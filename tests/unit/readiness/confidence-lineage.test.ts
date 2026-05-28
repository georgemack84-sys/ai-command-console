import { describe, expect, it } from "vitest";

import { buildConfidenceLineage } from "@/services/readiness/confidenceLineage";

describe("buildConfidenceLineage", () => {
  it("preserves inherited constraints and disputed signals", () => {
    const lineage = buildConfidenceLineage({
      sourceSystem: "readiness",
      derivedFrom: ["governance", "containment", "continuity"],
      inheritedConstraints: ["freeze_active"],
      disputedSignals: ["replay_mismatch"],
    });

    expect(lineage.sourceSystem).toBe("readiness");
    expect(lineage.inheritedConstraints).toContain("freeze_active");
    expect(lineage.disputedSignals).toContain("replay_mismatch");
  });
});
