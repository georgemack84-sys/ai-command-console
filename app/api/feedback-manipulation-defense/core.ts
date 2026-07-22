import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  defendFeedbackIntegrity,
  getFeedbackManipulationFoundation,
  replayFeedbackManipulationDefense,
} from "@/services/feedback-manipulation-defense";
import type { FeedbackManipulationInput, FeedbackManipulationResult } from "@/types/feedback-manipulation-defense";

export async function requireFeedbackManipulationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getFeedbackManipulationFoundation();
}

export async function defendRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).baseline;
}

export async function authenticationRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).authentication_report;
}

export async function approvalRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).approval_report;
}

export async function rejectionRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).rejection_report;
}

export async function syntheticRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).synthetic_assessment;
}

export async function influenceRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).influence_report;
}

export async function integrityScoreRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).integrity_score_report;
}

export async function assessmentRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).manipulation_assessment;
}

export async function trustImpactRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).trust_impact_analysis;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).containment_decision;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).manipulation_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as FeedbackManipulationInput;
  return defendFeedbackIntegrity(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackManipulationResult> & FeedbackManipulationInput;
  const result = body.baseline && body.metrics ? body as FeedbackManipulationResult : defendFeedbackIntegrity(body);
  return {
    replay_valid: replayFeedbackManipulationDefense(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getFeedbackManipulationFoundation();
  const body = await readBody(request) as FeedbackManipulationInput;
  const result = defendFeedbackIntegrity(body);
  return {
    status: result.status,
    failures: result.failures,
    feedback_integrity_score: result.metrics.feedback_integrity_score,
    trust_score: result.metrics.trust_score,
    manipulation_score: result.metrics.manipulation_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.containment_decision.containment_actions,
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
    authorizes_learning: result.authorizes_learning,
  };
}
