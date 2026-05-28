import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectConstraintReasoning } from "./helpers";

describe("constraint reasoning projection", () => {
  it("shows blocking constraints without hiding invalid states", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectConstraintReasoning({
      traceView: fixture.traceFixture.view,
    });

    expect(Array.isArray(projected.reasoning.blockingConstraints)).toBe(true);
    expect(typeof projected.reasoning.governanceMismatchConstraints).toBe("boolean");
  });
});
