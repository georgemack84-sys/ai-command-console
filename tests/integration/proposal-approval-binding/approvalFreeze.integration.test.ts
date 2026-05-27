import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "./helpers";

describe("proposal approval freeze propagation", () => {
  it("denies admissibility when upstream freeze containment exists", () => {
    const fixture = buildProposalApprovalBindingFixture({
      proposalFreezeResult: {
        ...buildProposalApprovalBindingFixture().input.proposalFreezeResult,
        status: "FROZEN",
      },
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_FREEZE_BYPASS")).toBe(true);
  });
});
