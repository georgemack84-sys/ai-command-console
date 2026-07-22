import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeMissionTrend,
  buildMissionTrendObservabilitySurface,
  getMissionTrendIntelligenceEngineContract,
  replayMissionTrend,
  validateMissionTrend,
} from "@/services/mission-trend-intelligence-engine";
import type { MissionTrend, MissionTrendInput } from "@/types/mission-trend-intelligence-engine";

export async function requireMissionTrendUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionTrendInput {
  return body as MissionTrendInput;
}

function trendFromBody(body: Record<string, unknown>): MissionTrend {
  return (body.trend as MissionTrend | undefined) ?? analyzeMissionTrend(inputFromBody(body));
}

export function contractResponse() { return getMissionTrendIntelligenceEngineContract(); }
export async function analyzeRequest(request: Request) { return analyzeMissionTrend(inputFromBody(await readBody(request))); }
export async function movingAverageRequest(request: Request) { return trendFromBody(await readBody(request)).moving_average; }
export async function driftRequest(request: Request) { return trendFromBody(await readBody(request)).subsystem_drift; }
export async function degradationRequest(request: Request) { return trendFromBody(await readBody(request)).degradation_velocity; }
export async function recoveryRequest(request: Request) { return trendFromBody(await readBody(request)).recovery_trend; }
export async function forecastRequest(request: Request) { return trendFromBody(await readBody(request)).forecast; }
export async function evidenceRequest(request: Request) { return trendFromBody(await readBody(request)).evidence; }
export async function replayRequest(request: Request) { return replayMissionTrend(trendFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionTrend(trendFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionTrendObservabilitySurface();
  return buildMissionTrendObservabilitySurface(trendFromBody(await readBody(request)));
}
