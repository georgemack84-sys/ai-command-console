import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectEnforcementReasoning } from "./helpers";

describe("enforcement reasoning projection", () => {
  it("shows enforcement chain and blocking point", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectEnforcementReasoning({
      traceView: fixture.traceFixture.view,
    });

    expect(projected.reasoning.enforcementOrder).toHaveLength(9);
    expect(projected.reasoning.finalDecisionSource).toBeTruthy();
  });
});
