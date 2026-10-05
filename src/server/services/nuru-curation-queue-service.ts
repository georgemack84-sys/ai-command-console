import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const curationQueueStatuses = ["DISCOVERED", "TRIAGED", "ANALYZING", "WAITING", "READY_FOR_REVIEW", "APPROVED", "REJECTED", "ARCHIVED", "SUPERSEDED"] as const;
export const curationQueueLanes = ["AUTO_ACCEPT_ELIGIBLE", "HUMAN_REVIEW", "CONFLICT_REVIEW", "INSUFFICIENT_EVIDENCE"] as const;
export const curationQueueItemSchema = z.object({ candidateId: z.string().min(1).optional(), itemId: z.string().min(1).optional(), proposalId: z.string().min(1).optional(), status: z.enum(curationQueueStatuses).default("DISCOVERED"), lane: z.enum(curationQueueLanes).optional(), priority: z.number().int().min(0).max(100).default(50), reason: z.string().min(1).max(1_000), correlationId: z.string().min(1) }).refine((value) => Boolean(value.candidateId || value.itemId || value.proposalId), "Queue item requires a candidate, item, or proposal reference.");
export const curationQueueTransitionSchema = z.object({ queueId: z.string().min(1), status: z.enum(curationQueueStatuses), lane: z.enum(curationQueueLanes).optional(), reason: z.string().min(1).max(1_000), actor: z.string().min(1), correlationId: z.string().min(1) });

const transitions: Record<(typeof curationQueueStatuses)[number], ReadonlyArray<(typeof curationQueueStatuses)[number]>> = { DISCOVERED: ["TRIAGED"], TRIAGED: ["ANALYZING", "WAITING", "REJECTED"], ANALYZING: ["WAITING", "READY_FOR_REVIEW", "REJECTED"], WAITING: ["ANALYZING", "READY_FOR_REVIEW", "REJECTED"], READY_FOR_REVIEW: ["APPROVED", "REJECTED", "WAITING"], APPROVED: ["ARCHIVED", "SUPERSEDED"], REJECTED: [], ARCHIVED: ["SUPERSEDED"], SUPERSEDED: [] };

export function classifyCurationLane(input: { confidence: number; evidenceQuality: "NONE" | "LIMITED" | "SUFFICIENT" | "STRONG"; sourceAuthority: "LOW" | "MODERATE" | "HIGH" | "OWNER"; conflictDetected: boolean }) {
  if (input.conflictDetected) return "CONFLICT_REVIEW" as const;
  if (["NONE", "LIMITED"].includes(input.evidenceQuality)) return "INSUFFICIENT_EVIDENCE" as const;
  return input.confidence >= 0.9 && input.evidenceQuality === "STRONG" && ["HIGH", "OWNER"].includes(input.sourceAuthority) ? "AUTO_ACCEPT_ELIGIBLE" as const : "HUMAN_REVIEW" as const;
}

/** A deterministic work queue. It classifies review needs but never bypasses governance. */
export const NuruCurationQueueService = {
  async enqueue(rawItem: z.input<typeof curationQueueItemSchema>) {
    const item = curationQueueItemSchema.parse(rawItem);
    return item.proposalId
      ? nuruKnowledgeRepository.nuruCurationQueue.upsert({ where: { proposalId: item.proposalId }, create: item, update: {} })
      : nuruKnowledgeRepository.nuruCurationQueue.create({ data: item });
  },

  async transition(rawTransition: z.input<typeof curationQueueTransitionSchema>) {
    const transition = curationQueueTransitionSchema.parse(rawTransition);
    const queueItem = await nuruKnowledgeRepository.nuruCurationQueue.findUnique({ where: { id: transition.queueId } }) as { id: string; status: typeof curationQueueStatuses[number]; candidateId?: string | null; itemId?: string | null; proposalId?: string | null } | null;
    if (!queueItem) throw new Error("Curation queue item was not found.");
    if (!transitions[queueItem.status].includes(transition.status)) throw new Error(`Invalid curation queue transition: ${queueItem.status} → ${transition.status}.`);
    const updated = await nuruKnowledgeRepository.nuruCurationQueue.update({ where: { id: queueItem.id }, data: { status: transition.status, lane: transition.lane, reason: transition.reason } });
    await NuruAuditService.record({ operation: "QUEUE_UPDATED", actor: transition.actor, resourceId: queueItem.itemId ?? queueItem.candidateId ?? queueItem.proposalId ?? queueItem.id, inputReference: queueItem.status, outputReference: transition.status, decision: transition.lane, reason: transition.reason, correlationId: transition.correlationId });
    return updated;
  },

  async list(status?: typeof curationQueueStatuses[number]) { return nuruKnowledgeRepository.nuruCurationQueue.findMany({ where: status ? { status } : {}, orderBy: [{ priority: "desc" }, { createdAt: "asc" }] }); },
};
