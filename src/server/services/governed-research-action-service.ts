import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
} from "@/src/server/services/governed-route-action-service";
import { AppError } from "@/src/server/api/errors";

const governedResearchActions: Record<string, string> = {
  "brief:route": "research:brief-route",
  "review:create": "research:review-create",
  "review:followup": "research:review-followup",
  "report:create": "research:report-create",
  "report:publish": "research:report-publish",
};

export function normalizeGovernedResearchAction(action: string) {
  const normalized = governedResearchActions[action];
  if (!normalized) {
    throw new AppError(400, "research_action_unknown", `Unknown research action: ${action}.`);
  }
  return normalized;
}

export function createGovernedResearchActionExecutor(executePlan?: ControlledPlanExecutor) {
  return createGovernedRouteActionExecutor({
    domain: "research",
    source: "research_api",
    normalizeAction: normalizeGovernedResearchAction,
    executePlan,
  });
}

export const executeGovernedResearchAction = createGovernedResearchActionExecutor();
