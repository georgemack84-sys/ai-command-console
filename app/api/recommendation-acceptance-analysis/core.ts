import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeRecommendationAcceptance,
  computeRecommendationAcceptanceHash,
  getRecommendationAcceptanceFoundation,
  replayRecommendationAcceptance,
} from "@/services/recommendation-acceptance-analysis";
import type { AcceptanceAnalysisInput, AcceptanceAnalysisResult } from "@/types/recommendation-acceptance-analysis";

export async function requireRecommendationAcceptanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationAcceptanceContractResponse() {
  return getRecommendationAcceptanceFoundation();
}

export async function analyzeRecommendationAcceptanceRequest(request: Request) {
  const body = await readBody(request) as AcceptanceAnalysisInput;
  return analyzeRecommendationAcceptance(body);
}

export async function classifyRecommendationAcceptanceRequest(request: Request) {
  const body = await readBody(request) as AcceptanceAnalysisInput;
  const result = analyzeRecommendationAcceptance(body);
  return {
    acceptance_classification: result.acceptance_record.acceptance_classification,
    outcome_correlation: result.acceptance_record.outcome_correlation,
    acceptance_pattern: result.acceptance_record.acceptance_pattern,
    implementation_status: result.acceptance_record.implementation_status,
  };
}

export async function correlateRecommendationAcceptanceRequest(request: Request) {
  const body = await readBody(request) as AcceptanceAnalysisInput;
  const result = analyzeRecommendationAcceptance(body);
  return {
    outcome_correlation: result.acceptance_record.outcome_correlation,
    mission_improvement_score: result.acceptance_record.mission_improvement_score,
    workflow_efficiency_score: result.acceptance_record.workflow_efficiency_score,
    operator_confidence_score: result.acceptance_record.operator_confidence_score,
    governance_preservation_score: result.acceptance_record.governance_preservation_score,
    descriptive_only: result.trend_record.descriptive_only,
  };
}

export async function validateRecommendationAcceptanceRequest(request: Request) {
  const body = await readBody(request) as Partial<AcceptanceAnalysisResult> & AcceptanceAnalysisInput;
  const result = body.acceptance_record ? body as AcceptanceAnalysisResult : analyzeRecommendationAcceptance(body);
  return {
    validation: result.validation,
    acceptance_hash: computeRecommendationAcceptanceHash(result.acceptance_record),
    replay_valid: replayRecommendationAcceptance(result),
  };
}

export async function replayRecommendationAcceptanceRequest(request: Request) {
  const body = await readBody(request) as Partial<AcceptanceAnalysisResult> & AcceptanceAnalysisInput;
  const result = body.acceptance_record ? body as AcceptanceAnalysisResult : analyzeRecommendationAcceptance(body);
  return {
    replay_valid: replayRecommendationAcceptance(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectRecommendationAcceptanceRequest(request?: Request) {
  if (!request) return getRecommendationAcceptanceFoundation();
  const body = await readBody(request) as AcceptanceAnalysisInput;
  const result = analyzeRecommendationAcceptance(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    classification: result.acceptance_record.acceptance_classification,
    outcome_correlation: result.acceptance_record.outcome_correlation,
    advisory_only: result.advisory_only,
  };
}
