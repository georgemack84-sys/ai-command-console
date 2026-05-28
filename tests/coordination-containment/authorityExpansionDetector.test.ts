import { describe, expect, it } from "vitest";

import { detectAuthorityExpansion } from "@/services/coordination-containment/authorityExpansionDetector";
import { buildContainmentAuthorityContract } from "@/services/coordination-containment/orchestrationBoundaryEnforcer";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("detectAuthorityExpansion", () => {
  it("rejects authority inheritance markers", () => {
    const fixture = buildMissionGraphFixture();
    const evidence = detectAuthorityExpansion({
      authorityContract: buildContainmentAuthorityContract(),
      missionGraph: fixture.snapshot,
      metadata: { authorityInheritance: true },
    });

    expect(evidence).toContain("metadata:authorityinheritance");
  });
});
