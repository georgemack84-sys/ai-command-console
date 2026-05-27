import { TENANT_ERROR_CODES, createTenantScopeError } from "./tenantErrors";
import type { TenantContext, TenantScopedRecord } from "./tenantTypes";

export function assertTenantContext(value: TenantContext | null | undefined): asserts value is TenantContext {
  if (!value) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_CONTEXT_MISSING, `${TENANT_ERROR_CODES.TENANT_CONTEXT_MISSING}: Tenant context is required.`, 400);
  }
  if (!String(value.tenantId || "").trim()) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_ID_MISSING, `${TENANT_ERROR_CODES.TENANT_ID_MISSING}: tenantId is required.`, 400);
  }
  if (!String(value.workspaceId || "").trim()) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_WORKSPACE_MISSING, `${TENANT_ERROR_CODES.TENANT_WORKSPACE_MISSING}: workspaceId is required.`, 400);
  }
}

export function assertTenantMatch({
  tenantContext,
  tenantId,
  workspaceId,
  code = TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH,
}: {
  tenantContext: TenantContext;
  tenantId?: string | null;
  workspaceId?: string | null;
  code?: string;
}) {
  assertTenantContext(tenantContext);
  if (tenantId != null && String(tenantId).trim() && String(tenantId).trim() !== tenantContext.tenantId) {
    throw createTenantScopeError(code, `${code}: Tenant scope mismatch.`);
  }
  if (workspaceId != null && String(workspaceId).trim() && String(workspaceId).trim() !== tenantContext.workspaceId) {
    throw createTenantScopeError(code, `${code}: Workspace scope mismatch.`);
  }
}

export function assertTenantRecordAccess({
  tenantContext,
  record,
  code = TENANT_ERROR_CODES.TENANT_CROSS_READ_BLOCKED,
}: {
  tenantContext: TenantContext;
  record: TenantScopedRecord | null | undefined;
  code?: string;
}) {
  if (!record) {
    return;
  }
  assertTenantMatch({
    tenantContext,
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    code,
  });
}
