import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruGraphService, type GraphRelationship } from "@/src/server/services/nuru-graph-service";

/** Controlled submission/query tools for agents. This service owns persistence access. */
export const NuruAgentRecordService = {
  submitDiscovery: (data: unknown) => nuruKnowledgeRepository.nuruDiscoveryCandidate.create({ data }),
  submitContext: (data: unknown) => nuruKnowledgeRepository.nuruContextAssessment.create({ data }),
  submitQuality: (data: unknown) => nuruKnowledgeRepository.nuruQualityAssessment.create({ data }),
  submitConnections: (data: unknown) => NuruGraphService.proposeBatch((Array.isArray(data) ? data : [data]) as GraphRelationship[], crypto.randomUUID()),
  relationshipHistory: async (itemId: string) => (await NuruGraphService.history(itemId)).edges,
};
