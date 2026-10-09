import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
} from "@/src/server/services/governed-route-action-service";

const actionIds: Record<string, string> = {
  create: "research:briefs-create",
  update: "research:briefs-update",
  route: "research:briefs-route",
  delete: "research:briefs-delete",
};

export function normalizeResearchBriefMutationAction(action: string) {
  const normalized = actionIds[action];
  if (!normalized) {
    throw new AppError(400, "research_brief_action_unknown", `Unknown research brief action: ${action}.`);
  }
  return normalized;
}

export function createGovernedResearchBriefMutationExecutor(executePlan?: ControlledPlanExecutor) {
  return createGovernedRouteActionExecutor({
    domain: "research_brief",
    source: "research_briefs_api",
    normalizeAction: normalizeResearchBriefMutationAction,
    executePlan,
  });
}

export const executeGovernedResearchBriefMutation = createGovernedResearchBriefMutationExecutor();
