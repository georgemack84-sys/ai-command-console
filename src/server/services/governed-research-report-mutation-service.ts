import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

const actionIds: Record<string, string> = {
  create: "research:reports-create",
  update: "research:reports-update",
  delete: "research:reports-delete",
};

export function normalizeResearchReportMutationAction(action: string) {
  const normalized = actionIds[action];
  if (!normalized) {
    throw new AppError(400, "research_report_action_unknown", `Unknown research report action: ${action}.`);
  }
  return normalized;
}

export function createGovernedResearchReportMutationExecutor(executePlan?: ControlledPlanExecutor) {
  return createGovernedRouteActionExecutor({
    domain: "research_report",
    source: "research_reports_api",
    normalizeAction: normalizeResearchReportMutationAction,
    executePlan,
  });
}

export const executeGovernedResearchReportMutation = createGovernedResearchReportMutationExecutor();

export type ResearchReportMutationActor = GovernedRouteActor;
