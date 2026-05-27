import { describe, expect, it } from "vitest";

import { buildRoutingAuthorityContract } from "@/services/approval-aware-coordination-router";

describe("routing authority contract", () => {
  it("keeps all routing authorities false", () => {
    expect(Object.values(buildRoutingAuthorityContract()).every((value) => value === false)).toBe(true);
  });
});
