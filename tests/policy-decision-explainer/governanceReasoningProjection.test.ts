import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectGovernanceReasoning } from "./helpers";

describe("governance reasoning projection", () => {
  it("renders governance reasoning without recomputation", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectGovernanceReasoning({
      traceView: fixture.traceFixture.view,
      treaty: fixture.traceFixture.validationFixture.context.treaty,
    });

    expect(projected.reasoning.evaluator).toBe("validation-core");
    expect(projected.reasoning.tracePolicyId).toBe(
      fixture.traceFixture.view.governanceOverlay?.policyId,
    );
  });
});
