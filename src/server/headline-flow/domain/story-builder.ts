import { createHash } from "node:crypto";
import type { CanonicalArticle, CanonicalStory, StoryPackage } from "@/src/server/headline-flow/domain/types";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function titleKey(title: string) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "its",
  "new",
  "of",
  "on",
  "or",
  "over",
  "says",
  "the",
  "to",
  "with",
]);

const HIGH_IMPACT_TERMS = new Set([
  "attack",
  "ban",
  "bill",
  "crisis",
  "deal",
  "election",
  "emergency",
  "evacuation",
  "flood",
  "killed",
  "lawsuit",
  "outage",
  "recall",
  "resigns",
  "strike",
  "tariff",
  "war",
]);

const BREAKING_TERMS = new Set(["breaking", "earthquake", "explosion", "hurricane", "shooting", "wildfire"]);

const TRUSTED_SOURCE_TERMS = new Map([
  ["associated press", 30],
  ["ap news", 30],
  ["reuters", 30],
  ["bbc", 24],
  ["npr", 22],
  ["pbs", 20],
  ["techcrunch", 16],
  ["espn", 14],
  ["sciencedaily", 14],
]);

function titleTokens(title: string) {
  return titleKey(title)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenOverlapScore(a: string[], b: string[]) {
  if (!a.length || !b.length) {
    return 0;
  }
  const bSet = new Set(b);
  const overlap = a.filter((token) => bSet.has(token)).length;
  return overlap / Math.min(a.length, b.length);
}

function sourceAuthorityScore(article: CanonicalArticle) {
  const sourceName = article.source.name.toLowerCase();
  for (const [term, score] of TRUSTED_SOURCE_TERMS) {
    if (sourceName.includes(term)) {
      return score;
    }
  }
  return article.canonicalUrl ? 8 : 0;
}

function storySourceCount(story: CanonicalStory) {
  return new Set(story.articles.map((article) => article.source.id)).size;
}

function storyImpactTerms(story: Pick<CanonicalStory, "headline" | "summary">) {
  const text = `${story.headline} ${story.summary}`.toLowerCase();
  return Array.from(HIGH_IMPACT_TERMS).filter((term) => text.includes(term));
}

function storyImportance(input: { headline: string; summary: string; sourceCount: number }): CanonicalStory["importance"] {
  const text = `${input.headline} ${input.summary}`.toLowerCase();
  if (Array.from(BREAKING_TERMS).some((term) => text.includes(term))) {
    return "breaking";
  }
  if (input.sourceCount > 1 || storyImpactTerms(input).length > 0) {
    return "important";
  }
  return "awareness";
}

function freshnessMetadata(story: CanonicalStory, now: Date): StoryPackage["displayMetadata"]["freshness"] {
  const ageMinutes = Math.max(0, Math.round((now.getTime() - story.lastPublishedAt.getTime()) / 60_000));
  if (ageMinutes <= 180) {
    return { bucket: "live", label: "Live", ageMinutes };
  }
  if (ageMinutes <= 24 * 60) {
    return { bucket: "today", label: "Today", ageMinutes };
  }
  return { bucket: "past_48h", label: "Past 48h", ageMinutes };
}

function freshnessScore(story: CanonicalStory, now: Date) {
  const ageMinutes = freshnessMetadata(story, now).ageMinutes;
  if (ageMinutes <= 180) {
    return 60_000_000;
  }
  if (ageMinutes <= 720) {
    return 46_000_000;
  }
  if (ageMinutes <= 1_440) {
    return 32_000_000;
  }
  return 18_000_000;
}

function storyQualityScore(story: CanonicalStory, now: Date) {
  const sourceCount = storySourceCount(story);
  const sourceScore = Math.min(sourceCount, 4) * 70_000_000;
  const authorityScore = story.articles.reduce((total, article) => total + sourceAuthorityScore(article), 0) * 1_000_000;
  const imageScore = story.articles.some((article) => article.imageUrl) ? 2_000_000 : 0;
  const importanceScore = story.importance === "breaking" ? 16_000_000 : story.importance === "important" ? 9_000_000 : 0;
  return sourceScore + authorityScore + imageScore + importanceScore + freshnessScore(story, now);
}

function briefingScore(story: CanonicalStory, now: Date) {
  const sourceCount = storySourceCount(story);
  const sourceSignal = Math.min(sourceCount, 4) * 18;
  const authoritySignal = Math.min(story.articles.reduce((total, article) => total + sourceAuthorityScore(article), 0), 36);
  const importanceSignal = story.importance === "breaking" ? 26 : story.importance === "important" ? 16 : 6;
  const mediaSignal = story.articles.some((article) => article.imageUrl) ? 6 : 0;
  const freshnessMinutes = freshnessMetadata(story, now).ageMinutes;
  const freshnessSignal = freshnessMinutes <= 120 ? 14 : freshnessMinutes <= 720 ? 10 : freshnessMinutes <= 2_880 ? 6 : 2;
  return Math.max(1, Math.min(100, sourceSignal + authoritySignal + importanceSignal + mediaSignal + freshnessSignal));
}

function rankingReason(input: { sourceCount: number; hasImage: boolean; impactTerms: string[]; topSource: string }) {
  const reasons = [];
  if (input.sourceCount > 1) {
    reasons.push(`${input.sourceCount} sources are tracking the same story`);
  } else {
    reasons.push(`Recent reporting from ${input.topSource}`);
  }
  if (input.impactTerms.length) {
    reasons.push(`impact signals: ${input.impactTerms.slice(0, 3).join(", ")}`);
  }
  if (input.hasImage) {
    reasons.push("article media available");
  }
  return reasons.join("; ") + ".";
}

function prioritySignals(story: CanonicalStory, now: Date) {
  const signals = [];
  const sourceCount = storySourceCount(story);
  const freshness = freshnessMetadata(story, now);
  if (freshness.bucket === "live") {
    signals.push("Live current event");
  } else if (freshness.bucket === "today") {
    signals.push("Today");
  } else {
    signals.push("Past 48h");
  }
  if (story.importance === "breaking") {
    signals.push("Breaking impact terms detected");
  } else if (story.importance === "important") {
    signals.push("High-impact current event");
  }
  if (sourceCount > 1) {
    signals.push(`${sourceCount} independent sources`);
  }
  const authoritySources = story.articles
    .filter((article) => sourceAuthorityScore(article) >= 20)
    .map((article) => article.source.name);
  if (authoritySources.length) {
    signals.push(`Authority source: ${authoritySources[0]}`);
  }
  if (story.articles.some((article) => article.imageUrl)) {
    signals.push("Article media available");
  }
  if (story.status === "developing") {
    signals.push("Developing story to monitor");
  }
  return signals.slice(0, 5);
}

function whyStoryMatters(story: CanonicalStory) {
  const topicReasons: Record<CanonicalStory["topic"], string> = {
    world: "It may affect international stability, alliances, migration, trade, or regional security.",
    politics: "It can shift policy direction, public trust, civic priorities, or institutional power.",
    business: "It can affect markets, prices, jobs, investment decisions, or consumer behavior.",
    technology: "It may change the tools, platforms, privacy expectations, or infrastructure people rely on.",
    science: "It can alter what experts know, what institutions prepare for, or which risks deserve attention.",
    health: "It can affect personal choices, public readiness, care delivery, or community safety.",
    sports: "It shapes the competitive picture, fan attention, scheduling, or major cultural moments.",
    entertainment: "It reflects shifts in culture, media behavior, public attention, or creative industries.",
    general: "It is timely, source-backed, and relevant to the broader briefing picture.",
  };
  const sourceCount = storySourceCount(story);
  const confidenceClause = sourceCount > 1
    ? `${sourceCount} sources are converging on the same event`
    : `${story.articles[0]?.source.name ?? "a source"} is reporting a developing event`;
  return `${confidenceClause}. ${topicReasons[story.topic]}`;
}

function rawString(article: CanonicalArticle, key: string) {
  const value = article.rawReference?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function storyGroupKey(article: CanonicalArticle, groups: Map<string, CanonicalArticle[]>) {
  const articleTokens = titleTokens(article.title);
  for (const [key, group] of groups) {
    const representative = group[0];
    if (!representative) {
      continue;
    }
    const sameTopic = representative.topics.some((topic) => article.topics.includes(topic));
    if (!sameTopic) {
      continue;
    }
    const representativeTokens = titleTokens(representative.title);
    if (tokenOverlapScore(articleTokens, representativeTokens) >= 0.62) {
      return key;
    }
  }
  return titleKey(article.title) || article.fingerprint;
}

export function dedupeArticles(articles: CanonicalArticle[]) {
  const unique: CanonicalArticle[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  for (const article of articles) {
    const key = article.canonicalUrl || article.fingerprint;
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    unique.push(article);
  }
  return { articles: unique, duplicateCount };
}

export function buildStories(articles: CanonicalArticle[], now = new Date()): CanonicalStory[] {
  const groups = new Map<string, CanonicalArticle[]>();
  for (const article of articles) {
    const key = storyGroupKey(article, groups);
    groups.set(key, [...(groups.get(key) || []), article]);
  }

  return Array.from(groups.values()).map((group) => {
    const articlesByQuality = [...group].sort((a, b) => {
      const authorityDelta = sourceAuthorityScore(b) - sourceAuthorityScore(a);
      if (authorityDelta !== 0) {
        return authorityDelta;
      }
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
    const articlesByRecency = [...group].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const leadArticle = articlesByQuality[0]!;
    const newestArticle = articlesByRecency[0]!;
    const oldestArticle = articlesByRecency[articlesByRecency.length - 1]!;
    const sourceCount = new Set(articlesByQuality.map((article) => article.source.id)).size;
    const status: CanonicalStory["status"] = sourceCount > 1 ? "confirmed" : "developing";
    const confidence: CanonicalStory["confidence"] = sourceCount > 1 ? "multi_source" : "single_source";
    const summary = leadArticle.description || `Latest reporting from ${leadArticle.source.name}.`;
    const impactTerms = storyImpactTerms({ headline: leadArticle.title, summary });
    return {
      id: `story_${hash(articlesByQuality.map((article) => article.id).sort().join("|"))}`,
      headline: leadArticle.title,
      summary,
      topic: leadArticle.topics[0] || "general",
      status,
      importance: storyImportance({ headline: leadArticle.title, summary, sourceCount }),
      confidence,
      articles: articlesByQuality,
      firstPublishedAt: oldestArticle.publishedAt,
      lastPublishedAt: newestArticle.publishedAt,
      rankingReason: rankingReason({
        sourceCount,
        hasImage: articlesByQuality.some((article) => article.imageUrl),
        impactTerms,
        topSource: leadArticle.source.name,
      }),
    };
  }).sort((a, b) => {
    const scoreDelta = storyQualityScore(b, now) - storyQualityScore(a, now);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return b.lastPublishedAt.getTime() - a.lastPublishedAt.getTime();
  });
}

export function buildStoryPackage(story: CanonicalStory, now = new Date()): StoryPackage {
  const sources = Array.from(new Map(story.articles.map((article) => [article.source.id, article.source])).values());
  const heroImageArticle = story.articles.find((article) => article.imageUrl);
  const heroImageUrl = heroImageArticle?.imageUrl || null;
  const freshness = freshnessMetadata(story, now);
  const score = briefingScore(story, now);
  return {
    id: `package_${story.id}`,
    eventId: story.id,
    headline: story.headline,
    shortSummary: story.summary,
    narration: `${story.headline}. ${story.summary}`,
    topic: story.topic,
    importance: story.importance,
    confidence: story.confidence,
    status: story.status,
    sourceSummary: sources.map((source) => source.name).join(" • "),
    sourceCount: sources.length,
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      url: source.url,
    })),
    publishedAt: story.firstPublishedAt.toISOString(),
    updatedAt: story.lastPublishedAt.toISOString(),
    displayMetadata: {
      rankingReason: story.rankingReason,
      briefingScore: score,
      prioritySignals: prioritySignals(story, now),
      personalizationReason: null,
      rankingAudit: {
        baseScore: score,
        personalizationBoost: 0,
        finalScore: score,
        originalRank: 0,
        personalizedRank: 0,
      },
      whyItMatters: whyStoryMatters(story),
      articleCount: story.articles.length,
      heroImageUrl,
      freshness,
      imageProvenance: {
        status: heroImageUrl ? "article" : "topic_fallback",
        sourceName: heroImageArticle?.source.name ?? null,
        articleUrl: heroImageArticle?.canonicalUrl ?? null,
        imageUrl: heroImageUrl,
      },
      sourceTrail: story.articles.map((article) => ({
        sourceName: article.source.name,
        articleUrl: article.canonicalUrl,
        publishedAt: article.publishedAt.toISOString(),
        providerId: article.providerId,
        discoveryProvider: rawString(article, "discoveryProvider"),
        feedUrl: rawString(article, "feedUrl"),
        originalUrl: rawString(article, "originalUrl"),
        linkResolutionStatus: rawString(article, "linkResolutionStatus"),
        imageUrl: article.imageUrl,
      })),
    },
  };
}
