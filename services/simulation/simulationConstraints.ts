import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { ConstitutionalSimulationType } from "./scenarioForecasting";

export function evaluateSimulationConstraints(input: {
  dashboard: RecoveryDashboardReadModel | null;
  simulationType: ConstitutionalSimulationType;
}) {
  const blockedReasons = [
    ...(input.dashboard ? [] : ["CONTROL_PLANE_CONTEXT_MISSING"]),
    ...(input.dashboard?.governanceDisputes.length ? ["REPLAY_MISMATCH_UNRESOLVED"] : []),
    ...(input.dashboard?.continuityConvergence?.requiresFreeze ? ["COORDINATION_FREEZE_ACTIVE"] : []),
  ];

  return {
    simulationType: input.simulationType,
    allowed: blockedReasons.length === 0,
    deterministic: true as const,
    readOnly: true as const,
    blockedReasons,
  };
}
