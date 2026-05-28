import { assertTenantContext } from "./tenantAssertions";
import { TENANT_ERROR_CODES, createTenantScopeError } from "./tenantErrors";
import type { TenantContext } from "./tenantTypes";

type TenantOwnedExecution = {
  tenantId: string;
  workspaceId: string;
  executionId: string;
};

const executionOwnership = new Map<string, TenantOwnedExecution>();

export function resetTenantResourceScope() {
  executionOwnership.clear();
}

export function registerTenantOwnedExecution(record: TenantOwnedExecution) {
  executionOwnership.set(String(record.executionId).trim(), {
    tenantId: String(record.tenantId).trim(),
    workspaceId: String(record.workspaceId).trim(),
    executionId: String(record.executionId).trim(),
  });
}

export function ensureTenantOwnedExecution({
  tenantContext,
  executionId,
}: {
  tenantContext: TenantContext;
  executionId: string;
}) {
  assertTenantContext(tenantContext);
  const normalizedExecutionId = String(executionId || "").trim();
  const existing = getTenantOwnedExecution(normalizedExecutionId);
  if (!existing) {
    registerTenantOwnedExecution({
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      executionId: normalizedExecutionId,
    });
    return getTenantOwnedExecution(normalizedExecutionId)!;
  }
  assertTenantOwnedExecution({
    tenantContext,
    executionId: normalizedExecutionId,
  });
  return existing;
}

export function getTenantOwnedExecution(executionId: string) {
  return executionOwnership.get(String(executionId || "").trim());
}

export function assertTenantOwnedExecution({
  tenantContext,
  executionId,
  code = TENANT_ERROR_CODES.TENANT_RECOVERY_SCOPE_MISMATCH,
}: {
  tenantContext: TenantContext;
  executionId: string;
  code?: string;
}) {
  assertTenantContext(tenantContext);
  const owned = getTenantOwnedExecution(executionId);
  if (!owned) {
    return;
  }
  if (owned.tenantId !== tenantContext.tenantId || owned.workspaceId !== tenantContext.workspaceId) {
    throw createTenantScopeError(code, "Execution is not owned by the active tenant.");
  }
}
