import { describe, expect, it } from "vitest";
import { runNuruCuration } from "@/src/server/services/nuru-agent-service";
import { buildCurationProposal } from "@/src/server/services/nuru-curation-proposal-service";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";

describe("Nuru V1 acceptance scenario", () => {
  it("detects the agent/service architectural principle and requires governance approval", () => {
    const source = { sourceType: "HUMAN_INPUT" as const, origin: "Nuru owner architecture brief", authority: "OWNER" as const };
    const result = runNuruCuration({ title: "Nuru Agent Service Boundary", content: "Keep Archive, Search, Metadata, Audit, Embeddings, Database, and Permissions as services rather than agents.", project: "Nuru", source });
    const proposal = buildCurationProposal({ itemId: "candidate-acceptance", classification: result.classification, project: "Nuru", recommendation: result.recommendation, relationships: result.relationships.map(({ targetItemId, relationshipType, confidence, evidence, proposedBy, status }) => ({ targetItemId, relationshipType, confidence, evidence, proposedBy, status })), qualityStatus: result.qualityStatus, confidence: result.confidence, evidence: ["Owner architecture brief", ...result.relationships.map((relationship) => relationship.evidence)], reasoningSummary: result.reasoningSummary, warnings: result.warnings, correlationId: "nuru-v1-acceptance" });
    const governance = NuruGovernanceGate.evaluate({ proposalId: proposal.id, recommendation: proposal.recommendation, qualityStatus: proposal.qualityStatus, confidence: proposal.confidence, evidenceQuality: "STRONG", sourceAuthority: "OWNER", requiredReview: proposal.requiredReview, humanApproved: false, correlationId: "nuru-v1-acceptance" });
    expect(result.runs.map((run) => run.agentType)).toEqual(["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY"]);
    expect(proposal).toMatchObject({ recommendation: "ACCEPT", classification: "Architectural Principle", project: "Nuru", requiredReview: true });
    expect(proposal.relationships.map((relationship) => relationship.targetItemId)).toEqual(expect.arrayContaining(["service:archive", "service:search", "service:metadata", "service:audit", "service:embeddings", "service:database", "service:permissions"]));
    expect(governance.outcome).toBe("HUMAN_REVIEW_REQUIRED");
  });
});
