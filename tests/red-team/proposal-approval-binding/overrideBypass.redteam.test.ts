import { describe, expect, it } from "vitest";
import type { ApprovalOverrideRequest } from "@/tests/integration/proposal-approval-binding/helpers";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

describe("override bypass red-team", () => {
  it("fails closed when override lineage is corrupted", () => {
    const fixture = buildProposalApprovalBindingFixture({
      operatorOverrideRequest: Object.freeze({
        overrideId: "override-corrupt",
        operatorId: "operator-4",
        disposition: "REVIEW_ONLY" as const,
        reason: "Replay review",
        boundAt: "2026-05-21T07:10:00.000Z",
        supersedesAutomation: false,
      }) as unknown as ApprovalOverrideRequest,
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
