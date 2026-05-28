import { describe, expect, it } from "vitest";

import { buildHumanSupremacyAuthorityContract } from "@/services/human-supremacy/authorityBoundaryValidator";

describe("authority leak prevention", () => {
  it("keeps all authority flags false", () => {
    expect(Object.values(buildHumanSupremacyAuthorityContract()).every((value) => value === false)).toBe(true);
  });
});
