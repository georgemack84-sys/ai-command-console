import { describe, expect, it } from "vitest";

import { appendContainmentLedger } from "@/services/coordination-containment/containmentLedger";

describe("appendContainmentLedger", () => {
  it("preserves append-only containment lineage", () => {
    const first = appendContainmentLedger({
      entry: {
        entryId: "a",
        coordinationId: "c",
        containmentState: "restricted",
        violationIds: Object.freeze(["v1"]),
        createdAt: "2026-05-17T08:00:00.000Z",
        containmentHash: "h1",
      },
    });
    const second = appendContainmentLedger({
      existing: first,
      entry: {
        entryId: "b",
        coordinationId: "c",
        containmentState: "frozen",
        violationIds: Object.freeze(["v2"]),
        createdAt: "2026-05-17T08:01:00.000Z",
        containmentHash: "h2",
      },
    });

    expect(second.entries).toHaveLength(2);
    expect(second.entries[0].entryId).toBe("a");
  });
});
