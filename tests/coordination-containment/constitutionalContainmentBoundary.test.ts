import { describe, expect, it } from "vitest";

import { buildContainmentAuthorityContract } from "@/services/coordination-containment/orchestrationBoundaryEnforcer";

describe("constitutional containment boundary", () => {
  it("keeps all authority flags false", () => {
    expect(Object.values(buildContainmentAuthorityContract()).every((value) => value === false)).toBe(true);
  });
});
