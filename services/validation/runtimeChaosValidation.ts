import { ConstitutionalValidationSeverity, ConstitutionalValidationState, type ConstitutionalValidationResult } from "./constitutionalOperationalValidation";

export function validateRuntimeChaos(input: {
  governanceOutage: boolean;
  escalationStorm: boolean;
  dependencyCollapse: boolean;
  replayCorruption: boolean;
  containmentFailure: boolean;
  heartbeatInstability: boolean;
  createdAt: number;
}) : ConstitutionalValidationResult {
  const failures = [
    ...(input.governanceOutage ? ["governance_outage_detected"] : []),
    ...(input.escalationStorm ? ["escalation_storm_detected"] : []),
    ...(input.dependencyCollapse ? ["dependency_collapse_detected"] : []),
    ...(input.replayCorruption ? ["replay_corruption_detected"] : []),
    ...(input.containmentFailure ? ["containment_failure_detected"] : []),
    ...(input.heartbeatInstability ? ["heartbeat_instability_detected"] : []),
  ];
  return {
    validationId: `runtime-chaos:${input.createdAt}`,
    validationState: failures.length > 0 ? ConstitutionalValidationState.FAILED : ConstitutionalValidationState.PASSED,
    severity: input.replayCorruption || input.containmentFailure ? ConstitutionalValidationSeverity.CRITICAL : ConstitutionalValidationSeverity.MODERATE,
    constitutionalSafe: failures.length === 0,
    survivabilitySafe: !(input.dependencyCollapse || input.containmentFailure),
    autonomySafe: !input.governanceOutage,
    governanceIntegrity: input.governanceOutage ? 0.22 : 0.74,
    containmentIntegrity: input.containmentFailure ? 0.28 : 0.72,
    operationalStability: input.dependencyCollapse ? 0.31 : 0.68,
    failures,
    warnings: [],
    disputedSystems: input.replayCorruption ? ["replay"] : [],
    rollbackRequired: input.replayCorruption,
    containmentRequired: input.containmentFailure || input.replayCorruption,
    escalationRequired: input.escalationStorm || input.governanceOutage,
    immutableAuditVerified: true,
  };
}
