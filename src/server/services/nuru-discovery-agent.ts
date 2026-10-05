import { z } from "zod";
import { discoveryAgentOutputSchema, sourceSchema, type DiscoveryCandidate } from "@/src/nuru/domain";
import { confidenceBand } from "@/src/nuru/confidence";
import { NuruAgentRuntime, nuruAgentDefinitions } from "@/src/server/services/nuru-agent-runtime";

export const discoveryInputSchema = z.object({ title: z.string().trim().min(3).max(180), content: z.string().trim().min(20).max(12_000), source: sourceSchema, context: z.record(z.string(), z.unknown()).default({}), correlationId: z.string().min(1) });
export type DiscoveryInput = z.infer<typeof discoveryInputSchema>;

const runtime = new NuruAgentRuntime(nuruAgentDefinitions, [
  { name: "search_knowledge", resource: "knowledge", action: "SEARCH", description: "Retrieve existing knowledge candidates." },
  { name: "submit_discovery", resource: "knowledge", action: "DISCOVER", description: "Submit a candidate for later curation." },
]);

function classify(content: string) {
  const normalized = content.toLowerCase();
  if (/(architecture|service|agent|governance)/.test(normalized)) return "Architecture Decision";
  if (/(research|study|evidence|analysis)/.test(normalized)) return "Research Finding";
  return "Knowledge Note";
}

/** Discovery proposes candidates only. It cannot archive or mutate canonical knowledge. */
export const NuruDiscoveryAgent = {
  async discover(rawInput: DiscoveryInput) {
    const input = discoveryInputSchema.parse(rawInput);
    return runtime.run("nuru.discovery.v1", { objective: "Identify information that may deserve Nuru curation.", context: { ...input.context, title: input.title }, tokenBudget: 2_000, timeBudgetMs: 10_000, correlationId: input.correlationId }, async (run) => {
      const initialType = classify(input.content);
      const confidence = input.source.authority === "OWNER" ? 0.92 : input.source.authority === "HIGH" ? 0.82 : 0.65;
      const candidate: Omit<DiscoveryCandidate, "id"> = { item: { title: input.title, content: input.content }, source: input.source, reasonDiscovered: `Candidate submitted from ${input.source.origin} for initial Nuru assessment.`, initialType, relevanceScore: Math.round(confidence * 100), confidence, status: "CANDIDATE" };
      const record = await run.invokeTool("submit_discovery", { title: candidate.item.title, content: candidate.item.content, source: candidate.source, reasonDiscovered: candidate.reasonDiscovered, initialType, relevanceScore: candidate.relevanceScore, confidence, status: candidate.status });
      return { ...candidate, id: typeof record === "object" && record !== null && "id" in record && typeof record.id === "string" ? record.id : crypto.randomUUID(), confidenceBand: confidenceBand(confidence) };
    }, discoveryAgentOutputSchema);
  },
};
