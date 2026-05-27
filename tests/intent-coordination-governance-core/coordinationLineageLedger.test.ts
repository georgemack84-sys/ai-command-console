import { describe, expect, it } from "vitest";

import { appendCoordinationGovernanceLineage } from "@/services/intent-coordination-governance-core/coordinationLineageLedger";

describe("coordination lineage ledger", () => {
  it("appends immutable entries", () => {
    const first = appendCoordinationGovernanceLineage({
      coordinationId: "coord-1",
      coordinationHash: "hash-1",
      replayHash: "replay-1",
      lineageHash: "lineage-1",
      createdAt: "2026-05-17T00:10:00.000Z",
    });
    const second = appendCoordinationGovernanceLineage({
      existing: first,
      coordinationId: "coord-1",
      coordinationHash: "hash-2",
      replayHash: "replay-2",
      lineageHash: "lineage-2",
      createdAt: "2026-05-17T00:11:00.000Z",
    });
    expect(first.entries).toHaveLength(1);
    expect(second.entries).toHaveLength(2);
    expect(second.immutable).toBe(true);
  });
});
