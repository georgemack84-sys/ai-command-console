import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

export function createGovernedScheduledSummaryActionExecutor(executePlan?: ControlledPlanExecutor) {
  const execute = createGovernedRouteActionExecutor({
    domain: "scheduled_summary",
    source: "scheduled_summary_api",
    normalizeAction: () => "research:summaries-run-due",
    additionalPlanFields: (input) => ({
      reviewAcknowledged: input.confirmed === true,
    }),
    executePlan,
  });

  return (input: Record<string, unknown>, actor: GovernedRouteActor) =>
    execute({ action: "run-due", payload: input, confirmed: input?.confirmed }, actor);
}

export const executeGovernedScheduledSummaryAction = createGovernedScheduledSummaryActionExecutor();
