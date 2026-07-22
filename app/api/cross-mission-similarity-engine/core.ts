import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishCrossMissionSimilarityEngine,
  getCrossMissionSimilarityEngine,
  replayCrossMissionSimilarityEngine,
} from "@/services/cross-mission-similarity-engine";
import type { CrossMissionSimilarityInput, CrossMissionSimilarityResult } from "@/types/cross-mission-similarity-engine";

export async function requireCrossMissionSimilarityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getCrossMissionSimilarityEngine();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  return establishCrossMissionSimilarityEngine(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  return establishCrossMissionSimilarityEngine(body).similarity_records;
}

export async function candidatesRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  const result = establishCrossMissionSimilarityEngine(body);
  return {
    candidate_eligibility: result.candidate_eligibility,
    source_patterns: result.source_patterns,
  };
}

export async function scoringRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  const result = establishCrossMissionSimilarityEngine(body);
  return result.similarity_records.map((record) => ({
    similarity_id: record.similarity_id,
    objective_similarity: record.objective_similarity,
    evidence_similarity: record.evidence_similarity,
    risk_similarity: record.risk_similarity,
    confidence_similarity: record.confidence_similarity,
    governance_similarity: record.governance_similarity,
    outcome_similarity: record.outcome_similarity,
    simulation_similarity: record.simulation_similarity,
    strategy_similarity: record.strategy_similarity,
    operator_similarity: record.operator_similarity,
    certification_similarity: record.certification_similarity,
    overall_similarity_score: record.overall_similarity_score,
    rank: record.rank,
  }));
}

export async function explanationsRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  return establishCrossMissionSimilarityEngine(body).similarity_records.map((record) => record.explanation);
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  return establishCrossMissionSimilarityEngine(body).similarity_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  return establishCrossMissionSimilarityEngine(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<CrossMissionSimilarityResult> & CrossMissionSimilarityInput;
  const result = body.contract && body.metrics ? (body as CrossMissionSimilarityResult) : establishCrossMissionSimilarityEngine(body);
  return {
    replay_valid: replayCrossMissionSimilarityEngine(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getCrossMissionSimilarityEngine();
  const body = (await readBody(request)) as CrossMissionSimilarityInput;
  const result = establishCrossMissionSimilarityEngine(body);
  return {
    status: result.status,
    failures: result.failures,
    candidate_count: result.metrics.candidate_count,
    replay_success_rate: result.metrics.replay_success_rate,
    explanation_completeness: result.metrics.explanation_completeness,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    governed: result.governed,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    autonomous_learning_supported: result.autonomous_learning_supported,
    decision_authority_supported: result.decision_authority_supported,
    recommendation_mutation_supported: result.recommendation_mutation_supported,
  };
}
