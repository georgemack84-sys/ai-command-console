import { describe, expect, it } from "vitest";

import { buildTenantLockKey } from "../../services/tenancy/tenantLockScope.ts";
import { assertTenantLockRecord } from "../../services/tenancy/tenantLockAssertions.ts";
import { TENANT_ERROR_CODES } from "../../services/tenancy/tenantErrors.ts";

describe("tenant lock scope", () => {
  it("separates the same executionId across tenants", () => {
    expect(buildTenantLockKey({ tenantId: "tenant-a", executionId: "exec-1" })).not.toBe(
      buildTenantLockKey({ tenantId: "tenant-b", executionId: "exec-1" }),
    );
  });

  it("blocks access to foreign tenant locks", () => {
    expect(() =>
      assertTenantLockRecord({
        tenantId: "tenant-a",
        record: {
          tenantId: "tenant-b",
          executionId: "exec-1",
        },
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_LOCK_SCOPE_MISMATCH);
  });
});
