import { assertTenantContext, assertTenantRecordAccess } from "./tenantAssertions";
import { TENANT_ERROR_CODES, createTenantScopeError } from "./tenantErrors";
import type { TenantContext, TenantScopedRecord } from "./tenantTypes";

export function createScopedExecutionQuery({
  tenantId,
  executionId,
}: {
  tenantId: string;
  executionId: string;
}) {
  if (!String(tenantId || "").trim() || !String(executionId || "").trim()) {
    throw createTenantScopeError(
      TENANT_ERROR_CODES.TENANT_UNSCOPED_QUERY_BLOCKED,
      `${TENANT_ERROR_CODES.TENANT_UNSCOPED_QUERY_BLOCKED}: Tenant-scoped execution lookup requires tenantId and executionId.`,
      403,
    );
  }
  return {
    tenantId: String(tenantId).trim(),
    executionId: String(executionId).trim(),
  };
}

export function enforceTenantScopedRecord({
  tenantId,
  record,
}: {
  tenantId: string;
  record: TenantScopedRecord;
}) {
  assertTenantRecordAccess({
    tenantContext: {
      tenantId,
      workspaceId: record.workspaceId || tenantId,
      source: "system",
      isolationVersion: "3.6G",
    },
    record,
  });
}

export function createScopedLookup({
  tenantContext,
  identifier,
}: {
  tenantContext: TenantContext;
  identifier: string;
}) {
  assertTenantContext(tenantContext);
  if (!String(identifier || "").trim()) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_UNSCOPED_QUERY_BLOCKED, `${TENANT_ERROR_CODES.TENANT_UNSCOPED_QUERY_BLOCKED}: Scoped lookup identifier is required.`, 403);
  }
  return {
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    identifier: String(identifier).trim(),
  };
}
