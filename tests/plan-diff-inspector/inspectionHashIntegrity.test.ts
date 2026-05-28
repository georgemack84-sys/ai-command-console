import { describe, expect, it } from "vitest";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildPlanDiffFixture } from "./helpers";

describe("inspection hash integrity", () => {
  it("changes when meaningful visible inspection evidence changes", () => {
    const fixture = buildPlanDiffFixture();
    const left = buildPlanDiffInspection(fixture.input);
    const right = buildPlanDiffInspection({
      ...fixture.input,
      sourceRefs: ["policy-explanation", "trace-view", "execution-treaty", "extra-ref"],
    });

    expect(right.deterministicHash).not.toBe(left.deterministicHash);
  });
});
