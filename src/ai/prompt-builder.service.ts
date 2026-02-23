import { Injectable } from '@nestjs/common';
import { LinkedInProfile } from '../linkedin/linkedin.interface.js';
import { TovTranslation } from '../tov/tov-translator.service.js';

export const PROMPT_VERSION = 'v1';

export interface HashInput {
  promptVersion: string;
  phase: string;
  prospectUrl: string;
  profileFullName: string;
  companyContext?: string;
  sequenceLength?: number;
  tovSummary?: string;
}

@Injectable()
export class PromptBuilderService {
  buildAnalysisPrompt(profile: LinkedInProfile): {
    system: string;
    user: string;
  } {
    const system = `You are a B2B sales intelligence analyst. Analyze the LinkedIn prospect profile provided and return a JSON object with exactly these fields:

{
  "industry_insights": "A 2-3 sentence analysis of the prospect's industry context and current market dynamics relevant to outreach.",
  "pain_points": ["Array of 3-5 likely pain points based on their role, company, and industry."],
  "talking_points": ["Array of 3-5 personalized talking points that could resonate with this prospect."],
  "communication_style_recommendation": "A 1-2 sentence recommendation on how to communicate with this person based on their seniority and background."
}

Rules:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- Base all analysis on the provided profile data. Do not fabricate information.
- Keep pain points and talking points specific to the prospect, not generic.`;

    const user = this.formatProfileForPrompt(profile);

    return { system, user };
  }

  buildGenerationPrompt(
    profile: LinkedInProfile,
    analysis: Record<string, unknown>,
    tov: TovTranslation,
    companyContext: string,
    sequenceLength: number,
  ): { system: string; user: string } {
    const tovRules = tov.tovInstructions
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join('\n');

    const system = `You are a B2B sales copywriter. Generate a personalized messaging sequence for the prospect described below.

Return a JSON object with exactly this structure:

{
  "messages": [
    {
      "step": 1,
      "channel": "linkedin_connection" | "linkedin_message" | "email",
      "subject": "Email subject line or null for LinkedIn messages",
      "body": "The message body text",
      "signals_used": ["Array of specific profile facts you referenced"],
      "personalization_rationale": "1-2 sentences explaining why you wrote this message this way",
      "assumptions": ["Array of inferences you made about the prospect"],
      "risk_checks": ["Array of safety validations, e.g. 'No sensitive inference', 'No unverifiable claims'"],
      "confidence_score": 0.85
    }
  ],
  "overall_confidence": 0.82
}

Tone-of-voice rules (follow these strictly):
${tovRules}

Sequence guidelines:
- Generate exactly ${sequenceLength} messages.
- Step 1 should be a LinkedIn connection request (short, <300 chars).
- Subsequent steps can be LinkedIn messages or emails.
- Each message should build on the previous one without repeating.
- Reference specific details from the prospect's profile.
- Confidence scores should reflect how well the message fits the prospect (0.0-1.0).

Rules:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- Do NOT include raw chain-of-thought. Use the structured fields (signals_used, personalization_rationale, assumptions, risk_checks) for transparency.
- Every assumption must be defensible from the profile data.
- risk_checks must confirm no sensitive inferences or unverifiable claims.`;

    const user = `PROSPECT PROFILE:
${this.formatProfileForPrompt(profile)}

PROSPECT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

ABOUT OUR COMPANY:
${companyContext}

Generate a ${sequenceLength}-message outreach sequence.`;

    return { system, user };
  }

  private formatProfileForPrompt(profile: LinkedInProfile): string {
    const parts: string[] = [
      `Name: ${profile.fullName}`,
      `Headline: ${profile.headline ?? 'N/A'}`,
      `Current Title: ${profile.currentTitle ?? 'N/A'}`,
      `Current Company: ${profile.currentCompany ?? 'N/A'}`,
      `Location: ${profile.location ?? 'N/A'}`,
      `Industry: ${profile.industry ?? 'N/A'}`,
    ];

    if (profile.summary) {
      parts.push(`Summary: ${profile.summary}`);
    }

    if (profile.experience.length > 0) {
      const expLines = profile.experience.map(
        (e) =>
          `  - ${e.title} at ${e.company} (${e.startDate} – ${e.endDate ?? 'Present'})`,
      );
      parts.push(`Experience:\n${expLines.join('\n')}`);
    }

    if (profile.skills.length > 0) {
      parts.push(`Skills: ${profile.skills.join(', ')}`);
    }

    if (profile.educations.length > 0) {
      const eduLines = profile.educations.map(
        (e) =>
          `  - ${e.degree ?? 'Degree'} in ${e.field ?? 'N/A'} from ${e.school}`,
      );
      parts.push(`Education:\n${eduLines.join('\n')}`);
    }

    if (profile.connections != null) {
      parts.push(`Connections: ${profile.connections}+`);
    }

    return parts.join('\n');
  }

  buildAnalysisHashInput(
    prospectUrl: string,
    profile: LinkedInProfile,
  ): HashInput {
    return {
      promptVersion: PROMPT_VERSION,
      phase: 'analysis',
      prospectUrl,
      profileFullName: profile.fullName,
    };
  }

  buildGenerationHashInput(
    prospectUrl: string,
    profile: LinkedInProfile,
    tov: TovTranslation,
    companyContext: string,
    sequenceLength: number,
  ): HashInput {
    return {
      promptVersion: PROMPT_VERSION,
      phase: 'generation',
      prospectUrl,
      profileFullName: profile.fullName,
      companyContext,
      sequenceLength,
      tovSummary: tov.tovSummary,
    };
  }
}
