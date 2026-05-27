import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { SimulationScenario } from "./simulationTypes";

export function buildSimulationLineage({
  dashboard,
  scenario,
}: {
  dashboard: RecoveryDashboardReadModel;
  scenario: SimulationScenario;
}) {
  return Array.from(new Set([
    `simulation:${scenario.simulationType.toLowerCase()}`,
    ...(dashboard.continuityConvergence?.evidence || []).slice(0, 4),
    ...scenario.executionIds.slice(0, 3).map((executionId) => `execution:${executionId}`),
  ]));
}
