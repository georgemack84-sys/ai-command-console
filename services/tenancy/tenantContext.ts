import { assertTenantContext } from "./tenantAssertions";
import type { TenantContext, TenantContextSource } from "./tenantTypes";

export function createTenantContext(input: {
  tenantId: string;
  workspaceId: string;
  operatorId?: string;
  source: TenantContextSource;
}): TenantContext {
  const context: TenantContext = {
    tenantId: String(input.tenantId || "").trim(),
    workspaceId: String(input.workspaceId || "").trim(),
    operatorId: input.operatorId ? String(input.operatorId).trim() : undefined,
    source: input.source,
    isolationVersion: "3.6G",
  };
  assertTenantContext(context);
  return context;
}
