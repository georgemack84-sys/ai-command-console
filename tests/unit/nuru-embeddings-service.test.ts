import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({
  nuruKnowledgeRepository: { nuruEmbeddingReference: { upsert: vi.fn(), deleteMany: vi.fn() } },
}));

import { NuruEmbeddingsService, chunkText } from "@/src/server/services/nuru-embeddings-service";

describe("Nuru Embeddings Service", () => {
  it("chunks content and retrieves conceptually overlapping indexed candidates", async () => {
    const service = new NuruEmbeddingsService();
    await service.index("K-101", "Agents reason about knowledge while deterministic services enforce storage and audit.");
    await service.index("K-102", "Ocean currents and coral reefs form a changing marine ecosystem.");
    const matches = await service.similar("agent service architecture", 1);
    expect(matches[0]?.itemId).toBe("K-101");
  });

  it("removes indexed chunks and respects explicit chunk boundaries", async () => {
    const service = new NuruEmbeddingsService();
    expect(chunkText("one two three four", 2)).toEqual(["one two", "three four"]);
    await service.index("K-103", "vector infrastructure stays behind the embeddings service");
    await service.remove("K-103");
    expect((await service.similar("vector infrastructure", 10)).some((match) => match.itemId === "K-103")).toBe(false);
  });
});
