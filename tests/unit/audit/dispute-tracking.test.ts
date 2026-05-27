import { describe, expect, it } from "vitest";

import { createDisputeRecord, transitionDisputeRecord } from "@/services/audit/disputeTracking";

describe("disputeTracking", () => {
  it("tracks disputes through explicit states", () => {
    const record = createDisputeRecord({
      category: "REPLAY",
      state: "OPEN",
      evidenceRefs: ["evidence:a"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });
    const next = transitionDisputeRecord({
      record,
      nextState: "FROZEN",
    });

    expect(next.state).toBe("FROZEN");
  });
});
