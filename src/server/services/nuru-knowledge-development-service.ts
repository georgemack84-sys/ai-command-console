import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

const authority = ["LOW", "MODERATE", "HIGH", "OWNER"] as const;
const verification = ["UNVERIFIED", "CORROBORATING", "VERIFIED", "DISPUTED", "RETRACTED"] as const;

export const knowledgeDevelopmentInputSchema = z.object({
  subjectId: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  eventTime: z.coerce.date(),
  publicationTime: z.coerce.date().optional(),
  discoveryTime: z.coerce.date().optional(),
  summary: z.string().min(1).max(4_000),
  claims: z.array(z.object({ text: z.string().min(1).max(4_000), claimCandidateId: z.string().min(1).optional() })).min(1).max(50),
  evidence: z.array(z.object({ referenceId: z.string().min(1), kind: z.string().min(1).max(100), detail: z.string().min(1).max(2_000) })).min(1).max(100),
  entities: z.array(z.string().min(1).max(200)).max(100).default([]),
  sourceAuthority: z.enum(authority),
  verificationState: z.enum(verification),
  provenance: z.object({ sourceRegistryId: z.string().min(1).optional(), sourceChangeEventId: z.string().min(1).optional(), headlineFlowEventId: z.string().min(1).optional(), normalizedDocumentIds: z.array(z.string().min(1)).max(100).default([]) }).refine((value) => Boolean(value.sourceRegistryId || value.sourceChangeEventId || value.headlineFlowEventId || value.normalizedDocumentIds.length), "A development requires source provenance."),
});

export type KnowledgeDevelopmentInput = z.infer<typeof knowledgeDevelopmentInputSchema>;

/** Records evidence about how knowledge evolved. This service cannot create or update canonical knowledge. */
export const NuruKnowledgeDevelopmentService = {
  async record(rawInput: z.input<typeof knowledgeDevelopmentInputSchema>, context: { workspaceId: string; actor: string; correlationId: string }) {
    const input = knowledgeDevelopmentInputSchema.parse(rawInput);
    const development = await nuruKnowledgeRepository.nuruKnowledgeDevelopment.create({ data: {
      id: `NURU-DEV-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
      workspaceId: context.workspaceId,
      subjectId: input.subjectId,
      type: input.type,
      eventTime: input.eventTime,
      publicationTime: input.publicationTime,
      discoveryTime: input.discoveryTime ?? new Date(),
      summary: input.summary,
      claims: input.claims,
      evidence: input.evidence,
      entities: input.entities,
      sourceAuthority: input.sourceAuthority,
      verificationState: input.verificationState,
      provenance: input.provenance,
      createdBy: context.actor,
      correlationId: context.correlationId,
    } }) as { id: string };
    await NuruAuditService.record({ operation: "KNOWLEDGE_DEVELOPMENT_RECORDED", actor: context.actor, resourceId: development.id, inputReference: input.subjectId, decision: "EVIDENCE_RECORDED", reason: "Development recorded for curation and review; canonical knowledge was not changed.", correlationId: context.correlationId });
    return development;
  },

  async timeline(workspaceId: string, subjectId: string) {
    return nuruKnowledgeRepository.nuruKnowledgeDevelopment.findMany({ where: { workspaceId, subjectId }, orderBy: [{ eventTime: "asc" }, { createdAt: "asc" }], take: 500 });
  },
};
