import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { toNuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-pool-service";
import { buildNuruRabbitHole, findNuruRabbitHoleAccess } from "@/src/server/services/nuru-rabbit-hole-service";

type StoredCandidate = { id: string; title: string; content: string; source: unknown; reasonDiscovered: string; initialType: string; confidence: number };
type EditionItemRow = { lane: string; score: number; explanation: string; shownAt: Date; candidate: StoredCandidate };
const editionItemRepository = nuruKnowledgeRepository.nuruPersonalEditionItem as unknown as { findMany(args: unknown): Promise<EditionItemRow[]> };
const candidateRepository = nuruKnowledgeRepository.nuruDiscoveryCandidate as unknown as { findMany(args: unknown): Promise<StoredCandidate[]> };

/** A detail is available only from the member's latest edition or one of its grounded Rabbit Hole paths. */
export async function getNuruPersonalDiscoveryDetail(userId: string, candidateId: string) {
  const [shownRows, eligibleRows] = await Promise.all([
    editionItemRepository.findMany({ where: { edition: { userId } }, orderBy: { shownAt: "desc" }, take: 7, include: { candidate: true } }),
    candidateRepository.findMany({ where: { status: "ELIGIBLE" }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const roots = shownRows.map((row) => ({ row, candidate: toNuruEditionCandidate(row.candidate) })).filter((entry): entry is { row: EditionItemRow; candidate: NonNullable<ReturnType<typeof toNuruEditionCandidate>> } => entry.candidate !== null);
  const pool = eligibleRows.map((row) => ({ row, candidate: toNuruEditionCandidate(row) })).filter((entry): entry is { row: StoredCandidate; candidate: NonNullable<ReturnType<typeof toNuruEditionCandidate>> } => entry.candidate !== null);
  const shown = roots.find((entry) => entry.candidate.id === candidateId);
  const pathAccess = shown ? null : findNuruRabbitHoleAccess(candidateId, roots.map((entry) => entry.candidate), pool.map((entry) => entry.candidate));
  const pathCandidate = pathAccess ? pool.find((entry) => entry.candidate.id === candidateId) : null;
  const source = shown?.row.candidate ?? pathCandidate?.row;
  const candidate = shown?.candidate ?? pathCandidate?.candidate;
  if (!candidate) return null;
  const topics = candidate.topics;
  const nextPool = pool.map((entry) => entry.candidate).filter((entry) => entry.id !== candidateId);
  const topicSet = new Set(topics.map((topic) => topic.toLocaleLowerCase()));
  const nextDirections = nextPool.map((entry) => ({ candidate: entry, sharedTopics: entry.topics.filter((topic) => topicSet.has(topic.toLocaleLowerCase())) })).filter((entry) => entry.sharedTopics.length > 0).sort((left, right) => right.sharedTopics.length - left.sharedTopics.length || right.candidate.confidence - left.candidate.confidence || left.candidate.title.localeCompare(right.candidate.title)).slice(0, 6);
  return {
    candidate: { ...candidate, description: source?.content ?? "" },
    sourceFacts: { sourceFamily: candidate.sourceFamily, sourceUrl: candidate.sourceUrl, topics, confidence: candidate.confidence },
    nuruInterpretation: shown ? { lane: shown.row.lane, score: shown.row.score, explanation: shown.row.explanation } : { lane: "RABBIT_HOLE", score: Math.round(candidate.confidence * 100), explanation: `Connected from “${pathAccess?.root.title}” through ${pathAccess?.node.sharedTopics.join(", ")}.` },
    nextDirections,
    rabbitHole: buildNuruRabbitHole(candidate, nextPool),
  };
}
