import { describe, expect, it } from "vitest";

import { appendMissionGraphLedger } from "@/services/mission-graph/graphAppendOnlyLedger";

describe("append-only graph ledger", () => {
  it("appends without rewriting prior chronology", () => {
    const first = appendMissionGraphLedger({
      entry: Object.freeze({
        entryId: "entry-a",
        snapshotId: "snapshot-a",
        graphHash: "graph-a",
        createdAt: "2026-05-17T08:00:00.000Z",
      }),
    });
    const second = appendMissionGraphLedger({
      existing: first,
      entry: Object.freeze({
        entryId: "entry-b",
        snapshotId: "snapshot-b",
        graphHash: "graph-b",
        createdAt: "2026-05-17T08:05:00.000Z",
      }),
    });

    expect(second.entries.map((entry) => entry.entryId)).toEqual(["entry-a", "entry-b"]);
  });
});
