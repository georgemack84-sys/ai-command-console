import Parser from "rss-parser";
import type { NewsProvider } from "@/lib/news/providers/NewsProvider";
import type { RawNewsStory } from "@/types/headline";

const DEFAULT_FEEDS = "https://feeds.bbci.co.uk/news/rss.xml";

type RssItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
  enclosure?: { url?: string };
};

export class RssNewsProvider implements NewsProvider {
  readonly name = "rss";
  readonly kind = "rss" as const;
  private readonly parser = new Parser();

  isConfigured() {
    return Boolean(process.env.NEWS_RSS_FEEDS || DEFAULT_FEEDS);
  }

  async health() {
    const feeds = getFeeds();
    return {
      name: this.name,
      kind: this.kind,
      configured: feeds.length > 0,
      status: feeds.length > 0 ? ("ok" as const) : ("unconfigured" as const),
      message: feeds.length > 0 ? `${feeds.length} RSS feed(s) configured.` : "No RSS feeds configured.",
      checkedAt: new Date().toISOString(),
    };
  }

  async getHeadlines(input: { category?: string; limit?: number }) {
    const feeds = getFeeds();
    const timeoutMs = Number(process.env.NEWS_PROVIDER_TIMEOUT_MS || 7000);
    const stories: RawNewsStory[] = [];

    for (const feedUrl of feeds.slice(0, 4)) {
      const feed = await withTimeout(this.parser.parseURL(feedUrl), timeoutMs);
      const sourceName = feed.title || new URL(feedUrl).hostname;
      for (const item of (feed.items as RssItem[]).slice(0, input.limit ?? 25)) {
        stories.push({
          title: item.title,
          summary: item.contentSnippet || stripHtml(item.content || ""),
          sourceName,
          sourceType: "RSS",
          category: input.category || "top",
          publishedAt: item.isoDate || item.pubDate,
          articleUrl: item.link,
          imageUrl: item.enclosure?.url,
          providerName: this.name,
          sourceUrl: feedUrl,
          importanceScore: 60,
          freshnessScore: 60,
        });
      }
    }

    return stories.slice(0, input.limit ?? 25);
  }
}

function getFeeds() {
  return (process.env.NEWS_RSS_FEEDS || DEFAULT_FEEDS)
    .split(",")
    .map((feed) => feed.trim())
    .filter(Boolean);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("News provider timed out.")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
