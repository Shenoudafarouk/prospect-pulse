import { Injectable } from '@nestjs/common';

export interface TovTranslation {
  tovSummary: string;
  tovInstructions: string[];
}

type Bucket = 'low' | 'medium' | 'high';

const FORMALITY: Record<Bucket, string> = {
  low: 'Use a casual, conversational tone. First names, contractions, and informal language are encouraged.',
  medium:
    'Use a balanced, professional-but-approachable tone. Avoid slang but keep it natural.',
  high: 'Use a formal, polished tone. Address the prospect respectfully with proper titles when appropriate.',
};

const WARMTH: Record<Bucket, string> = {
  low: 'Keep the message concise and matter-of-fact. Skip pleasantries and get to the point.',
  medium:
    'Be moderately warm and personable. Show genuine interest without being effusive.',
  high: 'Be very warm and empathetic. Build personal rapport and show authentic enthusiasm.',
};

const DIRECTNESS: Record<Bucket, string> = {
  low: 'Lead with context and build up to the ask gradually. Use soft, suggestive language.',
  medium:
    'Be clear about your intent while remaining tactful. Balance context with directness.',
  high: "Be upfront about the value proposition and your ask. Respect the reader's time.",
};

const HUMOR: Record<Bucket, string> = {
  low: 'Keep the tone serious and professional. Avoid jokes or playful language.',
  medium: "Light wit is fine where it fits naturally, but don't force it.",
  high: 'Use humor and personality to stand out. Be playful and memorable.',
};

const TECHNICALITY: Record<Bucket, string> = {
  low: 'Use simple, non-technical language. Focus on business outcomes, not implementation.',
  medium:
    'Use some industry terminology where relevant, but explain complex concepts.',
  high: "Use technical language appropriate for the prospect's expertise. Reference specific tools and methodologies.",
};

const SUMMARY_FRAGMENTS: Record<string, Record<Bucket, string>> = {
  formality: { low: 'casual', medium: 'professional', high: 'formal' },
  warmth: { low: 'concise', medium: 'personable', high: 'warm and empathetic' },
  directness: { low: 'gradual', medium: 'balanced', high: 'direct' },
};

@Injectable()
export class TovTranslatorService {
  translate(params: {
    formality: number;
    warmth: number;
    directness: number;
    humor?: number | null;
    technicality?: number | null;
  }): TovTranslation {
    const fBucket = this.toBucket(params.formality);
    const wBucket = this.toBucket(params.warmth);
    const dBucket = this.toBucket(params.directness);

    const instructions: string[] = [
      FORMALITY[fBucket],
      WARMTH[wBucket],
      DIRECTNESS[dBucket],
    ];

    if (params.humor != null) {
      instructions.push(HUMOR[this.toBucket(params.humor)]);
    }
    if (params.technicality != null) {
      instructions.push(TECHNICALITY[this.toBucket(params.technicality)]);
    }

    const fWord = SUMMARY_FRAGMENTS.formality[fBucket];
    const wWord = SUMMARY_FRAGMENTS.warmth[wBucket];
    const dWord = SUMMARY_FRAGMENTS.directness[dBucket];
    const tovSummary = `Use a ${fWord}, ${wWord} tone with a ${dWord} messaging style.`;

    return { tovSummary, tovInstructions: instructions };
  }

  private toBucket(value: number): Bucket {
    if (value <= 0.3) return 'low';
    if (value <= 0.7) return 'medium';
    return 'high';
  }
}
