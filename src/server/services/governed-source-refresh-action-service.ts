import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

export function createGovernedSourceRefreshActionExecutor(executePlan?: ControlledPlanExecutor) {
  const execute = createGovernedRouteActionExecutor({
    domain: "source_refresh",
    source: "source_refresh_api",
    normalizeAction: () => "sources:refresh",
    additionalPlanFields: (input) => ({
      reviewAcknowledged: input.confirmed === true,
    }),
    executePlan,
  });

  return (input: Record<string, unknown>, actor: GovernedRouteActor) =>
    execute({ action: "refresh", payload: input, confirmed: input?.confirmed }, actor);
}

export const executeGovernedSourceRefreshAction = createGovernedSourceRefreshActionExecutor();
