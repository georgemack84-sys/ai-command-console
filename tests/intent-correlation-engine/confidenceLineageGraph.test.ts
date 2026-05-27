import { describe, expect, it } from "vitest";

import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { buildConfidenceLineageGraphs } from "@/services/intent-correlation-engine/confidenceLineageGraph";
import { buildIntentCorrelationFixture } from "./helpers";

describe("confidence lineage graph", () => {
  it("binds historical confidence without recalculating it", () => {
    const { input } = buildIntentCorrelationFixture();
    const replay = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    const result = buildConfidenceLineageGraphs({
      readinessGates: input.readinessGates,
      relationshipIds: [],
      replayBinding: replay.replayBinding,
    });
    expect(result.errors).toEqual([]);
    expect(result.graphs[0]!.points[0]!.observedConfidence).toBe(input.readinessGates[0]!.proposalView.confidenceScore);
  });
});
