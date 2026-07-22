import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getOperatorFeedbackGovernanceValidationFoundation,
  replayOperatorFeedbackGovernanceValidation,
  validateOperatorFeedbackGovernance,
} from "@/services/operator-feedback-governance-validation";
import type { FeedbackGovernanceValidationInput, FeedbackGovernanceValidationResult } from "@/types/operator-feedback-governance-validation";

export async function requireOperatorFeedbackGovernanceValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOperatorFeedbackGovernanceValidationFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body);
}

export async function authorityRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).authority_validation;
}

export async function constitutionalRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).constitutional_validation;
}

export async function policyRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).policy_validation;
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).escalation_decision;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).decision_registry_record;
}

export async function explanationRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).explanation;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as FeedbackGovernanceValidationInput;
  return validateOperatorFeedbackGovernance(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackGovernanceValidationResult> & FeedbackGovernanceValidationInput;
  const result = body.explanation && body.audit_events ? body as FeedbackGovernanceValidationResult : validateOperatorFeedbackGovernance(body);
  return {
    replay_valid: replayOperatorFeedbackGovernanceValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    validation_state: result.validation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOperatorFeedbackGovernanceValidationFoundation();
  const body = request ? await readBody(request) as FeedbackGovernanceValidationInput : {};
  const result = validateOperatorFeedbackGovernance(body);
  return {
    validation_state: result.validation_state,
    escalation: result.escalation_decision.category,
    failures: result.failures,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    fail_closed: result.fail_closed,
    modifies_production: result.modifies_production,
    authorizes_adaptive_implementation: result.authorizes_adaptive_implementation,
  };
}
