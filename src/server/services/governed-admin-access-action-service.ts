import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

const governedAdminAccessActions: Record<string, string> = {
  "user-role": "admin:user-role",
  "user-status": "admin:user-status",
  "user-workspace": "admin:user-workspace",
  "workspace-rename": "admin:workspace-rename",
  "workspace-invite": "admin:workspace-invite",
  "workspace-invite-revoke": "admin:workspace-invite-revoke",
  "workspace-policy": "admin:workspace-policy",
  governance: "admin:governance",
  "ai-summary-check": "admin:ai-summary-check",
};

export function normalizeGovernedAdminAccessAction(action: string) {
  const normalized = governedAdminAccessActions[action];
  if (!normalized) {
    throw new AppError(400, "admin_action_unknown", `Unknown admin action: ${action}.`);
  }
  return normalized;
}

const createExecutor = (executePlan?: ControlledPlanExecutor) =>
  createGovernedRouteActionExecutor({
    domain: "admin",
    source: "admin_access_api",
    normalizeAction: normalizeGovernedAdminAccessAction,
    executePlan,
  });

export function createGovernedAdminAccessActionExecutor(executePlan?: ControlledPlanExecutor) {
  const execute = createExecutor(executePlan);
  return (input: Record<string, unknown>, actor: GovernedRouteActor) =>
    execute(
      {
        action: input?.type,
        payload: input,
        confirmed: input?.confirmed,
      },
      actor,
    );
}

export const executeGovernedAdminAccessAction = createGovernedAdminAccessActionExecutor();
