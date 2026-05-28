import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("approval inheritance rejection", () => {
  it("blocks invalid approval scope from routing", () => {
    const fixture = buildApprovalAwareRoutingFixture({ approvalValid: false });
    expect(fixture.result.allowed).toBe(false);
  });
});
