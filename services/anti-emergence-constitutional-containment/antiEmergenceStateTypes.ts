import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";

export type EmergenceClassification =
  | "contained"
  | "elevated"
  | "frozen"
  | "disputed"
  | "invalid"
  | "revoked";

export type EmergenceSeverity = "none" | "moderate" | "high" | "critical";

export type AntiEmergenceErrorCode =
  | "ANTI_EMERGENCE_REPLAY_MISMATCH"
  | "ANTI_EMERGENCE_GOVERNANCE_DETACHED"
  | "ANTI_EMERGENCE_CONTAINMENT_DRIFT"
  | "ANTI_EMERGENCE_ISOLATION_VIOLATION"
  | "ANTI_EMERGENCE_BOUNDARY_VIOLATION"
  | "ANTI_EMERGENCE_DRIFT_DETECTED"
  | "ANTI_EMERGENCE_SUPREMACY_VIOLATION"
  | "ANTI_EMERGENCE_DETERMINISM_VIOLATION"
  | "ANTI_EMERGENCE_VALIDATOR_MISMATCH";

export type AntiEmergenceError = Readonly<{
  code: AntiEmergenceErrorCode;
  message: string;
  path: string;
}>;

export type EmergenceDomain =
  | "hidden_orchestration"
  | "recursive_coordination"
  | "authority_expansion"
  | "hidden_retry"
  | "invisible_scheduling"
  | "topology_mutation"
  | "workflow_synthesis"
  | "governance_detachment"
  | "fanout_expansion";

export type EmergenceSignal = Readonly<{
  domain: EmergenceDomain;
  triggered: boolean;
  severity: EmergenceSeverity;
  reason: string;
  deterministicHash: string;
}>;

export type AntiEmergenceContainmentState = Readonly<{
  classification: EmergenceClassification;
  freezeRequired: boolean;
  approvalsInvalidated: boolean;
  topologyFrozen: boolean;
  containmentHash: string;
}>;

export type AntiEmergenceInput = Readonly<{
  containmentId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: EmergenceLineageLedger;
  existingReplayLedger?: readonly EmergenceLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type EmergenceReplayBinding = Readonly<{
  bindingId: string;
  replayBound: boolean;
  governanceBound: boolean;
  supremacyBound: boolean;
  escalationBound: boolean;
  containmentBound: boolean;
  deterministicHash: string;
}>;

export type EmergenceEvidence = Readonly<{
  evidenceId: string;
  containmentId: string;
  replayEvidenceId: string;
  supremacyEvidenceId: string;
  escalationEvidenceHash: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type EmergenceLineageEntry = Readonly<{
  entryId: string;
  containmentId: string;
  coordinationId: string;
  classification: EmergenceClassification;
  severity: EmergenceSeverity;
  createdAt: string;
  deterministicHash: string;
}>;

export type EmergenceLineageLedger = Readonly<{
  entries: readonly EmergenceLineageEntry[];
  lineageHash: string;
}>;

export type EmergenceLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type EmergenceForensicExport = Readonly<{
  exportId: string;
  containmentId: string;
  evidenceHash: string;
  lineageHash: string;
  containmentHash: string;
  topologyHash: string;
  exportHash: string;
}>;

export type EmergenceIntegrityReport = Readonly<{
  reportId: string;
  containmentId: string;
  classification: EmergenceClassification;
  failClosed: boolean;
  deterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type AntiEmergenceRecord = Readonly<{
  containmentId: string;
  coordinationId: string;
  replayId: string;
  supremacyId: string;
  escalationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  classification: EmergenceClassification;
  severity: EmergenceSeverity;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  createdAt: string;
}>;

export type AntiEmergenceResult = Readonly<{
  record: AntiEmergenceRecord;
  signals: readonly EmergenceSignal[];
  replayBinding: EmergenceReplayBinding;
  containmentState: AntiEmergenceContainmentState;
  evidence: EmergenceEvidence;
  lineage: EmergenceLineageLedger;
  replayLedger: readonly EmergenceLedgerEntry[];
  forensicExport: EmergenceForensicExport;
  integrityReport: EmergenceIntegrityReport;
  warnings: readonly string[];
  errors: readonly AntiEmergenceError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
