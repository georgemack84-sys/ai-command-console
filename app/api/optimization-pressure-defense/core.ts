import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  defendOptimizationPressure,
  getOptimizationPressureFoundation,
  replayOptimizationPressureDefense,
} from "@/services/optimization-pressure-defense";
import type { OptimizationPressureInput, OptimizationPressureResult } from "@/types/optimization-pressure-defense";

export async function requireOptimizationPressureUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOptimizationPressureFoundation();
}

export async function defendRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).baseline;
}

export async function objectiveAlignmentRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).objective_alignment_report;
}

export async function rewardHackingRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).reward_hacking_assessment;
}

export async function metricIntegrityRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).metric_integrity_report;
}

export async function governanceTradeoffRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).governance_tradeoff_report;
}

export async function balanceRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).balance_report;
}

export async function integrityScoreRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).integrity_score_report;
}

export async function assessmentRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).pressure_assessment;
}

export async function riskSummaryRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).risk_summary;
}

export async function suppressionRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).suppression_decision;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).optimization_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as OptimizationPressureInput;
  return defendOptimizationPressure(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<OptimizationPressureResult> & OptimizationPressureInput;
  const result = body.baseline && body.metrics ? body as OptimizationPressureResult : defendOptimizationPressure(body);
  return {
    replay_valid: replayOptimizationPressureDefense(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOptimizationPressureFoundation();
  const body = await readBody(request) as OptimizationPressureInput;
  const result = defendOptimizationPressure(body);
  return {
    status: result.status,
    failures: result.failures,
    optimization_integrity_score: result.metrics.optimization_integrity_score,
    objective_alignment_score: result.metrics.objective_alignment_score,
    governance_preservation_score: result.metrics.governance_preservation_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.suppression_decision.containment_actions,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_optimization: result.authorizes_optimization,
  };
}
