import { getMissionControlBundle, runMissionControl, validateMissionControl } from "@/services/mission-control";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MissionControlInput, MissionControlResult } from "@/types/mission-control";

export async function requireMissionControlUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MissionControlInput { return body as MissionControlInput; }
function resultFromBody(body: Record<string, unknown>): MissionControlResult { return (body.result as MissionControlResult | undefined) ?? runMissionControl(inputFromBody(body)); }

export function contractResponse() { return getMissionControlBundle(); }
export async function validateRequest(request: Request) { return validateMissionControl(resultFromBody(await readBody(request))); }
export async function workspaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { application: result.application, mission_workspace: result.mission_workspace }; }
export async function missionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { mission_management: result.mission_management }; }
export async function intelligenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { strategic_intelligence: result.strategic_intelligence }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { recommendation_center: result.recommendation_center }; }
export async function operatorsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { operator_workspace: result.operator_workspace }; }
export async function visualizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { visualization_framework: result.visualization_framework }; }
export async function replayAuditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { replay_audit_viewer: result.replay_audit_viewer }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { governance_workspace: result.governance_workspace }; }
export async function configurationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { configuration: result.configuration, integrations: result.integrations }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionControl(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
