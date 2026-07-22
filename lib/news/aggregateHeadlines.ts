import { cached } from "@/lib/news/cache";
import { createConfiguredProviders } from "@/lib/news/providers";
import type { RawNewsStory } from "@/types/headline";

export type AggregatedHeadlines = {
  stories: RawNewsStory[];
  providers: Array<{ name: string; status: "fulfilled" | "rejected"; count: number; error?: string }>;
  sourceStats: Array<{ sourceName: string; count: number; providers: string[] }>;
};

export async function aggregateHeadlines(input: { category?: string; limit?: number; query?: string; location?: string; forceMock?: boolean }): Promise<AggregatedHeadlines> {
  const providers = createConfiguredProviders(input.forceMock);
  const cacheKey = `headlines:${providers.map((provider) => provider.name).join(",")}:${input.category || "top"}:${input.query || ""}:${input.location || ""}:${input.limit || 25}`;
  const ttlMs = Number(process.env.NEWS_CACHE_TTL_MS || 90000);
  return cached(cacheKey, ttlMs, async () => {
    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          return {
            status: "fulfilled" as const,
            provider,
            stories: await provider.getHeadlines({ category: input.category, limit: input.limit, query: input.query, location: input.location }),
          };
        } catch (error) {
          return {
            status: "rejected" as const,
            provider,
            stories: [],
            error: error instanceof Error ? error.message : "Provider failed",
          };
        }
      }),
    );

    const providerStats: AggregatedHeadlines["providers"] = [];
    const stories: RawNewsStory[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        providerStats.push({ name: result.provider.name, status: "fulfilled", count: result.stories.length });
        stories.push(...result.stories.map((story) => ({ ...story, providerName: story.providerName || result.provider.name })));
      } else {
        providerStats.push({ name: result.provider.name, status: "rejected", count: 0, error: result.error });
      }
    }

    const queryMatchedStories = input.query ? stories.filter((story) => story.providerName === "web-search") : [];
    const selectedStories = queryMatchedStories.length ? queryMatchedStories : stories;

    const liveOnly = providers.some((provider) => provider.name !== "mock");
    if (!selectedStories.length && liveOnly) {
      return {
        stories: [],
        providers: providerStats,
        sourceStats: [],
      };
    }

    if (!selectedStories.length && !input.forceMock) {
      return aggregateHeadlines({ ...input, forceMock: true });
    }

    return {
      stories: selectedStories,
      providers: providerStats,
      sourceStats: buildSourceStats(selectedStories),
    };
  });
}

function buildSourceStats(stories: RawNewsStory[]) {
  const map = new Map<string, { sourceName: string; count: number; providers: Set<string> }>();
  for (const story of stories) {
    const sourceName = story.sourceName || "Unknown Source";
    const current = map.get(sourceName) || { sourceName, count: 0, providers: new Set<string>() };
    current.count += 1;
    if (story.providerName) current.providers.add(story.providerName);
    map.set(sourceName, current);
  }
  return [...map.values()].map((item) => ({ sourceName: item.sourceName, count: item.count, providers: [...item.providers] }));
}
