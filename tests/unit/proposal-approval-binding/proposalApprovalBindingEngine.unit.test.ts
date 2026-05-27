import { describe, expect, it } from "vitest";
import { bindProposalApproval } from "@/services/proposal-approval-binding/approvalBindingEngine";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("proposalApprovalBindingEngine", () => {
  it("binds approvals immutably for valid constitutional inputs", () => {
    const fixture = buildProposalApprovalBindingFixture();

    expect(fixture.result.status).toBe("BOUND");
    expect(fixture.result.admissibility.admissible).toBe(true);
    expect(fixture.result.binding.immutable).toBe(true);
    expect(fixture.result.auditEntries.length).toBeGreaterThan(0);
  });

  it("rejects fabricated approval dependencies", () => {
    const fixture = buildProposalApprovalBindingFixture();
    const altered = bindProposalApproval({
      ...fixture.input,
      approvals: fixture.input.approvals.slice(1),
    });

    expect(altered.status).toBe("FAILED_CLOSED");
    expect(altered.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_FABRICATION")).toBe(true);
  });

  it("keeps operator overrides constraining rather than escalating", () => {
    const fixture = buildProposalApprovalBindingFixture({
      operatorOverrideRequest: Object.freeze({
        overrideId: "override-1",
        operatorId: "operator-1",
        disposition: "FREEZE" as const,
        reason: "Need manual constitutional review",
        boundAt: "2026-05-21T07:05:00.000Z",
        supersedesAutomation: true as const,
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.overrideBinding?.supersedesAutomation).toBe(true);
    expect(fixture.result.admissibility.status).toBe("FROZEN");
  });
});
