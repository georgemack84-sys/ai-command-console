import { z } from "zod";
import { connectionAgentOutputSchema, relationshipTypes, type Connection } from "@/src/nuru/domain";
import { confidenceBand } from "@/src/nuru/confidence";
import { NuruAgentRuntime, nuruAgentDefinitions } from "@/src/server/services/nuru-agent-runtime";

export const connectionAgentInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), relatedProjects: z.array(z.string()).default([]), correlationId: z.string().min(1), limit: z.number().int().min(1).max(20).default(10) });
export type ConnectionAgentInput = z.infer<typeof connectionAgentInputSchema>;
const runtime = new NuruAgentRuntime(nuruAgentDefinitions, [
  { name: "search_knowledge", resource: "knowledge", action: "SEARCH", description: "Find keyword and metadata candidates." },
  { name: "detect_duplicates", resource: "knowledge", action: "SEARCH", description: "Assess exact, near, and semantic duplicates." },
  { name: "find_cross_project_connections", resource: "knowledge", action: "SEARCH", description: "Find related knowledge outside the primary project." },
  { name: "find_similar", resource: "embeddings", action: "SEARCH", description: "Find semantic candidates." },
  { name: "find_relationships", resource: "relationships", action: "READ", description: "Read recorded relationship history." },
  { name: "get_history", resource: "archive", action: "READ", description: "Read version lineage." },
  { name: "submit_connection_proposal", resource: "relationships", action: "CONNECT", description: "Submit relationship proposals." },
]);

function relationshipFor(content: string): (typeof relationshipTypes)[number] {
  if (/\bcontradict|conflict/i.test(content)) return "CONTRADICTS";
  if (/\bsupersed|replace/i.test(content)) return "SUPERSEDES";
  if (/\bextend|expand|refine/i.test(content)) return "EXTENDS";
  return "RELATED_TO";
}

/** Connection interprets retrieval candidates; all high-impact conclusions remain proposals. */
export const NuruConnectionAgent = {
  async connect(rawInput: ConnectionAgentInput) {
    const input = connectionAgentInputSchema.parse(rawInput);
    return runtime.run("nuru.connection.v1", { objective: "Find and propose meaningful relationships for the current item.", context: { itemId: input.itemId }, tokenBudget: 3_000, timeBudgetMs: 15_000, correlationId: input.correlationId }, async (run) => {
      const [keywordCandidates, semanticCandidates, historical, duplicateAssessment, crossProjectConnections] = await Promise.all([
        run.invokeTool("search_knowledge", { query: input.title, project: input.project, limit: input.limit }) as Promise<Array<{ id: string; title: string; confidence: number }>>,
        run.invokeTool("find_similar", { itemId: input.itemId, content: input.content, limit: input.limit, threshold: 0 }) as Promise<Array<{ itemId: string; score: number }>>,
        run.invokeTool("find_relationships", { itemId: input.itemId }) as Promise<unknown[]>,
        run.invokeTool("detect_duplicates", { itemId: input.itemId, title: input.title, content: input.content, project: input.project, limit: input.limit }) as Promise<{ result: "NOT_DUPLICATE" | "EXACT_DUPLICATE" | "POSSIBLE_DUPLICATE" | "SEMANTIC_DUPLICATE" | "UPDATED_VERSION"; matchedItemId?: string; confidence: number }>,
        run.invokeTool("find_cross_project_connections", { itemId: input.itemId, title: input.title, content: input.content, primaryProject: input.project ?? "Nuru", relatedProjects: input.relatedProjects, limit: input.limit }) as Promise<Array<{ itemId: string; targetItemId: string; targetProject: string; relationshipType: "RELATED_TO"; confidence: number; evidence: string; status: "PROPOSED" }>>,
      ]);
      const candidateScores = new Map<string, { score: number; evidence: string }>();
      for (const candidate of keywordCandidates) candidateScores.set(candidate.id, { score: candidate.confidence, evidence: `Keyword and metadata retrieval matched “${candidate.title}”.` });
      for (const candidate of semanticCandidates) {
        const current = candidateScores.get(candidate.itemId);
        candidateScores.set(candidate.itemId, { score: Math.max(current?.score ?? 0, candidate.score), evidence: current?.evidence ?? "Embedding similarity identified conceptual overlap." });
      }
      const relationshipType = relationshipFor(input.content);
      const proposals: Connection[] = [...candidateScores.entries()].filter(([targetItemId]) => targetItemId !== input.itemId).slice(0, input.limit).map(([targetItemId, candidate]) => ({ itemId: input.itemId, targetItemId, relationshipType, confidence: Math.min(0.95, Math.max(0.4, candidate.score)), evidence: candidate.evidence, proposedBy: "nuru.connection.v1", status: "PROPOSED" }));
      for (const connection of crossProjectConnections) if (!proposals.some((proposal) => proposal.targetItemId === connection.targetItemId)) proposals.push({ itemId: input.itemId, targetItemId: connection.targetItemId, relationshipType: connection.relationshipType, confidence: connection.confidence, evidence: connection.evidence, proposedBy: "nuru.connection.v1", status: "PROPOSED" });
      // Discovery candidates are not canonical knowledge rows. Their relationships
      // remain in the Curator package until governance promotes the item.
      if (proposals.length && input.itemId.startsWith("K-")) for (const proposal of proposals) await run.invokeTool("submit_connection_proposal", { sourceItemId: proposal.itemId, targetItemId: proposal.targetItemId, relationshipType: proposal.relationshipType, confidence: proposal.confidence, evidence: proposal.evidence, status: "PROPOSED" });
      const confidence = proposals.length ? Math.max(...proposals.map((proposal) => proposal.confidence)) : 0.4;
      return { proposals, crossProjectConnections, duplicateAssessment, candidatesConsidered: candidateScores.size, historicalRelationships: historical.length, highImpactRequiresValidation: proposals.some((proposal) => ["SUPERSEDES", "CONTRADICTS"].includes(proposal.relationshipType)), confidence, confidenceBand: confidenceBand(confidence), reasoningSummary: "Proposals combine project-local retrieval, cross-project retrieval, semantic similarity, duplicate assessment, and recorded relationship history." };
    }, connectionAgentOutputSchema);
  },
};
