import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";

export interface OperatorAuthorityAction {
  actionId: string;
  operatorId: string;
  actionType:
    | "PAUSE"
    | "DENY"
    | "FREEZE"
    | "REVOKE"
    | "ESCALATE"
    | "OVERRIDE"
    | "KILL_SWITCH";
  targetIds: string[];
  scopeBoundaryIds: string[];
  governanceSnapshotId: string;
  replaySnapshotId: string;
  propagatedAt: string;
  propagationCompleted: boolean;
  replayHash: string;
  auditHash: string;
  advisoryOnly: true;
  executable: false;
  executionAuthorized: false;
  operatorReviewRequired: true;
}

export type OperatorAuthorityErrorCode =
  | "OPERATOR_AUTHORITY_COMMAND_INVALID"
  | "OPERATOR_AUTHORITY_SUPREMACY_BROKEN"
  | "OPERATOR_AUTHORITY_CONTAINMENT_INVALID"
  | "OPERATOR_AUTHORITY_FIREWALL_VIOLATION"
  | "OPERATOR_AUTHORITY_EXECUTION_BLOCKED"
  | "OPERATOR_AUTHORITY_REPLAY_INVALID"
  | "OPERATOR_AUTHORITY_OVERRIDE_RECOVERY_DETECTED"
  | "OPERATOR_AUTHORITY_PERSISTENCE_DETECTED"
  | "OPERATOR_AUTHORITY_KILL_SWITCH_BYPASS"
  | "OPERATOR_AUTHORITY_RECURSIVE_OVERRIDE"
  | "OPERATOR_AUTHORITY_DISTRIBUTED_DRIFT"
  | "OPERATOR_AUTHORITY_OVERRIDE_RETRY"
  | "OPERATOR_AUTHORITY_OVERRIDE_MUTATION"
  | "OPERATOR_AUTHORITY_HIDDEN_RESTORATION"
  | "OPERATOR_AUTHORITY_PROPAGATION_MISMATCH"
  | "OPERATOR_AUTHORITY_STALE_AUTHORITY"
  | "OPERATOR_AUTHORITY_REPLAY_DRIFT"
  | "OPERATOR_AUTHORITY_GOVERNANCE_DRIFT"
  | "OPERATOR_AUTHORITY_FAIL_CLOSED";

export type OperatorAuthorityError = Readonly<{
  code: OperatorAuthorityErrorCode;
  message: string;
  path: string;
}>;

export type OperatorAuthorityInput = Readonly<{
  actionId: string;
  operatorId: string;
  actionType: OperatorAuthorityAction["actionType"];
  targetIds: readonly string[];
  scopeBoundaryIds: readonly string[];
  recommendationValidationResult: RecommendationValidationResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  validatedAt: string;
  deterministicSeed: string;
  validatorVersionId: string;
  existingLineage?: OperatorAuthorityLineageLedger;
  existingAuditLedger?: readonly OperatorAuthorityLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type OperatorAuthorityStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type OverridePropagationRecord = Readonly<{
  actionId: string;
  actionType: OperatorAuthorityAction["actionType"];
  targetIds: readonly string[];
  propagationCompleted: boolean;
  propagationHash: string;
}>;

export type RecommendationSuppressionRecord = Readonly<{
  recommendationId: string;
  suppressed: boolean;
  continuityInvalidated: boolean;
  suppressionHash: string;
}>;

export type OperatorAuthoritySnapshot = Readonly<{
  snapshotId: string;
  actionId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  propagationHash: string;
  snapshotHash: string;
}>;

export type OperatorAuthorityEvidence = Readonly<{
  evidenceId: string;
  actionId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type OperatorAuthorityLineageEntry = Readonly<{
  entryId: string;
  actionId: string;
  actionType: OperatorAuthorityAction["actionType"];
  recommendationId: string;
  propagatedAt: string;
  deterministicHash: string;
}>;

export type OperatorAuthorityLineageLedger = Readonly<{
  entries: readonly OperatorAuthorityLineageEntry[];
  lineageHash: string;
}>;

export type OperatorAuthorityLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type OperatorAuthorityForensicExport = Readonly<{
  exportId: string;
  actionId: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
  exportHash: string;
}>;

export type OperatorAuthorityMetrics = Readonly<{
  overrideLatency: number;
  freezePropagation: number;
  revokePropagation: number;
  killSwitchPropagation: number;
  authorityRestorationAttempts: number;
  staleAuthorityPersistence: number;
  propagationFailures: number;
  replayMismatches: number;
  escalationFrequency: number;
  operatorInterventionFrequency: number;
  hiddenAuthorityRecoveryAttempts: number;
  metricsHash: string;
}>;

export type OperatorAuthorityResult = Readonly<{
  action: OperatorAuthorityAction;
  stages: readonly OperatorAuthorityStageRecord[];
  propagation: OverridePropagationRecord;
  suppression: RecommendationSuppressionRecord;
  snapshot: OperatorAuthoritySnapshot;
  evidence: OperatorAuthorityEvidence;
  lineage: OperatorAuthorityLineageLedger;
  auditLedger: readonly OperatorAuthorityLedgerEntry[];
  forensics: OperatorAuthorityForensicExport;
  metrics: OperatorAuthorityMetrics;
  errors: readonly OperatorAuthorityError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
