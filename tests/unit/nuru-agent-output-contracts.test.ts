import { describe, expect, it } from "vitest";
import { contextAgentOutputSchema, qualityAgentOutputSchema } from "@/src/nuru/domain";

describe("Nuru structured agent output contracts", () => {
  it("requires contextual classification, topics, confidence, and a reasoning summary", () => {
    expect(contextAgentOutputSchema.parse({ candidateId: "K-302", itemId: "K-302", project: "Nuru", primaryProject: "Nuru", relatedProjects: ["Noesis"], artifactType: "architecture_decision", scope: "V1", topic: "agent architecture", topics: ["agent architecture", "service boundary"], sourceContext: "Owner brief", likelyPurpose: "Define Nuru V1 boundaries.", dependencies: [], relatedComponents: [], confidence: 0.94, confidenceBand: "VERY_HIGH", reasoningSummary: "Defines agents versus deterministic services." })).toMatchObject({ confidence: 0.94 });
  });

  it("requires quality issues to be machine-readable rather than narrative-only", () => {
    expect(qualityAgentOutputSchema.parse({ itemId: "K-302", status: "PASS_WITH_WARNINGS", result: "PASS_WITH_WARNINGS", issues: [{ type: "POSSIBLE_DUPLICATE", relatedItem: "K-281", severity: "LOW" }], sourceKnown: true, provenanceAvailable: true, duplicateState: "POSSIBLE_DUPLICATE", conflictDetected: false, contextAccurate: true, relationshipsJustified: true, evidenceSufficient: true, confidence: 0.91, confidenceBand: "VERY_HIGH", warnings: ["Possible duplicate."], reasoningSummary: "Duplicate retrieval found a related canonical item." })).toMatchObject({ issues: [{ relatedItem: "K-281" }] });
  });
});
