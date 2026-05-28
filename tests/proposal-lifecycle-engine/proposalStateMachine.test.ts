import { describe, expect, it } from "vitest";

import { resolveProposalTransition } from "@/services/proposal-lifecycle-engine";

describe("proposalStateMachine", () => {
  it("rejects invalid transitions", () => {
    const result = resolveProposalTransition({
      currentState: "draft",
      requestedTransition: "approve",
      approvalValid: true,
      revoked: false,
      futureBound: false,
      errorsPresent: false,
    });
    expect(result.errors.some((error) => error.code === "PROPOSAL_STATE_TRANSITION_INVALID")).toBe(true);
  });

  it("keeps archived proposals immutable", () => {
    const result = resolveProposalTransition({
      currentState: "archived",
      requestedTransition: "archive",
      approvalValid: true,
      revoked: false,
      futureBound: false,
      errorsPresent: false,
    });
    expect(result.resultingState).toBe("archived");
    expect(result.errors.some((error) => error.code === "PROPOSAL_ARCHIVED_IMMUTABLE")).toBe(true);
  });
});
