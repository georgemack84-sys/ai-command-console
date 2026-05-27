import { describe, expect, it } from "vitest";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("coordinationContainmentEngine", () => {
  it("enforces bounded depth and branch ceilings", () => {
    const { input } = buildBoundedCoordinationFixture({
      requestedCeiling: Object.freeze({
        maxDepth: 1,
        maxBranchFactor: 1,
        maxDelegations: 1,
        maxEscalationDepth: 0,
        maxWorkflowNodes: 1,
        maxCoordinationDurationMs: 1000,
      }),
    });
    const framework = buildBoundedCoordinationFramework(input);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_DEPTH_EXCEEDED");
  });
});
