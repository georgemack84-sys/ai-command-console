import { describe, expect, it } from "vitest";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildPlanDiffFixture } from "./helpers";

describe("large inspection determinism", () => {
  it("remains deterministic with larger evidence bundles", () => {
    const fixture = buildPlanDiffFixture();
    const expandedBase = Object.freeze({
      ...fixture.baseArtifact,
      evidenceRefs: Object.freeze([
        ...(fixture.baseArtifact.evidenceRefs as readonly string[]),
        ...(fixture.baseArtifact.evidenceRefs as readonly string[]),
      ]),
    });
    const expandedTarget = Object.freeze({
      ...fixture.targetArtifact,
      evidenceRefs: Object.freeze([
        ...(fixture.targetArtifact.evidenceRefs as readonly string[]),
        "unknown-evidence-ref-2",
      ]),
    });

    const left = buildPlanDiffInspection({
      ...fixture.input,
      baseArtifact: expandedBase,
      targetArtifact: expandedTarget,
    });
    const right = buildPlanDiffInspection({
      ...fixture.input,
      baseArtifact: expandedBase,
      targetArtifact: expandedTarget,
    });

    expect(right).toEqual(left);
  });
});
