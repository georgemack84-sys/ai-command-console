import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export const nuruTasteInterviewPrompts = [
  { id: "recent-fascinations", question: "Tell Nuru three things you've found fascinating recently.", hint: "They can be subjects, stories, people, objects, or questions." },
  { id: "why-it-matters", question: "What was fascinating about one of them?", hint: "Was it the idea, the story, the person, the process, or something else?" },
  { id: "not-for-you", question: "What's something popular that doesn't pull you in?", hint: "This helps Nuru avoid mistaking popularity for your curiosity." },
  { id: "depth-or-newness", question: "Do you prefer something completely new, or going deeper into something familiar?", hint: "There is no permanent answer—just your current appetite." },
  { id: "attention-lens", question: "When a discovery stays with you, what usually matters most?", hint: "The subject, story, person, process, ideas, or another quality." },
] as const;

type PromptId = (typeof nuruTasteInterviewPrompts)[number]["id"];
export const nuruTasteInterviewInputSchema = z.object({
  answers: z.array(z.object({ promptId: z.enum(nuruTasteInterviewPrompts.map((prompt) => prompt.id) as [PromptId, ...PromptId[]]), answer: z.string().trim().min(3).max(1_500) })).length(nuruTasteInterviewPrompts.length),
}).superRefine((input, context) => {
  const unique = new Set(input.answers.map((answer) => answer.promptId));
  if (unique.size !== nuruTasteInterviewPrompts.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["answers"], message: "Answer each Taste Interview question exactly once." });
});
export type NuruTasteInterviewInput = z.infer<typeof nuruTasteInterviewInputSchema>;

export type NuruInterviewSignal = { concept: string; dimension: "SUBJECT" | "NEGATIVE_SUBJECT" | "EXPLORATION" | "ATTENTION_LENS"; polarity: -1 | 1; confidence: number; evidencePromptId: PromptId; summary: string };
export const nuruTasteProfileSignalActionSchema = z.object({ signalId: z.string().min(1), type: z.enum(["confirm", "quiet", "remove"]) });

function phrases(answer: string, max = 3) {
  return answer.split(/[\n,;]|(?:\band\b)/i).map((part) => part.trim().replace(/^[\-•\d.)\s]+/, "")).filter((part) => part.length >= 3).slice(0, max);
}

/** A conservative V1 interpretation: raw answers remain evidence, while all derived interests begin as candidates. */
export function deriveNuruInterviewSignals(input: NuruTasteInterviewInput): NuruInterviewSignal[] {
  const answers = new Map(input.answers.map((entry) => [entry.promptId, entry.answer]));
  const fascination = phrases(answers.get("recent-fascinations") ?? "").map((concept) => ({ concept, dimension: "SUBJECT" as const, polarity: 1 as const, confidence: 0.35, evidencePromptId: "recent-fascinations" as const, summary: `You mentioned “${concept}” as recently fascinating.` }));
  const negative = phrases(answers.get("not-for-you") ?? "", 1).map((concept) => ({ concept, dimension: "NEGATIVE_SUBJECT" as const, polarity: -1 as const, confidence: 0.3, evidencePromptId: "not-for-you" as const, summary: `You said “${concept}” does not currently pull you in.` }));
  const depth = (answers.get("depth-or-newness") ?? "").trim();
  const lens = (answers.get("attention-lens") ?? "").trim();
  return [...fascination, ...negative,
    { concept: depth, dimension: "EXPLORATION" as const, polarity: 1 as const, confidence: 0.25, evidencePromptId: "depth-or-newness" as const, summary: "Your current exploration preference, held lightly." },
    { concept: lens, dimension: "ATTENTION_LENS" as const, polarity: 1 as const, confidence: 0.25, evidencePromptId: "attention-lens" as const, summary: "What you said tends to hold your attention." },
  ].filter((signal) => signal.concept.length >= 3);
}

export async function getNuruTasteInterview(userId: string) {
  const [answers, signals] = await Promise.all([
    nuruKnowledgeRepository.nuruTasteInterviewResponse.findMany({ where: { userId }, orderBy: { updatedAt: "asc" } }),
    nuruKnowledgeRepository.nuruTasteProfileSignal.findMany({ where: { userId, source: "INTERVIEW_V1", isActive: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return { prompts: nuruTasteInterviewPrompts, answers, signals };
}

export async function getNuruTasteProfileSignals(userId: string) {
  return nuruKnowledgeRepository.nuruTasteProfileSignal.findMany({ where: { userId, isActive: true }, orderBy: { updatedAt: "desc" } });
}

/** Explicit confirmation increases confidence; quieting or removing never changes the raw interview response. */
export async function actOnNuruTasteProfileSignal(userId: string, rawAction: z.input<typeof nuruTasteProfileSignalActionSchema>) {
  const action = nuruTasteProfileSignalActionSchema.parse(rawAction);
  const signal = await nuruKnowledgeRepository.nuruTasteProfileSignal.findUnique({ where: { id: action.signalId } });
  if (!signal || signal.userId !== userId) throw new Error("That Taste Map signal no longer exists.");
  if (action.type === "remove") {
    await nuruKnowledgeRepository.nuruTasteProfileSignal.deleteMany({ where: { id: signal.id, userId } });
    return getNuruTasteProfileSignals(userId);
  }
  const updated = await nuruKnowledgeRepository.nuruTasteProfileSignal.update({ where: { id: signal.id }, data: action.type === "confirm" ? { confidence: Math.min(0.6, signal.confidence + 0.2), status: "ESTABLISHED" } : { isActive: false } });
  return action.type === "quiet" ? getNuruTasteProfileSignals(userId) : [updated, ...(await getNuruTasteProfileSignals(userId)).filter((entry) => entry.id !== updated.id)];
}

export async function getNuruTasteRankingContext(userId: string) {
  const signals = await getNuruTasteProfileSignals(userId);
  return {
    preferredTopics: signals.filter((signal) => signal.dimension === "SUBJECT" && signal.polarity > 0).map((signal) => signal.concept),
    excludedTopics: signals.filter((signal) => signal.dimension === "NEGATIVE_SUBJECT").map((signal) => signal.concept),
    signals: signals.map(({ concept, dimension, polarity, confidence }) => ({ concept, dimension, polarity, confidence })),
  };
}

export async function submitNuruTasteInterview(userId: string, rawInput: NuruTasteInterviewInput) {
  const input = nuruTasteInterviewInputSchema.parse(rawInput);
  const signals = deriveNuruInterviewSignals(input);
  await nuruKnowledgeRepository.$transaction(async (tx) => {
    for (const answer of input.answers) await tx.nuruTasteInterviewResponse.upsert({ where: { userId_promptId: { userId, promptId: answer.promptId } }, create: { userId, promptId: answer.promptId, answer: answer.answer }, update: { answer: answer.answer } });
    await tx.nuruTasteEvidence.deleteMany({ where: { userId, signal: { source: "INTERVIEW_V1" } } });
    await tx.nuruTasteProfileSignal.deleteMany({ where: { userId, source: "INTERVIEW_V1" } });
    for (const signal of signals) {
      const record = await tx.nuruTasteProfileSignal.upsert({ where: { userId_concept_dimension_source: { userId, concept: signal.concept, dimension: signal.dimension, source: "INTERVIEW_V1" } }, create: { userId, concept: signal.concept, dimension: signal.dimension, polarity: signal.polarity, confidence: signal.confidence, evidenceCount: 1, status: "CANDIDATE", source: "INTERVIEW_V1" }, update: { polarity: signal.polarity, confidence: signal.confidence, evidenceCount: 1, status: "CANDIDATE", isActive: true } });
      await tx.nuruTasteEvidence.createMany({ data: [{ userId, signalId: record.id, sourceType: "INTERVIEW_RESPONSE", sourceId: signal.evidencePromptId, summary: signal.summary, weight: signal.confidence }] });
    }
  });
  return getNuruTasteInterview(userId);
}
