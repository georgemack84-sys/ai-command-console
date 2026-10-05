import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ knowledge: { findMany: vi.fn() }, conflicts: { findMany: vi.fn() }, queue: { findMany: vi.fn() }, proposals: { findMany: vi.fn() }, relationships: { findMany: vi.fn() } }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruKnowledgeItem: mocks.knowledge, nuruContradictionAssessment: mocks.conflicts, nuruCurationQueue: mocks.queue, nuruCurationProposal: mocks.proposals, nuruRelationship: mocks.relationships } }));
import { NuruCuratorMemoryService } from "@/src/server/services/nuru-curator-memory-service";

describe("Nuru Curator memory", () => {
  it("builds a bounded, governed project context packet", async () => {
    mocks.knowledge.findMany.mockResolvedValueOnce([{ id: "K-1", title: "Service boundary", contentType: "Architecture Decision", status: "ARCHIVED", confidence: 0.96 }]).mockResolvedValueOnce([]);
    mocks.conflicts.findMany.mockResolvedValue([{ itemId: "K-1", relatedItemId: "K-2", state: "POTENTIAL_CONTRADICTION", confidence: 0.9 }]);
    mocks.queue.findMany.mockResolvedValue([{ id: "Q-1", proposalId: "CP-1", lane: "CONFLICT_REVIEW", priority: 80 }]);
    mocks.proposals.findMany.mockResolvedValue([{ id: "CP-0", recommendation: "MERGE", status: "APPROVED", decisionReason: "Reviewed." }]);
    mocks.relationships.findMany.mockResolvedValue([{ sourceItemId: "K-1", targetItemId: "K-3", relationshipType: "REFERENCES", confidence: 0.8, status: "APPROVED" }]);
    const packet = await NuruCuratorMemoryService.build({ project: "Nuru" });
    expect(packet.summary).toMatchObject({ project: "Nuru", canonicalPrinciples: 1, openConflicts: 1, pendingReviews: 1, recentDecisions: 1, relevantRelationships: 1 });
    expect(packet.curationPolicies).toHaveLength(4);
    expect(mocks.knowledge.findMany.mock.calls[0][0]).toMatchObject({ take: 17 });
  });

  it("returns an explicit empty packet when memory is unavailable", () => {
    expect(NuruCuratorMemoryService.unavailable("Nuru").summary).toMatchObject({ unavailable: true, canonicalPrinciples: 0, policyCount: 4 });
  });
});
