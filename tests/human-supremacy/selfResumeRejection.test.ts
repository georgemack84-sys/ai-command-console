import { describe, expect, it } from "vitest";

import { validateAuthorityBoundary, buildHumanSupremacyAuthorityContract } from "@/services/human-supremacy/authorityBoundaryValidator";

describe("self resume rejection", () => {
  it("rejects self-resume signals", () => {
    const errors = validateAuthorityBoundary({
      authorityContract: buildHumanSupremacyAuthorityContract(),
      metadata: Object.freeze({ selfResume: true }),
    });

    expect(errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_SELF_RESUME_FORBIDDEN");
  });
});
