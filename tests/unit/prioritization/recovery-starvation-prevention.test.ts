import { describe, expect, it } from "vitest";

import { detectRecoveryStarvation } from "@/services/prioritization/recoveryStarvationPrevention";

describe("detectRecoveryStarvation", () => {
  it("detects critical recovery suppression and tenant contamination", () => {
    const warnings = detectRecoveryStarvation({
      rankedAssessments: [
        { executionId: "exec_top", category: "STANDARD", recoveryComplexity: 0.2, governanceReviewRequired: false },
        { executionId: "exec_critical", category: "SURVIVABILITY_CRITICAL", recoveryComplexity: 0.9, governanceReviewRequired: false },
      ] as never,
      candidates: [
        { executionId: "exec_top", tenantId: "tenant_a", evidence: [] },
        { executionId: "exec_critical", tenantId: "tenant_b", evidence: [] },
      ],
      tenantId: "tenant_a",
    });

    expect(warnings).toContain("cross_tenant_priority_contamination");
    expect(warnings.some((warning) => warning.includes("deferred"))).toBe(true);
  });
});
