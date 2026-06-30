import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import {
  buildTaskSequenceVisibilitySurface,
  classifyWorkflowTasks,
  generateTaskSequence,
  getTaskSequencingFramework,
  replayTaskSequence,
  validateTaskSequence,
} from "@/services/task-sequencing";
import type { TaskSequencingScenario } from "@/types/task-sequencing";

export async function requireTaskSequencingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildSequencingInputs(scenario?: TaskSequencingScenario) {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow, scenario);
  return { identity, workflow, sequence };
}

export function getTaskSequencingResponse() {
  return getTaskSequencingFramework();
}

export async function classifyTaskSequencingRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as TaskSequencingScenario | undefined;
  const { workflow } = buildSequencingInputs(scenario);
  return classifyWorkflowTasks(workflow, scenario);
}

export async function sequenceTaskSequencingRequest(request: Request) {
  const body = await readBody(request);
  return buildSequencingInputs(body.scenario as TaskSequencingScenario | undefined).sequence;
}

export async function validateTaskSequencingRequest(request: Request) {
  return validateTaskSequence(await sequenceTaskSequencingRequest(request));
}

export async function replayTaskSequencingRequest(request: Request) {
  return replayTaskSequence(await sequenceTaskSequencingRequest(request));
}

export async function visibilityTaskSequencingRequest(request: Request) {
  return buildTaskSequenceVisibilitySurface(await sequenceTaskSequencingRequest(request));
}
