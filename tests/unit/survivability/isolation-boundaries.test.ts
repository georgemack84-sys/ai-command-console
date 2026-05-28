import { describe, expect, it } from "vitest";

import { determineIsolationBoundaries } from "@/services/survivability/survivabilityIsolation";

describe("isolation boundaries", () => {
  it("isolates unstable domains deterministically", () => {
    const result = determineIsolationBoundaries({
      unstableDomains: ["replay", "coordination", "replay"],
      failingDomains: ["governance"],
      dependencyCollapseRisk: 0.74,
      tenantSurvivabilityRisk: 0.8,
    });

    expect(result.isolatedDomains).toEqual(["coordination", "governance", "replay"]);
    expect(result.quarantinedDomains).toContain("governance");
  });
});
