import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";

export type OperatorInterventionType =
  | "override"
  | "freeze"
  | "revoke_authority"
  | "revoke_escalation"
  | "kill_switch";

export type SupremacyEnforcementState =
  | "ENFORCED"
  | "FROZEN"
  | "REVOKED"
  | "SHUTDOWN"
  | "DISPUTED"
  | "INVALID";

export type HumanSupremacyErrorCode =
  | "HUMAN_SUPREMACY_GOVERNANCE_DETACHED"
  | "HUMAN_SUPREMACY_REPLAY_BINDING_INVALID"
  | "HUMAN_SUPREMACY_OVERRIDE_SUPPRESSED"
  | "HUMAN_SUPREMACY_FREEZE_PROPAGATION_FAILED"
  | "HUMAN_SUPREMACY_SHUTDOWN_PROPAGATION_FAILED"
  | "HUMAN_SUPREMACY_LINEAGE_CORRUPTION"
  | "HUMAN_SUPREMACY_REPLAY_MISMATCH"
  | "HUMAN_SUPREMACY_CONTAINMENT_DEGRADED"
  | "HUMAN_SUPREMACY_ISOLATION_VIOLATION"
  | "HUMAN_SUPREMACY_BOUNDARY_VIOLATION"
  | "HUMAN_SUPREMACY_DRIFT_DETECTED"
  | "HUMAN_SUPREMACY_DETERMINISM_VIOLATION"
  | "HUMAN_SUPREMACY_VALIDATOR_MISMATCH";

export type HumanSupremacyError = Readonly<{
  code: HumanSupremacyErrorCode;
  message: string;
  path: string;
}>;

export type HumanSupremacyEnforcementInput = Readonly<{
  supremacyId: string;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  operatorId: string;
  interventionType: OperatorInterventionType;
  reason: string;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: SupremacyLineageLedger;
  existingReplayLedger?: readonly SupremacyLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type OverridePropagationRecord = Readonly<{
  overrideId: string;
  replayId: string;
  globallyPropagated: boolean;
  propagationState: "immediate" | "suppressed" | "partial";
  overrideHash: string;
}>;

export type AutonomyFreezeRecord = Readonly<{
  freezeId: string;
  active: boolean;
  scope: "none" | "autonomy" | "global";
  freezeHash: string;
}>;

export type AuthorityRevocationRecord = Readonly<{
  revocationId: string;
  authorityRevoked: boolean;
  revokedScopes: readonly string[];
  revocationHash: string;
}>;

export type EscalationRevocationRecord = Readonly<{
  escalationRevocationId: string;
  escalationRevoked: boolean;
  revokedScopes: readonly string[];
  escalationHash: string;
}>;

export type KillSwitchRecord = Readonly<{
  killSwitchId: string;
  active: boolean;
  scope: "none" | "global";
  shutdownHash: string;
}>;

export type SupremacyReplayBinding = Readonly<{
  bindingId: string;
  governanceBound: boolean;
  replayBound: boolean;
  containmentBound: boolean;
  deterministicHash: string;
}>;

export type SupremacyEvidence = Readonly<{
  evidenceId: string;
  supremacyId: string;
  replayEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type SupremacyLineageEntry = Readonly<{
  entryId: string;
  supremacyId: string;
  coordinationId: string;
  interventionType: OperatorInterventionType;
  enforcementState: SupremacyEnforcementState;
  createdAt: string;
  deterministicHash: string;
}>;

export type SupremacyLineageLedger = Readonly<{
  entries: readonly SupremacyLineageEntry[];
  lineageHash: string;
}>;

export type SupremacyLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type SupremacyForensicExport = Readonly<{
  exportId: string;
  supremacyId: string;
  evidenceHash: string;
  lineageHash: string;
  overrideHash: string;
  freezeHash: string;
  shutdownHash: string;
  exportHash: string;
}>;

export type SupremacyIntegrityReport = Readonly<{
  reportId: string;
  supremacyId: string;
  enforcementState: SupremacyEnforcementState;
  failClosed: boolean;
  deterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type OperatorInspectionPanel = Readonly<{
  panelId: string;
  supremacyId: string;
  operatorId: string;
  coordinationId: string;
  interventionType: OperatorInterventionType;
  enforcementState: SupremacyEnforcementState;
  evidenceHash: string;
  panelHash: string;
}>;

export type HumanSupremacyEnforcementRecord = Readonly<{
  supremacyId: string;
  coordinationId: string;
  replayId: string;
  boundaryId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  interventionType: OperatorInterventionType;
  enforcementState: SupremacyEnforcementState;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  createdAt: string;
}>;

export type HumanSupremacyEnforcementResult = Readonly<{
  record: HumanSupremacyEnforcementRecord;
  replayBinding: SupremacyReplayBinding;
  overridePropagation: OverridePropagationRecord;
  freeze: AutonomyFreezeRecord;
  authorityRevocation: AuthorityRevocationRecord;
  escalationRevocation: EscalationRevocationRecord;
  killSwitch: KillSwitchRecord;
  evidence: SupremacyEvidence;
  lineage: SupremacyLineageLedger;
  replayLedger: readonly SupremacyLedgerEntry[];
  forensicExport: SupremacyForensicExport;
  integrityReport: SupremacyIntegrityReport;
  inspectionPanel: OperatorInspectionPanel;
  warnings: readonly string[];
  errors: readonly HumanSupremacyError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
