import { describe, expect, it } from "vitest";
import { validateApprovalValidityWindow } from "@/services/proposal-approval-binding/approvalValidityWindowEngine";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("approvalValidityWindowEngine", () => {
  it("fails closed on ambiguous approval windows", () => {
    const fixture = buildProposalApprovalBindingFixture();
    const errors = validateApprovalValidityWindow({
      validityWindow: {
        ...fixture.input.validityWindow,
        ambiguous: true,
      },
      evaluatedAt: fixture.input.evaluatedAt,
    });

    expect(errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_VALIDITY_WINDOW_AMBIGUOUS")).toBe(true);
  });
});
