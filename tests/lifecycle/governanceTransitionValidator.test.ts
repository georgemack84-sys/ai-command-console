import { describe, expect, it } from "vitest";
import { validateGovernanceTransitionRequest } from "@/services/governance/governanceTransitionValidator";
import { buildLifecycleFixture } from "./helpers";

describe("governance transition validator", () => {
  it("accepts matching explicit governance evidence", () => {
    const { request } = buildLifecycleFixture();
    expect(validateGovernanceTransitionRequest(request)).toEqual([]);
  });

  it("rejects approval bypass on review -> approved", () => {
    const { request } = buildLifecycleFixture({
      currentState: "review",
      nextState: "approved",
    });
    const failing = Object.freeze({
      ...request,
      proposal: Object.freeze({
        ...request.proposal,
        approval: Object.freeze({
          ...request.proposal.approval,
          valid: false,
        }),
      }),
      approvalValidation: Object.freeze({
        asserted: true as const,
        approvalState: "invalid" as const,
      }),
    });
    expect(validateGovernanceTransitionRequest(failing).map((error) => error.code)).toContain("LIFECYCLE_APPROVAL_MISMATCH");
  });
});
