import { describe, expect, it } from "vitest";

import { mapProposalRelationships } from "@/services/intent-correlation-engine/proposalRelationshipMapper";
import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { buildIntentCorrelationFixture } from "./helpers";

describe("proposal relationship mapper", () => {
  it("maps explicit relationships only", () => {
    const { input } = buildIntentCorrelationFixture();
    const replay = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    const result = mapProposalRelationships({
      coordinationRecords: input.coordinationRecords,
      replayBinding: replay.replayBinding,
      createdAt: input.createdAt,
    });
    expect(result.errors).toEqual([]);
    expect(result.relationships).toHaveLength(2);
  });

  it("rejects execution-like relationship names", () => {
    const fixture = buildIntentCorrelationFixture({
      topology: Object.freeze({
        ...buildIntentCorrelationFixture().input.coordinationRecords[0]!.topology,
        relationships: Object.freeze([
          Object.freeze({
            relationshipId: "rel-bad",
            parentIntentId: "intent-a",
            childIntentId: "intent-b",
            relationshipType: "dispatch" as never,
            governanceBindings: Object.freeze(["gov"]),
            replaySafe: true as const,
            executionAuthority: false as const,
          }),
        ]),
      }),
    });
    const replay = bindCorrelationReplay({
      coordinationRecords: fixture.input.coordinationRecords,
      proposals: fixture.input.proposals,
      readinessGates: fixture.input.readinessGates,
      escalations: fixture.input.escalations,
      approvalGraphs: fixture.input.approvalGraphs,
      createdAt: fixture.input.createdAt,
    });
    const result = mapProposalRelationships({
      coordinationRecords: fixture.input.coordinationRecords,
      replayBinding: replay.replayBinding,
      createdAt: fixture.input.createdAt,
    });
    expect(result.errors.some((error) => error.code === "PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED")).toBe(true);
  });
});
