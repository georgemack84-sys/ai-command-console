import { describe, expect, it } from "vitest";

import { buildContainmentAuthorityContract, enforceOrchestrationBoundary } from "@/services/coordination-containment/orchestrationBoundaryEnforcer";

describe("enforceOrchestrationBoundary", () => {
  it("rejects orchestration-adjacent metadata", () => {
    const errors = enforceOrchestrationBoundary({
      authorityContract: buildContainmentAuthorityContract(),
      metadata: { workflowPlan: "dispatch-after-schedule" },
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
