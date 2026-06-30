import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor } from "@/services/execution-monitor";
import { buildCheckpointManager } from "@/services/checkpoint-manager";
import {
  buildRollbackPreparation,
  buildRollbackPreparationVisibilitySurface,
  getRollbackPreparationFramework,
  replayRollbackPreparation,
  validateRollbackPreparation,
} from "@/services/rollback-preparation";
import type { RollbackPreparationScenario } from "@/types/rollback-preparation";

export async function requireRollbackPreparationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildPreparationInputs(scenario?: RollbackPreparationScenario) {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule);
  const checkpoints = buildCheckpointManager(identity, monitor);
  const preparation = buildRollbackPreparation(identity, checkpoints, scenario);
  return { preparation };
}

export function getRollbackPreparationResponse() {
  return getRollbackPreparationFramework();
}

export async function prepareRollbackRequest(request: Request) {
  const body = await readBody(request);
  return buildPreparationInputs(body.scenario as RollbackPreparationScenario | undefined).preparation;
}

export async function rollbackBoundaryRequest(request: Request) {
  return (await prepareRollbackRequest(request)).plans[0]?.rollback_boundary;
}

export async function validateRollbackPreparationRequest(request: Request) {
  return validateRollbackPreparation(await prepareRollbackRequest(request));
}

export async function replayRollbackPreparationRequest(request: Request) {
  return replayRollbackPreparation(await prepareRollbackRequest(request));
}

export async function visibilityRollbackPreparationRequest(request: Request) {
  return buildRollbackPreparationVisibilitySurface(await prepareRollbackRequest(request));
}
