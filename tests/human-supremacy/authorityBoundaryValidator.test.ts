import { describe, expect, it } from "vitest";

import { buildHumanSupremacyAuthorityContract, validateAuthorityBoundary } from "@/services/human-supremacy/authorityBoundaryValidator";

describe("authority boundary validator", () => {
  it("rejects forbidden authority metadata", () => {
    const errors = validateAuthorityBoundary({
      authorityContract: buildHumanSupremacyAuthorityContract(),
      metadata: Object.freeze({
        governanceBypass: true,
        orchestrationPlan: true,
      }),
    });

    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_GOVERNANCE_BYPASS_FORBIDDEN");
    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_ORCHESTRATION_LEAK_FORBIDDEN");
  });
});
