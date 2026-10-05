import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), curate: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { findUnique: mocks.findUnique } } }));
vi.mock("@/src/server/services/nuru-curator-agent", async () => { const { z } = await import("zod"); return { curatorInputSchema: z.object({ title: z.string(), content: z.string(), project: z.string().optional(), source: z.object({ sourceType: z.string(), origin: z.string(), authority: z.string() }), correlationId: z.string() }), NuruCuratorAgent: { curate: mocks.curate } }; });
import { NuruCurationReplayService } from "@/src/server/services/nuru-curation-replay-service";
describe("Nuru curation replay", () => {
  it("reruns captured Curator input and compares recommendations without changing the original", async () => {
    mocks.findUnique.mockResolvedValue({ id: "RUN-441", agentType: "CURATOR", model: "model-a", promptVersion: "3", policyVersion: "7", inputContext: { curationInput: { title: "Architecture", content: "A sufficiently long architecture decision.", source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, correlationId: "original" } }, result: { proposal: { recommendation: "MERGE" } } });
    mocks.curate.mockResolvedValue({ runId: "RUN-442", result: { proposal: { recommendation: "SUPERSEDE" } } });
    const replay = await NuruCurationReplayService.replay({ originalRunId: "RUN-441", modelVersion: "model-b", promptVersion: "4", policyVersion: "8" });
    expect(replay.comparison).toMatchObject({ changed: true, originalRecommendation: "MERGE", replayRecommendation: "SUPERSEDE" });
  });
});
