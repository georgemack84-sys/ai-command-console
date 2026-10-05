import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { deriveNuruFeedbackTasteSignals, type NuruDiscoverInterestSignal } from "@/src/server/services/nuru-discover-interest-service";

const saveReasonCodes = ["SUBJECT", "STORY", "PERSON", "PROCESS", "IDEAS", "CONNECTION"] as const;
const dismissReasonCodes = ["ALREADY_KNEW", "TOO_SIMILAR", "WRONG_SUBJECT", "TOO_TECHNICAL", "NOT_DEEP_ENOUGH", "WRONG_FORMAT", "NOT_INTERESTED"] as const;
export const nuruPersonalEditionFeedbackReasonCodes = [...saveReasonCodes, ...dismissReasonCodes] as const;

export const nuruPersonalEditionFeedbackSchema = z.object({
  candidateId: z.string().min(1),
  action: z.enum(["SAVE", "DISMISS", "RESTORE"]),
  reasonCode: z.enum(nuruPersonalEditionFeedbackReasonCodes).optional(),
}).superRefine((feedback, context) => {
  if (feedback.action === "SAVE" && feedback.reasonCode && !saveReasonCodes.includes(feedback.reasonCode as typeof saveReasonCodes[number])) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Choose a reason that matches saving this discovery." });
  }
  if (feedback.action === "DISMISS" && feedback.reasonCode && !dismissReasonCodes.includes(feedback.reasonCode as typeof dismissReasonCodes[number])) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Choose a reason that matches dismissing this discovery." });
  }
  if (feedback.action === "RESTORE" && feedback.reasonCode) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "A restored discovery does not need a feedback reason." });
  }
});

export type NuruPersonalEditionFeedback = z.infer<typeof nuruPersonalEditionFeedbackSchema>;
type FeedbackCandidate = { id: string; source: unknown; initialType: string };
const candidateRepository = nuruKnowledgeRepository.nuruDiscoveryCandidate as unknown as { findUnique(args: unknown): Promise<FeedbackCandidate | null> };

function candidateTopics(candidate: FeedbackCandidate) {
  const source = candidate.source && typeof candidate.source === "object" ? candidate.source as Record<string, unknown> : {};
  return Array.isArray(source.topics) ? source.topics.filter((topic): topic is string => typeof topic === "string") : [];
}

/** A feedback reason becomes a tentative, reversible Taste Map signal—not a fact about the member. */
export function deriveNuruPersonalEditionTasteSignals(feedback: NuruPersonalEditionFeedback, candidate: FeedbackCandidate) {
  if (feedback.action === "RESTORE" || !feedback.reasonCode) return [];
  return deriveNuruFeedbackTasteSignals({ knowledgeItemId: candidate.id, signalType: feedback.action, reasonCode: feedback.reasonCode } as NuruDiscoverInterestSignal, { topics: candidateTopics(candidate), contentType: candidate.initialType });
}

/** Latest event wins. Events must be newest first, matching the repository query used by edition preparation. */
export function dismissedNuruEditionCandidateIds(events: Array<{ candidateId: string; action: string }>) {
  const latestByCandidate = new Map<string, string>();
  for (const event of events) if (!latestByCandidate.has(event.candidateId)) latestByCandidate.set(event.candidateId, event.action);
  return new Set([...latestByCandidate].filter(([, action]) => action === "DISMISS").map(([candidateId]) => candidateId));
}

export async function recordNuruPersonalEditionFeedback(userId: string, rawFeedback: NuruPersonalEditionFeedback) {
  const feedback = nuruPersonalEditionFeedbackSchema.parse(rawFeedback);
  const shown = await nuruKnowledgeRepository.nuruPersonalEditionItem.findMany({ where: { candidateId: feedback.candidateId, edition: { userId } }, take: 1 });
  if (!shown.length) throw new Error("That discovery was not part of one of your Nuru editions.");
  const candidate = await candidateRepository.findUnique({ where: { id: feedback.candidateId } });
  if (!candidate) throw new Error("That discovery is no longer available for feedback.");
  const tasteSignals = deriveNuruPersonalEditionTasteSignals(feedback, candidate);
  await nuruKnowledgeRepository.$transaction(async (tx) => {
    await tx.nuruPersonalEditionFeedback.create({ data: { userId, ...feedback } });
    for (const tasteSignal of tasteSignals) {
      const profile = await tx.nuruTasteProfileSignal.upsert({ where: { userId_concept_dimension_source: { userId, concept: tasteSignal.concept, dimension: tasteSignal.dimension, source: "FEEDBACK_V1" } }, create: { userId, concept: tasteSignal.concept, dimension: tasteSignal.dimension, polarity: tasteSignal.polarity, confidence: 0.2, evidenceCount: 1, status: "CANDIDATE", source: "FEEDBACK_V1" }, update: { polarity: tasteSignal.polarity, confidence: 0.35, evidenceCount: { increment: 1 }, status: "CANDIDATE", isActive: true } });
      await tx.nuruTasteEvidence.createMany({ data: [{ userId, signalId: profile.id, sourceType: "DISCOVERY_REACTION", sourceId: feedback.candidateId, summary: tasteSignal.summary, weight: tasteSignal.polarity * 0.2 }] });
    }
  });
  return { candidateId: feedback.candidateId, action: feedback.action };
}
