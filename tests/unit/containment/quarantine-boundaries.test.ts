import { describe, expect, it } from "vitest";

import { determineIsolationBoundaries } from "@/services/survivability/survivabilityIsolation";

describe("quarantine boundaries", () => {
  it("prevents spread by quarantining failing domains", () => {
    const result = determineIsolationBoundaries({
      unstableDomains: ["coordination"],
      failingDomains: ["tenant-a", "tenant-b"],
      dependencyCollapseRisk: 0.81,
      tenantSurvivabilityRisk: 0.77,
    });

    expect(result.quarantinedDomains).toEqual(["tenant-a", "tenant-b"]);
  });
});
