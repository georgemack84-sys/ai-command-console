import { describe, expect, it } from "vitest";

import { evaluateSamApproval } from "../../services/sam/samApprovalGate.ts";

describe("sam approval gate", () => {
  it("missing approval blocks", () => {
    const result = evaluateSamApproval({
      actionType: "recover_execution",
      requireApproval: true,
    });

    expect(result.required).toBe(true);
    expect(result.granted).toBe(false);
    expect(result.reason).toBe("SAM_APPROVAL_REQUIRED");
  });

  it("denied approval blocks", () => {
    const result = evaluateSamApproval({
      actionType: "recover_execution",
      requireApproval: true,
      approval: {
        status: "denied",
        reason: "no",
      },
    });

    expect(result.denied).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_DENIED");
  });

  it("granted approval allows dry-run only", () => {
    const result = evaluateSamApproval({
      actionType: "recover_execution",
      requireApproval: true,
      approval: {
        status: "granted",
        approvedBy: "operator_1",
      },
    });

    expect(result.granted).toBe(true);
    expect(result.status).toBe("granted");
  });

  it("read-only allowlisted actions can be not_applicable", () => {
    const result = evaluateSamApproval({
      actionType: "inspect_state",
      requireApproval: true,
      approval: {
        status: "not_applicable",
      },
    });

    expect(result.required).toBe(false);
    expect(result.granted).toBe(true);
  });
});
