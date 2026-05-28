import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("invisible retry rejection", () => {
  it("rejects retry markers", () => {
    const fixture = buildApprovalAwareRoutingFixture({ metadata: { retryLoop: true } });
    expect(fixture.result.allowed).toBe(false);
  });
});
