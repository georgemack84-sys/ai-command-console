import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionHealthRecommendationObservabilitySurface,
  getMissionHealthRecommendationEngineContract,
  recommendMissionHealth,
  replayMissionHealthRecommendations,
  validateMissionHealthRecommendations,
} from "@/services/mission-health-recommendation-engine";
import type { MissionHealthRecommendationInput, MissionHealthRecommendationSet } from "@/types/mission-health-recommendation-engine";

export async function requireMissionHealthRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionHealthRecommendationInput {
  return body as MissionHealthRecommendationInput;
}

function setFromBody(body: Record<string, unknown>): MissionHealthRecommendationSet {
  return (body.recommendation_set as MissionHealthRecommendationSet | undefined) ?? recommendMissionHealth(inputFromBody(body));
}

export function contractResponse() { return getMissionHealthRecommendationEngineContract(); }
export async function recommendRequest(request: Request) { return recommendMissionHealth(inputFromBody(await readBody(request))); }
export async function priorityRequest(request: Request) { return setFromBody(await readBody(request)).recommendations.map((item) => ({ recommendation_id: item.recommendation_id, recommendation_type: item.recommendation_type, priority: item.priority, severity: item.severity, risk_score: item.risk_score })); }
export async function confidenceRequest(request: Request) { return setFromBody(await readBody(request)).recommendations.map((item) => ({ recommendation_id: item.recommendation_id, confidence: item.confidence, confidence_score: item.confidence_score })); }
export async function evidenceRequest(request: Request) { return setFromBody(await readBody(request)).recommendations.flatMap((item) => item.supporting_evidence); }
export async function operatorReportRequest(request: Request) { return setFromBody(await readBody(request)).operator_advisory_report; }
export async function governanceValidationRequest(request: Request) { return setFromBody(await readBody(request)).recommendations.map((item) => item.governance_validation); }
export async function replayRequest(request: Request) { return replayMissionHealthRecommendations(setFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionHealthRecommendations(setFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionHealthRecommendationObservabilitySurface();
  return buildMissionHealthRecommendationObservabilitySurface(setFromBody(await readBody(request)));
}
