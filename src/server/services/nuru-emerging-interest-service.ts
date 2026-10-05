import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type FeedbackWithCandidate = { candidateId: string; action: string; candidate: { title: string; source: unknown } };
const feedbackRepository = nuruKnowledgeRepository.nuruPersonalEditionFeedback as unknown as { findMany(args: unknown): Promise<FeedbackWithCandidate[]> };

function candidateTopics(source: unknown) {
  const record = source && typeof source === "object" ? source as Record<string, unknown> : {};
  return Array.isArray(record.topics) ? record.topics.filter((topic): topic is string => typeof topic === "string") : [];
}

/** Repeated explicit saves can form a visible, reversible hypothesis; this never writes to the Taste Map. */
export function deriveNuruEmergingInterestHypotheses(events: FeedbackWithCandidate[]) {
  const latest = new Map<string, FeedbackWithCandidate>();
  for (const event of events) if (!latest.has(event.candidateId)) latest.set(event.candidateId, event);
  const evidence = new Map<string, Array<{ candidateId: string; title: string }>>();
  for (const event of latest.values()) if (event.action === "SAVE") for (const topic of candidateTopics(event.candidate.source)) {
    const key = topic.trim().toLocaleLowerCase();
    if (!key) continue;
    evidence.set(key, [...(evidence.get(key) ?? []), { candidateId: event.candidateId, title: event.candidate.title }]);
  }
  return [...evidence.entries()].filter(([, items]) => items.length >= 2).map(([topic, items]) => ({ topic, evidence: items, message: `I’ve noticed you saved more than one discovery connected to ${topic}. Shall we explore it?` })).sort((left, right) => right.evidence.length - left.evidence.length || left.topic.localeCompare(right.topic)).slice(0, 3);
}

export async function getNuruEmergingInterestHypotheses(userId: string) {
  return deriveNuruEmergingInterestHypotheses(await feedbackRepository.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { candidate: true } }));
}
