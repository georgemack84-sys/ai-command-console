import { describe, expect, it } from "vitest";

import { buildCivilizationContinuity } from "@/services/civilization/civilizationContinuity";

describe("buildCivilizationContinuity", () => {
  it("preserves deterministic continuity lineage", () => {
    const result = buildCivilizationContinuity({
      survivabilityConfidence: 0.68,
      continuityProjection: 0.66,
      isolatedSystems: ["replay"],
      protectedDomains: ["governance"],
      createdAt: 10,
    });

    expect(result.lineageId).toBe("civilization-continuity:10");
    expect(result.continuityPreserved).toBe(true);
  });
});
