import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("workflow synthesis rejection", () => {
  it("rejects generated workflow targets", () => {
    const fixture = buildApprovalAwareRoutingFixture({
      requestedTransition: "review->generated_workflow",
      targetCoordinationState: "generated_workflow",
    });
    expect(fixture.result.allowed).toBe(false);
  });
});
