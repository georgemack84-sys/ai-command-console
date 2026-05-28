import { beforeEach, describe, expect, it } from "vitest";

import { getSamThroughputSnapshot, recordSamThroughputEvent, resetSamThroughputTracker } from "../../services/sam/performance/samThroughputTracker.ts";

describe("sam throughput regression", () => {
  beforeEach(() => {
    resetSamThroughputTracker();
  });

  it("tracks throughput deterministically by operation kind", () => {
    recordSamThroughputEvent("bridge_completed");
    recordSamThroughputEvent("bridge_completed");
    recordSamThroughputEvent("audit_appended");

    const snapshot = getSamThroughputSnapshot();
    expect(snapshot.totalEvents).toBe(3);
    expect(snapshot.byKind.bridge_completed).toBe(2);
    expect(snapshot.byKind.audit_appended).toBe(1);
  });
});
