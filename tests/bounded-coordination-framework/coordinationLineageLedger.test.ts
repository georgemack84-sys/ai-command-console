import { describe, expect, it } from "vitest";

import { appendCoordinationLineage } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("coordinationLineageLedger", () => {
  it("appends immutable coordination lineage", () => {
    const { framework } = buildBoundedCoordinationFixture();
    const appended = appendCoordinationLineage({
      existing: framework.lineage,
      graphId: framework.topology.graphId,
      graphHash: framework.topology.graphHash,
      replayHash: framework.replayBinding.reconstructionHash,
      lineageHash: framework.topology.lineageHash,
      createdAt: "2026-05-16T16:27:00.000Z",
    });
    expect(appended.entries.length).toBe(framework.lineage.entries.length + 1);
    expect(appended.immutable).toBe(true);
  });
});
