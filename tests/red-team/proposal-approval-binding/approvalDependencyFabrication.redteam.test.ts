import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("approval dependency fabrication red-team", () => {
  it("rejects fabricated approval regeneration", () => {
    const base = buildProposalApprovalBindingFixture();
    const fabricated = Object.freeze([
      ...base.input.approvals,
      Object.freeze({
        ...base.input.approvals[0]!,
        approvalId: "fabricated-approval",
      }),
    ]);

    const fixture = buildProposalApprovalBindingFixture({
      approvals: fabricated,
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_FABRICATION")).toBe(true);
  });
});
