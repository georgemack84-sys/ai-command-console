import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
} from "@/src/server/services/governed-route-action-service";

const workspaceActionAliases: Record<string, string> = {
  "workspace:assign-owner": "collaboration:automation-assign",
  "workspace:assign-approver": "collaboration:automation-assign-approver",
  "workspace:assign-backup-approver": "collaboration:automation-assign-backup-approver",
  "workspace:snooze": "collaboration:automation-snooze",
  "workspace:run-sweep": "collaboration:automation-run-sweep",
  "workspace:create-followup": "collaboration:automation-create-followup",
  "workspace:add-note": "collaboration:automation-add-note",
  "workspace:generate-summary": "collaboration:automation-generate-summary",
  "workspace:set-status": "collaboration:automation-set-status",
};

export function normalizeGovernedOperationsAction(action: string) {
  return workspaceActionAliases[action] || action;
}

export function createGovernedOperationsActionExecutor(
  executePlan?: ControlledPlanExecutor,
) {
  return createGovernedRouteActionExecutor({
    domain: "operations",
    source: "operations_api",
    normalizeAction: normalizeGovernedOperationsAction,
    executePlan,
  });
}

export const executeGovernedOperationsAction = createGovernedOperationsActionExecutor();
