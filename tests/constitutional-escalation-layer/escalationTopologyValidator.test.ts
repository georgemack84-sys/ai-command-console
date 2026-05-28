import { describe, expect, it } from "vitest";
import { validateEscalationTopology } from "@/services/constitutional-escalation-layer";
import { buildBoundedCoordinationFixture } from "@/tests/bounded-coordination-framework/helpers";

describe("validateEscalationTopology", () => {
  it("surfaces coordination overflow signals", () => {
    const fixture = buildBoundedCoordinationFixture({
      requestedCeiling: Object.freeze({
        maxDepth: 1,
        maxBranchFactor: 0,
        maxDelegations: 0,
        maxEscalationDepth: 0,
        maxWorkflowNodes: 1,
        maxCoordinationDurationMs: 100,
      }),
    });

    const result = validateEscalationTopology(fixture.framework);
    expect(result.signals.branchFactorOverflow || result.signals.depthOverflow).toBe(true);
  });
});
