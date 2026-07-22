import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionHealthScoringObservabilitySurface,
  getMissionHealthScoringEngineContract,
  replayMissionHealthScore,
  scoreMissionHealth,
  validateMissionHealthScore,
} from "@/services/mission-health-scoring-engine";
import type { MissionHealthScore, MissionHealthScoringInput } from "@/types/mission-health-scoring-engine";

export async function requireMissionHealthScoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionHealthScoringInput {
  return body as MissionHealthScoringInput;
}

function scoreFromBody(body: Record<string, unknown>): MissionHealthScore {
  return (body.score as MissionHealthScore | undefined) ?? scoreMissionHealth(inputFromBody(body));
}

export function contractResponse() { return getMissionHealthScoringEngineContract(); }
export async function scoreRequest(request: Request) { return scoreMissionHealth(inputFromBody(await readBody(request))); }
export async function weightsRequest(request: Request) { return scoreFromBody(await readBody(request)).weighting_profile; }
export async function confidenceRequest(request: Request) { return scoreFromBody(await readBody(request)).overall_confidence; }
export async function readinessRequest(request: Request) {
  const score = scoreFromBody(await readBody(request));
  return { mission_health_score_id: score.mission_health_score_id, readiness_score: score.readiness_score, readiness: score.readiness };
}
export async function stabilityRequest(request: Request) {
  const score = scoreFromBody(await readBody(request));
  return { mission_health_score_id: score.mission_health_score_id, stability_index: score.stability_index, consistency_score: score.consistency_score, consistency: score.consistency };
}
export async function degradationRequest(request: Request) {
  const score = scoreFromBody(await readBody(request));
  return { mission_health_score_id: score.mission_health_score_id, degradation_severity: score.degradation_severity, health_state: score.health_state };
}
export async function evidenceRequest(request: Request) { return scoreFromBody(await readBody(request)).scoring_evidence; }
export async function replayRequest(request: Request) { return replayMissionHealthScore(scoreFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionHealthScore(scoreFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionHealthScoringObservabilitySurface();
  return buildMissionHealthScoringObservabilitySurface(scoreFromBody(await readBody(request)));
}
