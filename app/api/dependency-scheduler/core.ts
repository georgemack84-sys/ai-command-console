import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import {
  buildDependencySchedule,
  buildDependencyScheduleVisibilitySurface,
  getDependencySchedulerFramework,
  registerDependencies,
  replayDependencySchedule,
  validateDependencySchedule,
} from "@/services/dependency-scheduler";
import type { DependencySchedulerScenario } from "@/types/dependency-scheduler";

export async function requireDependencySchedulerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildSchedulerInputs(scenario?: DependencySchedulerScenario) {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence, scenario);
  return { identity, sequence, schedule };
}

export function getDependencySchedulerResponse() {
  return getDependencySchedulerFramework();
}

export async function registryDependencySchedulerRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as DependencySchedulerScenario | undefined;
  const { sequence } = buildSchedulerInputs(scenario);
  return registerDependencies(sequence, scenario);
}

export async function scheduleDependencySchedulerRequest(request: Request) {
  const body = await readBody(request);
  return buildSchedulerInputs(body.scenario as DependencySchedulerScenario | undefined).schedule;
}

export async function readinessDependencySchedulerRequest(request: Request) {
  return (await scheduleDependencySchedulerRequest(request)).readiness_records;
}

export async function validateDependencySchedulerRequest(request: Request) {
  return validateDependencySchedule(await scheduleDependencySchedulerRequest(request));
}

export async function replayDependencySchedulerRequest(request: Request) {
  return replayDependencySchedule(await scheduleDependencySchedulerRequest(request));
}

export async function visibilityDependencySchedulerRequest(request: Request) {
  return buildDependencyScheduleVisibilitySurface(await scheduleDependencySchedulerRequest(request));
}
