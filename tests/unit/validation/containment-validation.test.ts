import { describe, expect, it } from "vitest";

import { validateContainment } from "@/services/validation/containmentValidation";

describe("validateContainment", () => {
  it("fails closed when containment verification is unreliable", () => {
    const result = validateContainment({
      convergence: { requiresContainment: true },
      resilience: { requiresContainment: true },
      readiness: { containmentConfidence: 0.34 },
      containmentVerified: false,
    });

    expect(result.valid).toBe(false);
    expect(result.containmentRequired).toBe(true);
    expect(result.blockedReasons).toContain("containment_verification_failed");
  });
});
