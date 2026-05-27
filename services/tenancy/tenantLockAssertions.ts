import { assertTenantRecordAccess } from "./tenantAssertions";
import { TENANT_ERROR_CODES } from "./tenantErrors";

export function assertTenantLockRecord({
  tenantId,
  record,
}: {
  tenantId: string;
  record: { tenantId?: string; workspaceId?: string; executionId?: string } | null | undefined;
}) {
  assertTenantRecordAccess({
    tenantContext: {
      tenantId,
      workspaceId: record?.workspaceId || tenantId,
      source: "system",
      isolationVersion: "3.6G",
    },
    record,
    code: TENANT_ERROR_CODES.TENANT_LOCK_SCOPE_MISMATCH,
  });
}
