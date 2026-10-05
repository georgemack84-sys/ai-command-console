import { describe, expect, it } from "vitest";
import { buildCurationProposal } from "@/src/server/services/nuru-curation-proposal-service";

describe("Nuru Curation Proposal", () => {
  it("creates a structured, review-required proposal without mutating knowledge", () => {
    const proposal = buildCurationProposal({ itemId: "K-101", classification: "Architecture Decision", project: "Nuru", recommendation: "ACCEPT", relationships: [{ targetItemId: "K-182", relationshipType: "EXTENDS", confidence: 0.9, evidence: "Builds on the V1 concept.", proposedBy: "nuru.connection.v1", status: "PROPOSED" }], qualityStatus: "PASS", confidence: 0.94, evidence: ["Owner brief", "Quality pass"], reasoningSummary: "Defines the approved V1 agent/service boundary.", warnings: [], correlationId: "corr-proposal" });
    expect(proposal).toMatchObject({ recommendation: "ACCEPT", classification: "Architecture Decision", project: "Nuru", requiredReview: true, relationships: [expect.objectContaining({ relationshipType: "EXTENDS", status: "PROPOSED" })] });
  });
});
