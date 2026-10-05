import { describe, expect, it } from "vitest";
import { buildNuruDiscoverEdition } from "@/src/server/services/nuru-discover-edition-service";

const catalog = [
  { id: "c1", knowledgeItemId: "K-1", title: "First", summary: "First", contentType: "Principle", project: "Nuru", topics: [], confidence: 0.91, source: { sourceType: "HUMAN_INPUT", origin: "owner", authority: "OWNER" }, provenanceAvailable: true },
  { id: "c2", knowledgeItemId: "K-2", title: "Second", summary: "Second", contentType: "Principle", project: "Nuru", topics: [], confidence: 0.87, source: { sourceType: "HUMAN_INPUT", origin: "owner", authority: "OWNER" }, provenanceAvailable: true },
];

describe("Nuru Discover edition service", () => {
  it("creates a deterministic edition from admitted catalog inputs", () => {
    const edition = buildNuruDiscoverEdition(catalog, [], "2026-09-16");
    expect(edition.editionVersion).toBe("discover-edition-deterministic-v1");
    expect(edition.featured).toEqual(expect.objectContaining({ knowledgeItemId: expect.any(String) }));
    expect(edition.supporting).toHaveLength(1);
    expect(edition.rationale).toContain("human-admitted catalog");
  });

  it("fails closed for an empty catalog", () => {
    expect(buildNuruDiscoverEdition([], [], "2026-09-16").featured).toBeNull();
  });
});
