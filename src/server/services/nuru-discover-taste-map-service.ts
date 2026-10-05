import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";
import type { NuruDiscoverInterestSignalRow } from "@/src/server/repositories/nuru-knowledge-repository";

export type NuruDiscoverTasteTopic = {
  topic: string;
  score: number;
  savedCount: number;
  dismissedCount: number;
  evidenceItemIds: string[];
};

function latestSignals(signals: NuruDiscoverInterestSignalRow[]) {
  const latest = new Map<string, NuruDiscoverInterestSignalRow>();
  for (const signal of signals) {
    const previous = latest.get(signal.knowledgeItemId);
    if (!previous || previous.createdAt < signal.createdAt) latest.set(signal.knowledgeItemId, signal);
  }
  return latest;
}

/** Creates a user-readable topic profile from explicit, latest feedback only. */
export function buildNuruDiscoverTasteMap(catalog: NuruDiscoverCatalogItem[], signals: NuruDiscoverInterestSignalRow[]) {
  const catalogById = new Map(catalog.map((item) => [item.knowledgeItemId, item]));
  const topics = new Map<string, NuruDiscoverTasteTopic>();
  for (const [itemId, signal] of latestSignals(signals)) {
    const item = catalogById.get(itemId);
    if (!item) continue;
    for (const topic of item.topics) {
      const current = topics.get(topic) ?? { topic, score: 0, savedCount: 0, dismissedCount: 0, evidenceItemIds: [] };
      if (signal.signalType === "SAVE") {
        current.savedCount += 1;
        current.score += 1;
      } else if (signal.signalType === "DISMISS") {
        current.dismissedCount += 1;
        current.score -= 1;
      }
      if (!current.evidenceItemIds.includes(itemId)) current.evidenceItemIds.push(itemId);
      topics.set(topic, current);
    }
  }
  return [...topics.values()]
    .sort((left, right) => Math.abs(right.score) - Math.abs(left.score) || left.topic.localeCompare(right.topic));
}
