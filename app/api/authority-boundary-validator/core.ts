import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getAuthorityBoundaryValidatorFoundation,
  replayAuthorityBoundaryValidation,
  validateAuthorityBoundary,
} from "@/services/authority-boundary-validator";
import type { AuthorityBoundaryValidatorInput, AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";

export async function requireAuthorityBoundaryValidatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAuthorityBoundaryValidatorFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body);
}

export async function scopeRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.authority_scope;
}

export async function approvalsRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.approval_authority_results;
}

export async function executionRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.execution_authority_results;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.governance_authority_results;
}

export async function operatorRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.operator_authority_results;
}

export async function delegationRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.delegation_results;
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.escalation_requirements;
}

export async function violationsRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).validation.authority_violations;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  return validateAuthorityBoundary(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AuthorityBoundaryValidatorResult> & AuthorityBoundaryValidatorInput;
  const result = body.validation && body.ledger_entry ? body as AuthorityBoundaryValidatorResult : validateAuthorityBoundary(body);
  return {
    replay_valid: replayAuthorityBoundaryValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.validation.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAuthorityBoundaryValidatorFoundation();
  const body = await readBody(request) as AuthorityBoundaryValidatorInput;
  const result = validateAuthorityBoundary(body);
  return {
    status: result.validation.authority_status,
    failures: result.validation.failures,
    violation_count: result.validation.authority_violations.length,
    escalation_level: result.validation.escalation_requirements[0]?.level ?? "NONE",
    advisory_only: result.advisory_only,
    least_authority_enforced: result.least_authority_enforced,
    authority_granted: result.authority_granted,
    execution_authority_granted: result.execution_authority_granted,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
  };
}
