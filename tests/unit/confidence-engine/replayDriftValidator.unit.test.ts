import { describe, expect, it } from "vitest";
import { validateConfidenceDrift } from "@/services/confidence-engine/confidenceDriftValidator";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidenceDriftValidator", () => {
  it("emits frozen drifts for governance mismatch", () => {
    const fixture = buildDeterministicConfidenceFixture();
    const drifts = validateConfidenceDrift({
      engineInput: fixture.input,
      errors: Object.freeze([{
        code: "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT",
        message: "drift",
        path: "proposalGovernanceBindingResult",
      }]),
    });

    expect(drifts[0]?.driftType).toBe("governance_mismatch");
    expect(drifts[0]?.frozen).toBe(true);
  });
});
