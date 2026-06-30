import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import {
  buildExecutionMonitor,
  buildExecutionMonitorVisibilitySurface,
  getExecutionMonitorFramework,
  replayExecutionMonitor,
  validateExecutionMonitor,
} from "@/services/execution-monitor";
import type { ExecutionMonitorScenario } from "@/types/execution-monitor";

export async function requireExecutionMonitorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildMonitorInputs(scenario?: ExecutionMonitorScenario) {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule, scenario);
  return { monitor };
}

export function getExecutionMonitorResponse() {
  return getExecutionMonitorFramework();
}

export async function monitorExecutionRequest(request: Request) {
  const body = await readBody(request);
  return buildMonitorInputs(body.scenario as ExecutionMonitorScenario | undefined).monitor;
}

export async function telemetryExecutionMonitorRequest(request: Request) {
  return (await monitorExecutionRequest(request)).telemetry_events;
}

export async function healthExecutionMonitorRequest(request: Request) {
  return (await monitorExecutionRequest(request)).health_metrics;
}

export async function validateExecutionMonitorRequest(request: Request) {
  return validateExecutionMonitor(await monitorExecutionRequest(request));
}

export async function replayExecutionMonitorRequest(request: Request) {
  return replayExecutionMonitor(await monitorExecutionRequest(request));
}

export async function visibilityExecutionMonitorRequest(request: Request) {
  return buildExecutionMonitorVisibilitySurface(await monitorExecutionRequest(request));
}
