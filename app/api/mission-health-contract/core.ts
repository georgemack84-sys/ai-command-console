import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionHealthObservabilitySurface,
  createMissionHealth,
  getMissionHealthContract,
  replayMissionHealth,
  validateMissionHealth,
} from "@/services/mission-health-contract";
import type { MissionHealthInput, MissionHealthRecord } from "@/types/mission-health-contract";

export async function requireMissionHealthUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionHealthInput {
  return body as MissionHealthInput;
}

function healthFromBody(body: Record<string, unknown>): MissionHealthRecord {
  return (body.health as MissionHealthRecord | undefined) ?? createMissionHealth(inputFromBody(body));
}

export function contractResponse() { return getMissionHealthContract(); }
export async function healthRequest(request: Request) { return createMissionHealth(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionHealth(healthFromBody(await readBody(request))); }
export async function subsystemsRequest(request: Request) { return healthFromBody(await readBody(request)).subsystem_scores; }
export async function evidenceRequest(request: Request) { return healthFromBody(await readBody(request)).evidence; }
export async function timelineRequest(request: Request) { return healthFromBody(await readBody(request)).timeline; }
export async function trendRequest(request: Request) { return healthFromBody(await readBody(request)).trend_summary; }
export async function replayRequest(request: Request) { return replayMissionHealth(healthFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionHealthObservabilitySurface();
  return buildMissionHealthObservabilitySurface(healthFromBody(await readBody(request)));
}
