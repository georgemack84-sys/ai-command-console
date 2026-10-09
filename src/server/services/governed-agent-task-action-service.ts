import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

export function normalizeGovernedAgentTaskAction(action: string) {
  if (action !== "create") {
    throw new AppError(400, "agent_task_action_unknown", `Unknown agent task action: ${action}.`);
  }
  return "agent-tasks:create";
}

export function createGovernedAgentTaskActionExecutor(executePlan?: ControlledPlanExecutor) {
  const execute = createGovernedRouteActionExecutor({
    domain: "agent_task",
    source: "agent_tasks_api",
    normalizeAction: normalizeGovernedAgentTaskAction,
    executePlan,
  });

  return (input: Record<string, unknown>, actor: GovernedRouteActor) =>
    execute({ action: "create", payload: input, confirmed: input?.confirmed }, actor);
}

export const executeGovernedAgentTaskAction = createGovernedAgentTaskActionExecutor();
