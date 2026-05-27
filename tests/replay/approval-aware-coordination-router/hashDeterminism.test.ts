import { describe, expect, it } from "vitest";

import { hashRoutingValue } from "@/services/approval-aware-coordination-router";
import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("routing hash determinism", () => {
  it("produces identical hashes for identical input", () => {
    const fixture = buildApprovalAwareRoutingFixture();
    expect(hashRoutingValue("route", fixture.result)).toBe(hashRoutingValue("route", fixture.result));
  });
});
