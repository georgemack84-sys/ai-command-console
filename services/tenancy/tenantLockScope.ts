import { TENANT_ERROR_CODES, createTenantScopeError } from "./tenantErrors";

export function buildTenantLockKey({
  tenantId,
  executionId,
}: {
  tenantId: string;
  executionId: string;
}) {
  if (!String(tenantId || "").trim() || !String(executionId || "").trim()) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_LOCK_SCOPE_MISMATCH, "Tenant-scoped lock key requires tenantId and executionId.");
  }
  return `${String(tenantId).trim()}::${String(executionId).trim()}`;
}
