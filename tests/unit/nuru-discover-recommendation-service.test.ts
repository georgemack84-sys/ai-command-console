import { describe, expect, it } from "vitest";
import { buildNuruDiscoverSession } from "@/src/server/services/nuru-discover-recommendation-service";
import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";

const catalog: NuruDiscoverCatalogItem[] = [
  { id: "K-1", knowledgeItemId: "K-1", title: "Hidden infrastructure", summary: "One", contentType: "Essay", project: "Nuru", topics: ["systems", "history"], confidence: 0.91, source: { sourceType: "PROJECT_DOCUMENT", origin: "Owner brief", authority: "OWNER" }, provenanceAvailable: true },
  { id: "K-2", knowledgeItemId: "K-2", title: "Human craft", summary: "Two", contentType: "Essay", project: "Nuru", topics: ["craft"], confidence: 0.8, source: { sourceType: "PROJECT_DOCUMENT", origin: "Owner brief", authority: "OWNER" }, provenanceAvailable: true },
  { id: "K-3", knowledgeItemId: "K-3", title: "Systems practice", summary: "Three", contentType: "Essay", project: "Nuru", topics: ["systems"], confidence: 0.75, source: { sourceType: "PROJECT_DOCUMENT", origin: "Owner brief", authority: "OWNER" }, provenanceAvailable: true },
];

describe("Nuru Discover recommendation service", () => {
  it("ranks topic affinity ahead of otherwise higher-confidence catalog entries", () => {
    const session = buildNuruDiscoverSession(catalog, { preferredTopics: ["craft"] });
    expect(session.recommendations[0]).toEqual(expect.objectContaining({
      item: expect.objectContaining({ id: "K-2" }),
      lane: "NEAR_MATCH",
      explanation: expect.objectContaining({ reasonCodes: expect.arrayContaining(["TOPIC_AFFINITY", "PROVENANCE_VERIFIED"]) }),
    }));
  });

  it("does not render dismissed items and preserves an explicit explanation", () => {
    const session = buildNuruDiscoverSession(catalog, { dismissedItemIds: ["K-1"] });
    expect(session.recommendations.map((entry) => entry.item.id)).not.toContain("K-1");
    expect(session.recommendations[0]?.explanation.rankingVersion).toBe("discover-deterministic-v1");
  });

  it("reports preferences without catalog coverage instead of inferring a match", () => {
    const session = buildNuruDiscoverSession(catalog, { preferredTopics: ["gardening", "systems"] });
    expect(session.coverage).toEqual({
      matchedTopics: [{ topic: "systems", itemCount: 2 }],
      unmatchedTopics: ["gardening"],
    });
  });

  it("honors a visible negative Taste Map signal by excluding matching topics", () => {
    const session = buildNuruDiscoverSession(catalog, { excludedTopics: ["systems"] });
    expect(session.recommendations.map((entry) => entry.item.id)).toEqual(["K-2"]);
  });

  it("applies visible feedback dimensions with an explanation reason", () => {
    const session = buildNuruDiscoverSession(catalog, { tasteSignals: [{ concept: "Novelty", dimension: "NOVELTY", polarity: 1, confidence: 0.5 }] });
    const craft = session.recommendations.find((entry) => entry.item.id === "K-2");
    expect(craft?.score).toBe(85);
    expect(craft?.explanation.reasonCodes).toContain("NOVELTY_FEEDBACK");
  });
});
