import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("replay repair rejection", () => {
  it("rejects replay repair markers", () => {
    const fixture = buildApprovalAwareRoutingFixture({ metadata: { repairReplay: true } });
    expect(fixture.result.allowed).toBe(false);
  });
});
