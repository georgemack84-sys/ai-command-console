import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createMany: vi.fn(), findMany: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruRelationship: { createMany: mocks.createMany, findMany: mocks.findMany } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));

import { NuruGraphService } from "@/src/server/services/nuru-graph-service";

describe("Nuru relationship graph", () => {
  it("stores Connection proposals as graph edges rather than canonical relationships", async () => {
    await NuruGraphService.propose({ sourceItemId: "K-101", targetItemId: "K-205", relationshipType: "DEFINES_BOUNDARY", confidence: 0.9, evidence: "The architecture explicitly assigns the boundary.", proposedBy: "nuru.connection.v1", status: "PROPOSED" }, "graph-corr");
    expect(mocks.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ status: "PROPOSED", relationshipType: "DEFINES_BOUNDARY" })] }));
  });

  it("traverses approved graph edges deterministically", async () => {
    mocks.findMany.mockResolvedValueOnce([{ sourceItemId: "K-101", targetItemId: "K-205", relationshipType: "RELATED_TO", confidence: 0.8, status: "APPROVED" }]).mockResolvedValueOnce([]);
    const graph = await NuruGraphService.traverse({ itemId: "K-101", depth: 2 });
    expect(graph).toMatchObject({ rootItemId: "K-101", nodes: expect.arrayContaining(["K-205"]), edges: [expect.objectContaining({ relationshipType: "RELATED_TO" })] });
  });
});
