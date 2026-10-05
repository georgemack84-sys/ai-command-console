import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() }, nuruQualityAssessment: { create: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
vi.mock("@/src/server/services/nuru-search-service", () => ({ NuruSearchService: { search: vi.fn(async () => [{ id: "K-101", title: "Existing Boundary" }]) } }));
vi.mock("@/src/server/services/nuru-duplicate-service", () => ({ nuruDuplicateService: { assess: vi.fn(async () => ({ result: "NOT_DUPLICATE" })) } }));
vi.mock("@/src/server/services/nuru-contradiction-service", () => ({ NuruContradictionService: { assess: vi.fn(async () => []) } }));
import { NuruQualityAgent } from "@/src/server/services/nuru-quality-agent";

describe("Nuru Quality Agent", () => {
  it("flags conflict as evidence for review, not an autonomous veto", async () => {
    const result = await NuruQualityAgent.assess({ itemId: "K-202", title: "New Boundary", content: "This conflicts with an earlier canonical policy.", source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, contextAccurate: true, proposedRelationships: [{ relationshipType: "CONTRADICTS", evidence: "The two policies specify incompatible archive authority." }], confidence: 0.95, correlationId: "corr-quality" });
    expect(result).toMatchObject({ status: "success", result: { status: "CONFLICT", conflictDetected: true, evidenceSufficient: true } });
  });
});
