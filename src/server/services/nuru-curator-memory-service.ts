import { z } from "zod";
import { curatorMemorySummarySchema } from "@/src/nuru/domain";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

const memoryRequestSchema = z.object({ project: z.string().trim().min(1).max(120), canonicalLimit: z.number().int().min(1).max(25).default(17), ruleLimit: z.number().int().min(1).max(12).default(12), conflictLimit: z.number().int().min(1).max(10).default(10), reviewLimit: z.number().int().min(1).max(10).default(5), decisionLimit: z.number().int().min(1).max(20).default(10), relationshipLimit: z.number().int().min(1).max(50).default(24) });
const memoryReferenceSchema = z.object({ id: z.string(), title: z.string(), type: z.string(), status: z.string(), confidence: z.number().min(0).max(1) });
const decisionReferenceSchema = z.object({ id: z.string(), recommendation: z.string(), status: z.string(), reason: z.string().nullable().optional() });
const reviewReferenceSchema = z.object({ id: z.string(), proposalId: z.string().nullable().optional(), lane: z.string().nullable().optional(), priority: z.number().int() });
const relationshipReferenceSchema = z.object({ sourceItemId: z.string(), targetItemId: z.string(), relationshipType: z.string(), confidence: z.number().min(0).max(1), status: z.string() });
export const curatorMemoryPacketSchema = z.object({ summary: curatorMemorySummarySchema, canonicalArchitecture: z.array(memoryReferenceSchema).max(25), projectRules: z.array(memoryReferenceSchema).max(12), activeConflicts: z.array(z.object({ itemId: z.string(), relatedItemId: z.string(), state: z.string(), confidence: z.number().min(0).max(1) })).max(10), openReviews: z.array(reviewReferenceSchema).max(10), recentDecisions: z.array(decisionReferenceSchema).max(20), relevantRelationships: z.array(relationshipReferenceSchema).max(50), curationPolicies: z.array(z.string()).max(10) });
export type CuratorMemoryPacket = z.infer<typeof curatorMemoryPacketSchema>;

type MemoryKnowledge = { id: string; title: string; contentType: string; status: string; confidence: number };
type MemoryRepository = { nuruKnowledgeItem: { findMany(args: unknown): Promise<MemoryKnowledge[]> }; nuruContradictionAssessment: { findMany(args: unknown): Promise<Array<{ itemId: string; relatedItemId: string; state: string; confidence: number }>> }; nuruCurationQueue: { findMany(args: unknown): Promise<Array<{ id: string; proposalId?: string | null; lane?: string | null; priority: number }>> }; nuruCurationProposal: { findMany(args: unknown): Promise<Array<{ id: string; recommendation: string; status: string; decisionReason?: string | null }>> }; nuruRelationship: { findMany(args: unknown): Promise<Array<{ sourceItemId: string; targetItemId: string; relationshipType: string; confidence: number; status: string }>> } };
const repository = nuruKnowledgeRepository as unknown as MemoryRepository;

/** Stable, bounded rules for every Curator run; this service is read-only and cannot change policy or canonical records. */
export const nuruCurationPolicies = ["Agent judgment is not canonical knowledge.", "A Curator may recommend but may not archive, supersede, or approve knowledge.", "Conflicts and high-impact relationships require governance and human review.", "Confidence is evidence, never authority."] as const;

function reference(item: MemoryKnowledge) { return { id: item.id, title: item.title, type: item.contentType, status: item.status, confidence: item.confidence }; }

export const NuruCuratorMemoryService = {
  async build(rawRequest: z.input<typeof memoryRequestSchema>): Promise<CuratorMemoryPacket> {
    const request = memoryRequestSchema.parse(rawRequest); const currentStatuses = ["APPROVED", "ARCHIVED"];
    const [canonicalArchitecture, projectRules, activeConflicts, openReviews, recentDecisions] = await Promise.all([
      repository.nuruKnowledgeItem.findMany({ where: { project: request.project, status: { in: currentStatuses }, contentType: { in: ["Architecture Decision", "Architectural Principle"] } }, orderBy: [{ confidence: "desc" }, { createdAt: "desc" }], take: request.canonicalLimit }),
      repository.nuruKnowledgeItem.findMany({ where: { project: request.project, status: { in: currentStatuses }, contentType: "Project Rule" }, orderBy: { createdAt: "desc" }, take: request.ruleLimit }),
      repository.nuruContradictionAssessment.findMany({ where: { state: "POTENTIAL_CONTRADICTION" }, orderBy: { createdAt: "desc" }, take: request.conflictLimit }),
      repository.nuruCurationQueue.findMany({ where: { status: "READY_FOR_REVIEW" }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: request.reviewLimit }),
      repository.nuruCurationProposal.findMany({ where: { status: { in: ["APPROVED", "REJECT", "HOLD", "REQUEST_CHANGES"] } }, orderBy: { reviewedAt: "desc" }, take: request.decisionLimit }),
    ]);
    const canonicalIds = canonicalArchitecture.map((item) => item.id);
    const relevantRelationships = canonicalIds.length ? await repository.nuruRelationship.findMany({ where: { status: "APPROVED", OR: [{ sourceItemId: { in: canonicalIds } }, { targetItemId: { in: canonicalIds } }] }, orderBy: { confidence: "desc" }, take: request.relationshipLimit }) : [];
    return curatorMemoryPacketSchema.parse({ summary: { project: request.project, canonicalPrinciples: canonicalArchitecture.length, projectRules: projectRules.length, openConflicts: activeConflicts.length, pendingReviews: openReviews.length, recentDecisions: recentDecisions.length, relevantRelationships: relevantRelationships.length, policyCount: nuruCurationPolicies.length }, canonicalArchitecture: canonicalArchitecture.map(reference), projectRules: projectRules.map(reference), activeConflicts, openReviews, recentDecisions: recentDecisions.map((decision) => ({ id: decision.id, recommendation: decision.recommendation, status: decision.status, reason: decision.decisionReason })), relevantRelationships, curationPolicies: nuruCurationPolicies });
  },

  unavailable(project: string): CuratorMemoryPacket {
    return curatorMemoryPacketSchema.parse({ summary: { project, canonicalPrinciples: 0, projectRules: 0, openConflicts: 0, pendingReviews: 0, recentDecisions: 0, relevantRelationships: 0, policyCount: nuruCurationPolicies.length, unavailable: true }, canonicalArchitecture: [], projectRules: [], activeConflicts: [], openReviews: [], recentDecisions: [], relevantRelationships: [], curationPolicies: nuruCurationPolicies });
  },
};
