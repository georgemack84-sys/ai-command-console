import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computeRecommendationDimensionEvaluationHash,
  evaluateRecommendationDimensions,
  getRecommendationDimensionEvaluationFoundation,
  replayRecommendationDimensionEvaluation,
} from "@/services/recommendation-dimension-evaluation";
import type { DimensionEvaluationInput, DimensionEvaluationResult, RecommendationDimension } from "@/types/recommendation-dimension-evaluation";

export async function requireRecommendationDimensionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function dimensionResponse(result: DimensionEvaluationResult, dimension: RecommendationDimension) {
  return result.evaluation_record.dimension_scores.find((score) => score.dimension === dimension);
}

export function getRecommendationDimensionContractResponse() {
  return getRecommendationDimensionEvaluationFoundation();
}

export async function evaluateRecommendationDimensionRequest(request: Request) {
  const body = await readBody(request) as DimensionEvaluationInput;
  return evaluateRecommendationDimensions(body);
}

export async function evaluateSingleDimensionRequest(request: Request, dimension: RecommendationDimension) {
  const body = await readBody(request) as DimensionEvaluationInput;
  return dimensionResponse(evaluateRecommendationDimensions(body), dimension);
}

export async function validateRecommendationDimensionRequest(request: Request) {
  const body = await readBody(request) as Partial<DimensionEvaluationResult> & DimensionEvaluationInput;
  const result = body.evaluation_record ? body as DimensionEvaluationResult : evaluateRecommendationDimensions(body);
  return {
    validation: result.validation,
    evaluation_hash: computeRecommendationDimensionEvaluationHash(result.evaluation_record),
    replay_valid: replayRecommendationDimensionEvaluation(result),
  };
}

export async function replayRecommendationDimensionRequest(request: Request) {
  const body = await readBody(request) as Partial<DimensionEvaluationResult> & DimensionEvaluationInput;
  const result = body.evaluation_record ? body as DimensionEvaluationResult : evaluateRecommendationDimensions(body);
  return {
    replay_valid: replayRecommendationDimensionEvaluation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectRecommendationDimensionRequest(request?: Request) {
  if (!request) return getRecommendationDimensionEvaluationFoundation();
  const body = await readBody(request) as DimensionEvaluationInput;
  const result = evaluateRecommendationDimensions(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    dimensions: result.evaluation_record.dimension_scores.map((score) => score.dimension),
    advisory_only: result.advisory_only,
  };
}
