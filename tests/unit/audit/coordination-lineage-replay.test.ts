import { describe, expect, it } from "vitest";

import { buildCoordinationLineage } from "@/services/coordination/coordinationLineage";

describe("coordination lineage replay", () => {
  it("produces replayable immutable lineage", () => {
    const lineage = buildCoordinationLineage({
      coordinationId: "coordination:a",
      participatingSystems: ["GOVERNANCE", "CONTAINMENT"],
      dependencyOrdering: ["CONTAINMENT", "GOVERNANCE"],
      enforcementReferences: ["enforcement:a"],
    });

    expect(lineage.immutableLineageHash).toHaveLength(64);
  });
});
