import { describe, expect, it } from "vitest";

import { inspectCorrelationTopology } from "@/services/intent-correlation-engine/correlationTopologyInspector";
import { buildIntentCorrelationFixture } from "./helpers";

describe("correlation topology inspector", () => {
  it("allows explicit two-hop visibility without inferring a third edge", () => {
    const { computation } = buildIntentCorrelationFixture();
    const result = inspectCorrelationTopology(computation.result.relationships);
    expect(result).toEqual([]);
    expect(computation.result.relationships.some((relationship) => relationship.sourceProposalId === "proposal-a" && relationship.targetProposalId === "proposal-c")).toBe(false);
  });
});
