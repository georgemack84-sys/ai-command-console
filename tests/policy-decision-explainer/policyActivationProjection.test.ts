import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectPolicyActivations } from "./helpers";

describe("policy activation projection", () => {
  it("renders deterministic policy activation state from governance overlay", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectPolicyActivations({
      traceView: fixture.traceFixture.view,
      treaty: fixture.traceFixture.validationFixture.context.treaty,
    });

    expect(projected.activations[0]?.policyId).toBeTruthy();
    expect(projected.activations[0]?.activationOrder).toBe(1);
    expect(projected.errors).toEqual([]);
  });
});
