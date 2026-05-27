import { describe, expect, it } from "vitest";

import { validateAuthorityBoundary, buildHumanSupremacyAuthorityContract } from "@/services/human-supremacy/authorityBoundaryValidator";

describe("override inheritance rejection", () => {
  it("rejects authority inheritance signals", () => {
    const errors = validateAuthorityBoundary({
      authorityContract: buildHumanSupremacyAuthorityContract(),
      metadata: Object.freeze({ authorityInheritance: true }),
    });

    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_AUTHORITY_INHERITANCE_FORBIDDEN");
  });
});
