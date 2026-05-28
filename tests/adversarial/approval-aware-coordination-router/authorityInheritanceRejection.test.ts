import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("authority inheritance rejection", () => {
  it("rejects authority inheritance markers", () => {
    const fixture = buildApprovalAwareRoutingFixture({ metadata: { authorityInheritance: true } });
    expect(fixture.result.errors.some((error) => error.includes("authorityinheritance"))).toBe(true);
  });
});
