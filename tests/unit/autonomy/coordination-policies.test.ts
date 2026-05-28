import { describe, expect, it } from "vitest";

import { evaluateCoordinationPolicies } from "@/services/autonomy/coordinationPolicies";

describe("evaluateCoordinationPolicies", () => {
  it("denies unrestricted autonomy and preserves oversight", () => {
    const result = evaluateCoordinationPolicies({
      constitutionalSafe: false,
      disputedTruth: true,
      freezeActive: true,
      containmentRequired: true,
      advisoryOnly: true,
    });

    expect(result.coordinationType).toBe("CONTAINED");
    expect(result.deniedActions).toContain("autonomous_execution");
    expect(result.requiredOversight).toContain("operator_review_required");
  });
});
