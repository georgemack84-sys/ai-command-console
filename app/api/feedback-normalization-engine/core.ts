import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getFeedbackNormalizationEngineFoundation,
  normalizeFeedback,
  replayFeedbackNormalization,
} from "@/services/feedback-normalization-engine";
import type { FeedbackNormalizationEngineInput, FeedbackNormalizationEngineResult } from "@/types/feedback-normalization-engine";

export async function requireFeedbackNormalizationEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getFeedbackNormalizationEngineFoundation();
}

export function vocabularyResponse() {
  return getFeedbackNormalizationEngineFoundation().result.canonical_vocabulary;
}

export async function normalizeRequest(request: Request) {
  const body = await readBody(request) as FeedbackNormalizationEngineInput;
  return normalizeFeedback(body);
}

export async function recordRequest(request: Request) {
  const body = await readBody(request) as FeedbackNormalizationEngineInput;
  return normalizeFeedback(body).normalized_record;
}

export async function explanationRequest(request: Request) {
  const body = await readBody(request) as FeedbackNormalizationEngineInput;
  return normalizeFeedback(body).explanation;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as FeedbackNormalizationEngineInput;
  return normalizeFeedback(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackNormalizationEngineResult> & FeedbackNormalizationEngineInput;
  const result = body.explanation && body.audit_events ? body as FeedbackNormalizationEngineResult : normalizeFeedback(body);
  return {
    replay_valid: replayFeedbackNormalization(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    normalization_state: result.normalization_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getFeedbackNormalizationEngineFoundation();
  const body = await readBody(request) as FeedbackNormalizationEngineInput;
  const result = normalizeFeedback(body);
  return {
    normalization_state: result.normalization_state,
    canonical_feedback_type: result.normalized_record?.canonical_feedback_type ?? null,
    canonical_issue: result.normalized_record?.canonical_issue ?? null,
    duplicate_resolution_status: result.normalized_record?.duplicate_resolution_status ?? null,
    failures: result.failures,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    evidence_only: result.evidence_only,
  };
}
