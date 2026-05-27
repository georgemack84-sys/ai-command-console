import { describe, expect, it } from "vitest";

import { buildApprovalAwareRoutingFixture } from "@/tests/integration/approval-aware-coordination-router/helpers";

describe("routing replay log", () => {
  it("records deterministic replay-safe routing evidence", () => {
    const fixture = buildApprovalAwareRoutingFixture();
    expect(fixture.result.replayLog.deterministicHash.length).toBeGreaterThan(0);
    expect(fixture.result.replayLog.governanceSnapshotId).toBe(fixture.result.governanceSnapshotId);
  });
});
