import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import OpenAI from 'openai';
import { AiGeneration } from './entities/ai-generation.entity.js';
import { GenerationStatus } from './enums/generation-status.enum.js';
import {
  PromptBuilderService,
  PROMPT_VERSION,
} from './prompt-builder.service.js';
import { LinkedInProfile } from '../linkedin/linkedin.interface.js';
import { TovTranslation } from '../tov/tov-translator.service.js';
import {
  ProspectAnalysisResult,
  MessageGenerationResult,
} from './types/ai-responses.js';

const MODEL = 'gpt-4o-mini';
const PROVIDER = 'openai';
const COST_PER_1K_INPUT = 0.00015;
const COST_PER_1K_OUTPUT = 0.0006;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(AiGeneration)
    private readonly generationRepo: Repository<AiGeneration>,
    private readonly promptBuilder: PromptBuilderService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('openai.apiKey'),
    });
  }

  async analyzeProspect(
    profile: LinkedInProfile,
    sequenceId: string | null,
  ): Promise<ProspectAnalysisResult> {
    const { system, user } = this.promptBuilder.buildAnalysisPrompt(profile);
    const requestHash = this.computeHash({ phase: 'analysis', profile });

    const result = await this.callOpenAI<ProspectAnalysisResult>(
      system,
      user,
      requestHash,
      sequenceId,
    );

    this.validateAnalysisResult(result);
    return result;
  }

  async generateMessages(
    profile: LinkedInProfile,
    analysis: ProspectAnalysisResult,
    tov: TovTranslation,
    companyContext: string,
    sequenceLength: number,
    sequenceId: string | null,
  ): Promise<MessageGenerationResult> {
    const { system, user } = this.promptBuilder.buildGenerationPrompt(
      profile,
      analysis as unknown as Record<string, unknown>,
      tov,
      companyContext,
      sequenceLength,
    );
    const requestHash = this.computeHash({
      phase: 'generation',
      profile,
      analysis,
      tov,
      companyContext,
      sequenceLength,
    });

    const result = await this.callOpenAI<MessageGenerationResult>(
      system,
      user,
      requestHash,
      sequenceId,
    );

    this.validateGenerationResult(result, sequenceLength);
    return result;
  }

  private async callOpenAI<T>(
    system: string,
    user: string,
    requestHash: string,
    sequenceId: string | null,
  ): Promise<T> {
    const requestPayload = {
      model: MODEL,
      messages: [
        { role: 'system' as const, content: system },
        { role: 'user' as const, content: user },
      ],
      response_format: { type: 'json_object' as const },
      temperature: 0.7,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const startMs = Date.now();
      try {
        const response =
          await this.openai.chat.completions.create(requestPayload);
        const latencyMs = Date.now() - startMs;
        const content = response.choices[0]?.message?.content ?? '';
        const parsed = this.parseJson<T>(content);

        await this.recordGeneration({
          sequenceId,
          requestHash,
          requestPayload: requestPayload as unknown as Record<string, unknown>,
          responsePayload: response as unknown as Record<string, unknown>,
          usage: response.usage ?? null,
          latencyMs,
          status: GenerationStatus.SUCCESS,
          errorMessage: null,
        });

        return parsed;
      } catch (error) {
        const latencyMs = Date.now() - startMs;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === 0) {
          this.logger.warn(
            `OpenAI call failed (attempt 1), retrying: ${lastError.message}`,
          );
          continue;
        }

        await this.recordGeneration({
          sequenceId,
          requestHash,
          requestPayload: requestPayload as unknown as Record<string, unknown>,
          responsePayload: null,
          usage: null,
          latencyMs,
          status: GenerationStatus.FAILED,
          errorMessage: lastError.message,
        });
      }
    }

    throw lastError ?? new Error('OpenAI call failed after retries');
  }

  private parseJson<T>(content: string): T {
    try {
      return JSON.parse(content) as T;
    } catch {
      const match = /\{[\s\S]*\}/.exec(content);
      if (match) {
        return JSON.parse(match[0]) as T;
      }
      throw new Error('Failed to parse JSON from AI response');
    }
  }

  private async recordGeneration(params: {
    sequenceId: string | null;
    requestHash: string;
    requestPayload: Record<string, unknown>;
    responsePayload: Record<string, unknown> | null;
    usage: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    } | null;
    latencyMs: number;
    status: GenerationStatus;
    errorMessage: string | null;
  }): Promise<AiGeneration> {
    const promptTokens = params.usage?.prompt_tokens ?? null;
    const completionTokens = params.usage?.completion_tokens ?? null;
    const totalTokens = params.usage?.total_tokens ?? null;

    let estimatedCost: string | null = null;
    if (promptTokens != null && completionTokens != null) {
      const cost =
        (promptTokens / 1000) * COST_PER_1K_INPUT +
        (completionTokens / 1000) * COST_PER_1K_OUTPUT;
      estimatedCost = cost.toFixed(6);
    }

    const generation = this.generationRepo.create({
      sequenceId: params.sequenceId,
      model: MODEL,
      provider: PROVIDER,
      promptVersion: PROMPT_VERSION,
      requestHash: params.requestHash,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      latencyMs: params.latencyMs,
      status: params.status,
      errorMessage: params.errorMessage,
      requestPayload: params.requestPayload,
      responsePayload: params.responsePayload,
    });

    return this.generationRepo.save(generation);
  }

  private computeHash(input: unknown): string {
    const keys = Object.keys(input as object).sort((a, b) =>
      a.localeCompare(b),
    );
    const normalized = JSON.stringify(input, keys);
    return createHash('sha256').update(normalized).digest('hex').slice(0, 64);
  }

  private validateAnalysisResult(result: ProspectAnalysisResult): void {
    if (
      typeof result.industry_insights !== 'string' ||
      !Array.isArray(result.pain_points) ||
      !Array.isArray(result.talking_points) ||
      typeof result.communication_style_recommendation !== 'string'
    ) {
      throw new Error(
        'AI analysis response missing required fields: industry_insights, pain_points, talking_points, communication_style_recommendation',
      );
    }
  }

  private validateGenerationResult(
    result: MessageGenerationResult,
    expectedLength: number,
  ): void {
    if (!Array.isArray(result.messages)) {
      throw new Error('AI generation response missing messages array');
    }
    if (result.messages.length !== expectedLength) {
      this.logger.warn(
        `Expected ${expectedLength} messages, got ${result.messages.length}`,
      );
    }
    if (
      typeof result.overall_confidence !== 'number' ||
      result.overall_confidence < 0 ||
      result.overall_confidence > 1
    ) {
      this.logger.warn(
        'overall_confidence missing or out of range, defaulting to 0.5',
      );
      result.overall_confidence = 0.5;
    }
    for (const msg of result.messages) {
      if (!msg.body || typeof msg.body !== 'string') {
        throw new Error(`Message at step ${msg.step} is missing body text`);
      }
      if (!Array.isArray(msg.signals_used)) msg.signals_used = [];
      if (!Array.isArray(msg.assumptions)) msg.assumptions = [];
      if (!Array.isArray(msg.risk_checks)) msg.risk_checks = [];
      msg.personalization_rationale ??= '';
      msg.confidence_score ??= 0.5;
    }
  }
}
