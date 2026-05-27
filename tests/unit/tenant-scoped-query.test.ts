import { describe, expect, it } from "vitest";

import { createScopedExecutionQuery, enforceTenantScopedRecord } from "../../services/tenancy/scopedQuery.ts";
import { TENANT_ERROR_CODES } from "../../services/tenancy/tenantErrors.ts";

describe("tenant scoped query", () => {
  it("requires tenantId for execution lookup", () => {
    expect(() =>
      createScopedExecutionQuery({
        tenantId: "",
        executionId: "exec-1",
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_UNSCOPED_QUERY_BLOCKED);
  });

  it("creates a scoped execution lookup", () => {
    expect(
      createScopedExecutionQuery({
        tenantId: "tenant-1",
        executionId: "exec-1",
      }),
    ).toEqual({
      tenantId: "tenant-1",
      executionId: "exec-1",
    });
  });

  it("blocks cross-tenant records", () => {
    expect(() =>
      enforceTenantScopedRecord({
        tenantId: "tenant-1",
        record: {
          tenantId: "tenant-2",
        },
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_CROSS_READ_BLOCKED);
  });
});
