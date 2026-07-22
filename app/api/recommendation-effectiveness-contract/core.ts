import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computeRecommendationEffectivenessHash,
  evaluateRecommendationEffectiveness,
  getRecommendationEffectivenessFoundation,
  replayRecommendationEffectiveness,
} from "@/services/recommendation-effectiveness-contract";
import type { RecommendationEffectivenessInput, RecommendationEffectivenessResult } from "@/types/recommendation-effectiveness-contract";

export async function requireRecommendationEffectivenessUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationEffectivenessContractResponse() {
  return getRecommendationEffectivenessFoundation();
}

export async function evaluateRecommendationEffectivenessRequest(request: Request) {
  const body = await readBody(request) as RecommendationEffectivenessInput;
  return evaluateRecommendationEffectiveness(body);
}

export async function validateRecommendationEffectivenessRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationEffectivenessResult> & RecommendationEffectivenessInput;
  const result = body.effectiveness_record ? body as RecommendationEffectivenessResult : evaluateRecommendationEffectiveness(body);
  return {
    validation: result.validation,
    record_hash: computeRecommendationEffectivenessHash(result.effectiveness_record),
    replay_valid: replayRecommendationEffectiveness(result),
  };
}

export async function replayRecommendationEffectivenessRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationEffectivenessResult> & RecommendationEffectivenessInput;
  const result = body.effectiveness_record ? body as RecommendationEffectivenessResult : evaluateRecommendationEffectiveness(body);
  return {
    replay_valid: replayRecommendationEffectiveness(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function hashRecommendationEffectivenessRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationEffectivenessResult> & RecommendationEffectivenessInput;
  const result = body.effectiveness_record ? body as RecommendationEffectivenessResult : evaluateRecommendationEffectiveness(body);
  return { recommendation_effectiveness_hash: computeRecommendationEffectivenessHash(result.effectiveness_record) };
}

export async function inspectRecommendationEffectivenessRequest(request?: Request) {
  if (!request) return getRecommendationEffectivenessFoundation();
  const body = await readBody(request) as RecommendationEffectivenessInput;
  const result = evaluateRecommendationEffectiveness(body);
  return {
    status: result.validation.lifecycle_state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    mandatory_dimensions: result.effectiveness_record.dimension_scores.map((score) => score.dimension),
    advisory_only: result.advisory_only,
  };
}
