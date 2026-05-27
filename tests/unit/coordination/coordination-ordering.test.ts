import { describe, expect, it } from "vitest";

import { orderCoordinationSystems } from "@/services/coordination/coordinationOrdering";

describe("orderCoordinationSystems", () => {
  it("preserves deterministic ordering", () => {
    expect(orderCoordinationSystems(["SIMULATION", "CONTAINMENT", "GOVERNANCE"])).toEqual([
      "CONTAINMENT",
      "GOVERNANCE",
      "SIMULATION",
    ]);
  });
});
