import { describe, expect, it } from "vitest";

import { buildConstitutionalRuntimeAuthority } from "@/services/runtime/constitutionalRuntimeAuthority";

describe("buildConstitutionalRuntimeAuthority", () => {
  it("never grants execution authority when sovereignty or validation are unsafe", () => {
    const result = buildConstitutionalRuntimeAuthority({
      sovereignty: { sovereigntyState: "CONTAINED", constitutionalSafe: false, immutableAuditHealthy: true },
      validation: { validationState: "FAILED", constitutionalSafe: false, autonomySafe: false, containmentRequired: true, immutableAuditVerified: true, failures: ["containment_required"] },
      createdAt: 10,
    });

    expect(result.executionAllowed).toBe(false);
    expect(result.advisoryOnly).toBe(true);
  });
});
