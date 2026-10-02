import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const supersessionActions = ["REJECT", "COEXIST", "NARROW_SCOPE", "SUPERSEDE"] as const;
export const supersessionRequestSchema = z.object({ currentItemId: z.string().min(1), candidateItemId: z.string().min(1), reason: z.string().min(3).max(2_000), requestedBy: z.string().min(1), correlationId: z.string().min(1) }).refine((value) => value.currentItemId !== value.candidateItemId, "Supersession requires two distinct items.");
export const supersessionDecisionSchema = z.object({ reviewId: z.string().min(1), action: z.enum(supersessionActions), decidedBy: z.string().min(1), reason: z.string().min(3).max(2_000), narrowedScope: z.string().min(1).max(500).optional(), correlationId: z.string().min(1) }).superRefine((value, context) => { if (value.action === "NARROW_SCOPE" && !value.narrowedScope) context.addIssue({ code: z.ZodIssueCode.custom, path: ["narrowedScope"], message: "A narrowed scope is required for this decision." }); });

/** Human-review workflow for architectural evolution. It preserves originals and never infers a successor. */
export const NuruSupersessionService = {
  async list() {
    return nuruKnowledgeRepository.nuruSupersessionReview.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) as Promise<Array<{ id: string; currentItemId: string; candidateItemId: string; status: string; reason: string; requestedBy: string; decidedBy: string | null; decisionReason: string | null; narrowedScope: string | null; createdAt: Date; decidedAt: Date | null }>>;
  },

  async request(rawRequest: z.input<typeof supersessionRequestSchema>) {
    const request = supersessionRequestSchema.parse(rawRequest);
    return nuruKnowledgeRepository.nuruSupersessionReview.create({ data: { currentItemId: request.currentItemId, candidateItemId: request.candidateItemId, status: "PENDING", reason: request.reason, requestedBy: request.requestedBy, correlationId: request.correlationId } });
  },

  async decide(rawDecision: z.input<typeof supersessionDecisionSchema>) {
    const decision = supersessionDecisionSchema.parse(rawDecision);
    const review = await nuruKnowledgeRepository.nuruSupersessionReview.findUnique({ where: { id: decision.reviewId } }) as { id: string; currentItemId: string; candidateItemId: string; status: string } | null;
    if (!review || review.status !== "PENDING") throw new Error("Supersession review is not pending.");
    const status = decision.action === "REJECT" ? "REJECTED" : decision.action === "COEXIST" ? "COEXISTING" : decision.action === "NARROW_SCOPE" ? "NARROWED_SCOPE" : "SUPERSEDED";
    const updated = await nuruKnowledgeRepository.nuruSupersessionReview.update({ where: { id: review.id }, data: { status, decidedBy: decision.decidedBy, decisionReason: decision.reason, narrowedScope: decision.narrowedScope, decidedAt: new Date() } });
    const lineage = decision.action === "SUPERSEDE" ? await NuruArchiveService.activateSupersession(review.currentItemId, review.candidateItemId, "nuru.governance.v1") : null;
    await NuruAuditService.record({ operation: "SUPERSESSION_REVIEWED", actor: decision.decidedBy, resourceId: review.currentItemId, inputReference: review.candidateItemId, outputReference: review.id, decision: decision.action, reason: decision.reason, correlationId: decision.correlationId });
    return { review: updated, action: decision.action, lineage };
  },
};
