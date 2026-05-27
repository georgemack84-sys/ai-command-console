import { describe, expect, it } from "vitest";

import { validateAuthorityBoundary, buildHumanSupremacyAuthorityContract } from "@/services/human-supremacy/authorityBoundaryValidator";

describe("constitutional boundary validator", () => {
  it("rejects execution and orchestration leakage", () => {
    const errors = validateAuthorityBoundary({
      authorityContract: buildHumanSupremacyAuthorityContract(),
      metadata: Object.freeze({
        executionAuthority: true,
        orchestrationPlan: true,
      }),
    });

    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_EXECUTION_LEAK_FORBIDDEN");
    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_ORCHESTRATION_LEAK_FORBIDDEN");
  });
});
