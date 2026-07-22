import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getGovernanceAdaptationValidatorFoundation,
  replayGovernanceAdaptationValidation,
  validateGovernanceAdaptation,
} from "@/services/governance-adaptation-validator";
import type { GovernanceAdaptationValidatorInput, GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";

export async function requireGovernanceAdaptationValidatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAdaptationValidatorFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body);
}

export async function policiesRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.evaluated_policies;
}

export async function rulesRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.rule_results;
}

export async function dependenciesRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.dependency_results;
}

export async function approvalsRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.required_approvals;
}

export async function obligationsRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.governance_obligations;
}

export async function exceptionsRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.exception_results;
}

export async function escalationsRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).validation.escalation_requirements;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  return validateGovernanceAdaptation(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceAdaptationValidatorResult> & GovernanceAdaptationValidatorInput;
  const result = body.validation && body.ledger_entry ? body as GovernanceAdaptationValidatorResult : validateGovernanceAdaptation(body);
  return {
    replay_valid: replayGovernanceAdaptationValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.validation.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAdaptationValidatorFoundation();
  const body = await readBody(request) as GovernanceAdaptationValidatorInput;
  const result = validateGovernanceAdaptation(body);
  return {
    status: result.validation.governance_status,
    failures: result.validation.failures,
    approval_count: result.validation.required_approvals.length,
    escalation_level: result.validation.escalation_requirements[0]?.level ?? "NONE",
    advisory_only: result.advisory_only,
    execution_authority_granted: result.execution_authority_granted,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
  };
}
