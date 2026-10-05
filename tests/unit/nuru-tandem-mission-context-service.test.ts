import { describe, expect, it, vi } from "vitest";
import { NuruTandemMissionContextService } from "@/src/server/services/nuru-tandem-mission-context-service";
import type { TandemKnowledgePackage } from "@/src/tandem/nuru-knowledge-contracts";

const packageFixture: TandemKnowledgePackage = { packageId: "pkg-1", authority: "NURU", authorityVersion: "NURU_TANDEM_V1", requestId: "req-1", missionId: "mission-1", subject: "NVIDIA", resolvedEntity: { query: "NVDA", status: "RESOLVED", canonicalId: "entity-nvda", canonicalName: "NVIDIA", entityType: "COMPANY", confidence: 1, candidates: [{ id: "entity-nvda", name: "NVIDIA", entityType: "COMPANY" }] }, retrievedAt: "2026-09-24T00:00:00.000Z", freshnessRequirement: "CURRENT", knowledge: [], temporalClaims: [], uncertainties: [], openQuestions: [], writePolicy: "READ_ONLY_NO_CANONICAL_WRITE" };

describe("Nuru Tandem mission context", () => {
  it("stores an immutable package snapshot without a canonical knowledge effect", async () => {
    const create = vi.fn(async (value) => value); const service = new NuruTandemMissionContextService({ create, list: vi.fn() });
    const result = await service.attach(packageFixture, { workspaceId: "ws-1", missionId: "mission-1", attachedBy: "human:1" });
    expect(result).toMatchObject({ immutable: true, canonicalKnowledgeEffect: "NONE", package: { packageId: "pkg-1" } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ missionId: "mission-1", knowledgePackage: packageFixture }));
  });

  it("rejects attaching a package to a different mission", async () => {
    const service = new NuruTandemMissionContextService({ create: vi.fn(), list: vi.fn() });
    await expect(service.attach(packageFixture, { workspaceId: "ws-1", missionId: "mission-other", attachedBy: "human:1" })).rejects.toThrow("own mission");
  });
});
