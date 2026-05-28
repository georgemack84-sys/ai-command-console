import { describe, expect, it } from "vitest";

import { evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { buildEnforcementFixture } from "./helpers";

describe("tenant isolation", () => {
  it("denies cross-tenant execution", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      tenantContext: {
        tenantId: "tenant-a",
        expectedTenantId: "tenant-b",
      },
    }));

    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "EXECUTION_TENANT_ISOLATION_VIOLATION")).toBe(true);
  });

  it("denies ambiguous tenant execution", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      tenantContext: {
        tenantId: undefined,
        expectedTenantId: "tenant-a",
      },
    }));

    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "EXECUTION_TENANT_ISOLATION_VIOLATION")).toBe(true);
  });
});
