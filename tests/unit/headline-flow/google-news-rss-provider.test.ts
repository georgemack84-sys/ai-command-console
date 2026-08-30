import { describe, expect, it, vi } from "vitest";
import { GoogleNewsRssProvider } from "@/src/server/headline-flow/providers/google-news-rss-provider";

const NOW = new Date("2026-08-27T12:00:00.000Z");

function response(xml: string) {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    text: async () => xml,
  } as Response;
}

function redirect(location: string) {
  return {
    ok: false,
    status: 302,
    headers: new Headers({ location }),
    text: async () => "",
  } as Response;
}

describe("GoogleNewsRssProvider", () => {
  it("returns current RSS articles with topic coverage diagnostics", async () => {
    const fetcher = vi.fn(async () => response("<rss></rss>"));
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async () => ({
        title: "Google News - world news",
        items: [
          {
            title: "World article headline - Example Source",
            link: "https://example.com/2026/08/27/world-article-headline-current-event",
            guid: "world-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            contentSnippet: "A current world article.",
            enclosure: {
              url: "https://cdn.example.com/images/world-article.jpg",
              type: "image/jpeg",
            },
            source: "Example Source",
          },
          {
            title: "Homepage should be rejected",
            link: "https://example.com",
            guid: "bad-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Example Source",
          },
          {
            title: "LIVE: Watch updates now",
            link: "https://example.com/2026/08/27/live-watch-updates-now",
            guid: "live-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Example Source",
          },
        ],
      }),
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "world", limit: 5 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      providerId: "rss",
      sourceName: "Example Source",
      title: "World article headline",
      canonicalUrl: "https://example.com/2026/08/27/world-article-headline-current-event",
      imageUrl: "https://cdn.example.com/images/world-article.jpg",
      topics: ["world"],
    });
    expect(diagnostics).toMatchObject({
      discoveryStrategy: "rss_targeted",
      imageExtraction: {
        attempted: 2,
        found: 2,
        fallback: 0,
        rejected: 0,
      },
      rejectedArticleUrls: [
        { reason: "homepage" },
        { reason: "live_or_video_item" },
        { reason: "homepage" },
        { reason: "live_or_video_item" },
      ],
      topicCoverage: {
        attemptedTopics: ["world"],
        fulfilledTopics: ["world"],
        topicArticleCounts: {
          world: 1,
        },
        lowYieldTopics: [],
        failedTopics: [],
      },
      freshnessWindowHours: 48,
    });
  });

  it("fans out RSS searches across subjects for all mode", async () => {
    const fetcher = vi.fn(async () => response("<rss></rss>"));
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async () => ({
        items: [
          {
            title: "Current article headline",
            link: "https://example.com/2026/08/27/current-article-headline-for-topic",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Example Source",
          },
        ],
      }),
    });

    const articles = await provider.fetchLatest({ now: NOW, limit: 18 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(fetcher).toHaveBeenCalledTimes(18);
    expect(articles).toHaveLength(9);
    expect(diagnostics.discoveryStrategy).toBe("rss_broad");
    expect(diagnostics.topicCoverage?.attemptedTopics).toHaveLength(9);
    expect(diagnostics.topicCoverage?.fulfilledTopics).toHaveLength(9);
    expect(diagnostics.topicCoverage?.lowYieldTopics).toEqual([]);
    expect(diagnostics.topicCoverage?.topicArticleCounts).toMatchObject({
      world: 1,
      politics: 1,
      business: 1,
      technology: 1,
      science: 1,
      health: 1,
      sports: 1,
      entertainment: 1,
      general: 1,
    });
    expect(diagnostics.freshnessWindowHours).toBe(48);
    expect(diagnostics.rawResponse).toMatchObject({
      responseCount: 18,
      parsedArticleCount: 18,
    });
    expect(diagnostics.linkResolution?.direct).toBe(18);
    expect(diagnostics.imageExtraction).toMatchObject({
      attempted: 18,
      found: 0,
      fallback: 18,
    });
  });

  it("interleaves broad RSS results so later subjects are not starved by the limit", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => response(`<rss>${String(url)}</rss>`));
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async (xml: string) => {
        const topic = ["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"]
          .find((candidate) => xml.includes(candidate)) ?? "general";

        return {
          items: [1, 2].map((index) => ({
            title: `${topic} article ${index} - Example Source`,
            link: `https://example.com/2026/08/27/${topic}-article-${index}-current-event`,
            guid: `${topic}-${index}`,
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Example Source",
          })),
        };
      },
    });

    const articles = await provider.fetchLatest({ now: NOW, limit: 9 });

    expect(articles).toHaveLength(9);
    expect(articles.map((article) => article.topics[0])).toEqual([
      "world",
      "politics",
      "business",
      "technology",
      "science",
      "health",
      "sports",
      "entertainment",
      "general",
    ]);
  });

  it("extracts Media RSS thumbnails and rejects unsafe image URLs", async () => {
    const fetcher = vi.fn(async () => response("<rss></rss>"));
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async () => ({
        title: "Google News - science news",
        items: [
          {
            title: "Science image story - Example Source",
            link: "https://example.com/2026/08/27/science-image-story-current-event",
            guid: "science-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            mediaThumbnail: [{ $: { url: "http://127.0.0.1/private.jpg" } }, { $: { url: "https://images.example.com/science.jpg" } }],
            source: "Example Source",
          },
        ],
      }),
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "science", limit: 1 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(articles).toHaveLength(1);
    expect(articles[0]?.imageUrl).toBe("https://images.example.com/science.jpg");
    expect(diagnostics.imageExtraction).toMatchObject({
      attempted: 1,
      found: 1,
      fallback: 0,
      rejected: 1,
    });
  });

  it("resolves Google News RSS article links to publisher URLs", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("https://news.google.com/rss/articles/")) {
        return redirect("https://publisher.example.com/2026/08/27/current-event-story");
      }
      return response("<rss></rss>");
    });
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async () => ({
        title: "Google News - technology news",
        items: [
          {
            title: "Current event story - Publisher",
            link: "https://news.google.com/rss/articles/current-event-story",
            guid: "tech-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Publisher",
          },
        ],
      }),
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "technology", limit: 1 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(articles).toHaveLength(1);
    expect(articles[0]?.canonicalUrl).toBe("https://publisher.example.com/2026/08/27/current-event-story");
    expect(articles[0]?.sourceUrl).toBe("https://publisher.example.com/2026/08/27/current-event-story");
    expect(diagnostics.linkResolution).toMatchObject({
      attempted: 1,
      resolved: 1,
      unresolved: 0,
      rejected: 0,
    });
  });

  it("rejects unsafe Google News redirect targets", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("https://news.google.com/rss/articles/")) {
        return redirect("http://127.0.0.1/private");
      }
      return response("<rss></rss>");
    });
    const provider = new GoogleNewsRssProvider(fetcher as unknown as typeof fetch, {
      parseString: async () => ({
        title: "Google News - business news",
        items: [
          {
            title: "Current business story - Publisher",
            link: "https://news.google.com/rss/articles/current-business-story",
            guid: "business-1",
            pubDate: "Thu, 27 Aug 2026 10:30:00 GMT",
            source: "Publisher",
          },
        ],
      }),
    });

    const articles = await provider.fetchLatest({ now: NOW, topic: "business", limit: 1 });
    const diagnostics = provider.getRuntimeDiagnostics();

    expect(articles).toHaveLength(0);
    expect(diagnostics.linkResolution).toMatchObject({
      attempted: 2,
      resolved: 0,
      rejected: 2,
    });
    expect(diagnostics.rejectedArticleUrls).toMatchObject([
      { reason: "link_resolution_unsafe_redirect" },
      { reason: "link_resolution_unsafe_redirect" },
    ]);
  });
});
