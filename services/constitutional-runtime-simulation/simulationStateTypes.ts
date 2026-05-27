import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { AntiEmergenceResult } from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import type { ConstitutionalAuthorityBoundaryResult } from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { ConstitutionalTelemetryResult } from "@/services/constitutional-telemetry/telemetryStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type SimulationAuthorityStatus =
  | "MODELED_ONLY"
  | "NON_AUTHORITATIVE"
  | "FORBIDDEN_TO_EXECUTE";

export type SimulationExecutionStatus =
  | "EXECUTION_FORBIDDEN"
  | "SCHEDULING_FORBIDDEN"
  | "RUNTIME_MUTATION_FORBIDDEN";

export type SimulationOutcome =
  | "PASSED"
  | "FAILED_CLOSED"
  | "UNSTABLE"
  | "DISPUTED"
  | "REQUIRES_OPERATOR_REVIEW";

export type SimulationScenarioType =
  | "ESCALATION_PROPAGATION"
  | "AUTHORITY_REVOCATION"
  | "COORDINATION_STRESS"
  | "GOVERNANCE_CONFLICT"
  | "REPLAY_FAILURE"
  | "OPERATOR_INTERVENTION"
  | "RUNTIME_INSTABILITY"
  | "CONTAINMENT_PRESSURE";

export type ConstitutionalRuntimeSimulationErrorCode =
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_GOVERNANCE_MISMATCH"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_AUTHORITY_DIVERGENCE"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_OPERATOR_AMBIGUITY"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_ESCALATION_NONDETERMINISM"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_EXECUTABLE"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_HIDDEN_ORCHESTRATION"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_RECURSIVE_COORDINATION"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_AUTHORITY_MUTATION"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_CONTAINMENT_LOWERED"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_AUTHORITY_CROSSOVER"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_VALIDATOR_MISMATCH"
  | "CONSTITUTIONAL_RUNTIME_SIMULATION_BOUNDARY_VIOLATION";

export type ConstitutionalRuntimeSimulationError = Readonly<{
  code: ConstitutionalRuntimeSimulationErrorCode;
  message: string;
  path: string;
}>;

export type SimulationSignalDomain =
  | "escalation_propagation"
  | "authority_revocation"
  | "coordination_stress"
  | "governance_conflict"
  | "replay_failure"
  | "operator_intervention"
  | "runtime_instability"
  | "containment_pressure";

export type SimulationSignalSeverity = "none" | "moderate" | "high" | "critical";

export type SimulationSignal = Readonly<{
  domain: SimulationSignalDomain;
  triggered: boolean;
  severity: SimulationSignalSeverity;
  reason: string;
  deterministicHash: string;
}>;

export type SimulationScenarioDefinition = Readonly<{
  scenarioId: string;
  scenarioType: SimulationScenarioType;
  description: string;
  weight: number;
  deterministicHash: string;
}>;

export type SimulationScenarioTrace = Readonly<{
  scenarioId: string;
  scenarioType: SimulationScenarioType;
  outcome: SimulationOutcome;
  escalationRequired: boolean;
  operatorReviewRequired: boolean;
  constitutionalViolations: readonly string[];
  traceHash: string;
}>;

export type ConstitutionalSimulationReport = Readonly<{
  simulationId: string;
  advisoryOnly: true;
  executable: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  schedulingAllowed: false;
  orchestrationAllowed: false;
  governanceMutationAllowed: false;
  authorityStatus: "MODELED_ONLY";
  outcome: SimulationOutcome;
  escalationRequired: boolean;
  containmentPressureScore: number;
  constitutionalViolations: readonly string[];
  simulationTraceHash: string;
  operatorReviewRequired: boolean;
}>;

export type ConstitutionalRuntimeSimulationInput = Readonly<{
  simulationId: string;
  constitutionalAuthorityBoundaryResult: ConstitutionalAuthorityBoundaryResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  antiEmergenceResult: AntiEmergenceResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  constitutionalTelemetryResult: ConstitutionalTelemetryResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: SimulationLineageLedger;
  existingReplayLedger?: readonly SimulationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type SimulationReplayBinding = Readonly<{
  bindingId: string;
  replayBound: boolean;
  telemetryBound: boolean;
  runtimeBound: boolean;
  governanceBound: boolean;
  deterministicHash: string;
}>;

export type SimulationGovernanceBinding = Readonly<{
  bindingId: string;
  governanceBound: boolean;
  supremacyBound: boolean;
  containmentBound: boolean;
  escalationBound: boolean;
  deterministicHash: string;
}>;

export type SimulationContainmentState = Readonly<{
  containmentPressureScore: number;
  oversightIncreased: boolean;
  authorityIncreaseDetected: boolean;
  containmentHash: string;
}>;

export type SimulationEvidence = Readonly<{
  evidenceId: string;
  simulationId: string;
  replayEvidenceId: string;
  telemetryEvidenceId: string;
  runtimeEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type SimulationLineageEntry = Readonly<{
  entryId: string;
  simulationId: string;
  coordinationId: string;
  outcome: SimulationOutcome;
  createdAt: string;
  deterministicHash: string;
}>;

export type SimulationLineageLedger = Readonly<{
  entries: readonly SimulationLineageEntry[];
  lineageHash: string;
}>;

export type SimulationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type SimulationExport = Readonly<{
  exportId: string;
  simulationId: string;
  evidenceHash: string;
  lineageHash: string;
  reportHash: string;
  scenarioHash: string;
  exportHash: string;
}>;

export type ConstitutionalRuntimeSimulationResult = Readonly<{
  report: ConstitutionalSimulationReport;
  authorityStatus: SimulationAuthorityStatus;
  executionStatus: readonly SimulationExecutionStatus[];
  replayBinding: SimulationReplayBinding;
  governanceBinding: SimulationGovernanceBinding;
  containmentState: SimulationContainmentState;
  scenarioDefinitions: readonly SimulationScenarioDefinition[];
  scenarioTraces: readonly SimulationScenarioTrace[];
  signals: readonly SimulationSignal[];
  evidence: SimulationEvidence;
  lineage: SimulationLineageLedger;
  replayLedger: readonly SimulationLedgerEntry[];
  export: SimulationExport;
  warnings: readonly string[];
  errors: readonly ConstitutionalRuntimeSimulationError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
