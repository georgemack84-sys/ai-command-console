import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getAdaptationScoringFoundation,
  replayAdaptationScoring,
  scoreAdaptationProposals,
} from "@/services/adaptation-scoring-engine";
import type { AdaptationScoringInput, AdaptationScoringResult } from "@/types/adaptation-scoring-engine";

export async function requireAdaptationScoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationScoringFoundation();
}

export async function scoreRequest(request: Request) {
  const body = await readBody(request) as AdaptationScoringInput;
  return scoreAdaptationProposals(body);
}

export async function scoresRequest(request: Request) {
  const body = await readBody(request) as AdaptationScoringInput;
  return scoreAdaptationProposals(body).scored_proposals;
}

export async function dimensionsRequest(request: Request) {
  const body = await readBody(request) as AdaptationScoringInput;
  return scoreAdaptationProposals(body).scored_proposals.flatMap((score) => score.dimension_scores);
}

export async function explanationsRequest(request: Request) {
  const body = await readBody(request) as AdaptationScoringInput;
  return scoreAdaptationProposals(body).scored_proposals.flatMap((score) => [score.overall_explanation, ...score.dimension_scores.map((dimension) => dimension.explanation)]);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationScoringInput;
  return scoreAdaptationProposals(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationScoringResult> & AdaptationScoringInput;
  const result = body.scored_proposals && body.metrics ? body as AdaptationScoringResult : scoreAdaptationProposals(body);
  return {
    replay_valid: replayAdaptationScoring(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    scoring_state: result.scoring_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationScoringFoundation();
  const body = await readBody(request) as AdaptationScoringInput;
  const result = scoreAdaptationProposals(body);
  return {
    scoring_state: result.scoring_state,
    failures: result.failures,
    proposals_scored: result.scored_proposals.length,
    average_overall_score: result.metrics.average_overall_score,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_based: result.evidence_based,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_proposals: result.mutates_proposals,
  };
}
