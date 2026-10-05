import { describe, expect, it, vi } from "vitest";
import { NuruTandemMissionContextService } from "@/src/server/services/nuru-tandem-mission-context-service";
import { NuruTandemMissionReplayService } from "@/src/server/services/nuru-tandem-mission-replay-service";

describe("Nuru Tandem governance qualification", () => {
  it("replays only immutable, non-canonical mission context", async () => {
    const stored: any[] = [];
    const context = new NuruTandemMissionContextService({
      create: vi.fn(async (value) => { stored.push(value); return value; }),
      list: vi.fn(async () => stored),
    });
    await context.attach({ packageId: "pkg", authority: "NURU", authorityVersion: "NURU_TANDEM_V1", requestId: "r", missionId: "m", subject: "N", resolvedEntity: { query: "N", status: "RESOLVED", canonicalId: "e", canonicalName: "N", entityType: "TOPIC", confidence: 1, candidates: [] }, retrievedAt: "2026-01-01T00:00:00.000Z", freshnessRequirement: "HISTORICAL", knowledge: [], temporalClaims: [], uncertainties: [], openQuestions: [], writePolicy: "READ_ONLY_NO_CANONICAL_WRITE" }, { workspaceId: "ws", missionId: "m", attachedBy: "human:1" });
    const replay = await new NuruTandemMissionReplayService({ list: (workspaceId, missionId) => context.list(workspaceId, missionId) }).replay({ missionId: "m", asOf: "2030-01-01" }, "ws");
    expect(replay.knowledgePackages[0].canonicalKnowledgeEffect).toBe("NONE");
  });
});
