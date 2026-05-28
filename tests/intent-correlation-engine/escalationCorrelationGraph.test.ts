import { describe, expect, it } from "vitest";

import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { buildEscalationCorrelationGraphs } from "@/services/intent-correlation-engine/escalationCorrelationGraph";
import { buildIntentCorrelationFixture } from "./helpers";

describe("escalation correlation graph", () => {
  it("associates escalation visibility without creating authority", () => {
    const { input, computation } = buildIntentCorrelationFixture();
    const replay = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    const result = buildEscalationCorrelationGraphs({
      escalations: input.escalations,
      relationships: computation.result.relationships,
      replayBinding: replay.replayBinding,
    });
    expect(result.errors).toEqual([]);
    expect(result.graphs.every((graph) => graph.boundary.executionAuthority === false)).toBe(true);
  });
});
