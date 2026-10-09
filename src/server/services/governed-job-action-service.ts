import { AppError } from "@/src/server/api/errors";
import {
  createGovernedRouteActionExecutor,
  type ControlledPlanExecutor,
  type GovernedRouteActor,
} from "@/src/server/services/governed-route-action-service";

const governedJobActions: Record<string, string> = {
  "workspace:generate-insights": "jobs:workspace-generate-insights",
  "workspace:failure-drill": "jobs:workspace-failure-drill",
  "workspace:generate-summary": "jobs:workspace-generate-summary",
  "job:cancel": "jobs:cancel",
  "job:retry": "jobs:retry",
};

export function normalizeGovernedJobAction(action: string) {
  const normalized = governedJobActions[action];
  if (!normalized) {
    throw new AppError(400, "job_action_unknown", `Unknown job action: ${action}.`);
  }
  return normalized;
}

export function createGovernedJobActionExecutor(executePlan?: ControlledPlanExecutor) {
  const execute = createGovernedRouteActionExecutor({
    domain: "job",
    source: "jobs_api",
    normalizeAction: normalizeGovernedJobAction,
    executePlan,
  });
  return (input: Record<string, unknown>, actor: GovernedRouteActor) =>
    execute({ action: input?.type, payload: input, confirmed: input?.confirmed }, actor);
}

export const executeGovernedJobAction = createGovernedJobActionExecutor();
