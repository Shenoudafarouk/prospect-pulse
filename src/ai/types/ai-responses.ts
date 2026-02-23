export interface ProspectAnalysisResult {
  industry_insights: string;
  pain_points: string[];
  talking_points: string[];
  communication_style_recommendation: string;
}

export interface GeneratedMessage {
  step: number;
  channel: string;
  subject: string | null;
  body: string;
  signals_used: string[];
  personalization_rationale: string;
  assumptions: string[];
  risk_checks: string[];
  confidence_score: number;
}

export interface MessageGenerationResult {
  messages: GeneratedMessage[];
  overall_confidence: number;
}
