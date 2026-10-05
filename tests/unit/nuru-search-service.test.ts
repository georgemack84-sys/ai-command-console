import { describe, expect, it } from "vitest";
import { buildNuruSearchWhere, nuruSearchSchema } from "@/src/server/services/nuru-search-service";

describe("Nuru Search Service", () => {
  it("builds deterministic keyword, project, type, metadata, and date filters", () => {
    const search = nuruSearchSchema.parse({ query: "agent architecture", project: "Nuru", type: "Architecture Decision", metadata: { phase: "V1" }, createdAfter: "2026-01-01", limit: 20 });
    expect(buildNuruSearchWhere(search)).toEqual(expect.objectContaining({ AND: expect.arrayContaining([expect.objectContaining({ project: "Nuru" }), expect.objectContaining({ contentType: "Architecture Decision" })]) }));
  });

  it("constrains relationship traversal to explicit candidate ids", () => {
    const search = nuruSearchSchema.parse({ relationshipFrom: "K-102" });
    expect(buildNuruSearchWhere(search, ["K-147", "K-231"])).toEqual(expect.objectContaining({ AND: expect.arrayContaining([expect.objectContaining({ id: { in: ["K-147", "K-231"] } })]) }));
  });
});
