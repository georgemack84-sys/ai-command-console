export const RECOVERY_SIMULATION_SCENARIO_TYPES = [
  "CRASH_RECOVERY",
  "LEASE_CONFLICT_RECOVERY",
  "STALE_EXECUTION_RECOVERY",
  "REPLAY_RECOVERY",
  "DEGRADED_INFRASTRUCTURE_RECOVERY",
  "DEPENDENCY_FAILURE_RECOVERY",
  "APPROVAL_TIMEOUT_RECOVERY",
  "PARTIAL_EXECUTION_RECOVERY",
] as const;

export type RecoverySimulationScenarioType = (typeof RECOVERY_SIMULATION_SCENARIO_TYPES)[number];

export const RECOVERY_SIMULATION_STATES = [
  "PENDING",
  "VALIDATING",
  "RUNNING",
  "REPLAYING",
  "VALIDATING_CONTINUITY",
  "VALIDATING_GOVERNANCE",
  "GENERATING_EVIDENCE",
  "COMPLETED",
  "FAILED",
  "DISPUTED",
  "BLOCKED",
  "CONTAINED",
] as const;

export type RecoverySimulationState = (typeof RECOVERY_SIMULATION_STATES)[number];

export const RECOVERY_SIMULATION_OUTCOMES = [
  "RECOVERY_VALID",
  "RECOVERY_VALID_WITH_WARNINGS",
  "REPLAY_DIVERGENCE_DETECTED",
  "GOVERNANCE_BLOCKED",
  "CONTINUITY_FAILED",
  "EVIDENCE_INCOMPLETE",
  "SIMULATION_FAILED",
  "CONTAINMENT_REQUIRED",
] as const;

export type RecoverySimulationOutcome = (typeof RECOVERY_SIMULATION_OUTCOMES)[number];

export type RecoverySimulationRequest = {
  simulationId: string;
  executionId: string;
  scenarioType: RecoverySimulationScenarioType;
  dryRun: true;
  requestedBy?: string;
  tenantId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type RecoverySimulationResult = {
  simulationId: string;
  executionId: string;
  scenarioType: RecoverySimulationScenarioType;
  state: string;
  outcome: string;
  dryRun: true;
  productionMutationAllowed: false;
  replayDeterministic: boolean;
  continuityValidated: boolean;
  governanceValidated: boolean;
  divergenceDetected: boolean;
  survivabilityScore: number;
  confidence: number;
  evidenceIds: string[];
  auditEventIds: string[];
  warnings: string[];
  disputes: string[];
  errors: string[];
  recommendedAction:
    | "ALLOW_RECOVERY_PATTERN"
    | "REQUIRE_RECONCILIATION"
    | "ESCALATE_TO_GOVERNANCE"
    | "CONTAIN_RUNTIME"
    | "BLOCK_RECOVERY_PATTERN";
  timestamp: string;
};

export type RecoverySimulationScenario = {
  type: RecoverySimulationScenarioType;
  recoveryAction: "replay" | "rollback" | "reassign" | "terminate" | "quarantine";
  expectedWarnings: string[];
  expectedDisputes: string[];
};
