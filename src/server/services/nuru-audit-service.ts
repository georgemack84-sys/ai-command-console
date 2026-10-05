import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export const nuruAuditOperationSchema = z.enum(["AGENT_RUN_STARTED", "AGENT_DISPATCHED", "AGENT_RESULT_RECEIVED", "TOOL_INVOKED", "SOURCE_REGISTERED", "NSI_SOURCE_REGISTERED", "NSI_SOURCE_REVIEWED", "NSI_RAW_ARTIFACT_STORED", "NSI_DOCUMENT_EXTRACTED", "NSI_EXTRACTION_DEFERRED", "NSI_CLAIM_CANDIDATES_GENERATED", "NSI_CLAIM_REVIEWED", "NSI_SOURCE_CLASSIFIED", "PROVENANCE_RECORDED", "KNOWLEDGE_DEVELOPMENT_RECORDED", "TEMPORAL_CLAIM_RECORDED", "KNOWLEDGE_CORRECTION_PROPOSED", "KNOWLEDGE_CORRECTION_REVIEWED", "RELATIONSHIP_PROPOSED", "RELATIONSHIP_APPROVED", "RELATIONSHIP_REJECTED", "RELATIONSHIP_REVIEWED", "SUPERSESSION_REVIEWED", "QUEUE_UPDATED", "DISCOVERY_CREATED", "CONTEXT_PROPOSED", "CONNECTION_PROPOSED", "QUALITY_FLAGGED", "CURATION_PROPOSED", "CURATION_APPROVED", "CURATION_REJECTED", "KNOWLEDGE_ARCHIVED", "KNOWLEDGE_SUPERSEDED", "KNOWLEDGE_RESTORED", "CATALOG_ADMITTED", "CATALOG_WITHDRAWN"]);
export const nuruAuditInputSchema = z.object({ operation: nuruAuditOperationSchema, actor: z.string().min(1), agentRunId: z.string().min(1).optional(), resourceId: z.string().min(1), inputReference: z.string().max(500).optional(), outputReference: z.string().max(500).optional(), decision: z.string().max(120).optional(), reason: z.string().max(2000).optional(), correlationId: z.string().min(1), proposalId: z.string().min(1).optional() });
export type NuruAuditInput = z.infer<typeof nuruAuditInputSchema>;

/** Append-only audit API. Consumers record facts about operations; they cannot update or delete events. */
export const NuruAuditService = {
  async record(rawEvent: NuruAuditInput) {
    const event = nuruAuditInputSchema.parse(rawEvent);
    return nuruKnowledgeRepository.nuruAuditEvent.create({ data: { proposalId: event.proposalId, eventType: event.operation, actor: event.actor, agentRunId: event.agentRunId, resourceId: event.resourceId, inputReference: event.inputReference, outputReference: event.outputReference, decision: event.decision, reason: event.reason, correlationId: event.correlationId } });
  },

  async history(resourceId: string) {
    return nuruKnowledgeRepository.nuruAuditEvent.findMany({ where: { resourceId }, orderBy: { createdAt: "asc" } });
  },
};
