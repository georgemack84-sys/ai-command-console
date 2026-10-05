import { z } from "zod";

export const explanationInputSchema = z.object({ title: z.string(), recommendation: z.string(), classification: z.string(), confidence: z.number().min(0).max(1), reasoningSummary: z.string(), qualityStatus: z.string(), warnings: z.array(z.string()), source: z.object({ origin: z.string(), sourceType: z.string(), authority: z.string() }), context: z.object({ project: z.string().optional(), scope: z.string().optional() }), relationships: z.array(z.object({ relationshipType: z.string(), targetItemId: z.string(), evidence: z.string().optional() })), agents: z.array(z.object({ agentType: z.string(), status: z.string() })) });
export type ExplanationInput = z.infer<typeof explanationInputSchema>;

export function buildNuruExplanation(rawInput: ExplanationInput) {
  const input = explanationInputSchema.parse(rawInput);
  return { summary: { recommendation: input.recommendation, confidence: input.confidence, whyImportant: input.reasoningSummary, uncertainty: input.warnings }, layers: [
    { id: "curator", label: "Curator Recommendation", agent: "CURATOR", judgment: input.recommendation, evidence: [input.reasoningSummary] },
    { id: "quality", label: "Quality Assessment", agent: "QUALITY", judgment: input.qualityStatus, evidence: input.warnings.length ? input.warnings : ["No quality warnings reported."] },
    { id: "connection", label: "Connection Evidence", agent: "CONNECTION", judgment: `${input.relationships.length} proposed relationship(s)`, evidence: input.relationships.map((relationship) => `${relationship.relationshipType} → ${relationship.targetItemId}${relationship.evidence ? `: ${relationship.evidence}` : ""}`) },
    { id: "context", label: "Context Assessment", agent: "CONTEXT", judgment: input.classification, evidence: [`Project: ${input.context.project ?? "Unscoped"}`, `Scope: ${input.context.scope ?? "Not established"}`] },
    { id: "discovery", label: "Discovery Source", agent: "DISCOVERY", judgment: input.title, evidence: [`${input.source.sourceType} from ${input.source.origin}`, `Declared authority: ${input.source.authority}`] },
  ], agents: input.agents };
}
