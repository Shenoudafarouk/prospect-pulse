import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageSequence } from './entities/message-sequence.entity.js';
import { SequenceMessage } from './entities/sequence-message.entity.js';
import { SequenceStatus } from './enums/sequence-status.enum.js';
import { GenerateSequenceDto } from './dto/generate-sequence.dto.js';
import type { LinkedInProvider } from '../linkedin/linkedin.interface.js';
import { LINKEDIN_PROVIDER } from '../linkedin/linkedin.interface.js';
import { LinkedInProfileNormalizer } from '../linkedin/linkedin-profile.normalizer.js';
import { ProspectsService } from '../prospects/prospects.service.js';
import { TovService } from '../tov/tov.service.js';
import { TovTranslatorService } from '../tov/tov-translator.service.js';
import { AiService } from '../ai/ai.service.js';
import { AiGeneration } from '../ai/entities/ai-generation.entity.js';

@Injectable()
export class SequencesService {
  private readonly logger = new Logger(SequencesService.name);

  constructor(
    @InjectRepository(MessageSequence)
    private readonly sequenceRepo: Repository<MessageSequence>,
    @InjectRepository(SequenceMessage)
    private readonly messageRepo: Repository<SequenceMessage>,
    @InjectRepository(AiGeneration)
    private readonly generationRepo: Repository<AiGeneration>,
    @Inject(LINKEDIN_PROVIDER)
    private readonly linkedInProvider: LinkedInProvider,
    private readonly normalizer: LinkedInProfileNormalizer,
    private readonly prospectsService: ProspectsService,
    private readonly tovService: TovService,
    private readonly tovTranslator: TovTranslatorService,
    private readonly aiService: AiService,
  ) {}

  async generate(dto: GenerateSequenceDto) {
    if (!dto.tov_config_id && !dto.tov_config) {
      throw new BadRequestException(
        'Either tov_config_id or tov_config is required',
      );
    }

    // 1. Fetch LinkedIn profile
    this.logger.log(`Fetching profile for ${dto.prospect_url}`);
    const profile = await this.linkedInProvider.fetchProfile(dto.prospect_url);

    // 2. Normalize and upsert prospect
    const normalized = this.normalizer.normalize(dto.prospect_url, profile);
    const prospect =
      await this.prospectsService.upsertByLinkedinUrl(normalized);

    // 3. Resolve TovConfig: use saved by id or create from body
    const tovConfig = dto.tov_config_id
      ? await this.tovService.findById(dto.tov_config_id)
      : await this.tovService.create(dto.tov_config!);
    const tovTranslation = this.tovTranslator.translate({
      formality: tovConfig.formality,
      warmth: tovConfig.warmth,
      directness: tovConfig.directness,
      humor: tovConfig.humor ?? undefined,
      technicality: tovConfig.technicality ?? undefined,
    });

    // 4. Create sequence with status=generating
    const sequence = this.sequenceRepo.create({
      prospectId: prospect.id,
      tovConfigId: tovConfig.id,
      companyContext: dto.company_context,
      sequenceLength: dto.sequence_length,
      status: SequenceStatus.GENERATING,
    });
    const saved = await this.sequenceRepo.save(sequence);

    try {
      // 5. AI Phase 1: Prospect analysis
      this.logger.log(`Running AI analysis for sequence ${saved.id}`);
      const analysis = await this.aiService.analyzeProspect(
        profile,
        dto.prospect_url,
        saved.id,
      );

      // 6. AI Phase 2: Message generation
      this.logger.log(`Generating messages for sequence ${saved.id}`);
      const generation = await this.aiService.generateMessages(
        profile,
        dto.prospect_url,
        analysis,
        tovTranslation,
        dto.company_context,
        dto.sequence_length,
        saved.id,
      );

      // 7. Store analysis + confidence on sequence
      saved.prospectAnalysis = analysis as unknown as Record<string, unknown>;
      saved.overallConfidence = generation.overall_confidence;
      saved.status = SequenceStatus.COMPLETED;
      await this.sequenceRepo.save(saved);

      // 8. Store individual messages
      const messageEntities = generation.messages.map((msg) =>
        this.messageRepo.create({
          sequenceId: saved.id,
          stepNumber: msg.step,
          channel: msg.channel,
          subject: msg.subject,
          body: msg.body,
          signalsUsed: msg.signals_used,
          personalizationRationale: msg.personalization_rationale,
          assumptions: msg.assumptions,
          riskChecks: msg.risk_checks,
          confidenceScore: msg.confidence_score,
        }),
      );
      await this.messageRepo.save(messageEntities);

      // 9. Build response
      return this.buildResponse(
        saved,
        prospect,
        tovTranslation,
        messageEntities,
      );
    } catch (error) {
      this.logger.error(
        `Sequence ${saved.id} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      saved.status = SequenceStatus.FAILED;
      await this.sequenceRepo.save(saved);
      throw error;
    }
  }

  async findById(id: string) {
    const sequence = await this.sequenceRepo.findOne({
      where: { id },
      relations: ['prospect', 'tovConfig', 'messages', 'generations'],
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with id "${id}" not found`);
    }

    const tovTranslation = this.tovTranslator.translate(sequence.tovConfig);
    const sortedMessages = [...sequence.messages].sort(
      (a, b) => a.stepNumber - b.stepNumber,
    );

    return this.buildResponseFromEntity(
      sequence,
      tovTranslation,
      sortedMessages,
    );
  }

  private buildResponse(
    sequence: MessageSequence,
    prospect: { fullName: string; headline: string | null },
    tovTranslation: { tovSummary: string },
    messages: SequenceMessage[],
  ) {
    return {
      sequence_id: sequence.id,
      status: sequence.status,
      prospect: {
        name: prospect.fullName,
        headline: prospect.headline,
        analysis: sequence.prospectAnalysis,
      },
      tov_summary: tovTranslation.tovSummary,
      messages: messages.map((m) => ({
        step: m.stepNumber,
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        signals_used: m.signalsUsed,
        personalization_rationale: m.personalizationRationale,
        assumptions: m.assumptions,
        risk_checks: m.riskChecks,
        confidence_score: m.confidenceScore,
      })),
      overall_confidence: sequence.overallConfidence,
      generation_metadata: null as object | null,
    };
  }

  private buildResponseFromEntity(
    sequence: MessageSequence,
    tovTranslation: { tovSummary: string },
    messages: SequenceMessage[],
  ) {
    const metadata = this.aggregateGenerationMetadata(
      sequence.generations ?? [],
    );

    return {
      sequence_id: sequence.id,
      status: sequence.status,
      prospect: {
        name: sequence.prospect.fullName,
        headline: sequence.prospect.headline,
        analysis: sequence.prospectAnalysis,
      },
      tov_summary: tovTranslation.tovSummary,
      messages: messages.map((m) => ({
        step: m.stepNumber,
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        signals_used: m.signalsUsed,
        personalization_rationale: m.personalizationRationale,
        assumptions: m.assumptions,
        risk_checks: m.riskChecks,
        confidence_score: m.confidenceScore,
      })),
      overall_confidence: sequence.overallConfidence,
      generation_metadata: metadata,
    };
  }

  private aggregateGenerationMetadata(generations: AiGeneration[]) {
    if (generations.length === 0) return null;

    let totalTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;
    let model = '';

    for (const gen of generations) {
      totalTokens += gen.totalTokens ?? 0;
      totalCost += gen.estimatedCost ? Number.parseFloat(gen.estimatedCost) : 0;
      totalLatency += gen.latencyMs ?? 0;
      model = gen.model;
    }

    return {
      model,
      total_tokens: totalTokens,
      estimated_cost: Number.parseFloat(totalCost.toFixed(6)),
      latency_ms: totalLatency,
      phases: generations.length,
    };
  }
}
