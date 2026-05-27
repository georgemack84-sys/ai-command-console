import { describe, expect, it } from "vitest";

import { buildConstitutionalReviewRoute } from "@/services/governance/constitutionalReviewRouting";

describe("approval routing", () => {
  it("preserves constitutional sequencing", () => {
    const route = buildConstitutionalReviewRoute({
      reviewType: "approval",
      blockedReasons: ["REPLAY_MISMATCH_UNRESOLVED", "COORDINATION_FREEZE_ACTIVE"],
    });

    expect(route.route).toEqual([
      "governance_validation",
      "constitutional_enforcement",
      "approval_validation",
      "replay_verification",
      "containment_verification",
      "coordination_freeze_review",
      "replay_mismatch_review",
      "immutable_audit_append",
    ]);
  });
});
