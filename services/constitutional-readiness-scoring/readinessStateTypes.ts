import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { ConstitutionalRuntimeSimulationResult } from "@/services/constitutional-runtime-simulation/simulationStateTypes";
import type { ConstitutionalTelemetryResult } from "@/services/constitutional-telemetry/telemetryStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type ReadinessDomain =
  | "governance_integrity"
  | "replay_stability"
  | "override_reliability"
  | "escalation_correctness"
  | "containment_stability"
  | "runtime_compatibility"
  | "drift_resistance"
  | "human_supremacy";

export type ReadinessClassification =
  | "VERIFIED"
  | "CONDITIONAL"
  | "DEGRADED"
  | "FROZEN"
  | "DISPUTED"
  | "INVALID";

export type ConstitutionalReadinessErrorCode =
  | "CONSTITUTIONAL_READINESS_GOVERNANCE_DIVERGENCE"
  | "CONSTITUTIONAL_READINESS_REPLAY_NONDETERMINISTIC"
  | "CONSTITUTIONAL_READINESS_ESCALATION_AMBIGUOUS"
  | "CONSTITUTIONAL_READINESS_OVERRIDE_PROPAGATION_FAILED"
  | "CONSTITUTIONAL_READINESS_CONTAINMENT_WEAKENED"
  | "CONSTITUTIONAL_READINESS_AUTHORITY_BOUNDARY_DRIFT"
  | "CONSTITUTIONAL_READINESS_RUNTIME_COMPATIBILITY_UNCERTAIN"
  | "CONSTITUTIONAL_READINESS_GOVERNANCE_STALE"
  | "CONSTITUTIONAL_READINESS_HIDDEN_COORDINATION"
  | "CONSTITUTIONAL_READINESS_RECURSIVE_ESCALATION"
  | "CONSTITUTIONAL_READINESS_LINEAGE_INCOMPLETE"
  | "CONSTITUTIONAL_READINESS_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER"
  | "CONSTITUTIONAL_READINESS_REPLAY_BINDING_INVALID"
  | "CONSTITUTIONAL_READINESS_GOVERNANCE_BINDING_INVALID"
  | "CONSTITUTIONAL_READINESS_VALIDATOR_MISMATCH"
  | "CONSTITUTIONAL_READINESS_CERTIFICATION_SPOOFING"
  | "CONSTITUTIONAL_READINESS_SUPREMACY_BROKEN"
  | "CONSTITUTIONAL_READINESS_UNCERTAINTY_UNDERWEIGHTED"
  | "CONSTITUTIONAL_READINESS_BOUNDARY_VIOLATION";

export type ConstitutionalReadinessError = Readonly<{
  code: ConstitutionalReadinessErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalReadinessInput = Readonly<{
  readinessId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  antiEmergenceResult: AntiEmergenceResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  constitutionalTelemetryResult: ConstitutionalTelemetryResult;
  constitutionalRuntimeSimulationResult: ConstitutionalRuntimeSimulationResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ReadinessLineageLedger;
  existingReplayLedger?: readonly ReadinessLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ReadinessDomainScore = Readonly<{
  domain: ReadinessDomain;
  score: number;
  requirement: string;
  certified: boolean;
  deterministicHash: string;
}>;

export type GovernanceIntegrityRecord = Readonly<{
  governanceSnapshotId: string;
  governanceBound: boolean;
  staleGovernanceDetected: boolean;
  score: number;
  deterministicHash: string;
}>;

export type ReplayCertificationRecord = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replaySafe: boolean;
  lineageBound: boolean;
  score: number;
  deterministicHash: string;
}>;

export type ContainmentCertificationRecord = Readonly<{
  containmentId: string;
  contained: boolean;
  failClosed: boolean;
  score: number;
  deterministicHash: string;
}>;

export type RuntimeCompatibilityReadinessRecord = Readonly<{
  admissibilityId: string;
  runtimeCompatible: boolean;
  observabilityCompatible: boolean;
  score: number;
  deterministicHash: string;
}>;

export type EscalationCorrectnessRecord = Readonly<{
  escalationId: string;
  deterministic: boolean;
  oversightState: string;
  score: number;
  deterministicHash: string;
}>;

export type OverrideReliabilityRecord = Readonly<{
  supremacyId: string;
  globallyPropagated: boolean;
  propagationState: string;
  score: number;
  deterministicHash: string;
}>;

export type HumanSupremacyCertificationRecord = Readonly<{
  supremacyId: string;
  supremacyPreserved: boolean;
  operatorReviewRequired: true;
  score: number;
  deterministicHash: string;
}>;

export type DriftResistanceRecord = Readonly<{
  telemetryId: string;
  driftResistant: boolean;
  anomalyCount: number;
  score: number;
  deterministicHash: string;
}>;

export type ConstitutionalConfidenceRecord = Readonly<{
  readinessId: string;
  confidenceScore: number;
  confidenceHash: string;
}>;

export type UncertaintyPenaltyRecord = Readonly<{
  readinessId: string;
  penalty: number;
  penaltyReasons: readonly string[];
  penaltyHash: string;
}>;

export type ReadinessReplayBinding = Readonly<{
  bindingId: string;
  replayBound: boolean;
  governanceBound: boolean;
  escalationBound: boolean;
  overrideBound: boolean;
  telemetryBound: boolean;
  simulationBound: boolean;
  deterministicHash: string;
}>;

export type ReadinessGovernanceBinding = Readonly<{
  bindingId: string;
  governanceBound: boolean;
  supremacyBound: boolean;
  containmentBound: boolean;
  admissibilityBound: boolean;
  deterministicHash: string;
}>;

export type ConstitutionalReadinessEvidence = Readonly<{
  evidenceId: string;
  readinessId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type ConstitutionalReadinessReport = Readonly<{
  readinessId: string;
  advisoryOnly: true;
  executable: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  governanceMutationAllowed: false;
  orchestrationAllowed: false;
  operatorReviewRequired: true;
  readinessClassification: ReadinessClassification;
  readinessScore: number;
  confidenceScore: number;
  uncertaintyPenalty: number;
  failClosed: boolean;
  constitutionalViolations: readonly string[];
  reportHash: string;
}>;

export type ReadinessLineageEntry = Readonly<{
  entryId: string;
  readinessId: string;
  coordinationId: string;
  readinessClassification: ReadinessClassification;
  readinessScore: number;
  createdAt: string;
  deterministicHash: string;
}>;

export type ReadinessLineageLedger = Readonly<{
  entries: readonly ReadinessLineageEntry[];
  lineageHash: string;
}>;

export type ReadinessLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalReadinessExport = Readonly<{
  exportId: string;
  readinessId: string;
  evidenceHash: string;
  lineageHash: string;
  reportHash: string;
  scoreHash: string;
  exportHash: string;
}>;

export type ConstitutionalReadinessRecord = Readonly<{
  readinessId: string;
  coordinationId: string;
  replayId: string;
  supremacyId: string;
  escalationId: string;
  containmentId: string;
  admissibilityId: string;
  telemetryId: string;
  simulationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  readinessClassification: ReadinessClassification;
  failClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  createdAt: string;
}>;

export type ConstitutionalReadinessResult = Readonly<{
  record: ConstitutionalReadinessRecord;
  governanceIntegrity: GovernanceIntegrityRecord;
  replayCertification: ReplayCertificationRecord;
  containmentCertification: ContainmentCertificationRecord;
  runtimeCompatibility: RuntimeCompatibilityReadinessRecord;
  escalationCorrectness: EscalationCorrectnessRecord;
  overrideReliability: OverrideReliabilityRecord;
  humanSupremacyCertification: HumanSupremacyCertificationRecord;
  driftResistance: DriftResistanceRecord;
  confidence: ConstitutionalConfidenceRecord;
  uncertaintyPenalty: UncertaintyPenaltyRecord;
  domainScores: readonly ReadinessDomainScore[];
  replayBinding: ReadinessReplayBinding;
  governanceBinding: ReadinessGovernanceBinding;
  evidence: ConstitutionalReadinessEvidence;
  report: ConstitutionalReadinessReport;
  lineage: ReadinessLineageLedger;
  replayLedger: readonly ReadinessLedgerEntry[];
  export: ConstitutionalReadinessExport;
  warnings: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
