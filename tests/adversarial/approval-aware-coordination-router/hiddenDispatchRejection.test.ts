import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("hidden dispatch rejection", () => {
  it("rejects dispatch markers", () => {
    const fixture = buildApprovalAwareRoutingFixture({ metadata: { dispatch: true } });
    expect(fixture.result.allowed).toBe(false);
  });
});
