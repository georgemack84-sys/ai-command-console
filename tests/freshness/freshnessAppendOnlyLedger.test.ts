import { describe, expect, it } from "vitest";
import { appendFreshnessLedger } from "@/services/freshness/freshnessAppendOnlyLedger";

describe("freshness append-only ledger", () => {
  it("appends immutable freshness chronology", () => {
    const state = {
      proposalId: "proposal-a",
      freshnessStatus: "fresh",
      confidenceState: "stable",
      replayIntegrity: "verified",
      governanceCompatibility: "compatible",
      detectedDrifts: [],
      lastValidatedAt: "2026-05-17T06:00:00.000Z",
      expiresAt: "2026-05-17T07:00:00.000Z",
    } as const;
    const first = appendFreshnessLedger({
      state,
      stateHash: "hash-1",
      createdAt: "2026-05-17T06:00:00.000Z",
    });
    const second = appendFreshnessLedger({
      existing: first,
      state: { ...state, freshnessStatus: "stale" } as const,
      stateHash: "hash-2",
      createdAt: "2026-05-17T06:30:00.000Z",
    });
    expect(second.entries).toHaveLength(2);
    expect(second.entries[0]?.stateHash).toBe("hash-1");
    expect(second.entries[1]?.stateHash).toBe("hash-2");
  });
});
