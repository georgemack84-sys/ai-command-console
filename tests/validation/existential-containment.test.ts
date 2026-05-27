import { describe, expect, it } from "vitest";

import { validateConstitutionalOperation } from "@/services/validation/constitutionalOperationalValidation";

describe("validateConstitutionalOperation", () => {
  it("requires containment under existential severity", () => {
    const result = validateConstitutionalOperation({
      sovereigntyState: "CIVILIZATION_LOCKDOWN",
      constitutionalIntegrity: 0.21,
      governanceReliability: 0.32,
      containmentIntegrity: 0.41,
      operationalStability: 0.28,
      immutableAuditVerified: true,
      autonomyRisk: 0.88,
      disputedSystems: ["runtime"],
      createdAt: 10,
    });

    expect(result.severity).toBe("EXISTENTIAL");
    expect(result.containmentRequired).toBe(true);
  });
});
