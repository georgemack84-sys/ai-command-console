import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruKnowledgeItem: { findMany: mocks.findMany }, nuruDuplicateAssessment: { create: mocks.create } } }));

import { NuruDuplicateService } from "@/src/server/services/nuru-duplicate-service";

describe("Nuru duplicate detection", () => {
  it("identifies exact duplicates from normalized content hashes", async () => {
    mocks.findMany.mockResolvedValue([{ id: "K-281", title: "Agent boundary", content: "Keep archive services deterministic.", metadata: {}, contentType: "Architecture Decision", status: "ARCHIVED", project: "Nuru", source: {}, relationships: [], confidence: 0.9, currentVersion: 1, provenance: {}, createdAt: new Date() }]);
    const service = new NuruDuplicateService({ similar: vi.fn().mockResolvedValue([]) } as never);
    await expect(service.assess({ itemId: "K-302", title: "Boundary", content: "Keep archive services deterministic.", project: "Nuru" })).resolves.toMatchObject({ result: "EXACT_DUPLICATE", matchedItemId: "K-281", confidence: 1 });
  });

  it("identifies semantic duplicates without requiring matching wording", async () => {
    mocks.findMany.mockResolvedValue([]);
    const service = new NuruDuplicateService({ similar: vi.fn().mockResolvedValue([{ itemId: "K-281", score: 0.91 }]) } as never);
    await expect(service.assess({ itemId: "K-302", title: "Boundary", content: "Agents reason while services enforce.", project: "Nuru" })).resolves.toMatchObject({ result: "SEMANTIC_DUPLICATE", matchedItemId: "K-281" });
  });
});
