import { describe, expect, it } from "vitest";

import { buildCoordinationLineage } from "@/services/coordination/coordinationLineage";

describe("buildCoordinationLineage", () => {
  it("produces immutable lineage hash", () => {
    const result = buildCoordinationLineage({
      coordinationId: "coordination:a",
      participatingSystems: ["RECOVERY", "REPLAY"],
      dependencyOrdering: ["REPLAY", "RECOVERY"],
      enforcementReferences: ["enforcement:a"],
    });

    expect(result.immutableLineageHash).toHaveLength(64);
  });
});
