import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("approval authority expansion red-team", () => {
  it("rejects authority expansion attempts", () => {
    const base = buildProposalApprovalBindingFixture();
    const fixture = buildProposalApprovalBindingFixture({
      proposalGovernanceBindingResult: {
        ...base.input.proposalGovernanceBindingResult,
        authorityBoundary: {
          ...base.input.proposalGovernanceBindingResult.authorityBoundary,
          allowedScopes: Object.freeze(["proposal.review", "runtime.execute"]),
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_AUTHORITY_MISMATCH")).toBe(true);
  });
});
