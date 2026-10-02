import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export const humanFeedbackSchema = z.object({ proposalId: z.string().min(1), agentRecommendation: z.string().min(1), humanDecision: z.string().min(1), reason: z.string().min(3).max(2_000), scope: z.string().max(500).optional(), reviewer: z.string().min(1), correlationId: z.string().min(1) });
export type HumanFeedback = z.infer<typeof humanFeedbackSchema>;

/** Append-only evaluation data. This service cannot change prompts, policies, models, or agent identities. */
export const NuruHumanFeedbackService = {
  async record(rawFeedback: z.input<typeof humanFeedbackSchema>) {
    const feedback = humanFeedbackSchema.parse(rawFeedback);
    return nuruKnowledgeRepository.nuruHumanFeedback.create({ data: { ...feedback, evaluationStatus: "PENDING_REVIEW" } });
  },
  async evaluationDataset() { return nuruKnowledgeRepository.nuruHumanFeedback.findMany({ where: { evaluationStatus: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" } }); },
};
