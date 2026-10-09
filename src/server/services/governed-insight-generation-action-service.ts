import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
} from "@/src/server/services/governed-route-action-service";

const actionIds: Record<string, string> = {
  "generate-direct": "research:insights-generate-direct",
  "generate-queued": "research:insights-generate-queued",
};

export function normalizeInsightGenerationAction(action: string) {
  const normalized = actionIds[action];
  if (!normalized) {
    throw new AppError(400, "insight_generation_action_unknown", `Unknown insight generation action: ${action}.`);
  }
  return normalized;
}

export function createGovernedInsightGenerationActionExecutor(executePlan?: ControlledPlanExecutor) {
  return createGovernedRouteActionExecutor({
    domain: "insight_generation",
    source: "insights_api",
    normalizeAction: normalizeInsightGenerationAction,
    executePlan,
  });
}

export const executeGovernedInsightGenerationAction = createGovernedInsightGenerationActionExecutor();
