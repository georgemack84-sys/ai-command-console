import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishTenantIsolationPrivacyEnforcement,
  getTenantIsolationPrivacyEnforcement,
  replayTenantIsolationPrivacyEnforcement,
} from "@/services/tenant-isolation-privacy-enforcement";
import type { TenantIsolationInput, TenantIsolationRecord, TenantIsolationResult } from "@/types/tenant-isolation-privacy-enforcement";

export async function requireTenantIsolationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getTenantIsolationPrivacyEnforcement();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as TenantIsolationInput;
  return establishTenantIsolationPrivacyEnforcement(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as TenantIsolationInput;
  return establishTenantIsolationPrivacyEnforcement(body).isolation_records;
}

export async function validatorRequest(
  request: Request,
  key: "privacy_validation" | "segmentation_validation" | "cross_tenant_policy",
) {
  const body = (await readBody(request)) as TenantIsolationInput;
  return establishTenantIsolationPrivacyEnforcement(body).isolation_records.map((record: TenantIsolationRecord) => record[key]);
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as TenantIsolationInput;
  return establishTenantIsolationPrivacyEnforcement(body).isolation_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as TenantIsolationInput;
  return establishTenantIsolationPrivacyEnforcement(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<TenantIsolationResult> & TenantIsolationInput;
  const result = body.contract && body.metrics ? (body as TenantIsolationResult) : establishTenantIsolationPrivacyEnforcement(body);
  return {
    replay_valid: replayTenantIsolationPrivacyEnforcement(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getTenantIsolationPrivacyEnforcement();
  const body = (await readBody(request)) as TenantIsolationInput;
  const result = establishTenantIsolationPrivacyEnforcement(body);
  return {
    status: result.status,
    failures: result.failures,
    authorization_approvals: result.metrics.authorization_approvals,
    authorization_denials: result.metrics.authorization_denials,
    blocked_cross_tenant_requests: result.metrics.blocked_cross_tenant_requests,
    deterministic: result.deterministic,
    replayable: result.replayable,
    privacy_preserved: result.privacy_preserved,
    tenant_isolated: result.tenant_isolated,
    segmentation_enforced: result.segmentation_enforced,
    cross_tenant_blocked_by_default: result.cross_tenant_blocked_by_default,
    zero_implicit_sharing: result.zero_implicit_sharing,
  };
}
