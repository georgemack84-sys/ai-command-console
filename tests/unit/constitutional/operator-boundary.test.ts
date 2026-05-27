import { describe, expect, it } from "vitest";

import { buildOperatorApprovalPacket } from "@/services/controlPlane/operatorApprovalWorkflow";

describe("operator boundary", () => {
  it("keeps operator actions in governed preview mode", () => {
    const packet = buildOperatorApprovalPacket({
      reviewId: "review_1",
      targetId: "target_1",
      targetType: "APPROVAL_PACKET",
      reviewState: "PENDING_REVIEW",
      constitutionalReasoning: ["approval required"],
      governanceReferences: ["governance:1"],
      blockedReasons: [],
      createdAt: 1,
    });

    expect(packet.submissionEnabled).toBe(false);
  });
});
