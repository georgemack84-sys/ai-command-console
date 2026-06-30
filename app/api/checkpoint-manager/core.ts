import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor } from "@/services/execution-monitor";
import {
  buildCheckpointManager,
  buildCheckpointVisibilitySurface,
  getCheckpointManagerFramework,
  replayCheckpointManager,
  validateCheckpointManager,
} from "@/services/checkpoint-manager";
import type { CheckpointManagerScenario } from "@/types/checkpoint-manager";

export async function requireCheckpointManagerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildManagerInputs(scenario?: CheckpointManagerScenario) {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule);
  const manager = buildCheckpointManager(identity, monitor, scenario);
  return { manager };
}

export function getCheckpointManagerResponse() {
  return getCheckpointManagerFramework();
}

export async function captureCheckpointRequest(request: Request) {
  const body = await readBody(request);
  return buildManagerInputs(body.scenario as CheckpointManagerScenario | undefined).manager;
}

export async function registryCheckpointRequest(request: Request) {
  return (await captureCheckpointRequest(request)).registry;
}

export async function validateCheckpointRequest(request: Request) {
  return validateCheckpointManager(await captureCheckpointRequest(request));
}

export async function replayCheckpointRequest(request: Request) {
  return replayCheckpointManager(await captureCheckpointRequest(request));
}

export async function visibilityCheckpointRequest(request: Request) {
  return buildCheckpointVisibilitySurface(await captureCheckpointRequest(request));
}
