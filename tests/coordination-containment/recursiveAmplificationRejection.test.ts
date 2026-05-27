import { describe, expect, it } from "vitest";

import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("recursive amplification rejection", () => {
  it("contains recursive coordination signals", () => {
    const fixture = buildMissionGraphFixture();
    const cycleEdge = Object.freeze({
      ...fixture.snapshot.edges[0],
      edgeId: `${fixture.snapshot.edges[0].edgeId}-cycle`,
      sourceNodeId: fixture.snapshot.edges[0].targetNodeId,
      targetNodeId: fixture.snapshot.edges[0].sourceNodeId,
    });
    const record = buildCoordinationContainmentRecord({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: { ...fixture.snapshot, edges: Object.freeze([...fixture.snapshot.edges, cycleEdge]) },
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
    });

    expect(record.validation.allowed).toBe(false);
  });
});
