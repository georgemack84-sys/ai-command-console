import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getFeedbackIntakeEngineFoundation,
  replayFeedbackIntake,
  submitFeedbackIntake,
} from "@/services/feedback-intake-engine";
import type { FeedbackIntakeEngineInput, FeedbackIntakeEngineResult } from "@/types/feedback-intake-engine";

export async function requireFeedbackIntakeEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getFeedbackIntakeEngineFoundation();
}

export async function submitRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body);
}

export async function authenticationRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body).authentication;
}

export async function authorizationRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body).authorization;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body).contract_validation.validation_report;
}

export async function duplicatesRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  const result = submitFeedbackIntake(body);
  return {
    duplicate_status: result.duplicate_status,
    duplicate_reference: result.duplicate_reference,
    intake_decision: result.intake_decision,
  };
}

export async function queueRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body).queue_entry;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  return submitFeedbackIntake(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackIntakeEngineResult> & FeedbackIntakeEngineInput;
  const result = body.intake_id && body.audit_events ? body as FeedbackIntakeEngineResult : submitFeedbackIntake(body);
  return {
    replay_valid: replayFeedbackIntake(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    intake_decision: result.intake_decision,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getFeedbackIntakeEngineFoundation();
  const body = await readBody(request) as FeedbackIntakeEngineInput;
  const result = submitFeedbackIntake(body);
  return {
    intake_decision: result.intake_decision,
    duplicate_status: result.duplicate_status,
    failures: result.failures,
    error_class: result.error_class,
    retry_policy: result.retry_policy,
    queued: Boolean(result.queue_entry),
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    governance_compliant: result.governance_compliant,
    evidence_only: result.evidence_only,
  };
}
