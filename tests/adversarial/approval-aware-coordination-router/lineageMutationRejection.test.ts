import { describe, expect, it } from "vitest";

import { appendRoutingLineage } from "@/services/approval-aware-coordination-router";

describe("lineage mutation rejection", () => {
  it("appends instead of mutating prior chronology", () => {
    const first = appendRoutingLineage({
      entry: {
        lineageRecordId: "a",
        coordinationId: "c",
        proposalId: "p",
        decision: "route_allowed",
        target: "approval_review",
        containmentState: "safe",
        blockedReasons: Object.freeze([]),
        createdAt: "2026-05-17T12:00:00.000Z",
        deterministicHash: "h1",
      },
    });
    const second = appendRoutingLineage({
      existing: first,
      entry: {
        lineageRecordId: "b",
        coordinationId: "c",
        proposalId: "p",
        decision: "route_blocked",
        target: "human_review",
        containmentState: "restricted",
        blockedReasons: Object.freeze(["approval:invalid"]),
        createdAt: "2026-05-17T12:01:00.000Z",
        deterministicHash: "h2",
      },
    });
    expect(first.entries).toHaveLength(1);
    expect(second.entries).toHaveLength(2);
  });
});
