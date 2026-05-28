import { describe, expect, it } from "vitest";

import { assessOperationalContainment } from "@/services/containment/operationalContainment";

describe("containment survivability", () => {
  it("recommends isolation or quarantine under cross-domain corruption risk", () => {
    const result = assessOperationalContainment({
      survivabilityState: "CRITICAL",
      systemicInstability: 0.83,
      governanceCollapseRisk: 0.77,
      survivabilityConfidence: 0.29,
      containmentEffectiveness: 0.42,
      escalationPressure: 0.8,
      operationalDivergenceRisk: 0.78,
      dependencyCollapseRisk: 0.84,
      constitutionalConflictSpreadRisk: 0.69,
      tenantSurvivabilityRisk: 0.76,
      unstableDomains: ["tenant-a", "tenant-b"],
      nowMs: 4,
    });

    expect(["ISOLATE", "QUARANTINE", "CONTAIN", "FREEZE", "DENY"]).toContain(result.recommendedAction);
  });
});
