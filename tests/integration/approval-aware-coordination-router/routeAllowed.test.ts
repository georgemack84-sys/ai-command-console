import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "./helpers";

describe("approval-aware coordination router", () => {
  it("allows a static approved constitutional route", () => {
    const fixture = buildApprovalAwareRoutingFixture();
    expect(fixture.result.decision).toBe("route_allowed");
    expect(fixture.result.target).toBe("approval_review");
  });
});
