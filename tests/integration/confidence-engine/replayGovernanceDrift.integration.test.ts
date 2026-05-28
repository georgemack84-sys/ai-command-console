import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "./helpers";

describe("confidence governance drift compatibility", () => {
  it("freezes when immutable governance coordinates diverge", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalGovernanceBindingResult: {
        ...base.input.proposalGovernanceBindingResult,
        snapshot: {
          ...base.input.proposalGovernanceBindingResult.snapshot,
          policySnapshotId: "policy-substituted",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT")).toBe(true);
  });
});
