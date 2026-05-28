export enum ClarificationSeverity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export type ClarificationResolution = {
  clarificationRequired: boolean;
  generatedQuestions: string[];
  blockingReasons: string[];
  severity: ClarificationSeverity;
};
