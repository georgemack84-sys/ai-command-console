import { describe, expect, it } from "vitest";
import { toNuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";
import type { ArchiveKnowledgeRow, NuruDiscoverCatalogEntryRow } from "@/src/server/repositories/nuru-knowledge-repository";

const source = {
  sourceType: "PROJECT_DOCUMENT",
  origin: "Nuru owner architecture brief",
  authority: "OWNER",
};

function record(overrides: Partial<ArchiveKnowledgeRow> = {}): ArchiveKnowledgeRow {
  return {
    id: "K-discover-1",
    title: "A governed knowledge principle",
    content: "Approved knowledge can be presented to people only after an explicit Discover admission decision.",
    contentType: "Architecture Principle",
    status: "APPROVED",
    project: "Nuru",
    source,
    metadata: { phase: "V1" },
    relationships: [],
    confidence: 0.92,
    currentVersion: 1,
    provenance: { source, submittedBy: "human-governor", transformations: [] },
    createdAt: new Date("2026-09-15T12:00:00.000Z"),
    ...overrides,
  };
}

function entry(overrides: Partial<NuruDiscoverCatalogEntryRow> = {}): NuruDiscoverCatalogEntryRow {
  return {
    id: "DC-1",
    knowledgeItemId: "K-discover-1",
    status: "ACTIVE",
    topics: ["knowledge", "governance"],
    reason: "Approved for the Discover catalog by a human governor.",
    admittedBy: "human-governor",
    createdAt: new Date("2026-09-15T12:00:00.000Z"),
    updatedAt: new Date("2026-09-15T12:00:00.000Z"),
    ...overrides,
  };
}

describe("Nuru Discover catalog service", () => {
  it("admits an explicitly discoverable, approved, provenance-backed record", () => {
    expect(toNuruDiscoverCatalogItem(record(), entry())).toEqual(expect.objectContaining({
      id: "DC-1",
      knowledgeItemId: "K-discover-1",
      project: "Nuru",
      topics: ["knowledge", "governance"],
      provenanceAvailable: true,
      source: expect.objectContaining({ authority: "OWNER" }),
    }));
  });

  it("fails closed when a catalog entry has been withdrawn", () => {
    expect(toNuruDiscoverCatalogItem(record(), entry({ status: "WITHDRAWN" }))).toBeNull();
  });

  it("excludes superseded records even when their metadata says discoverable", () => {
    expect(toNuruDiscoverCatalogItem(record({ status: "SUPERSEDED" }), entry())).toBeNull();
  });

  it("excludes missing provenance and agent-only source material", () => {
    expect(toNuruDiscoverCatalogItem(record({ provenance: {} }), entry())).toBeNull();
    expect(toNuruDiscoverCatalogItem(record({
      source: { sourceType: "AGENT_OUTPUT", origin: "agent synthesis", authority: "LOW", derivedFromSourceId: "source-1" },
      provenance: { source: { sourceType: "AGENT_OUTPUT", origin: "agent synthesis", authority: "LOW", derivedFromSourceId: "source-1" }, submittedBy: "human-governor", transformations: [] },
    }), entry())).toBeNull();
  });
});
