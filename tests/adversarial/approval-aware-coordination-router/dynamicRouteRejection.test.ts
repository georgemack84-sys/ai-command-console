import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("dynamic route rejection", () => {
  it("rejects unknown static route targets", () => {
    const fixture = buildApprovalAwareRoutingFixture({
      requestedTransition: "validated->plugin_generated_target",
      targetCoordinationState: "plugin_generated_target",
    });
    expect(fixture.result.allowed).toBe(false);
  });
});
