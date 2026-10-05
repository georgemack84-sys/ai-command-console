export const nuruEditionLanes = ["FAMILIAR", "ADJACENT", "SERENDIPITY", "WILDCARD"] as const;
export type NuruEditionLane = (typeof nuruEditionLanes)[number];
export type NuruEditionCandidate = { id: string; title: string; type: "book" | "documentary" | "article"; sourceFamily: string; topics: string[]; confidence: number; sourceUrl: string };
export type NuruEditionTaste = { preferredTopics: string[]; excludedTopics?: string[]; explorationTolerance?: number };
export type NuruPersonalEditionItem = { candidate: NuruEditionCandidate; lane: NuruEditionLane; score: number; scoreBreakdown: { tasteResonance: number; novelty: number; crossDomain: number; quality: number; diversityPenalty: number }; explanation: string };

const lanePlan: Array<{ lane: NuruEditionLane; count: number }> = [{ lane: "FAMILIAR", count: 3 }, { lane: "ADJACENT", count: 2 }, { lane: "SERENDIPITY", count: 1 }, { lane: "WILDCARD", count: 1 }];
function normalized(values: string[]) { return new Set(values.map((value) => value.trim().toLocaleLowerCase()).filter(Boolean)); }

/** Deterministic seven-item edition. It never invents a source or a taste signal. */
export function buildNuruPersonalEdition(candidates: NuruEditionCandidate[], taste: NuruEditionTaste): NuruPersonalEditionItem[] {
  const preferred = normalized(taste.preferredTopics); const excluded = normalized(taste.excludedTopics ?? []); const exploration = Math.max(0, Math.min(1, taste.explorationTolerance ?? 0.5));
  const ranked = candidates.filter((candidate) => candidate.sourceUrl.startsWith("https://") && !candidate.topics.some((topic) => excluded.has(topic.toLocaleLowerCase()))).map((candidate) => {
    const overlap = candidate.topics.filter((topic) => preferred.has(topic.toLocaleLowerCase()));
    const tasteResonance = overlap.length * 35; const novelty = overlap.length ? 0 : Math.round(20 * exploration); const crossDomain = overlap.length ? 0 : 10; const quality = Math.round(candidate.confidence * 35);
    return { candidate, overlap, score: tasteResonance + novelty + crossDomain + quality };
  }).sort((left, right) => right.score - left.score || left.candidate.title.localeCompare(right.candidate.title));
  const selected: NuruPersonalEditionItem[] = []; const used = new Set<string>(); const usedSources = new Set<string>(); const usedTypes = new Set<string>(); const usedTopics = new Map<string, number>();
  // Diversity is an edition invariant, rather than a best-effort ranking hint.
  // The target is capped by what the eligible pool can actually supply, so an
  // honest short pool is never padded or misrepresented as diverse.
  const sourceFamilyTarget = Math.min(3, new Set(ranked.map((entry) => entry.candidate.sourceFamily)).size);
  const contentTypeTarget = Math.min(2, new Set(ranked.map((entry) => entry.candidate.type)).size);
  for (const { lane, count } of lanePlan) {
    for (let slot = 0; slot < count; slot += 1) {
      const pool = ranked.filter((entry) => !used.has(entry.candidate.id) && (lane === "FAMILIAR" ? entry.overlap.length > 0 : lane === "ADJACENT" ? entry.overlap.length > 0 || preferred.size === 0 : entry.overlap.length === 0));
      const choice = pool.map((entry) => {
        const repeatedTopics = entry.candidate.topics.reduce((total, topic) => total + Math.max(0, (usedTopics.get(topic.trim().toLocaleLowerCase()) ?? 0) - 2), 0);
        const diversityPenalty = (usedSources.has(entry.candidate.sourceFamily) ? 8 : 0) + (usedTypes.has(entry.candidate.type) ? 4 : 0) + Math.min(12, repeatedTopics * 3);
        const sourceCoverageBoost = usedSources.size < sourceFamilyTarget && !usedSources.has(entry.candidate.sourceFamily) ? 200 : 0;
        const typeCoverageBoost = usedTypes.size < contentTypeTarget && !usedTypes.has(entry.candidate.type) ? 100 : 0;
        return { entry, diversityPenalty, selectionScore: entry.score - diversityPenalty + sourceCoverageBoost + typeCoverageBoost };
      }).sort((left, right) => right.selectionScore - left.selectionScore || left.entry.candidate.title.localeCompare(right.entry.candidate.title))[0];
      if (!choice) break;
      used.add(choice.entry.candidate.id); usedSources.add(choice.entry.candidate.sourceFamily); usedTypes.add(choice.entry.candidate.type); choice.entry.candidate.topics.forEach((topic) => { const key = topic.trim().toLocaleLowerCase(); if (key) usedTopics.set(key, (usedTopics.get(key) ?? 0) + 1); });
      const { candidate, overlap, score } = choice.entry;
      selected.push({ candidate, lane, score: score - choice.diversityPenalty, scoreBreakdown: { tasteResonance: overlap.length * 35, novelty: overlap.length ? 0 : Math.round(20 * exploration), crossDomain: overlap.length ? 0 : 10, quality: Math.round(candidate.confidence * 35), diversityPenalty: choice.diversityPenalty }, explanation: overlap.length ? `Connected to your Taste Map through ${overlap.join(", ")}.` : `A deliberate ${lane.toLocaleLowerCase()} leap beyond your stated interests, from ${candidate.sourceFamily}.` });
    }
  }
  return selected;
}
