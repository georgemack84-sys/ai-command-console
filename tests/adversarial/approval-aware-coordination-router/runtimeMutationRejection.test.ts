import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("routing runtime mutation rejection", () => {
  it("rejects runtime mutation markers", () => {
    const fixture = buildApprovalAwareRoutingFixture({ metadata: { mutateRuntime: true } });
    expect(fixture.result.allowed).toBe(false);
  });
});
