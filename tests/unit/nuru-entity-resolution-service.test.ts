import { describe, expect, it } from "vitest";
import { NuruEntityResolutionService } from "@/src/server/services/nuru-entity-resolution-service";

describe("Nuru entity resolution", () => {
  it("normalizes an approved alias and returns its stable identity", async () => {
    const service = new NuruEntityResolutionService(async (query) => query === "nvda" ? [{ id: "entity-nvidia", canonicalName: "NVIDIA Corporation", entityType: "COMPANY" }] : []);
    await expect(service.resolve("  NVDA  ")).resolves.toMatchObject({ status: "RESOLVED", canonicalId: "entity-nvidia", canonicalName: "NVIDIA Corporation", confidence: 1 });
  });

  it("returns ambiguity instead of choosing a likely entity", async () => {
    const service = new NuruEntityResolutionService(async () => [{ id: "entity-1", canonicalName: "Acme One", entityType: "COMPANY" }, { id: "entity-2", canonicalName: "Acme Two", entityType: "COMPANY" }]);
    await expect(service.resolve("Acme")).resolves.toMatchObject({ status: "AMBIGUOUS", canonicalId: null, candidates: [{ id: "entity-1" }, { id: "entity-2" }] });
  });
});
