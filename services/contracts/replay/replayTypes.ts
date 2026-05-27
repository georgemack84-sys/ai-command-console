export type ReplayReconstructionResult = {
  executionId: string;
  reconstructedStates: string[];
  replaySequence: string[];
  missingEvidence: string[];
  reconstructionConfidence: number;
  deterministic: boolean;
  warnings: string[];
};

export type ReplayDivergence = {
  category: string;
  severity: string;
  deterministic: boolean;
  replayState: string;
  historicalState: string;
  evidence: string[];
  requiresEscalation: boolean;
};

export type ReplayConfidence = {
  score: number;
  deterministic: boolean;
  confidenceLevel: string;
  riskFactors: string[];
  verifiedEvidence: string[];
  warnings: string[];
};
