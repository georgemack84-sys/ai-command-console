import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecommendationGenerationContract,
  buildRecommendationGenerationObservabilitySurface,
  computeRecommendationGenerationHash,
  generateRecommendations,
  replayRecommendationGeneration,
  validateRecommendationGeneration,
} from "@/services/recommendation-generation";
import type { RecommendationGenerationResult, RecommendationGenerationScenario } from "@/types/recommendation-generation";

export async function requireRecommendationGenerationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationGenerationContractResponse() {
  return buildRecommendationGenerationContract();
}

export async function generateRecommendationsRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; scenario?: RecommendationGenerationScenario };
  return generateRecommendations(body);
}

export async function validateRecommendationGenerationRequest(request: Request) {
  const body = await readBody(request);
  return validateRecommendationGeneration(Object.keys(body).length ? body as Partial<RecommendationGenerationResult> : generateRecommendations());
}

export async function replayRecommendationGenerationRequest(request: Request) {
  const body = await readBody(request);
  return replayRecommendationGeneration(Object.keys(body).length ? body as RecommendationGenerationResult : generateRecommendations());
}

export async function hashRecommendationGenerationRequest(request: Request) {
  const body = await readBody(request);
  const result = Object.keys(body).length ? body as RecommendationGenerationResult : generateRecommendations();
  return { recommendation_generation_hash: computeRecommendationGenerationHash(result) };
}

export async function inspectRecommendationGenerationRequest(request?: Request) {
  if (!request) return buildRecommendationGenerationObservabilitySurface();
  const body = await readBody(request);
  return buildRecommendationGenerationObservabilitySurface(Object.keys(body).length ? body as RecommendationGenerationResult : generateRecommendations());
}
