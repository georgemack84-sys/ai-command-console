import { describe, expect, it } from "vitest";

import { bindCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayBinder";
import { mapProposalRelationships } from "@/services/intent-correlation-engine/proposalRelationshipMapper";
import { buildRecommendationClusters } from "@/services/intent-correlation-engine/recommendationClusterModel";
import { buildIntentCorrelationFixture } from "./helpers";

describe("recommendation cluster model", () => {
  it("creates bounded advisory clusters", () => {
    const { input } = buildIntentCorrelationFixture();
    const replay = bindCorrelationReplay({
      coordinationRecords: input.coordinationRecords,
      proposals: input.proposals,
      readinessGates: input.readinessGates,
      escalations: input.escalations,
      approvalGraphs: input.approvalGraphs,
      createdAt: input.createdAt,
    });
    const relationships = mapProposalRelationships({
      coordinationRecords: input.coordinationRecords,
      replayBinding: replay.replayBinding,
      createdAt: input.createdAt,
    });
    const result = buildRecommendationClusters({
      relationships: relationships.relationships,
      replayBinding: replay.replayBinding,
      createdAt: input.createdAt,
    });
    expect(result.errors).toEqual([]);
    expect(result.clusters.length).toBeGreaterThan(0);
  });
});
