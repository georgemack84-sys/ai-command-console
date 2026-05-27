import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("containment bypass rejection", () => {
  it("does not route around frozen containment", () => {
    const fixture = buildApprovalAwareRoutingFixture({
      containmentState: "frozen",
      requestedTransition: "escalation_bound->coordinated",
      targetCoordinationState: "coordinated",
    });
    expect(fixture.result.target).toBe("coordination_hold");
  });
});
