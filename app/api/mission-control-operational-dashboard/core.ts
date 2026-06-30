import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionControlOperationalDashboardObservabilitySurface,
  getMissionControlOperationalDashboardContract,
  runMissionControlOperationalDashboard,
  validateMissionControlOperationalDashboard,
} from "@/services/mission-control-operational-dashboard";
import type { MissionControlOperationalDashboardInput, MissionControlOperationalDashboardReport } from "@/types/mission-control-operational-dashboard";

export async function requireMissionControlOperationalDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionControlOperationalDashboardInput {
  return body as MissionControlOperationalDashboardInput;
}

function reportFromBody(body: Record<string, unknown>): MissionControlOperationalDashboardReport {
  return (body.report as MissionControlOperationalDashboardReport | undefined) ?? runMissionControlOperationalDashboard(inputFromBody(body));
}

export function getMissionControlOperationalDashboardContractResponse() { return getMissionControlOperationalDashboardContract(); }
export async function dashboardRequest(request: Request) { return runMissionControlOperationalDashboard(inputFromBody(await readBody(request))); }
export async function validateDashboardRequest(request: Request) { return validateMissionControlOperationalDashboard(reportFromBody(await readBody(request))); }
export async function timelineRequest(request: Request) { return reportFromBody(await readBody(request)).timeline; }
export async function stateRequest(request: Request) { return reportFromBody(await readBody(request)).state_monitor; }
export async function governanceRequest(request: Request) { return reportFromBody(await readBody(request)).governance_panel; }
export async function confidenceRequest(request: Request) { return reportFromBody(await readBody(request)).confidence_monitor; }
export async function risksRequest(request: Request) { return reportFromBody(await readBody(request)).risk_monitor; }
export async function supervisionRequest(request: Request) { return reportFromBody(await readBody(request)).supervision_monitor; }
export async function summaryRequest(request: Request) { return reportFromBody(await readBody(request)).mission_summary; }
export async function alertsRequest(request: Request) { return reportFromBody(await readBody(request)).alerts; }
export async function refreshRequest(request: Request) { return reportFromBody(await readBody(request)).refresh_record; }
export async function inspectDashboardRequest(request?: Request) {
  if (!request) return buildMissionControlOperationalDashboardObservabilitySurface();
  return buildMissionControlOperationalDashboardObservabilitySurface(reportFromBody(await readBody(request)));
}
