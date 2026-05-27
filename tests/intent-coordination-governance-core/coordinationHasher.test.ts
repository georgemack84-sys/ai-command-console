import { describe, expect, it } from "vitest";

import { hashCoordinationGovernanceValue } from "@/services/intent-coordination-governance-core/coordinationHasher";

describe("coordination hasher", () => {
  it("is stable across object key ordering", () => {
    const left = hashCoordinationGovernanceValue("ns", { b: "two", a: "one" });
    const right = hashCoordinationGovernanceValue("ns", { a: "one", b: "two" });
    expect(left).toBe(right);
  });
});
