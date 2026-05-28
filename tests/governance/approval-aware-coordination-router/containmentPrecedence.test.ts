import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("routing containment precedence", () => {
  it("freezes routing when containment is frozen", () => {
    const fixture = buildApprovalAwareRoutingFixture({ containmentState: "frozen" });
    expect(fixture.result.decision).toBe("route_frozen");
    expect(fixture.result.target).toBe("coordination_hold");
  });
});
