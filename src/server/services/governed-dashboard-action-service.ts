import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
} from "@/src/server/services/governed-route-action-service";

const governedDashboardActions: Record<string, string> = {
  "alert:run-checks": "dashboard:alert-run-checks",
  "alert:acknowledge": "dashboard:alert-acknowledge",
  "workspace:generate-summary": "dashboard:workspace-generate-summary",
};

export function normalizeGovernedDashboardAction(action: string) {
  const normalized = governedDashboardActions[action];
  if (!normalized) {
    throw new AppError(400, "dashboard_action_unknown", `Unknown dashboard action: ${action}.`);
  }
  return normalized;
}

export function createGovernedDashboardActionExecutor(executePlan?: ControlledPlanExecutor) {
  return createGovernedRouteActionExecutor({
    domain: "dashboard",
    source: "dashboard_api",
    normalizeAction: normalizeGovernedDashboardAction,
    executePlan,
  });
}

export const executeGovernedDashboardAction = createGovernedDashboardActionExecutor();
