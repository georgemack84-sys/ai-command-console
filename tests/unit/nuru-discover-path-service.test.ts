import { describe, expect, it } from "vitest";
import { buildNuruDiscoverPaths } from "@/src/server/services/nuru-discover-path-service";

const catalog = [
  { id: "c1", knowledgeItemId: "K-1", title: "First", summary: "First record", contentType: "Principle", project: "Nuru", topics: [], confidence: 0.9, source: { sourceType: "HUMAN_INPUT", origin: "owner", authority: "OWNER" }, provenanceAvailable: true },
  { id: "c2", knowledgeItemId: "K-2", title: "Second", summary: "Second record", contentType: "Principle", project: "Nuru", topics: [], confidence: 0.9, source: { sourceType: "HUMAN_INPUT", origin: "owner", authority: "OWNER" }, provenanceAvailable: true },
];

describe("Nuru Discover path service", () => {
  it("uses only approved edges between active catalog entries", () => {
    expect(buildNuruDiscoverPaths(catalog, [
      { sourceItemId: "K-1", targetItemId: "K-2", relationshipType: "RELATED_TO", confidence: 0.9, status: "APPROVED" },
      { sourceItemId: "K-1", targetItemId: "K-3", relationshipType: "RELATED_TO", confidence: 0.9, status: "APPROVED" },
      { sourceItemId: "K-2", targetItemId: "K-1", relationshipType: "RELATED_TO", confidence: 0.9, status: "PROPOSED" },
    ])).toEqual([expect.objectContaining({ relationship: expect.objectContaining({ type: "RELATED_TO", evidence: "HUMAN_APPROVED" }), steps: [expect.objectContaining({ title: "First" }), expect.objectContaining({ title: "Second" })] })]);
  });
});
