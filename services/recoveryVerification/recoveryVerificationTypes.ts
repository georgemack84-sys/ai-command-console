export type RecoveryVerificationState =
  | "VERIFIED"
  | "PARTIAL"
  | "DISPUTED"
  | "FAILED"
  | "UNVERIFIABLE";

export type RecoveryVerificationResult = {
  verificationId: string;
  executionId: string;
  verified: boolean;
  verificationState: RecoveryVerificationState;
  confidenceScore: number;
  runtimeIntegrity: boolean;
  replayIntegrity: boolean;
  governanceIntegrity: boolean;
  continuityIntegrity: boolean;
  disputes: string[];
  evidence: string[];
  verifiedAt: string;
  classificationId?: string;
  classificationCategory?: string;
  classificationSeverity?: string;
};

export type TruthReconciliationResult = {
  runtimeIntegrity: boolean;
  continuityIntegrity: boolean;
  disputes: string[];
  evidence: string[];
};
