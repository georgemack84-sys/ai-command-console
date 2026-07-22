import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeRecommendationRejection,
  computeRecommendationRejectionHash,
  getRecommendationRejectionFoundation,
  replayRecommendationRejection,
} from "@/services/recommendation-rejection-analysis";
import type { RejectionAnalysisInput, RejectionAnalysisResult } from "@/types/recommendation-rejection-analysis";

export async function requireRecommendationRejectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationRejectionContractResponse() {
  return getRecommendationRejectionFoundation();
}

export async function analyzeRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as RejectionAnalysisInput;
  return analyzeRecommendationRejection(body);
}

export async function classifyRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as RejectionAnalysisInput;
  const result = analyzeRecommendationRejection(body);
  return {
    primary_rejection_category: result.rejection_record.primary_rejection_category,
    rejection_categories: result.rejection_record.rejection_categories,
    outcome_after_rejection: result.rejection_record.outcome_after_rejection,
    pattern: result.pattern_record.pattern,
  };
}

export async function contextRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as RejectionAnalysisInput;
  const result = analyzeRecommendationRejection(body);
  return {
    context_assessment: result.rejection_record.context_assessment,
    recommendation_quality_assessment: result.rejection_record.recommendation_quality_assessment,
    pattern: result.pattern_record.pattern,
    descriptive_only: result.pattern_record.descriptive_only,
  };
}

export async function outcomeImpactRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as RejectionAnalysisInput;
  const result = analyzeRecommendationRejection(body);
  return {
    outcome_after_rejection: result.rejection_record.outcome_after_rejection,
    mission_impact_score: result.rejection_record.mission_impact_score,
    governance_impact_score: result.rejection_record.governance_impact_score,
    rejection_effectiveness_score: result.rejection_record.rejection_effectiveness_score,
  };
}

export async function validateRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as Partial<RejectionAnalysisResult> & RejectionAnalysisInput;
  const result = body.rejection_record ? body as RejectionAnalysisResult : analyzeRecommendationRejection(body);
  return {
    validation: result.validation,
    rejection_hash: computeRecommendationRejectionHash(result.rejection_record),
    replay_valid: replayRecommendationRejection(result),
  };
}

export async function replayRecommendationRejectionRequest(request: Request) {
  const body = await readBody(request) as Partial<RejectionAnalysisResult> & RejectionAnalysisInput;
  const result = body.rejection_record ? body as RejectionAnalysisResult : analyzeRecommendationRejection(body);
  return {
    replay_valid: replayRecommendationRejection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectRecommendationRejectionRequest(request?: Request) {
  if (!request) return getRecommendationRejectionFoundation();
  const body = await readBody(request) as RejectionAnalysisInput;
  const result = analyzeRecommendationRejection(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    categories: result.rejection_record.rejection_categories,
    outcome_after_rejection: result.rejection_record.outcome_after_rejection,
    advisory_only: result.advisory_only,
  };
}
