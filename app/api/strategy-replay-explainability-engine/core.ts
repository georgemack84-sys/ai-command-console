import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getStrategyReplayExplainabilityFoundation,
  replayStrategyEvolutionExplainability,
  replayStrategyReplayExplainability,
} from "@/services/strategy-replay-explainability-engine";
import type {
  StrategyReplayExplainabilityInput,
  StrategyReplayExplainabilityResult,
} from "@/types/strategy-replay-explainability-engine";

export async function requireStrategyReplayExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategyReplayExplainabilityFoundation();
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategyReplayExplainabilityResult> & StrategyReplayExplainabilityInput;
  if (body.registry) {
    const result = body as StrategyReplayExplainabilityResult;
    return {
      replay_valid: replayStrategyReplayExplainability(result),
      replay_hash: result.replay_hash,
      integrity_hash: result.integrity_hash,
      replay_refs: result.replay_records.map((record) => record.replay_id),
    };
  }
  return replayStrategyEvolutionExplainability(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records;
}

export async function explanationRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    proposal_id: record.proposal_id,
    explainability_summary: record.explainability_summary,
    hidden_reasoning_detected: record.hidden_reasoning_detected,
  }));
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    lineage_refs: record.lineage_refs,
    proposal_refs: record.proposal_refs,
  }));
}

export async function traceRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    decision_trace_refs: record.decision_trace_refs,
    decision_refs: record.decision_refs,
    recommendation_refs: record.recommendation_refs,
  }));
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    outcome_refs: record.outcome_refs,
    pattern_refs: record.pattern_refs,
    evidence_refs: record.evidence_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    governance_refs: record.governance_refs,
  }));
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    simulation_refs: record.simulation_refs,
    replay_validation_status: record.replay_validation_status,
  }));
}

export async function operatorRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).replay_records.map((record) => ({
    replay_id: record.replay_id,
    operator_review_refs: record.operator_review_refs,
  }));
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  return replayStrategyEvolutionExplainability(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategyReplayExplainabilityFoundation();
  const body = await readBody(request) as StrategyReplayExplainabilityInput;
  const result = replayStrategyEvolutionExplainability(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    replay_records: result.replay_records.length,
    explainable: result.explainable,
    evidence_lineage_preserved: result.evidence_lineage_preserved,
    advisory_only: result.advisory_only,
  };
}
