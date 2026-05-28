import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReadinessResult } from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { ConstitutionalRuntimeSimulationResult } from "@/services/constitutional-runtime-simulation/simulationStateTypes";
import type { ConstitutionalTelemetryResult } from "@/services/constitutional-telemetry/telemetryStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type ConstitutionalCertificationDecision =
  | "CERTIFIED"
  | "CONDITIONALLY_CERTIFIED"
  | "REJECTED"
  | "CONTAINMENT_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "REPLAY_FAILURE"
  | "EMERGENCE_RISK"
  | "AUTHORITY_BOUNDARY_FAILURE"
  | "ESCALATION_FAILURE";

export type ConstitutionalCertificationErrorCode =
  | "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_AMBIGUITY"
  | "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_CERTIFICATION_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_CERTIFICATION_REPLAY_NONDETERMINISM"
  | "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY"
  | "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE"
  | "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_WEAKENING"
  | "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT"
  | "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION"
  | "CONSTITUTIONAL_CERTIFICATION_RECURSIVE_COORDINATION"
  | "CONSTITUTIONAL_CERTIFICATION_LINEAGE_GAP"
  | "CONSTITUTIONAL_CERTIFICATION_RUNTIME_UNCERTAINTY"
  | "CONSTITUTIONAL_CERTIFICATION_STALE_GOVERNANCE"
  | "CONSTITUTIONAL_CERTIFICATION_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_CROSSOVER"
  | "CONSTITUTIONAL_CERTIFICATION_POLICY_VIOLATION"
  | "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_INSUFFICIENT"
  | "CONSTITUTIONAL_CERTIFICATION_VALIDATOR_MISMATCH";

export type ConstitutionalCertificationError = Readonly<{
  code: ConstitutionalCertificationErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalCertificationInput = Readonly<{
  certificationId: string;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
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
  existingLineage?: CertificationLineageLedger;
  existingReplayLedger?: readonly CertificationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CertificationScorecard = Readonly<{
  governanceIntegrity: number;
  replayDeterminism: number;
  containmentStrength: number;
  humanSupremacy: number;
  escalationDeterminism: number;
  overrideReliability: number;
  driftResistance: number;
  runtimeCompatibility: number;
  antiEmergenceIntegrity: number;
  scoreHash: string;
}>;

export type CertificationPolicyRecord = Readonly<{
  containmentStrength: number;
  autonomyCapabilityGrowth: number;
  containmentDominatesAutonomy: boolean;
  policyHash: string;
}>;

export type CertificationAggregationRecord = Readonly<{
  readinessScore: number;
  confidenceScore: number;
  uncertaintyPenalty: number;
  aggregateScore: number;
  aggregateHash: string;
}>;

export type GovernanceImmutabilityRecord = Readonly<{
  governanceSnapshotId: string;
  immutable: boolean;
  score: number;
  deterministicHash: string;
}>;

export type ReplayCertificationRecord = Readonly<{
  replayId: string;
  deterministic: boolean;
  lineageComplete: boolean;
  score: number;
  deterministicHash: string;
}>;

export type HumanSupremacyCertificationRecord = Readonly<{
  supremacyId: string;
  preserved: boolean;
  killSwitchValid: boolean;
  score: number;
  deterministicHash: string;
}>;

export type EscalationCertificationRecord = Readonly<{
  escalationId: string;
  deterministic: boolean;
  oversightIncreasePreserved: boolean;
  score: number;
  deterministicHash: string;
}>;

export type ContainmentCertificationRecord = Readonly<{
  containmentId: string;
  contained: boolean;
  strongerThanCapabilityGrowth: boolean;
  score: number;
  deterministicHash: string;
}>;

export type AntiEmergenceCertificationRecord = Readonly<{
  containmentId: string;
  hiddenExecutionDetected: boolean;
  recursiveCoordinationDetected: boolean;
  authorityExpansionDetected: boolean;
  score: number;
  deterministicHash: string;
}>;

export type AuthorityBoundaryCertificationRecord = Readonly<{
  boundaryId: string;
  stable: boolean;
  revoked: boolean;
  score: number;
  deterministicHash: string;
}>;

export type DriftResistanceCertificationRecord = Readonly<{
  telemetryId: string;
  resistant: boolean;
  driftCount: number;
  score: number;
  deterministicHash: string;
}>;

export type CertificationEvidence = Readonly<{
  evidenceId: string;
  certificationId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type CertificationLineageEntry = Readonly<{
  entryId: string;
  certificationId: string;
  coordinationId: string;
  decision: ConstitutionalCertificationDecision;
  aggregateScore: number;
  createdAt: string;
  deterministicHash: string;
}>;

export type CertificationLineageLedger = Readonly<{
  entries: readonly CertificationLineageEntry[];
  lineageHash: string;
}>;

export type CertificationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalCertificationReport = Readonly<{
  certificationId: string;
  advisoryOnly: true;
  executionAuthorized: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  governanceMutationAllowed: false;
  orchestrationAllowed: false;
  operatorReviewRequired: true;
  decision: ConstitutionalCertificationDecision;
  certified: boolean;
  aggregateScore: number;
  confidenceScore: number;
  uncertaintyPenalty: number;
  failClosed: boolean;
  constitutionalViolations: readonly string[];
  reportHash: string;
}>;

export type ConstitutionalCertificationRecord = Readonly<{
  certificationId: string;
  coordinationId: string;
  readinessId: string;
  replayId: string;
  supremacyId: string;
  escalationId: string;
  containmentId: string;
  boundaryId: string;
  admissibilityId: string;
  telemetryId: string;
  simulationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  decision: ConstitutionalCertificationDecision;
  failClosed: boolean;
  governanceBound: boolean;
  replaySafe: boolean;
  createdAt: string;
}>;

export type ConstitutionalCertificationExport = Readonly<{
  exportId: string;
  certificationId: string;
  evidenceHash: string;
  lineageHash: string;
  reportHash: string;
  policyHash: string;
  exportHash: string;
}>;

export type ConstitutionalCertificationResult = Readonly<{
  record: ConstitutionalCertificationRecord;
  scorecard: CertificationScorecard;
  aggregation: CertificationAggregationRecord;
  policy: CertificationPolicyRecord;
  governanceImmutability: GovernanceImmutabilityRecord;
  replayCertification: ReplayCertificationRecord;
  humanSupremacyCertification: HumanSupremacyCertificationRecord;
  escalationCertification: EscalationCertificationRecord;
  containmentCertification: ContainmentCertificationRecord;
  antiEmergenceCertification: AntiEmergenceCertificationRecord;
  authorityBoundaryCertification: AuthorityBoundaryCertificationRecord;
  driftResistanceCertification: DriftResistanceCertificationRecord;
  evidence: CertificationEvidence;
  report: ConstitutionalCertificationReport;
  lineage: CertificationLineageLedger;
  replayLedger: readonly CertificationLedgerEntry[];
  export: ConstitutionalCertificationExport;
  warnings: readonly string[];
  errors: readonly ConstitutionalCertificationError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
