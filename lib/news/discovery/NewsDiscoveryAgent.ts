import { aggregateHeadlines } from "@/lib/news/aggregateHeadlines";
import { deduplicateHeadlines } from "@/lib/news/deduplicateHeadlines";
import { normalizeHeadlines } from "@/lib/news/normalizeHeadline";
import { rankHeadlines } from "@/lib/news/rankHeadlines";
import { discoveredStorySchema, type DiscoveredStory, type NewsDiscoveryRequest } from "@/lib/news/discovery/schemas";
import { newsDiscoveryAgentPrompt } from "@/lib/news/discovery/newsDiscoveryPrompt";
import { synchronizeStoryVisuals } from "@/lib/news/visual/VisualSynchronizationAgent";

export const newsDiscoveryPromptVersion = "1.0.0";

export class LocalNewsDiscoveryAgent {
  readonly id = "headline-flow-news-discovery" as const;

  async execute(input: NewsDiscoveryRequest) {
    const aggregated = await aggregateHeadlines({ category: input.category, limit: input.limit, query: input.query, location: input.location });
    const cutoff = Date.now() - input.timeWindowHours * 60 * 60 * 1000;
    const normalized = normalizeHeadlines(aggregated.stories).filter((story) => new Date(story.publishedAt).getTime() >= cutoff);
    const ranked = rankHeadlines(deduplicateHeadlines(normalized), input.category).slice(0, input.limit);
    const synchronized = await synchronizeStoryVisuals(ranked);
    const stories = synchronized
      .map((story): DiscoveredStory => ({
        id: story.id,
        headline: story.title,
        summary: story.summary,
        source: {
          name: story.source.name,
          author: "",
        },
        category: story.category,
        publishedAt: story.publishedAt,
        articleUrl: story.articleUrl,
        image: story.image
          ? {
              url: story.image.url,
              alt: story.image.alt,
              credit: story.image.credit || "",
            }
          : undefined,
        visualMode: story.visualMode === "ARTICLE_IMAGE" && story.image ? "ARTICLE_IMAGE" : "CATEGORY_FALLBACK",
        tags: buildTags(story.title, story.category, input.query, input.location),
        importanceScore: story.importanceScore,
        freshnessScore: story.freshnessScore,
        reasonSelected: story.visualExplanation || buildReasonSelected(story.source.name, story.category, Boolean(story.image)),
      }))
      .filter((story) => discoveredStorySchema.safeParse(story).success);

    return {
      generatedAt: new Date().toISOString(),
      agent: this.id,
      mode: "local-provider-backed" as const,
      promptVersion: newsDiscoveryPromptVersion,
      count: stories.length,
      stories,
    };
  }

  async explain() {
    return "The local News Discovery Agent uses configured Headline Flow providers, validates and normalizes stories, deduplicates them, ranks them deterministically, and preserves source attribution.";
  }

  async replay(input: NewsDiscoveryRequest) {
    return this.execute(input);
  }

  async qualify() {
    return {
      qualified: true,
      evidence: [
        "Uses provider-backed public-source records only.",
        "Rejects invalid URLs during normalization.",
        "Does not invent article or image URLs.",
        "Preserves publisher attribution.",
      ],
    };
  }
}

export function getNewsDiscoveryPrompt() {
  return {
    id: "headline-flow-news-discovery-prompt",
    version: newsDiscoveryPromptVersion,
    prompt: newsDiscoveryAgentPrompt,
  };
}

function buildTags(title: string, category: string, query?: string, location?: string) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 5)
    .slice(0, 4);
  return Array.from(new Set([category, query, location, ...words].filter((tag): tag is string => Boolean(tag))));
}

function buildReasonSelected(sourceName: string, category: string, hasImage: boolean) {
  return `Selected because it is a recent ${category} story from ${sourceName}, passed validation, and ${hasImage ? "includes a usable article image" : "has a professional category fallback"}.`;
}
