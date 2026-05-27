import { describe, expect, it } from "vitest";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildPlanDiffFixture } from "./helpers";

describe("no mutation behavior", () => {
  it("never mutates source input objects", () => {
    const fixture = buildPlanDiffFixture();
    const before = JSON.stringify(fixture.input);

    buildPlanDiffInspection(fixture.input);

    expect(JSON.stringify(fixture.input)).toBe(before);
  });
});
