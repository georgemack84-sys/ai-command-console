import { describe, expect, it } from "vitest";

import { evaluateConstitutionalContinuity } from "@/services/survivability/constitutionalContinuity";

describe("governance continuity", () => {
  it("prioritizes constitutional continuity under degraded governance", () => {
    const result = evaluateConstitutionalContinuity({
      governanceConfidence: 0.41,
      constitutionalIntegrity: 0.52,
      auditHistoryLength: 2,
      disputedTruthPresent: true,
    });

    expect(result.governanceContinuity).toBeLessThan(0.5);
    expect(result.auditPreservationConfidence).toBeGreaterThan(0);
  });
});
