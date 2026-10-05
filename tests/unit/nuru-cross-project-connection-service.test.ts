import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ search: vi.fn(), retrieve: vi.fn(), similar: vi.fn() }));
vi.mock("@/src/server/services/nuru-search-service", () => ({ NuruSearchService: { search: mocks.search } }));
vi.mock("@/src/server/services/nuru-archive-service", () => ({ NuruArchiveService: { retrieve: mocks.retrieve } }));
vi.mock("@/src/server/services/nuru-embeddings-service", () => ({ nuruEmbeddingsService: { similar: mocks.similar } }));
import { NuruCrossProjectConnectionService } from "@/src/server/services/nuru-cross-project-connection-service";

describe("Nuru cross-project connections", () => {
  it("finds proposed related knowledge outside the primary project", async () => {
    mocks.search.mockResolvedValue([{ id: "K-P", title: "Authority boundary", confidence: 0.85, project: "Proprium" }]); mocks.similar.mockResolvedValue([]); mocks.retrieve.mockResolvedValue({ id: "K-P", title: "Authority boundary", project: "Proprium" });
    const service = new NuruCrossProjectConnectionService({ search: mocks.search } as never, { retrieve: mocks.retrieve } as never, { similar: mocks.similar } as never);
    await expect(service.find({ itemId: "K-N", title: "Agent authority", content: "Services enforce authorization.", primaryProject: "Nuru" })).resolves.toMatchObject([{ targetItemId: "K-P", targetProject: "Proprium", status: "PROPOSED" }]);
  });
});
