import { assertTenantRecordAccess } from "./tenantAssertions";
import type { TenantContext, TenantScopedRecord } from "./tenantTypes";

export function guardScopedRecord<T extends TenantScopedRecord>({
  tenantContext,
  record,
}: {
  tenantContext: TenantContext;
  record: T | null | undefined;
}) {
  assertTenantRecordAccess({
    tenantContext,
    record,
  });
  return record;
}
