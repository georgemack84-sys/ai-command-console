import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getConstitutionalAdaptationValidatorFoundation,
  replayConstitutionalAdaptationValidation,
  validateConstitutionalAdaptation,
} from "@/services/constitutional-adaptation-validator";
import type { ConstitutionalAdaptationValidatorInput, ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";

export async function requireConstitutionalAdaptationValidatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getConstitutionalAdaptationValidatorFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body);
}

export async function principlesRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body).validation.protected_principles;
}

export async function rulesRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body).validation.evaluated_rules;
}

export async function conflictsRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body).validation.conflict_results;
}

export async function violationsRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body).validation.violations;
}

export async function rejectionRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  const result = validateConstitutionalAdaptation(body);
  return {
    constitutional_status: result.validation.constitutional_status,
    rejection_reasons: result.validation.rejection_reasons,
    automatically_rejected: result.validation.violations.some((violation) => violation.automatically_rejected),
  };
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  return validateConstitutionalAdaptation(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConstitutionalAdaptationValidatorResult> & ConstitutionalAdaptationValidatorInput;
  const result = body.validation && body.ledger_entry ? body as ConstitutionalAdaptationValidatorResult : validateConstitutionalAdaptation(body);
  return {
    replay_valid: replayConstitutionalAdaptationValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.validation.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConstitutionalAdaptationValidatorFoundation();
  const body = await readBody(request) as ConstitutionalAdaptationValidatorInput;
  const result = validateConstitutionalAdaptation(body);
  return {
    status: result.validation.constitutional_status,
    failures: result.validation.failures,
    violation_count: result.validation.violations.length,
    automatic_rejection: result.validation.violations.some((violation) => violation.automatically_rejected),
    advisory_only: result.advisory_only,
    human_governed: result.human_governed,
    governance_enforced: result.governance_enforced,
    execution_authority_granted: result.execution_authority_granted,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
  };
}
