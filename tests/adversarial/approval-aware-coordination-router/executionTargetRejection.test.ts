import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("execution target rejection", () => {
  it("rejects execution-like transitions", () => {
    const fixture = buildApprovalAwareRoutingFixture({
      requestedTransition: "proposal->execution",
      targetCoordinationState: "execution",
    });
    expect(fixture.result.allowed).toBe(false);
  });
});
