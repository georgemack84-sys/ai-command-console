import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";

export type EscalationDeterminismErrorCode =
  | "ESCALATION_DETERMINISM_REPLAY_MISMATCH"
  | "ESCALATION_DETERMINISM_GOVERNANCE_DETACHED"
  | "ESCALATION_DETERMINISM_CONTAINMENT_DEGRADED"
  | "ESCALATION_DETERMINISM_BOUNDARY_VIOLATION"
  | "ESCALATION_DETERMINISM_ISOLATION_VIOLATION"
  | "ESCALATION_DETERMINISM_DRIFT_DETECTED"
  | "ESCALATION_DETERMINISM_SUPREMACY_VIOLATION"
  | "ESCALATION_DETERMINISM_VALIDATOR_MISMATCH"
  | "ESCALATION_DETERMINISM_DETERMINISM_VIOLATION";

export type EscalationDeterminismError = Readonly<{
  code: EscalationDeterminismErrorCode;
  message: string;
  path: string;
}>;

export type EscalationUncertaintyDomain =
  | "replay"
  | "governance"
  | "approval"
  | "authority"
  | "containment"
  | "confidence"
  | "coordination"
  | "lineage";

export type EscalationSeverity = "none" | "elevated" | "high" | "critical";

export type OversightState = "stable" | "elevated" | "frozen" | "disputed" | "revoked";

export type EscalationDeterminismInput = Readonly<{
  escalationId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: EscalationLineageLedger;
  existingReplayLedger?: readonly EscalationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type UncertaintySignal = Readonly<{
  domain: EscalationUncertaintyDomain;
  triggered: boolean;
  severity: EscalationSeverity;
  reason: string;
  deterministicHash: string;
}>;

export type OversightTriggerRecord = Readonly<{
  triggerId: string;
  oversightState: OversightState;
  escalationTriggered: boolean;
  triggerHash: string;
}>;

export type EscalationReplayBinding = Readonly<{
  bindingId: string;
  replayBound: boolean;
  governanceBound: boolean;
  authorityBound: boolean;
  supremacyBound: boolean;
  containmentBound: boolean;
  deterministicHash: string;
}>;

export type EscalationEvidence = Readonly<{
  evidenceId: string;
  escalationId: string;
  replayEvidenceId: string;
  supremacyEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type EscalationLineageEntry = Readonly<{
  entryId: string;
  escalationId: string;
  coordinationId: string;
  oversightState: OversightState;
  severity: EscalationSeverity;
  createdAt: string;
  deterministicHash: string;
}>;

export type EscalationLineageLedger = Readonly<{
  entries: readonly EscalationLineageEntry[];
  lineageHash: string;
}>;

export type EscalationLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type EscalationForensicExport = Readonly<{
  exportId: string;
  escalationId: string;
  evidenceHash: string;
  lineageHash: string;
  triggerHash: string;
  replayHash: string;
  exportHash: string;
}>;

export type EscalationIntegrityReport = Readonly<{
  reportId: string;
  escalationId: string;
  oversightState: OversightState;
  failClosed: boolean;
  deterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type EscalationDeterminismRecord = Readonly<{
  escalationId: string;
  coordinationId: string;
  replayId: string;
  supremacyId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  oversightState: OversightState;
  severity: EscalationSeverity;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  createdAt: string;
}>;

export type EscalationDeterminismResult = Readonly<{
  record: EscalationDeterminismRecord;
  uncertaintySignals: readonly UncertaintySignal[];
  oversightTrigger: OversightTriggerRecord;
  replayBinding: EscalationReplayBinding;
  evidence: EscalationEvidence;
  lineage: EscalationLineageLedger;
  replayLedger: readonly EscalationLedgerEntry[];
  forensicExport: EscalationForensicExport;
  integrityReport: EscalationIntegrityReport;
  warnings: readonly string[];
  errors: readonly EscalationDeterminismError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
