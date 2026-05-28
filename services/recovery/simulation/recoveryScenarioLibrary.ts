import {
  RECOVERY_SIMULATION_SCENARIO_TYPES,
  type RecoverySimulationScenario,
  type RecoverySimulationScenarioType,
} from "./recoverySimulationTypes";

const SCENARIOS: Record<RecoverySimulationScenarioType, RecoverySimulationScenario> = {
  CRASH_RECOVERY: {
    type: "CRASH_RECOVERY",
    recoveryAction: "replay",
    expectedWarnings: [],
    expectedDisputes: [],
  },
  LEASE_CONFLICT_RECOVERY: {
    type: "LEASE_CONFLICT_RECOVERY",
    recoveryAction: "quarantine",
    expectedWarnings: ["lease:conflict"],
    expectedDisputes: ["LEASE_CONFLICT"],
  },
  STALE_EXECUTION_RECOVERY: {
    type: "STALE_EXECUTION_RECOVERY",
    recoveryAction: "quarantine",
    expectedWarnings: ["execution:stale"],
    expectedDisputes: ["STALE_RUNTIME_TRUTH"],
  },
  REPLAY_RECOVERY: {
    type: "REPLAY_RECOVERY",
    recoveryAction: "replay",
    expectedWarnings: [],
    expectedDisputes: ["REPLAY_DIVERGENCE"],
  },
  DEGRADED_INFRASTRUCTURE_RECOVERY: {
    type: "DEGRADED_INFRASTRUCTURE_RECOVERY",
    recoveryAction: "replay",
    expectedWarnings: ["infrastructure:degraded"],
    expectedDisputes: [],
  },
  DEPENDENCY_FAILURE_RECOVERY: {
    type: "DEPENDENCY_FAILURE_RECOVERY",
    recoveryAction: "replay",
    expectedWarnings: ["dependency:failed"],
    expectedDisputes: [],
  },
  APPROVAL_TIMEOUT_RECOVERY: {
    type: "APPROVAL_TIMEOUT_RECOVERY",
    recoveryAction: "rollback",
    expectedWarnings: ["approval:expired"],
    expectedDisputes: ["APPROVAL_TIMEOUT"],
  },
  PARTIAL_EXECUTION_RECOVERY: {
    type: "PARTIAL_EXECUTION_RECOVERY",
    recoveryAction: "quarantine",
    expectedWarnings: ["execution:partial"],
    expectedDisputes: ["PARTIAL_EXECUTION"],
  },
};

export function listRecoverySimulationScenarios() {
  return RECOVERY_SIMULATION_SCENARIO_TYPES.map((type) => SCENARIOS[type]);
}

export function getRecoverySimulationScenario(type: RecoverySimulationScenarioType): RecoverySimulationScenario {
  const scenario = SCENARIOS[type];
  if (!scenario) {
    throw new Error(`Unknown recovery simulation scenario: ${String(type)}`);
  }
  return scenario;
}
