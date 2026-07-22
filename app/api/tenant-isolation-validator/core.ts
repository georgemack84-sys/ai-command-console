import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getTenantIsolationValidatorFoundation,
  replayTenantIsolationValidation,
  validateTenantIsolation,
} from "@/services/tenant-isolation-validator";
import type { TenantIsolationDomain, TenantIsolationValidatorInput, TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export async function requireTenantIsolationValidatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function assessmentRequest(domain: TenantIsolationDomain) {
  return async (request: Request) => {
    const body = await readBody(request) as TenantIsolationValidatorInput;
    return validateTenantIsolation(body).validation.isolation_assessments.filter((assessment) => assessment.domain === domain);
  };
}

export function contractResponse() {
  return getTenantIsolationValidatorFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationValidatorInput;
  return validateTenantIsolation(body);
}

export const ownershipRequest = assessmentRequest("PROPOSAL_OWNERSHIP");
export const dataRequest = assessmentRequest("DATA");
export const recommendationsRequest = assessmentRequest("RECOMMENDATIONS");
export const replayIsolationRequest = assessmentRequest("REPLAY");
export const evidenceRequest = assessmentRequest("EVIDENCE");
export const ledgersRequest = assessmentRequest("AUDIT_LEDGER");
export const governanceRequest = assessmentRequest("GOVERNANCE");
export const certificationRequest = assessmentRequest("CERTIFICATION");

export async function leakageRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationValidatorInput;
  return validateTenantIsolation(body).validation.detected_leakage;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationValidatorInput;
  return validateTenantIsolation(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<TenantIsolationValidatorResult> & TenantIsolationValidatorInput;
  const result = body.validation && body.ledger_entry ? body as TenantIsolationValidatorResult : validateTenantIsolation(body);
  return {
    replay_valid: replayTenantIsolationValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.validation.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getTenantIsolationValidatorFoundation();
  const body = await readBody(request) as TenantIsolationValidatorInput;
  const result = validateTenantIsolation(body);
  return {
    status: result.validation.isolation_status,
    failures: result.validation.failures,
    leakage_count: result.validation.detected_leakage.length,
    zero_cross_tenant_influence: result.zero_cross_tenant_influence,
    tenant_first: result.tenant_first,
    privacy_preserving: result.privacy_preserving,
    least_access_enforced: result.least_access_enforced,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
  };
}
