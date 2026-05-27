import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "./helpers";

describe("bounded orchestration deterministic reconstruction", () => {
  it("produces identical hashes for identical inputs", () => {
    const first = buildBoundedOrchestrationFixture();
    const second = buildBoundedOrchestrationFixture();

    expect(first.record.deterministicHash).toBe(second.record.deterministicHash);
    expect(first.record.replay.replayHash).toBe(second.record.replay.replayHash);
    expect(first.record.chronology.chronologyHash).toBe(second.record.chronology.chronologyHash);
  });

  it("preserves append-only chronology", () => {
    const first = buildBoundedOrchestrationFixture();
    const second = buildBoundedOrchestrationFixture({
      createdAt: "2026-05-17T12:05:00.000Z",
      existingChronology: first.record.chronology,
    });

    expect(first.record.chronology.entries).toHaveLength(1);
    expect(second.record.chronology.entries).toHaveLength(2);
    expect(second.record.chronology.entries[0]?.entryId).toBe(first.record.chronology.entries[0]?.entryId);
  });
});
