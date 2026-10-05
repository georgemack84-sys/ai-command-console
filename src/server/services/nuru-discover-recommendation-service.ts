import { z } from "zod";
import type { NuruDiscoverCatalogItem } from "@/src/server/services/nuru-discover-catalog-service";

export const nuruDiscoverLanes = ["NEAR_MATCH", "ADJACENT", "SERENDIPITY", "WILDCARD"] as const;
export type NuruDiscoverLane = (typeof nuruDiscoverLanes)[number];

export const nuruDiscoverSessionInputSchema = z.object({
  preferredTopics: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  excludedTopics: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  tasteSignals: z.array(z.object({ concept: z.string().trim().min(1).max(120), dimension: z.string().trim().min(1).max(80), polarity: z.number().int().min(-1).max(1), confidence: z.number().min(0).max(1) })).max(100).default([]),
  dismissedItemIds: z.array(z.string().min(1)).max(100).default([]),
  limit: z.number().int().min(1).max(7).default(7),
});
export type NuruDiscoverSessionInput = z.input<typeof nuruDiscoverSessionInputSchema>;

export type NuruDiscoverRecommendation = {
  item: NuruDiscoverCatalogItem;
  lane: NuruDiscoverLane;
  score: number;
  explanation: {
    reasonCodes: string[];
    supportingTopics: string[];
    sourceStatus: "PROVENANCE_VERIFIED";
    confidence: number;
    rankingVersion: "discover-deterministic-v1";
    summary: string;
  };
};

export type NuruDiscoverSession = {
  rankingVersion: "discover-deterministic-v1";
  recommendations: NuruDiscoverRecommendation[];
  coverage: {
    matchedTopics: Array<{ topic: string; itemCount: number }>;
    unmatchedTopics: string[];
  };
};

function normalizedTopics(topics: string[]) {
  return new Set(topics.map((topic) => topic.trim().toLocaleLowerCase()).filter(Boolean));
}

function laneFor(position: number, sharedTopics: string[], hasPreferences: boolean): NuruDiscoverLane {
  if (sharedTopics.length > 0) return position === 0 ? "NEAR_MATCH" : "ADJACENT";
  if (!hasPreferences) return position === 0 ? "NEAR_MATCH" : "ADJACENT";
  return position % 2 === 0 ? "SERENDIPITY" : "WILDCARD";
}

function feedbackAdjustment(item: NuruDiscoverCatalogItem, sharedTopics: string[], signals: Array<{ concept: string; dimension: string; polarity: number; confidence: number }>) {
  const type = item.contentType.toLocaleLowerCase();
  const text = `${item.title} ${item.summary} ${item.topics.join(" ")}`.toLocaleLowerCase();
  let points = 0;
  const reasonCodes: string[] = [];
  for (const signal of signals) {
    const concept = signal.concept.toLocaleLowerCase();
    const weight = Math.max(1, Math.round(signal.confidence * 10));
    if (signal.dimension === "FORMAT" && type === concept) { points += signal.polarity * weight; reasonCodes.push("FORMAT_FEEDBACK"); }
    if (signal.dimension === "NOVELTY" && signal.polarity > 0 && sharedTopics.length === 0) { points += weight; reasonCodes.push("NOVELTY_FEEDBACK"); }
    if (signal.dimension === "DEPTH" && ((concept === "depth" && /book|article|essay/.test(type)) || (concept === "technical detail" && /technical|engineering|scientific/.test(text)))) { points += signal.polarity * weight; reasonCodes.push("DEPTH_FEEDBACK"); }
    if (signal.dimension === "ATTENTION_LENS" && text.includes(concept)) { points += signal.polarity * weight; reasonCodes.push("ATTENTION_LENS_FEEDBACK"); }
  }
  return { points, reasonCodes: [...new Set(reasonCodes)] };
}

/**
 * Produces a deterministic, explainable session from the human-admitted
 * catalog. It deliberately has no write path and no model inference.
 */
export function buildNuruDiscoverSession(
  catalog: NuruDiscoverCatalogItem[],
  rawInput: NuruDiscoverSessionInput = {},
): NuruDiscoverSession {
  const input = nuruDiscoverSessionInputSchema.parse(rawInput);
  const preferredTopics = normalizedTopics(input.preferredTopics);
  const excludedTopics = normalizedTopics(input.excludedTopics);
  const dismissed = new Set(input.dismissedItemIds);
  const hasPreferences = preferredTopics.size > 0;

  const candidates = catalog
    .filter((item) => !dismissed.has(item.knowledgeItemId) && !item.topics.some((topic) => excludedTopics.has(topic.toLocaleLowerCase())))
    .map((item) => {
      const sharedTopics = item.topics.filter((topic) => preferredTopics.has(topic.toLocaleLowerCase()));
      const adjustment = feedbackAdjustment(item, sharedTopics, input.tasteSignals);
      const score = Math.min(100, Math.max(0, Math.round(item.confidence * 100) + sharedTopics.length * 15 + adjustment.points));
      return { item, sharedTopics, score, adjustment };
    })
    .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
    .slice(0, input.limit);

  const coverage = input.preferredTopics.reduce<NuruDiscoverSession["coverage"]>((result, topic) => {
    const normalizedTopic = topic.trim().toLocaleLowerCase();
    if (!normalizedTopic) return result;
    const itemCount = catalog.filter((item) => item.topics.some((itemTopic) => itemTopic.trim().toLocaleLowerCase() === normalizedTopic)).length;
    if (itemCount) result.matchedTopics.push({ topic: topic.trim(), itemCount });
    else result.unmatchedTopics.push(topic.trim());
    return result;
  }, { matchedTopics: [], unmatchedTopics: [] });

  return {
    rankingVersion: "discover-deterministic-v1",
    coverage,
    recommendations: candidates.map(({ item, score, sharedTopics, adjustment }, position) => {
      const lane = laneFor(position, sharedTopics, hasPreferences);
      const reasonCodes = ["HUMAN_ADMITTED_CATALOG", "PROVENANCE_VERIFIED"];
      if (sharedTopics.length > 0) reasonCodes.push("TOPIC_AFFINITY");
      else if (!hasPreferences) reasonCodes.push("QUALITY_FIRST_NO_PREFERENCE_PROFILE");
      else reasonCodes.push(lane === "SERENDIPITY" ? "BOUNDED_EXPLORATION" : "NOVELTY_BALANCE");
      reasonCodes.push(...adjustment.reasonCodes);

      return {
        item,
        lane,
        score,
        explanation: {
          reasonCodes,
          supportingTopics: sharedTopics,
          sourceStatus: "PROVENANCE_VERIFIED",
          confidence: item.confidence,
          rankingVersion: "discover-deterministic-v1",
          summary: sharedTopics.length > 0
            ? `Matches your stated interest in ${sharedTopics.join(", ")}. This item was explicitly admitted to Discover with verified provenance.`
            : adjustment.reasonCodes.length ? `Nuru adjusted this using your visible ${adjustment.reasonCodes.map((code) => code.replaceAll("_", " ").toLowerCase()).join(", ")} signals, alongside verified provenance.` : "This item was explicitly admitted to Discover with verified provenance and is ranked by its documented confidence.",
        },
      };
    }),
  };
}
