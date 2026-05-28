export type SamChaosScenarioType =
  | "LOCK_LOSS"
  | "DB_FAILURE"
  | "PARTIAL_WRITE"
  | "TIMEOUT_MID_EXECUTION"
  | "CORRUPTED_STATE_READ"
  | "AUDIT_APPEND_FAILURE"
  | "IDEMPOTENCY_STORE_FAILURE"
  | "DUPLICATE_REPLAY";

export type SamChaosScenarioRequest = {
  type: SamChaosScenarioType;
  executionId: string;
  attemptId: string;
  deterministicSeed: string;
  dryRun: true;
};

export type SamChaosStabilityScore = {
  totalScore: number;
  recoveryCorrectness: number;
  idempotencyIntegrity: number;
  auditIntegrity: number;
  governanceIntegrity: number;
  dryRunContainment: number;
  duplicateSuppression: number;
  failureExplainability: number;
};

export type SamChaosScenarioResult = {
  type: SamChaosScenarioType;
  passed: boolean;
  recoveryCorrect: boolean;
  unauthorizedMutationDetected: boolean;
  duplicateDryRunDetected: boolean;
  duplicateAuditDetected: boolean;
  governanceBypassDetected: boolean;
  stabilityScore: number;
  findings: string[];
  scoreBreakdown: SamChaosStabilityScore;
};

export type SamChaosHookMode = {
  deterministicSeed: string;
  failStoreRead?: boolean;
  failStoreWrite?: boolean;
  failAuditAppend?: boolean;
  failDryRunTimeout?: boolean;
  corruptReadMode?: "proposal_hash_mismatch" | "ambiguous" | "pending";
};

export type SamChaosMetrics = {
  dryRunInvocationCount: number;
  auditAppendCount: number;
  auditSkipCount: number;
  auditEventCounts: Record<string, number>;
  storeReadCount: number;
  storeWriteCount: number;
  unauthorizedMutationDetected: boolean;
};
