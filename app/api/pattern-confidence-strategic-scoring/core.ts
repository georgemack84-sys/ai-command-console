import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computePatternScoreHash,
  getPatternScoringFoundation,
  replayPatternScoring,
  scorePatternIntelligence,
} from "@/services/pattern-confidence-strategic-scoring";
import type { PatternScoringInput, PatternScoringResult } from "@/types/pattern-confidence-strategic-scoring";

export async function requirePatternScoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternScoringContractResponse() {
  return getPatternScoringFoundation();
}

export async function scorePatternRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body);
}

export async function confidencePatternScoringRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body).score_records.map((record) => ({
    pattern_id: record.pattern_id,
    confidence_score: record.confidence_score,
    evidence_quality: record.evidence_quality,
    recurrence_strength: record.recurrence_strength,
  }));
}

export async function strategicPatternScoringRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body).score_records.map((record) => ({
    pattern_id: record.pattern_id,
    mission_importance: record.mission_importance,
    strategic_importance: record.strategic_importance,
    operator_importance: record.operator_importance,
    risk_relevance: record.risk_relevance,
  }));
}

export async function governancePatternScoringRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body).score_records.map((record) => ({
    pattern_id: record.pattern_id,
    governance_importance: record.governance_importance,
    governance_refs: record.governance_refs,
  }));
}

export async function compositePatternScoringRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body).score_records.map((record) => ({
    pattern_id: record.pattern_id,
    composite_pattern_score: record.composite_pattern_score,
    rating: record.rating,
    score_hash: computePatternScoreHash(record),
  }));
}

export async function registryPatternScoringRequest(request: Request) {
  const body = await readBody(request) as PatternScoringInput;
  return scorePatternIntelligence(body).registry;
}

export async function replayPatternScoringRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternScoringResult> & PatternScoringInput;
  const result = body.registry ? body as PatternScoringResult : scorePatternIntelligence(body);
  return {
    replay_valid: replayPatternScoring(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectPatternScoringRequest(request?: Request) {
  if (!request) return getPatternScoringFoundation();
  const body = await readBody(request) as PatternScoringInput;
  const result = scorePatternIntelligence(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    score_records: result.score_records.length,
    advisory_only: result.advisory_only,
    autonomous_optimization: result.autonomous_optimization,
  };
}
