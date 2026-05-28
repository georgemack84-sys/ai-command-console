import { describe, expect, it } from "vitest";
import { appendEscalationLineage } from "@/services/constitutional-escalation-layer";

describe("appendEscalationLineage", () => {
  it("preserves append-only lineage", () => {
    const first = appendEscalationLineage({
      escalationId: "esc-1",
      escalationHash: "hash-1",
      replayHash: "replay-1",
      lineageHash: "lineage-1",
      createdAt: "2026-05-16T18:00:00.000Z",
    });
    const second = appendEscalationLineage({
      existing: first,
      escalationId: "esc-2",
      escalationHash: "hash-2",
      replayHash: "replay-2",
      lineageHash: "lineage-2",
      createdAt: "2026-05-16T18:01:00.000Z",
    });

    expect(second.entries).toHaveLength(2);
    expect(second.entries[0]).toEqual(first.entries[0]);
    expect(second.immutable).toBe(true);
  });
});
