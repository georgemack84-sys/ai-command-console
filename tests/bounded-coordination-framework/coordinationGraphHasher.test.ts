import { describe, expect, it } from "vitest";

import { hashCoordinationValue } from "@/services/bounded-coordination-framework";

describe("coordinationGraphHasher", () => {
  it("hashes identical topology inputs deterministically", () => {
    const left = hashCoordinationValue("coord", { a: 1, b: ["x", "y"] });
    const right = hashCoordinationValue("coord", { b: ["x", "y"], a: 1 });
    expect(left).toBe(right);
  });
});
