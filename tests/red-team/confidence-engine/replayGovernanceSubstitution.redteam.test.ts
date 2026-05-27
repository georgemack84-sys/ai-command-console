import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidence governance substitution red-team", () => {
  it("fails closed on hidden governance substitution", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalGovernanceBindingResult: {
        ...base.input.proposalGovernanceBindingResult,
        binding: {
          ...base.input.proposalGovernanceBindingResult.binding,
          governanceSnapshotId: "governance-substituted",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT")).toBe(true);
  });
});
