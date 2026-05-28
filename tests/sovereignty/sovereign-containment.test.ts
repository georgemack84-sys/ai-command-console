import { describe, expect, it } from "vitest";

import { enforceSovereigntyBoundaries } from "@/services/sovereignty/sovereigntyEnforcement";

describe("enforceSovereigntyBoundaries", () => {
  it("fails closed under emergency containment pressure", () => {
    const result = enforceSovereigntyBoundaries({
      sovereigntyState: "EMERGENCY_CONTAINMENT",
      constitutionalSafe: false,
      immutableAuditHealthy: true,
      blockedReasons: ["disputed_truth"],
    });

    expect(result.allowed).toBe(false);
    expect(result.requiredActions).toContain("freeze_constitutional_progression");
  });
});
