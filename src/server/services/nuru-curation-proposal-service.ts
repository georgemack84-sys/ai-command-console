import { z } from "zod";
import { curationProposalSchema, recommendations, type CurationProposal } from "@/src/nuru/domain";

export const curationProposalInputSchema = z.object({
  itemId: z.string().min(1), classification: z.string().min(1), project: z.string().optional(),
  recommendation: z.enum(recommendations), relationships: z.array(z.object({ targetItemId: z.string(), relationshipType: z.string(), confidence: z.number().min(0).max(1), evidence: z.string(), proposedBy: z.string(), status: z.enum(["PROPOSED", "APPROVED", "REJECTED"]) })).default([]),
  qualityStatus: z.string().min(1), confidence: z.number().min(0).max(1), evidence: z.array(z.string()).min(1), reasoningSummary: z.string().min(1), warnings: z.array(z.string()).default([]), correlationId: z.string().min(1),
});
export type CurationProposalInput = z.infer<typeof curationProposalInputSchema>;

/** Creates a validated proposal artifact. Persistence and authorization remain separate governance concerns. */
export function buildCurationProposal(rawInput: CurationProposalInput): CurationProposal {
  const input = curationProposalInputSchema.parse(rawInput);
  return curationProposalSchema.parse({
    id: `proposal-${crypto.randomUUID()}`, itemId: input.itemId, recommendation: input.recommendation, classification: input.classification,
    project: input.project, relationships: input.relationships.map((relationship) => ({ ...relationship, sourceItemId: input.itemId, relationshipType: relationship.relationshipType })),
    qualityStatus: input.qualityStatus, confidence: input.confidence, evidence: input.evidence, reasoningSummary: input.reasoningSummary,
    warnings: input.warnings, requiredReview: true, createdBy: "nuru.curator.v1", createdAt: new Date().toISOString(),
  });
}
