import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() }, nuruRelationship: { findMany: vi.fn(async () => []), createMany: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
vi.mock("@/src/server/services/nuru-search-service", () => ({ NuruSearchService: { search: vi.fn(async () => [{ id: "K-182", title: "Nuru Curator", confidence: 0.8 }]) } }));
vi.mock("@/src/server/services/nuru-embeddings-service", () => ({ nuruEmbeddingsService: { similar: vi.fn(async () => [{ itemId: "K-205", score: 0.86, chunkId: "K-205:0", excerpt: "Curator architecture" }]) } }));
vi.mock("@/src/server/services/nuru-duplicate-service", () => ({ nuruDuplicateService: { assess: vi.fn(async () => ({ result: "NOT_DUPLICATE", confidence: 0.2 })) } }));
vi.mock("@/src/server/services/nuru-cross-project-connection-service", () => ({ nuruCrossProjectConnectionService: { find: vi.fn(async () => []) } }));
import { NuruConnectionAgent } from "@/src/server/services/nuru-connection-agent";

describe("Nuru Connection Agent", () => {
  it("uses retrieval candidates but retains high-impact supersession as proposals", async () => {
    const result = await NuruConnectionAgent.connect({ itemId: "K-101", title: "Agent architecture", content: "This extends the prior agent architecture but does not supersede it.", project: "Nuru", correlationId: "corr-connection" });
    expect(result).toMatchObject({ status: "success", result: { candidatesConsidered: 2, highImpactRequiresValidation: true, proposals: expect.arrayContaining([expect.objectContaining({ status: "PROPOSED", relationshipType: "SUPERSEDES" })]) } });
  });
});
