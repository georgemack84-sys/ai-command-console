import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("deterministic hashing", () => {
  it("produces the same constitutional decision hash for the same input", () => {
    const first = buildConstitutionalGovernanceFixture();
    const second = buildConstitutionalGovernanceFixture();

    expect(first.view.constitutionalDecisionHash).toBe(second.view.constitutionalDecisionHash);
    expect(first.view.decisions).toEqual(second.view.decisions);
  });
});
