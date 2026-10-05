import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export type NuruCanonicalKnowledgeCandidate = { id: string; title: string; content: string; project: string | null; status: string };

/** Narrow persistence boundary used by Nuru services; agents never receive this capability. */
export const nuruDatabaseService = {
  listKnowledgeTitles: () => nuruKnowledgeRepository.nuruKnowledgeItem.findMany({ select: { title: true }, take: 200 }),
  listCanonicalKnowledge: () => nuruKnowledgeRepository.nuruKnowledgeItem.findMany({ where: { status: { in: ["APPROVED", "ARCHIVED"] } }, select: { id: true, title: true, content: true, project: true, status: true }, take: 200 }) as unknown as Promise<NuruCanonicalKnowledgeCandidate[]>,
  transaction: nuruKnowledgeRepository.$transaction.bind(nuruKnowledgeRepository),
  listProposals: () => nuruKnowledgeRepository.nuruCurationProposal.findMany({ include: { item: true, runs: { orderBy: { createdAt: "asc" } }, auditEvents: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, take: 100 }),
};
