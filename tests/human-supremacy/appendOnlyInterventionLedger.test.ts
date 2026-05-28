import { describe, expect, it } from "vitest";

import { appendInterventionLedger } from "@/services/human-supremacy/interventionAppendOnlyLedger";

describe("append-only intervention ledger", () => {
  it("appends new entries without rewriting history", () => {
    const first = appendInterventionLedger({
      entry: Object.freeze({
        entryId: "entry-a",
        coordinationId: "coord-1",
        action: "pause_coordination" as const,
        replayHash: "replay-a",
        governanceHash: "gov-a",
        createdAt: "2026-05-17T09:00:00.000Z",
      }),
    });
    const second = appendInterventionLedger({
      existing: first,
      entry: Object.freeze({
        entryId: "entry-b",
        coordinationId: "coord-1",
        action: "inspect_replay_lineage" as const,
        replayHash: "replay-b",
        governanceHash: "gov-b",
        createdAt: "2026-05-17T09:01:00.000Z",
      }),
    });

    expect(second.entries.map((entry) => entry.entryId)).toEqual(["entry-a", "entry-b"]);
  });
});
