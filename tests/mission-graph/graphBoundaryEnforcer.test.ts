import { describe, expect, it } from "vitest";

import { buildMissionGraphAuthorityContract, enforceMissionGraphBoundary } from "@/services/mission-graph/graphBoundaryEnforcer";

describe("mission graph boundary enforcer", () => {
  it("rejects authority inference and workflow markers", () => {
    const result = enforceMissionGraphBoundary({
      authorityContract: buildMissionGraphAuthorityContract(),
      metadata: Object.freeze({
        authorityChain: "proposal-a -> proposal-b",
        workflowPlan: "dispatch next",
      }),
    });

    expect(result.visibilityFrozen).toBe(true);
    expect(result.errors.map((error) => error.code)).toContain("MISSION_GRAPH_AUTHORITY_LEAKAGE");
    expect(result.errors.map((error) => error.code)).toContain("MISSION_GRAPH_WORKFLOW_SYNTHESIS_REJECTED");
  });
});
