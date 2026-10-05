import { describe, expect, it } from "vitest";
import { buildNuruDiscoverTasteMap } from "@/src/server/services/nuru-discover-taste-map-service";
import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";

const item: NuruDiscoverCatalogItem = { id: "K-1", knowledgeItemId: "K-1", title: "Systems", summary: "", contentType: "Essay", project: "Nuru", topics: ["systems"], confidence: 0.9, source: { sourceType: "PROJECT_DOCUMENT", origin: "Owner", authority: "OWNER" }, provenanceAvailable: true };

describe("Nuru Discover Taste Map", () => {
  it("uses only the latest explicit signal for catalog topics", () => {
    expect(buildNuruDiscoverTasteMap([item], [
      { knowledgeItemId: "K-1", signalType: "SAVE", weight: 1, source: "DISCOVER_UI", createdAt: new Date("2026-09-15T10:00:00.000Z") },
      { knowledgeItemId: "K-1", signalType: "DISMISS", weight: -1, source: "DISCOVER_UI", createdAt: new Date("2026-09-15T11:00:00.000Z") },
    ])).toEqual([expect.objectContaining({ topic: "systems", score: -1, savedCount: 0, dismissedCount: 1 })]);
  });
});
