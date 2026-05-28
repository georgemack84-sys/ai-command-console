import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("chronology mutation rejection", () => {
  it("keeps routing lineage append-only", () => {
    const first = buildApprovalAwareRoutingFixture();
    const second = buildApprovalAwareRoutingFixture({
      existingLineage: first.result.lineage,
    });
    expect(first.result.lineage.entries.length).toBe(1);
    expect(second.result.lineage.entries.length).toBe(2);
  });
});
