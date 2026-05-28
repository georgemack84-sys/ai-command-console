import { describe, expect, it } from "vitest";

import { enforceTrustZone } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("trust zone enforcer", () => {
  it("quarantines unauthorized trust-zone escalation", () => {
    const fixture = buildAdmissionFixture({
      requestedTrustZone: "CRITICAL",
    });
    const enforcement = enforceTrustZone(fixture);
    expect(enforcement.allowed).toBe(false);
    expect(enforcement.failures.some((failure) => failure.code === "PHASE42L_TRUST_ZONE_VIOLATION")).toBe(true);
  });
});
