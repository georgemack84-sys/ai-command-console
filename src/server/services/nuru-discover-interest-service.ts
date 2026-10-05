import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { nuruKnowledgeRepository, type NuruDiscoverInterestSignalRow } from "@/src/server/repositories/nuru-knowledge-repository";

export const nuruDiscoverInterestSignalSchema = z.object({
  knowledgeItemId: z.string().min(1),
  signalType: z.enum(["SAVE", "DISMISS"]),
  reasonCode: z.enum(["SUBJECT", "STORY", "PERSON", "PROCESS", "IDEAS", "CONNECTION", "ALREADY_KNEW", "TOO_SIMILAR", "WRONG_SUBJECT", "TOO_TECHNICAL", "NOT_DEEP_ENOUGH", "WRONG_FORMAT", "NOT_INTERESTED"]).optional(),
}).superRefine((signal, context) => {
  const positive = ["SUBJECT", "STORY", "PERSON", "PROCESS", "IDEAS", "CONNECTION"];
  if (signal.reasonCode && (signal.signalType === "SAVE") !== positive.includes(signal.reasonCode)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "That reason does not match the selected reaction." });
});
export type NuruDiscoverInterestSignal = z.infer<typeof nuruDiscoverInterestSignalSchema>;
type FeedbackTasteSignal = { concept: string; dimension: string; polarity: -1 | 1; summary: string };

export function deriveNuruFeedbackTasteSignals(signal: NuruDiscoverInterestSignal, item: { topics: string[]; contentType: string }): FeedbackTasteSignal[] {
  if (!signal.reasonCode) return [];
  const lens: Record<string, string> = { STORY: "Story", PERSON: "People", PROCESS: "Process", IDEAS: "Ideas", CONNECTION: "Unexpected connections" };
  if (signal.reasonCode === "SUBJECT") return item.topics.map((concept) => ({ concept, dimension: "SUBJECT", polarity: 1, summary: `You saved this because of its subject: ${concept}.` }));
  if (lens[signal.reasonCode]) return [{ concept: lens[signal.reasonCode], dimension: "ATTENTION_LENS", polarity: 1, summary: `You saved this because of the ${lens[signal.reasonCode].toLowerCase()}.` }];
  if (signal.reasonCode === "WRONG_SUBJECT" || signal.reasonCode === "NOT_INTERESTED") return item.topics.map((concept) => ({ concept, dimension: "NEGATIVE_SUBJECT", polarity: -1, summary: `You marked this subject as a poor fit: ${concept}.` }));
  const adjustments: Record<string, FeedbackTasteSignal> = {
    ALREADY_KNEW: { concept: "Novelty", dimension: "NOVELTY", polarity: 1, summary: "You prefer discoveries that add something genuinely new." },
    TOO_SIMILAR: { concept: "Novelty", dimension: "NOVELTY", polarity: 1, summary: "You asked Nuru to vary its discoveries more." },
    TOO_TECHNICAL: { concept: "Technical detail", dimension: "DEPTH", polarity: -1, summary: "This level of technical detail was not the right fit." },
    NOT_DEEP_ENOUGH: { concept: "Depth", dimension: "DEPTH", polarity: 1, summary: "You asked for more depth." },
    WRONG_FORMAT: { concept: item.contentType, dimension: "FORMAT", polarity: -1, summary: `This ${item.contentType} format was not the right fit.` },
  };
  return adjustments[signal.reasonCode] ? [adjustments[signal.reasonCode]] : [];
}

export function resolveNuruDiscoverInterestState(signals: NuruDiscoverInterestSignalRow[]) {
  const latestByItem = new Map<string, NuruDiscoverInterestSignalRow>();
  for (const signal of signals) {
    const current = latestByItem.get(signal.knowledgeItemId);
    if (!current || current.createdAt < signal.createdAt) latestByItem.set(signal.knowledgeItemId, signal);
  }
  return {
    savedItemIds: [...latestByItem.values()].filter((signal) => signal.signalType === "SAVE").map((signal) => signal.knowledgeItemId),
    dismissedItemIds: [...latestByItem.values()].filter((signal) => signal.signalType === "DISMISS").map((signal) => signal.knowledgeItemId),
  };
}

/** Records a user-owned signal; it never alters canonical knowledge. */
export async function recordNuruDiscoverInterestSignal(userId: string, rawSignal: NuruDiscoverInterestSignal) {
  const signal = nuruDiscoverInterestSignalSchema.parse(rawSignal);
  const catalog = await listNuruDiscoverCatalog(100);
  if (!catalog.some((item) => item.knowledgeItemId === signal.knowledgeItemId)) {
    throw new AppError(409, "catalog_ineligible", "Only currently admitted Discover items can receive feedback.");
  }
  const item = catalog.find((entry) => entry.knowledgeItemId === signal.knowledgeItemId);
  if (!item) throw new AppError(409, "catalog_ineligible", "Only currently admitted Discover items can receive feedback.");
  const tasteSignals = deriveNuruFeedbackTasteSignals(signal, item);
  await nuruKnowledgeRepository.$transaction(async (tx) => {
    await tx.nuruDiscoverInterestSignal.create({ data: { userId, knowledgeItemId: signal.knowledgeItemId, signalType: signal.signalType, weight: signal.signalType === "SAVE" ? 1 : -1, source: "DISCOVER_UI", reasonCode: signal.reasonCode } });
    for (const tasteSignal of tasteSignals) {
      const profile = await tx.nuruTasteProfileSignal.upsert({ where: { userId_concept_dimension_source: { userId, concept: tasteSignal.concept, dimension: tasteSignal.dimension, source: "FEEDBACK_V1" } }, create: { userId, concept: tasteSignal.concept, dimension: tasteSignal.dimension, polarity: tasteSignal.polarity, confidence: 0.2, evidenceCount: 1, status: "CANDIDATE", source: "FEEDBACK_V1" }, update: { polarity: tasteSignal.polarity, confidence: 0.35, evidenceCount: { increment: 1 }, status: "CANDIDATE", isActive: true } });
      await tx.nuruTasteEvidence.createMany({ data: [{ userId, signalId: profile.id, sourceType: "DISCOVERY_REACTION", sourceId: signal.knowledgeItemId, summary: tasteSignal.summary, weight: tasteSignal.polarity * 0.2 }] });
    }
  });
  return getNuruDiscoverInterestState(userId);
}

export async function getNuruDiscoverInterestState(userId: string) {
  const signals = await listNuruDiscoverInterestSignals(userId);
  return resolveNuruDiscoverInterestState(signals);
}

export async function listNuruDiscoverInterestSignals(userId: string) {
  return nuruKnowledgeRepository.nuruDiscoverInterestSignal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
