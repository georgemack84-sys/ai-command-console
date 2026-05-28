import { describe, expect, it } from "vitest";
import { validateReplayLedgerIntegrity } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay ledger integrity", () => {
  it("accepts an intact append-only replay ledger", () => {
    const bundle = buildReplayBundle();
    expect(validateReplayLedgerIntegrity(bundle.ledger, bundle.snapshot!)).toEqual([]);
  });

  it("fails closed when the replay event chain is broken", () => {
    const bundle = buildReplayBundle();
    const corruptedLedger = bundle.ledger.map((event, index) => (
      index === 2
        ? { ...event, previousEventHash: "broken-chain" }
        : event
    ));

    const failures = validateReplayLedgerIntegrity(corruptedLedger, bundle.snapshot!);
    expect(failures.some((failure) => failure.code === "REPLAY_EVENT_CHAIN_BROKEN")).toBe(true);
  });
});
