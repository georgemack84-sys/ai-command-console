import { describe, expect, it } from "vitest";
import { archiveItemSchema, archiveRelationshipTypes } from "@/src/server/services/nuru-archive-service";

describe("Nuru Archive Service contracts", () => {
  it("requires provenance before durable storage", () => {
    expect(archiveItemSchema.safeParse({ title: "Architecture", content: "Services enforce.", contentType: "Architecture Decision", confidence: 0.9 }).success).toBe(false);
  });

  it("supports explicit historical relationship vocabulary", () => {
    expect(archiveRelationshipTypes).toEqual(expect.arrayContaining(["SUPERSEDES", "DERIVED_FROM", "RELATED_TO", "EXPANDS", "CONTRADICTS", "REFERENCES"]));
  });
});
