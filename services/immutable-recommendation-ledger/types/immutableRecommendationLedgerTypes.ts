import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationReplayInput, RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export interface RecommendationLedgerEvent {
  ledgerEventId: string;
  recommendationId: string;
  eventType:
    | "recommendation.generated"
    | "recommendation.constrained"
    | "recommendation.scored"
    | "recommendation.prioritized"
    | "recommendation.replayed"
    | "recommendation.archived";
  eventVersion: string;
  timestamp: string;
  sequenceNumber: number;
  lineageHash: string;
  parentLineageHash?: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  evidenceBundleId: string;
  recommendationHash: string;
  serializationHash: string;
  actorType:
    | "system"
    | "operator"
    | "replay-engine";
  payload: Record<string, unknown>;
  metadata: {
    deterministic: true;
    appendOnly: true;
    replayCompatible: true;
    executable: false;
  };
}

export type ImmutableRecommendationLedgerErrorCode =
  | "LEDGER_MUTATION_DETECTED"
  | "LEDGER_HASH_MISMATCH"
  | "LEDGER_REPLAY_INVALID"
  | "LEDGER_SEQUENCE_CORRUPTION"
  | "LEDGER_TIMESTAMP_MUTATION"
  | "LEDGER_SERIALIZATION_DRIFT"
  | "LEDGER_APPEND_ONLY_VIOLATION"
  | "LEDGER_LINEAGE_GAP_DETECTED"
  | "LEDGER_GOVERNANCE_CORRELATION_FAILURE";

export type ImmutableRecommendationLedgerError = Readonly<{
  code: ImmutableRecommendationLedgerErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationLedgerTelemetry = Readonly<{
  appendOnlyViolationCount: number;
  replayDriftCount: number;
  serializationDriftCount: number;
  hashMismatchCount: number;
  lineageGapCount: number;
  governanceMismatchCount: number;
  antiEmergenceViolationCount: number;
  orderingCorruptionCount: number;
  telemetryHash: string;
}>;

export type RecommendationLedgerValidationRecord = Readonly<{
  replayValidated: boolean;
  deterministicReplayVerified: boolean;
  antiEmergenceValidated: boolean;
  failClosedChecksPassed: boolean;
  validationHash: string;
}>;

export type ImmutableRecommendationLedgerInput = Readonly<{
  ledgerRunId: string;
  ledgerTimestamp: string;
  constitutionalVersion: string;
  replayInput: RecommendationReplayInput;
  replayResult: RecommendationReplayResult;
  existingEvents?: readonly RecommendationLedgerEvent[];
  existingAuditLedger?: readonly ImmutableRecommendationLedgerAuditEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type RecommendationLedgerStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationLedgerFreezeRecord = Readonly<{
  frozen: boolean;
  failedClosed: boolean;
  reasons: readonly ImmutableRecommendationLedgerErrorCode[];
  freezeHash: string;
}>;

export type RecommendationLedgerAuditRecord = Readonly<{
  auditId: string;
  ledgerRunId: string;
  recommendationId: string;
  eventType:
    | "LEDGER_APPEND_REQUESTED"
    | "LEDGER_APPEND_VALIDATED"
    | "LEDGER_APPEND_COMPLETED"
    | "LEDGER_APPEND_FROZEN"
    | "LEDGER_APPEND_FAILED_CLOSED"
    | "LEDGER_ANTI_EMERGENCE_BLOCKED";
  eventHash: string;
  timestamp: string;
  previousEntryHash?: string;
  entryHash: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  operatorReviewRequired: true;
}>;

export type ImmutableRecommendationLedgerAuditEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ImmutableRecommendationLedgerResult = Readonly<{
  status: "COMPLETED" | "FROZEN" | "FAILED_CLOSED";
  events: readonly RecommendationLedgerEvent[];
  validation: RecommendationLedgerValidationRecord;
  telemetry: RecommendationLedgerTelemetry;
  auditRecords: readonly RecommendationLedgerAuditRecord[];
  auditLedger: readonly ImmutableRecommendationLedgerAuditEntry[];
  freeze: RecommendationLedgerFreezeRecord;
  stages: readonly RecommendationLedgerStageRecord[];
  errors: readonly ImmutableRecommendationLedgerError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
