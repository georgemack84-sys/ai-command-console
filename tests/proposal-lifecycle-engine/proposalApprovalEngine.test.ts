import { describe, expect, it } from "vitest";

import { evaluateProposalApproval } from "@/services/proposal-lifecycle-engine";

describe("proposalApprovalEngine", () => {
  it("fails closed for expired approvals", () => {
    const result = evaluateProposalApproval({
      approval: Object.freeze({
        approvalId: "approval-001",
        status: "approved",
        explicit: true,
        approvers: Object.freeze(["operator-01"]),
        approvedAt: "2026-05-16T14:00:00.000Z",
        expiresAt: "2026-05-16T14:59:00.000Z",
        scopeHash: "scope",
        governanceDecisionHash: "gov",
        valid: true,
      }),
      governanceDecisionHash: "gov",
      timestamp: "2026-05-16T15:00:00.000Z",
    });
    expect(result.approval.status).toBe("expired");
    expect(result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_EXPIRED")).toBe(true);
  });

  it("does not grant implicit approval", () => {
    const result = evaluateProposalApproval({
      governanceDecisionHash: "gov",
      timestamp: "2026-05-16T15:00:00.000Z",
    });
    expect(result.approval.status).toBe("required");
    expect(result.approval.valid).toBe(false);
  });
});
