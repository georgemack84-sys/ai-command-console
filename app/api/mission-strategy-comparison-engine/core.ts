import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  compareMissionStrategies,
  getMissionStrategyComparisonFoundation,
  replayMissionStrategyComparison,
} from "@/services/mission-strategy-comparison-engine";
import type { MissionStrategyComparisonInput, MissionStrategyComparisonResult } from "@/types/mission-strategy-comparison-engine";

export async function requireMissionStrategyComparisonUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getMissionStrategyComparisonFoundation();
}

export async function compareRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body);
}

export async function comparisonsRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons;
}

export async function similarityRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons.map((comparison) => ({
    comparison_id: comparison.comparison_id,
    mission_similarity_level: comparison.mission_similarity_level,
    mission_similarity_score: comparison.mission_similarity_score,
    objective_alignment_score: comparison.objective_alignment_score,
  }));
}

export async function rankingRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons.map((comparison) => ({
    comparison_id: comparison.comparison_id,
    strategy_classification: comparison.strategy_classification,
    ranking_position: comparison.ranking_position,
    comparative_effectiveness_score: comparison.comparative_effectiveness_score,
  }));
}

export async function classificationRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons.map((comparison) => ({
    comparison_id: comparison.comparison_id,
    strategy_classification: comparison.strategy_classification,
    lifecycle_state: comparison.lifecycle_state,
  }));
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons.map((comparison) => ({
    comparison_id: comparison.comparison_id,
    supporting_outcome_refs: comparison.supporting_outcome_refs,
    supporting_pattern_refs: comparison.supporting_pattern_refs,
    supporting_evidence_refs: comparison.supporting_evidence_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).comparisons.map((comparison) => ({
    comparison_id: comparison.comparison_id,
    governance_alignment_score: comparison.governance_alignment_score,
    supporting_governance_refs: comparison.supporting_governance_refs,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<MissionStrategyComparisonResult> & MissionStrategyComparisonInput;
  const result = body.registry ? body as MissionStrategyComparisonResult : compareMissionStrategies(body);
  return {
    replay_valid: replayMissionStrategyComparison(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    supporting_replay_refs: result.comparisons.flatMap((comparison) => comparison.supporting_replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as MissionStrategyComparisonInput;
  return compareMissionStrategies(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getMissionStrategyComparisonFoundation();
  const body = await readBody(request) as MissionStrategyComparisonInput;
  const result = compareMissionStrategies(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    comparisons: result.comparisons.length,
    evidence_backed: result.evidence_backed,
    governance_compliant: result.governance_compliant,
    advisory_only: result.advisory_only,
    generates_proposals: result.generates_proposals,
  };
}
