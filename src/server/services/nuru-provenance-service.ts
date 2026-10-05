import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const provenanceStages = ["SOURCE", "DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATION_PROPOSAL", "HUMAN_APPROVAL", "KNOWLEDGE_ITEM"] as const;
export const provenanceStepSchema = z.object({ stage: z.enum(provenanceStages), referenceId: z.string().min(1), actor: z.string().min(1), details: z.record(z.string(), z.unknown()).default({}) });
export const provenanceChainSchema = z.array(provenanceStepSchema).max(20).default([]);
export type ProvenanceStep = z.infer<typeof provenanceStepSchema>;

/** Append-only lineage ledger. It records references; it never reinterprets an agent judgment as canonical fact. */
export const NuruProvenanceService = {
  async record(knowledgeItemId: string, source: ProvenanceStep, rawSteps: ProvenanceStep[], correlationId: string) {
    const steps = [source, ...provenanceChainSchema.parse(rawSteps), { stage: "KNOWLEDGE_ITEM" as const, referenceId: knowledgeItemId, actor: "nuru.archive.v1", details: {} }];
    await nuruKnowledgeRepository.nuruProvenanceLink.createMany({ data: steps.map((step, sequence) => ({ knowledgeItemId, sequence, stage: step.stage, referenceId: step.referenceId, actor: step.actor, details: step.details })) });
    await NuruAuditService.record({ operation: "PROVENANCE_RECORDED", actor: "nuru.archive.v1", resourceId: knowledgeItemId, inputReference: source.referenceId, outputReference: knowledgeItemId, decision: "LINEAGE_RECORDED", reason: `Recorded ${steps.length} ordered provenance links.`, correlationId });
    return steps;
  },

  async chain(knowledgeItemId: string) {
    return nuruKnowledgeRepository.nuruProvenanceLink.findMany({ where: { knowledgeItemId }, orderBy: { sequence: "asc" } });
  },
};
