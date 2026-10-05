import { z } from "zod";
import { qualityAgentOutputSchema, qualityStatuses, sourceSchema, type QualityIssue } from "@/src/nuru/domain";
import { confidenceBand } from "@/src/nuru/confidence";
import { NuruAgentRuntime, nuruAgentDefinitions } from "@/src/server/services/nuru-agent-runtime";

export const qualityAgentInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), source: sourceSchema, contextAccurate: z.boolean(), proposedRelationships: z.array(z.object({ evidence: z.string(), relationshipType: z.string() })).default([]), confidence: z.number().min(0).max(1), correlationId: z.string().min(1) });
export type QualityAgentInput = z.infer<typeof qualityAgentInputSchema>;
const runtime = new NuruAgentRuntime(nuruAgentDefinitions, [
  { name: "get_item", resource: "knowledge", action: "READ", description: "Read candidate evidence." },
  { name: "get_metadata", resource: "metadata", action: "READ", description: "Read normalized context metadata." },
  { name: "search_knowledge", resource: "knowledge", action: "SEARCH", description: "Check for duplicate or conflicting knowledge." },
  { name: "detect_duplicates", resource: "knowledge", action: "SEARCH", description: "Use standardized duplicate evidence." },
  { name: "detect_contradictions", resource: "knowledge", action: "SEARCH", description: "Find competing architecture claims." },
  { name: "search_knowledge", resource: "knowledge", action: "SEARCH", description: "Check for duplicate or conflicting knowledge." },
  { name: "submit_quality_assessment", resource: "proposals", action: "PROPOSE", description: "Submit quality evidence." },
]);

export const NuruQualityAgent = {
  async assess(rawInput: QualityAgentInput) {
    const input = qualityAgentInputSchema.parse(rawInput);
    return runtime.run("nuru.quality.v1", { objective: "Critically evaluate the candidate and its proposed relationships.", context: { itemId: input.itemId }, tokenBudget: 3_000, timeBudgetMs: 15_000, correlationId: input.correlationId }, async (run) => {
      const matches = await run.invokeTool("search_knowledge", { query: input.title, limit: 10 }) as Array<{ id: string; title: string }>;
      const duplicate = await run.invokeTool("detect_duplicates", { itemId: input.itemId, title: input.title, content: input.content, limit: 10 }) as { result: string; matchedItemId?: string };
      const contradictions = await run.invokeTool("detect_contradictions", { itemId: input.itemId, title: input.title, content: input.content, limit: 10 }) as Array<{ relatedItemId: string }>;
      const exactDuplicate = ["EXACT_DUPLICATE", "SEMANTIC_DUPLICATE", "POSSIBLE_DUPLICATE"].includes(duplicate.result);
      const sourceKnown = Boolean(input.source.origin); const provenanceAvailable = Boolean(input.source.sourceType && input.source.authority);
      const conflictDetected = /\bcontradict|conflict/i.test(input.content) || input.proposedRelationships.some((relationship) => relationship.relationshipType === "CONTRADICTS") || contradictions.length > 0;
      const relationshipsJustified = input.proposedRelationships.every((relationship) => relationship.evidence.trim().length >= 12);
      const warnings = [!sourceKnown ? "Source origin is unknown." : null, !provenanceAvailable ? "Provenance is incomplete." : null, exactDuplicate ? "Potential duplicate canonical knowledge found." : null, !input.contextAccurate ? "Context assessment requires review." : null, !relationshipsJustified ? "One or more relationship proposals lack sufficient evidence." : null].filter(Boolean) as string[];
      const evidenceSufficient = sourceKnown && provenanceAvailable && input.contextAccurate && relationshipsJustified;
      const status: (typeof qualityStatuses)[number] = conflictDetected ? "CONFLICT" : !evidenceSufficient ? "NEEDS_REVIEW" : exactDuplicate ? "PASS_WITH_WARNINGS" : input.confidence < 0.4 ? "INSUFFICIENT_EVIDENCE" : "PASS";
      const assessment = { itemId: input.itemId, status, sourceKnown, provenanceAvailable, duplicateState: exactDuplicate ? "POSSIBLE_DUPLICATE" : "NOT_DUPLICATE", conflictDetected, contextAccurate: input.contextAccurate, relationshipsJustified, evidenceSufficient, confidence: Math.min(input.confidence, evidenceSufficient ? 0.95 : 0.69), warnings };
      await run.invokeTool("submit_quality_assessment", assessment);
      const issues: QualityIssue[] = [];
      if (exactDuplicate) issues.push({ type: "POSSIBLE_DUPLICATE", relatedItem: duplicate.matchedItemId ?? matches.find((match) => match.title.toLowerCase() === input.title.toLowerCase() && match.id !== input.itemId)?.id, severity: "LOW" });
      if (!sourceKnown) issues.push({ type: "UNKNOWN_SOURCE", severity: "MEDIUM" });
      if (!provenanceAvailable) issues.push({ type: "MISSING_PROVENANCE", severity: "MEDIUM" });
      if (!input.contextAccurate) issues.push({ type: "CONTEXT_REVIEW", severity: "MEDIUM" });
      if (!relationshipsJustified) issues.push({ type: "INSUFFICIENT_RELATIONSHIP_EVIDENCE", severity: "MEDIUM" });
      if (conflictDetected) issues.push({ type: "CONFLICT", severity: "HIGH" });
      return { ...assessment, result: status, issues, confidenceBand: confidenceBand(assessment.confidence), reasoningSummary: `Quality assessment evaluated source, provenance, duplicate signals, contradiction candidates, context, and relationship evidence.` };
    }, qualityAgentOutputSchema);
  },
};
