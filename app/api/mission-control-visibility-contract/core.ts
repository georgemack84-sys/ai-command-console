import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionControlVisibilityObservabilitySurface,
  getMissionControlVisibilityContract,
  runMissionControlVisibilityContract,
  validateMissionControlVisibilityContract,
} from "@/services/mission-control-visibility-contract";
import type { MissionControlVisibilityContractInput, MissionControlVisibilityContractReport } from "@/types/mission-control-visibility-contract";

export async function requireMissionControlVisibilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionControlVisibilityContractInput {
  return body as MissionControlVisibilityContractInput;
}

function reportFromBody(body: Record<string, unknown>): MissionControlVisibilityContractReport {
  return (body.report as MissionControlVisibilityContractReport | undefined) ?? runMissionControlVisibilityContract(inputFromBody(body));
}

export function getMissionControlVisibilityContractResponse() { return getMissionControlVisibilityContract(); }
export async function reportMissionControlVisibilityRequest(request: Request) { return runMissionControlVisibilityContract(inputFromBody(await readBody(request))); }
export async function validateMissionControlVisibilityRequest(request: Request) { return validateMissionControlVisibilityContract(reportFromBody(await readBody(request))); }
export async function dashboardsMissionControlVisibilityRequest(request: Request) { return reportFromBody(await readBody(request)).dashboard_contracts; }
export async function widgetsMissionControlVisibilityRequest(request: Request) { return reportFromBody(await readBody(request)).widget_registry; }
export async function inspectMissionControlVisibilityRequest(request?: Request) {
  if (!request) return buildMissionControlVisibilityObservabilitySurface();
  return buildMissionControlVisibilityObservabilitySurface(reportFromBody(await readBody(request)));
}
