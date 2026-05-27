import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidence dependency inference red-team", () => {
  it("fails closed when approval lineage is fabricated", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalApprovalBindingResult: {
        ...base.input.proposalApprovalBindingResult,
        binding: {
          ...base.input.proposalApprovalBindingResult.binding,
          approvalIds: Object.freeze(["fabricated-approval"]),
        },
      },
    });

    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
