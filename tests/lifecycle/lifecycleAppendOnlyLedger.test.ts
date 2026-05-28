import { describe, expect, it } from "vitest";
import { appendLifecycleLedger } from "@/services/lifecycle/lifecycleAppendOnlyLedger";

describe("lifecycle append-only ledger", () => {
  it("appends without rewriting prior chronology", () => {
    const ledger = appendLifecycleLedger({
      transitionId: "t1",
      fromState: "observe",
      toState: "interpret",
      proposalId: "proposal-a",
      replayHash: "replay-1",
      createdAt: "2026-05-17T06:00:00.000Z",
    });
    const next = appendLifecycleLedger({
      existing: ledger,
      transitionId: "t2",
      fromState: "interpret",
      toState: "recommend",
      proposalId: "proposal-a",
      replayHash: "replay-2",
      createdAt: "2026-05-17T06:01:00.000Z",
    });
    expect(next.entries).toHaveLength(2);
    expect(next.entries[0]?.transitionId).toBe("t1");
    expect(next.entries[1]?.transitionId).toBe("t2");
  });
});
