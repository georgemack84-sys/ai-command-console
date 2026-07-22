import {
  buildDashboardObservabilitySurface,
  getMultiAgentCoordinationDashboard,
  loadAgentGraph,
  loadAuthorityView,
  loadCommunicationAudit,
  loadConflictView,
  loadCoordinationDashboard,
  loadDashboardSnapshot,
  loadReplayTimeline,
  validateCoordinationDashboard,
} from "@/services/multi-agent-coordination-dashboard";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DashboardInput, MultiAgentCoordinationDashboard } from "@/types/multi-agent-coordination-dashboard";

export async function requireCoordinationDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function dashboardFromBody(body: Record<string, unknown>): MultiAgentCoordinationDashboard {
  return (body.dashboard as MultiAgentCoordinationDashboard | undefined) ?? loadCoordinationDashboard(body as DashboardInput);
}

export function contractResponse() { return getMultiAgentCoordinationDashboard(); }
export async function dashboardRequest(request: Request) { return loadCoordinationDashboard((await readBody(request)) as DashboardInput); }
export async function agentGraphRequest(request: Request) { return loadAgentGraph((await readBody(request)) as DashboardInput); }
export async function replayTimelineRequest(request: Request) { return loadReplayTimeline((await readBody(request)) as DashboardInput); }
export async function conflictViewRequest(request: Request) { return loadConflictView((await readBody(request)) as DashboardInput); }
export async function authorityViewRequest(request: Request) { return loadAuthorityView((await readBody(request)) as DashboardInput); }
export async function communicationAuditRequest(request: Request) { return loadCommunicationAudit((await readBody(request)) as DashboardInput); }
export async function snapshotRequest(request: Request) { return loadDashboardSnapshot((await readBody(request)) as DashboardInput); }
export async function validateRequest(request: Request) { return validateCoordinationDashboard(dashboardFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildDashboardObservabilitySurface();
  return buildDashboardObservabilitySurface(dashboardFromBody(await readBody(request)));
}
