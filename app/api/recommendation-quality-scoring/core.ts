import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computeRecommendationQualityHash,
  getRecommendationQualityFoundation,
  replayRecommendationQuality,
  scoreRecommendationQuality,
} from "@/services/recommendation-quality-scoring";
import type { RecommendationQualityInput, RecommendationQualityResult } from "@/types/recommendation-quality-scoring";

export async function requireRecommendationQualityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationQualityContractResponse() {
  return getRecommendationQualityFoundation();
}

export async function scoreRecommendationQualityRequest(request: Request) {
  const body = await readBody(request) as RecommendationQualityInput;
  return scoreRecommendationQuality(body);
}

export async function validateRecommendationQualityRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationQualityResult> & RecommendationQualityInput;
  const result = body.quality_score ? body as RecommendationQualityResult : scoreRecommendationQuality(body);
  return {
    validation: result.validation,
    quality_hash: computeRecommendationQualityHash(result.quality_score),
    replay_valid: replayRecommendationQuality(result),
  };
}

export async function replayRecommendationQualityRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationQualityResult> & RecommendationQualityInput;
  const result = body.quality_score ? body as RecommendationQualityResult : scoreRecommendationQuality(body);
  return {
    replay_valid: replayRecommendationQuality(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function performanceRecommendationQualityRequest(request: Request) {
  const body = await readBody(request) as RecommendationQualityInput;
  const result = scoreRecommendationQuality(body);
  return {
    dimension_scores: result.quality_score.dimension_scores,
    composite_effectiveness_score: result.quality_score.composite_effectiveness_score,
    quality_rating: result.quality_score.quality_rating,
    weighting_profile: result.quality_score.weighting_profile,
  };
}

export async function inspectRecommendationQualityRequest(request?: Request) {
  if (!request) return getRecommendationQualityFoundation();
  const body = await readBody(request) as RecommendationQualityInput;
  const result = scoreRecommendationQuality(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    rating: result.quality_score.quality_rating,
    composite_effectiveness_score: result.quality_score.composite_effectiveness_score,
    advisory_only: result.advisory_only,
  };
}
