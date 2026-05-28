import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("recursive routing rejection", () => {
  it("rejects recursive routing lineage", () => {
    const seed = buildApprovalAwareRoutingFixture();
    const fixture = buildApprovalAwareRoutingFixture({
      priorRoutingLineageIds: [seed.input.coordinationId],
    });
    expect(fixture.result.allowed).toBe(false);
  });
});
