import { describe, expect, it } from "vitest";

import { buildAdmissionContext, deriveAdmissionHash } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("derived admission hasher", () => {
  it("is key-order independent", () => {
    const fixture = buildAdmissionFixture();
    const context = buildAdmissionContext(fixture);
    const reordered = {
      warnings: ["w1"],
      blocks: ["b1"],
      reasons: ["r1"],
      decision: "APPROVED" as const,
      context,
    };

    expect(deriveAdmissionHash(reordered)).toBe(deriveAdmissionHash({
      context,
      decision: "APPROVED",
      reasons: ["r1"],
      blocks: ["b1"],
      warnings: ["w1"],
    }));
  });

  it("changes on semantic mutation", () => {
    const fixture = buildAdmissionFixture();
    const context = buildAdmissionContext(fixture);
    const first = deriveAdmissionHash({ context, decision: "APPROVED", reasons: ["ready"], blocks: [], warnings: [] });
    const second = deriveAdmissionHash({ context, decision: "DENIED", reasons: ["ready"], blocks: [], warnings: [] });
    expect(first).not.toBe(second);
  });
});
