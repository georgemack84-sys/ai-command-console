import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";
import { buildContainmentFixture } from "@/tests/coordination-containment/helpers";
import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";

describe("constitutional coordination recursive rejection", () => {
  it("inherits recursive containment failure", () => {
    const containmentFixture = buildContainmentFixture();
    const cycleEdge = Object.freeze({
      ...containmentFixture.input.missionGraph.edges[0],
      edgeId: `${containmentFixture.input.missionGraph.edges[0].edgeId}-cycle`,
      sourceNodeId: containmentFixture.input.missionGraph.edges[0].targetNodeId,
      targetNodeId: containmentFixture.input.missionGraph.edges[0].sourceNodeId,
    });
    const recursiveContainment = buildCoordinationContainmentRecord({
      ...containmentFixture.input,
      missionGraph: {
        ...containmentFixture.input.missionGraph,
        edges: Object.freeze([...containmentFixture.input.missionGraph.edges, cycleEdge]),
      },
    });
    const fixture = buildConstitutionalCoordinationFixture({
      containmentRecord: recursiveContainment,
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
