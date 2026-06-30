import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import {
  activateWorkflow,
  buildWorkflowVisibilitySurface,
  getWorkflowOrchestratorFramework,
  replayWorkflow,
  validateOrchestration,
} from "@/services/workflow-orchestrator";
import type { WorkflowOrchestratorScenario } from "@/types/workflow-orchestrator";

export async function requireWorkflowOrchestratorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildWorkflowInputs(scenario?: WorkflowOrchestratorScenario) {
  const identity = generateAutonomyIdentity();
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract, scenario);
  return { identity, contract, workflow };
}

export function getWorkflowOrchestratorResponse() {
  return getWorkflowOrchestratorFramework();
}

export async function activateWorkflowRequest(request: Request) {
  const body = await readBody(request);
  return buildWorkflowInputs(body.scenario as WorkflowOrchestratorScenario | undefined).workflow;
}

export async function stateWorkflowRequest(request: Request) {
  const workflow = await activateWorkflowRequest(request);
  return {
    workflow_id: workflow.workflow_id,
    workflow_state: workflow.workflow_state,
    current_stage: workflow.current_stage,
    current_task: workflow.current_task,
    transition_history: workflow.transition_history,
  };
}

export async function eventsWorkflowRequest(request: Request) {
  return (await activateWorkflowRequest(request)).orchestration_events;
}

export async function synchronizationWorkflowRequest(request: Request) {
  return (await activateWorkflowRequest(request)).synchronization_points;
}

export async function validateWorkflowRequest(request: Request) {
  return validateOrchestration(await activateWorkflowRequest(request));
}

export async function replayWorkflowRequest(request: Request) {
  return replayWorkflow(await activateWorkflowRequest(request));
}

export async function visibilityWorkflowRequest(request: Request) {
  return buildWorkflowVisibilitySurface(await activateWorkflowRequest(request));
}
