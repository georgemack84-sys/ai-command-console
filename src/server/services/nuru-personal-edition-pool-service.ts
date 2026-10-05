import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { buildNuruPersonalEdition, type NuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-service";
import { dismissedNuruEditionCandidateIds } from "@/src/server/services/nuru-personal-edition-feedback-service";
import { getNuruTasteRankingContext } from "@/src/server/services/nuru-taste-interview-service";

type StoredCandidate = { id: string; title: string; content: string; source: unknown; reasonDiscovered: string; initialType: string; confidence: number };
const candidateRepository = nuruKnowledgeRepository.nuruDiscoveryCandidate as unknown as { findMany(args: unknown): Promise<StoredCandidate[]> };

const personalEditionInclude = {
  items: { orderBy: { position: "asc" }, include: { candidate: true } },
} as const;

function topicsFrom(candidate: StoredCandidate) {
  const source = candidate.source && typeof candidate.source === "object" ? candidate.source as Record<string, unknown> : {};
  if (Array.isArray(source.topics)) return source.topics.filter((topic): topic is string => typeof topic === "string");
  const query = candidate.reasonDiscovered.match(/for query “(.+)”\./)?.[1] ?? "";
  return query.split(/[,/]|\band\b/i).map((topic) => topic.trim()).filter(Boolean);
}

export function toNuruEditionCandidate(candidate: StoredCandidate): NuruEditionCandidate | null {
  if (candidate.initialType !== "book" && candidate.initialType !== "documentary" && candidate.initialType !== "article") return null;
  const source = candidate.source && typeof candidate.source === "object" ? candidate.source as Record<string, unknown> : {};
  const sourceUrl = typeof source.uri === "string" ? source.uri : "";
  if (!sourceUrl.startsWith("https://")) return null;
  return { id: candidate.id, title: candidate.title, type: candidate.initialType, sourceFamily: new URL(sourceUrl).hostname, topics: topicsFrom(candidate), confidence: candidate.confidence, sourceUrl };
}

function tasteForEdition(taste: Awaited<ReturnType<typeof getNuruTasteRankingContext>>) {
  return { preferredTopics: taste.preferredTopics, excludedTopics: taste.excludedTopics, explorationTolerance: taste.signals.some((signal) => signal.dimension === "NOVELTY" && signal.polarity > 0) ? 0.8 : 0.5 };
}

export function nuruEditionDate(now = new Date(), timeZone = "UTC") {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  } catch {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}

export function excludeRecentlyShownCandidates(candidates: NuruEditionCandidate[], recentlyShownCandidateIds: Iterable<string>) {
  const recentlyShown = new Set(recentlyShownCandidateIds);
  return candidates.filter((candidate) => !recentlyShown.has(candidate.id));
}

function serializeEdition(edition: Awaited<ReturnType<typeof nuruKnowledgeRepository.nuruPersonalEdition.findUnique>>) {
  if (!edition) return null;
  return {
    id: edition.id,
    editionDate: edition.editionDate,
    rankingVersion: edition.rankingVersion,
    createdAt: edition.createdAt,
    items: edition.items.map((item) => ({
      position: item.position,
      lane: item.lane,
      score: item.score,
      scoreBreakdown: item.scoreBreakdown,
      explanation: item.explanation,
      shownAt: item.shownAt,
      candidate: toNuruEditionCandidate(item.candidate),
    })).filter((item) => item.candidate !== null),
  };
}

/** Builds a read-only edition preview from R2-eligible material. */
export async function getNuruPersonalEdition(userId: string) {
  const [taste, rows] = await Promise.all([getNuruTasteRankingContext(userId), candidateRepository.findMany({ where: { status: "ELIGIBLE" }, orderBy: { createdAt: "desc" }, take: 100 })]);
  const candidates = rows.map(toNuruEditionCandidate).filter((candidate): candidate is NuruEditionCandidate => candidate !== null);
  return { rankingVersion: "personal-edition-v1", edition: buildNuruPersonalEdition(candidates, tasteForEdition(taste)), availableCandidateCount: candidates.length };
}

/** Creates at most one edition per UTC day and never reuses material shown in the previous 30 days. */
export async function prepareNuruPersonalEdition(userId: string, now = new Date(), timeZone = "UTC") {
  const editionDate = nuruEditionDate(now, timeZone);
  const existing = await nuruKnowledgeRepository.nuruPersonalEdition.findUnique({ where: { userId_editionDate: { userId, editionDate } }, include: personalEditionInclude });
  if (existing) return { persisted: true, repeated: true, edition: serializeEdition(existing) };

  const recentSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [taste, rows, recentItems, feedback] = await Promise.all([
    getNuruTasteRankingContext(userId),
    candidateRepository.findMany({ where: { status: "ELIGIBLE" }, orderBy: { createdAt: "desc" }, take: 100 }),
    nuruKnowledgeRepository.nuruPersonalEditionItem.findMany({ where: { edition: { userId }, shownAt: { gte: recentSince } }, select: { candidateId: true } }),
    nuruKnowledgeRepository.nuruPersonalEditionFeedback.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  const available = rows.map(toNuruEditionCandidate).filter((candidate): candidate is NuruEditionCandidate => candidate !== null);
  const editionItems = buildNuruPersonalEdition(excludeRecentlyShownCandidates(available, [...recentItems.map((item) => item.candidateId), ...dismissedNuruEditionCandidateIds(feedback)]), tasteForEdition(taste));
  try {
    const created = await nuruKnowledgeRepository.nuruPersonalEdition.upsert({
      where: { userId_editionDate: { userId, editionDate } },
      update: {},
      create: {
        userId,
        editionDate,
        rankingVersion: "personal-edition-v1",
        inputSnapshot: { taste: tasteForEdition(taste), timeZone, availableCandidateCount: available.length, excludedAsRecentlyShownCount: recentItems.length },
        items: { create: editionItems.map((item, index) => ({ candidateId: item.candidate.id, position: index + 1, lane: item.lane, score: item.score, scoreBreakdown: item.scoreBreakdown, explanation: item.explanation })) },
      },
      include: personalEditionInclude,
    });
    return { persisted: true, repeated: false, edition: serializeEdition(created), availableCandidateCount: available.length, recentCandidateCount: recentItems.length };
  } catch (error) {
    // Two tabs (or React's development replay) can both pass the initial lookup.
    // The unique index is the authority; after it resolves the race, return its edition.
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
    const winner = await nuruKnowledgeRepository.nuruPersonalEdition.findUnique({ where: { userId_editionDate: { userId, editionDate } }, include: personalEditionInclude });
    if (!winner) throw error;
    return { persisted: true, repeated: true, edition: serializeEdition(winner), availableCandidateCount: available.length, recentCandidateCount: recentItems.length };
  }
}
