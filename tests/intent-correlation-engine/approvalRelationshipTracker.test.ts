import { describe, expect, it } from "vitest";

import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { mapProposalRelationships } from "@/services/intent-correlation-engine/proposalRelationshipMapper";
import { trackApprovalRelationships } from "@/services/intent-correlation-engine/approvalRelationshipTracker";
import { buildIntentCorrelationFixture } from "./helpers";

describe("approval relationship tracker", () => {
  it("observes approval relationships without inheritance", () => {
    const fixture = buildIntentCorrelationFixture({
      topology: Object.freeze({
        ...buildIntentCorrelationFixture().input.coordinationRecords[0]!.topology,
        relationships: Object.freeze([
          Object.freeze({
            relationshipId: "rel-approval",
            parentIntentId: "intent-a",
            childIntentId: "intent-b",
            relationshipType: "approval" as const,
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
    const relationships = mapProposalRelationships({
      coordinationRecords: fixture.input.coordinationRecords,
      replayBinding: replay.replayBinding,
      createdAt: fixture.input.createdAt,
    });
    const result = trackApprovalRelationships({
      approvalGraphs: fixture.input.approvalGraphs,
      relationships: relationships.relationships,
      replayBinding: replay.replayBinding,
    });
    expect(result.errors).toEqual([]);
    expect(result.observations[0]!.approvalInheritance).toBe(false);
  });
});
