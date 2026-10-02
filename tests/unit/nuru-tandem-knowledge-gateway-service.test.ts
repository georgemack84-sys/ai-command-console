import { describe, expect, it } from "vitest";
import { NuruTandemKnowledgeGatewayService, type NuruTandemKnowledgeSource } from "@/src/server/services/nuru-tandem-knowledge-gateway-service";

const source: NuruTandemKnowledgeSource = {
  resolveEntity: async (subject) => ({ query: subject, status: "RESOLVED", canonicalId: "entity-ocean", canonicalName: "Ocean", entityType: "TOPIC", confidence: 1, candidates: [{ id: "entity-ocean", name: "Ocean", entityType: "TOPIC" }] }),
  findApproved: async () => [
    { id: "K-1", title: "Ocean mapping", content: "Approved finding", contentType: "Research", status: "APPROVED", confidence: 0.9, createdAt: new Date("2026-01-02T00:00:00.000Z"), source: { sourceType: "WEB_SOURCE", origin: "NOAA", uri: "https://example.com/noaa", authority: "HIGH" } },
    { id: "K-2", title: "Untraceable", content: "Must not leave Nuru", contentType: "Research", status: "APPROVED", confidence: 0.8, createdAt: new Date("2026-01-02T00:00:00.000Z"), source: { sourceType: "WEB_SOURCE", origin: "Unknown", authority: "LOW" } },
  ],
  provenanceFor: async (id) => id === "K-1" ? [{ stage: "SOURCE", referenceId: "S-1", actor: "human.owner", createdAt: new Date("2026-01-02T00:00:00.000Z") }] : [],
  timeline: async () => [
    { id: "C-1", subjectId: "ocean", predicate: "status", value: "mapped", normalizedValue: "mapped", state: "VERIFIED", effectiveFrom: new Date("2026-01-01T00:00:00.000Z"), effectiveTo: null, assertedAt: new Date("2026-01-02T00:00:00.000Z"), observedAt: new Date("2026-01-02T00:00:00.000Z"), evidence: [{ referenceId: "S-1", detail: "Primary record" }] },
    { id: "C-2", subjectId: "ocean", predicate: "status", value: "future", normalizedValue: "future", state: "VERIFIED", effectiveFrom: new Date("2027-01-01T00:00:00.000Z"), effectiveTo: null, assertedAt: new Date("2026-01-02T00:00:00.000Z"), observedAt: new Date("2026-01-02T00:00:00.000Z"), evidence: [{ referenceId: "S-2", detail: "Primary record" }] },
  ],
};

const request = { requestId: "req-1", missionId: "mission-1", participantId: "tandem", participantType: "KNOWLEDGE_AUTHORITY" as const, subject: "ocean", requestedContext: ["RESEARCH" as const], provenanceRequired: true as const, maxResults: 5 };

describe("Nuru Tandem knowledge gateway", () => {
  it("returns only approved knowledge with an ordered provenance chain and a read-only policy", async () => {
    const result = await new NuruTandemKnowledgeGatewayService(source).retrieve({ ...request, asOf: "2026-06-01" }, { workspaceId: "ws-1" });
    expect(result.knowledge.map((item) => item.id)).toEqual(["K-1"]);
    expect(result.knowledge[0].provenance[0]).toMatchObject({ stage: "SOURCE", referenceId: "S-1" });
    expect(result.temporalClaims.map((claim) => claim.id)).toEqual(["C-1"]);
    expect(result.writePolicy).toBe("READ_ONLY_NO_CANONICAL_WRITE");
    expect(result.uncertainties[0]).toContain("withheld");
  });

  it("rejects Tandem requests that would waive provenance", async () => {
    await expect(new NuruTandemKnowledgeGatewayService(source).retrieve({ ...request, provenanceRequired: false } as never, { workspaceId: "ws-1" })).rejects.toThrow();
  });

  it("does not retrieve knowledge when an entity cannot be safely resolved", async () => {
    const unresolved: NuruTandemKnowledgeSource = { ...source, resolveEntity: async (query) => ({ query, status: "AMBIGUOUS", canonicalId: null, canonicalName: null, entityType: null, confidence: 0, candidates: [{ id: "one", name: "Ocean One", entityType: "TOPIC" }, { id: "two", name: "Ocean Two", entityType: "TOPIC" }] }) };
    const result = await new NuruTandemKnowledgeGatewayService(unresolved).retrieve(request, { workspaceId: "ws-1" });
    expect(result.knowledge).toEqual([]);
    expect(result.openQuestions[0]).toContain("ambiguous");
  });
});
