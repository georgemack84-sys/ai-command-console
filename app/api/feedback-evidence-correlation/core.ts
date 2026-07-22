import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  correlateFeedbackEvidence,
  getFeedbackEvidenceCorrelationFoundation,
  replayFeedbackEvidenceCorrelation,
} from "@/services/feedback-evidence-correlation";
import type { FeedbackEvidenceCorrelationInput, FeedbackEvidenceCorrelationResult } from "@/types/feedback-evidence-correlation";

export async function requireFeedbackEvidenceCorrelationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getFeedbackEvidenceCorrelationFoundation();
}

export async function correlateRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body);
}

export async function graphRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body).graph;
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body).lineage_registry_record;
}

export async function decisionRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return {
    feedback_ref: result.lifecycle_correlation?.feedback_ref ?? null,
    decision_ref: result.lifecycle_correlation?.decision_ref ?? null,
    correlation_state: result.correlation_state,
  };
}

export async function recommendationRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return {
    recommendation_ref: result.lifecycle_correlation?.recommendation_ref ?? null,
    recommendation_status: result.lifecycle_correlation?.recommendation_status ?? null,
  };
}

export async function outcomeRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return {
    outcome_ref: result.lifecycle_correlation?.outcome_ref ?? null,
    outcome_category: result.lifecycle_correlation?.outcome_category ?? null,
  };
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return {
    simulation_ref: result.lifecycle_correlation?.simulation_ref ?? null,
    prediction_accuracy: result.lifecycle_correlation?.prediction_accuracy ?? null,
    scenario_coverage: result.lifecycle_correlation?.scenario_coverage ?? null,
    variance_magnitude: result.lifecycle_correlation?.variance_magnitude ?? null,
    simulation_usefulness: result.lifecycle_correlation?.simulation_usefulness ?? null,
  };
}

export async function replayCorrelationRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body).lineage_registry_record?.replay_refs ?? [];
}

export async function patternsRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return result.graph?.nodes.filter((node) => node.node_type === "PATTERN") ?? [];
}

export async function explanationRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body).explanation;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  return correlateFeedbackEvidence(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackEvidenceCorrelationResult> & FeedbackEvidenceCorrelationInput;
  const result = body.explanation && body.audit_events ? body as FeedbackEvidenceCorrelationResult : correlateFeedbackEvidence(body);
  return {
    replay_valid: replayFeedbackEvidenceCorrelation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    correlation_state: result.correlation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getFeedbackEvidenceCorrelationFoundation();
  const body = await readBody(request) as FeedbackEvidenceCorrelationInput;
  const result = correlateFeedbackEvidence(body);
  return {
    correlation_state: result.correlation_state,
    graph_nodes: result.graph?.nodes.length ?? 0,
    graph_edges: result.graph?.edges.length ?? 0,
    failures: result.failures,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    evidence_only: result.evidence_only,
    adaptive_proposal_traceable: result.adaptive_proposal_traceable,
    changes_production_behavior: result.changes_production_behavior,
  };
}
