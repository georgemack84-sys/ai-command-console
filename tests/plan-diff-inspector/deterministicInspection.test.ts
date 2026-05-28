import { describe, expect, it } from "vitest";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildPlanDiffFixture } from "./helpers";

describe("deterministic inspection hashing", () => {
  it("produces identical inspection output for identical input", () => {
    const fixture = buildPlanDiffFixture();

    const left = buildPlanDiffInspection(fixture.input);
    const right = buildPlanDiffInspection(fixture.input);

    expect(right).toEqual(left);
    expect(right.deterministicHash).toBe(left.deterministicHash);
  });
});
