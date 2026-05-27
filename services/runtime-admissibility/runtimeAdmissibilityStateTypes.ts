import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";

export type RuntimeAdmissibilityClassification =
  | "admissible"
  | "elevated"
  | "frozen"
  | "disputed"
  | "invalid"
  | "revoked";

export type RuntimeVisibilityDomain =
  | "runtime"
  | "governance"
  | "escalation"
  | "approval"
  | "override"
  | "rollback"
  | "replay"
  | "containment"
  | "anti_emergence"
  | "topology";

export type RuntimeAdmissibilityErrorCode =
  | "RUNTIME_ADMISSIBILITY_GOVERNANCE_MISMATCH"
  | "RUNTIME_ADMISSIBILITY_GOVERNANCE_DETACHED"
  | "RUNTIME_ADMISSIBILITY_REPLAY_MISMATCH"
  | "RUNTIME_ADMISSIBILITY_REPLAY_BINDING_INVALID"
  | "RUNTIME_ADMISSIBILITY_ROLLBACK_AMBIGUOUS"
  | "RUNTIME_ADMISSIBILITY_OBSERVABILITY_GAP"
  | "RUNTIME_ADMISSIBILITY_APPROVAL_AMBIGUOUS"
  | "RUNTIME_ADMISSIBILITY_ESCALATION_INCOMPATIBLE"
  | "RUNTIME_ADMISSIBILITY_OVERRIDE_INCOMPATIBLE"
  | "RUNTIME_ADMISSIBILITY_CONTAINMENT_DEGRADED"
  | "RUNTIME_ADMISSIBILITY_TOPOLOGY_MUTATION"
  | "RUNTIME_ADMISSIBILITY_ANTI_EMERGENCE_VIOLATION"
  | "RUNTIME_ADMISSIBILITY_AUTHORITY_EXPANSION"
  | "RUNTIME_ADMISSIBILITY_HIDDEN_ORCHESTRATION"
  | "RUNTIME_ADMISSIBILITY_HIDDEN_EXECUTION"
  | "RUNTIME_ADMISSIBILITY_INVISIBLE_SCHEDULING"
  | "RUNTIME_ADMISSIBILITY_HIDDEN_RETRY"
  | "RUNTIME_ADMISSIBILITY_RECURSIVE_COORDINATION"
  | "RUNTIME_ADMISSIBILITY_RUNTIME_CREATED_RUNTIME"
  | "RUNTIME_ADMISSIBILITY_BOUNDARY_VIOLATION"
  | "RUNTIME_ADMISSIBILITY_ISOLATION_VIOLATION"
  | "RUNTIME_ADMISSIBILITY_VALIDATOR_MISMATCH"
  | "RUNTIME_ADMISSIBILITY_LINEAGE_CORRUPTION";

export type RuntimeAdmissibilityError = Readonly<{
  code: RuntimeAdmissibilityErrorCode;
  message: string;
  path: string;
}>;

export type RuntimeTopologySnapshot = Readonly<{
  runtimeId: string;
  governanceSnapshotId: string;
  topologyHash: string;
  declaredEdges: readonly string[];
  hiddenOrchestrationDetected: boolean;
  recursiveCoordinationDetected: boolean;
  invisibleSchedulingDetected: boolean;
  hiddenRetryDetected: boolean;
  authorityExpansionDetected: boolean;
  runtimeCreatedRuntimesDetected: boolean;
  synthesizedOrchestrationDetected: boolean;
  executionMarkersDetected: boolean;
}>;

export type RuntimeRollbackSnapshot = Readonly<{
  checkpointId: string;
  checkpointState: string | null;
  ledgerEvents: readonly Record<string, unknown>[];
  rollbackHash: string;
}>;

export type RuntimeObservabilitySnapshot = Readonly<{
  runtimeId: string;
  coverageDomains: readonly RuntimeVisibilityDomain[];
  lineageRefs: readonly string[];
  observabilityHash: string;
}>;

export type RuntimeAdmissibilityInput = Readonly<{
  admissibilityId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  antiEmergenceResult: AntiEmergenceResult;
  runtimeTopology: RuntimeTopologySnapshot;
  rollbackSnapshot: RuntimeRollbackSnapshot;
  observabilitySnapshot: RuntimeObservabilitySnapshot;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: RuntimeCertificationLineageLedger;
  existingReplayLedger?: readonly RuntimeCertificationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type RuntimeCompatibilityRecord = Readonly<{
  governanceCompatible: boolean;
  replayCompatible: boolean;
  rollbackCompatible: boolean;
  observabilityCompatible: boolean;
  approvalCompatible: boolean;
  escalationCompatible: boolean;
  overrideCompatible: boolean;
  containmentCompatible: boolean;
  antiEmergenceCompatible: boolean;
  topologyCompatible: boolean;
  deterministicHash: string;
}>;

export type RuntimeGovernanceCheck = Readonly<{
  governanceSnapshotId: string;
  detached: boolean;
  driftDetected: boolean;
  governanceBound: boolean;
  deterministicHash: string;
}>;

export type RuntimeGovernanceBinding = Readonly<{
  bindingId: string;
  governanceBound: boolean;
  replayBound: boolean;
  supremacyBound: boolean;
  escalationBound: boolean;
  containmentBound: boolean;
  deterministicHash: string;
}>;

export type RuntimeReadinessScore = Readonly<{
  admissibilityId: string;
  score: number;
  restrictionLevel: "none" | "elevated" | "frozen";
  scoreHash: string;
}>;

export type RuntimeSimulationSignal = Readonly<{
  domain:
    | "governance"
    | "replay"
    | "rollback"
    | "observability"
    | "approval"
    | "escalation"
    | "override"
    | "containment"
    | "anti_emergence"
    | "topology";
  triggered: boolean;
  severity: "none" | "moderate" | "high" | "critical";
  reason: string;
  deterministicHash: string;
}>;

export type RuntimeCertificationEvidence = Readonly<{
  evidenceId: string;
  admissibilityId: string;
  replayEvidenceId: string;
  supremacyEvidenceId: string;
  escalationEvidenceId: string;
  emergenceEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type RuntimeCertificationLineageEntry = Readonly<{
  entryId: string;
  admissibilityId: string;
  coordinationId: string;
  classification: RuntimeAdmissibilityClassification;
  score: number;
  createdAt: string;
  deterministicHash: string;
}>;

export type RuntimeCertificationLineageLedger = Readonly<{
  entries: readonly RuntimeCertificationLineageEntry[];
  lineageHash: string;
}>;

export type RuntimeCertificationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RuntimeCertificationForensicExport = Readonly<{
  exportId: string;
  admissibilityId: string;
  evidenceHash: string;
  lineageHash: string;
  topologyHash: string;
  observabilityHash: string;
  rollbackHash: string;
  exportHash: string;
}>;

export type RuntimeCertificationIntegrityReport = Readonly<{
  reportId: string;
  admissibilityId: string;
  classification: RuntimeAdmissibilityClassification;
  failClosed: boolean;
  deterministic: boolean;
  reasons: readonly string[];
  reportHash: string;
}>;

export type RuntimeAdmissibilityRecord = Readonly<{
  admissibilityId: string;
  coordinationId: string;
  replayId: string;
  supremacyId: string;
  escalationId: string;
  containmentId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  runtimeId: string;
  classification: RuntimeAdmissibilityClassification;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  createdAt: string;
}>;

export type RuntimeAdmissibilityResult = Readonly<{
  record: RuntimeAdmissibilityRecord;
  governanceCheck: RuntimeGovernanceCheck;
  governanceBinding: RuntimeGovernanceBinding;
  compatibility: RuntimeCompatibilityRecord;
  readinessScore: RuntimeReadinessScore;
  simulationSignals: readonly RuntimeSimulationSignal[];
  evidence: RuntimeCertificationEvidence;
  lineage: RuntimeCertificationLineageLedger;
  replayLedger: readonly RuntimeCertificationLedgerEntry[];
  forensicExport: RuntimeCertificationForensicExport;
  integrityReport: RuntimeCertificationIntegrityReport;
  warnings: readonly string[];
  errors: readonly RuntimeAdmissibilityError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
