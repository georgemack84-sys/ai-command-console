import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildEscalationRecommendationMetrics,
  buildEscalationRecommendationObservabilitySurface,
  computeEscalationRecommendationHash,
  generateEscalationRecommendations,
  getEscalationRecommendationContract,
  replayEscalationRecommendation,
  validateEscalationRecommendation,
} from "@/services/escalation-recommendation";
import type { EscalationRecommendationResult, EscalationRecommendationScenario } from "@/types/escalation-recommendation";

export async function requireEscalationRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getEscalationRecommendationContractResponse() {
  return getEscalationRecommendationContract();
}

export async function generateEscalationRecommendationsRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; scenario?: EscalationRecommendationScenario };
  return generateEscalationRecommendations(body);
}

export async function validateEscalationRecommendationRequest(request: Request) {
  const body = await readBody(request);
  return validateEscalationRecommendation(Object.keys(body).length ? body as Partial<EscalationRecommendationResult> : generateEscalationRecommendations());
}

export async function replayEscalationRecommendationRequest(request: Request) {
  const body = await readBody(request);
  return replayEscalationRecommendation(Object.keys(body).length ? body as EscalationRecommendationResult : generateEscalationRecommendations());
}

export async function hashEscalationRecommendationRequest(request: Request) {
  const body = await readBody(request);
  const result = Object.keys(body).length ? body as EscalationRecommendationResult : generateEscalationRecommendations();
  return { escalation_recommendation_hash: computeEscalationRecommendationHash(result) };
}

export async function metricsEscalationRecommendationRequest(request?: Request) {
  if (!request) return buildEscalationRecommendationMetrics();
  const body = await readBody(request);
  return buildEscalationRecommendationMetrics(Object.keys(body).length ? body as EscalationRecommendationResult : generateEscalationRecommendations());
}

export async function inspectEscalationRecommendationRequest(request?: Request) {
  if (!request) return buildEscalationRecommendationObservabilitySurface();
  const body = await readBody(request);
  return buildEscalationRecommendationObservabilitySurface(Object.keys(body).length ? body as EscalationRecommendationResult : generateEscalationRecommendations());
}
