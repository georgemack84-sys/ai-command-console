import { z } from "zod";
import { curatorInputSchema, NuruCuratorAgent } from "@/src/server/services/nuru-curator-agent";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

const replayRequestSchema = z.object({ originalRunId: z.string().min(1), modelVersion: z.string().min(1), promptVersion: z.string().min(1), policyVersion: z.string().min(1) });
type ReplayRun = { id: string; agentType: string; model: string; promptVersion: string; policyVersion: string; inputContext: unknown; result: unknown };
const runs = nuruKnowledgeRepository.nuruAgentRun as unknown as { findUnique(args: unknown): Promise<ReplayRun | null> };

function recommendation(result: unknown) { return (result as { proposal?: { recommendation?: string } } | null)?.proposal?.recommendation ?? null; }

/** Replays captured Curator input under a candidate version set; it never overwrites the original run. */
export const NuruCurationReplayService = {
  async replay(rawRequest: z.input<typeof replayRequestSchema>) {
    const request = replayRequestSchema.parse(rawRequest);
    const original = await runs.findUnique({ where: { id: request.originalRunId } });
    if (!original || original.agentType !== "CURATOR") throw new Error("A captured Curator run is required for replay.");
    const context = original.inputContext as { curationInput?: unknown };
    const originalInput = curatorInputSchema.parse(context.curationInput);
    const replayed = await NuruCuratorAgent.curate({ ...originalInput, correlationId: `replay:${crypto.randomUUID()}` }, { modelVersion: request.modelVersion, promptVersion: request.promptVersion, policyVersion: request.policyVersion });
    const originalRecommendation = recommendation(original.result);
    const replayRecommendation = recommendation(replayed.result);
    return { original: { runId: original.id, modelVersion: original.model, promptVersion: original.promptVersion, policyVersion: original.policyVersion, recommendation: originalRecommendation }, replay: { modelVersion: request.modelVersion, promptVersion: request.promptVersion, policyVersion: request.policyVersion, runId: replayed.runId, recommendation: replayRecommendation }, comparison: { changed: originalRecommendation !== replayRecommendation, originalRecommendation, replayRecommendation } };
  },
};
