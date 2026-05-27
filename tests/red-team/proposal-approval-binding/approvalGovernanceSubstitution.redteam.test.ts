import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("approval governance substitution red-team", () => {
  it("fails closed on governance snapshot substitution", () => {
    const base = buildProposalApprovalBindingFixture();
    const fixture = buildProposalApprovalBindingFixture({
      proposalGovernanceBindingResult: {
        ...base.input.proposalGovernanceBindingResult,
        binding: {
          ...base.input.proposalGovernanceBindingResult.binding,
          governanceSnapshotId: "governance-snapshot-substituted",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_MISMATCH")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
