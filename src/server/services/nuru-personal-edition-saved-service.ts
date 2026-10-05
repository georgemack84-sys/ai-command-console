import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { toNuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-pool-service";

type SavedFeedbackRow = {
  candidateId: string;
  action: string;
  createdAt: Date;
  candidate: { id: string; title: string; content: string; source: unknown; reasonDiscovered: string; initialType: string; confidence: number };
};

const feedbackRepository = nuruKnowledgeRepository.nuruPersonalEditionFeedback as unknown as {
  findMany(args: unknown): Promise<SavedFeedbackRow[]>;
};

/** Lists the user's current explicit saves. The most recent feedback event wins. */
export async function listSavedNuruPersonalEditionDiscoveries(userId: string) {
  const feedback = await feedbackRepository.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { candidate: true },
  });
  const latest = new Map<string, SavedFeedbackRow>();
  for (const event of feedback) if (!latest.has(event.candidateId)) latest.set(event.candidateId, event);
  return [...latest.values()]
    .filter((event) => event.action === "SAVE")
    .map((event) => ({ candidate: toNuruEditionCandidate(event.candidate), savedAt: event.createdAt }))
    .filter((entry): entry is { candidate: NonNullable<ReturnType<typeof toNuruEditionCandidate>>; savedAt: Date } => entry.candidate !== null);
}
