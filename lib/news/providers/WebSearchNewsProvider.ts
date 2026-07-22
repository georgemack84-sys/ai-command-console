import Parser from "rss-parser";
import type { NewsProvider, NewsProviderHealth } from "@/lib/news/providers/NewsProvider";
import type { RawNewsStory } from "@/types/headline";

type SearchRssItem = {
  title?: string;
  link?: string;
  guid?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
};

const categoryTopicPools: Record<string, string[]> = {
  top: [
    "breaking news",
    "top stories",
    "public interest",
    "major developments",
    "latest updates",
    "global headlines",
    "national headlines",
    "developing story",
  ],
  world: [
    "world news",
    "international relations",
    "global economy",
    "conflict diplomacy",
    "elections abroad",
    "humanitarian crisis",
    "climate impacts",
    "migration",
    "security",
    "trade",
  ],
  business: [
    "business",
    "markets",
    "economy",
    "earnings",
    "startups",
    "mergers acquisitions",
    "labor",
    "inflation",
    "supply chain",
    "real estate",
    "banking",
    "energy markets",
  ],
  technology: [
    "technology",
    "artificial intelligence",
    "cybersecurity",
    "semiconductors",
    "startups",
    "consumer technology",
    "cloud computing",
    "robotics",
    "privacy",
    "social media",
    "software",
    "space technology",
  ],
  science: [
    "science",
    "space",
    "astronomy",
    "climate science",
    "physics",
    "biology",
    "archaeology",
    "ocean research",
    "NASA",
    "public research",
    "environment",
    "scientific discovery",
  ],
  health: [
    "health",
    "medicine",
    "public health",
    "medical research",
    "hospitals",
    "mental health",
    "nutrition",
    "drug approvals",
    "disease outbreak",
    "health policy",
    "biotech",
    "patient care",
  ],
  politics: [
    "politics",
    "government",
    "elections",
    "policy",
    "congress",
    "courts",
    "regulation",
    "campaign",
    "state government",
    "public polling",
    "foreign policy",
    "budget",
  ],
  sports: [
    "sports",
    "football",
    "basketball",
    "baseball",
    "soccer",
    "tennis",
    "golf",
    "olympics",
    "college sports",
    "player safety",
    "playoffs",
    "sports business",
  ],
  entertainment: [
    "entertainment",
    "movies",
    "television",
    "streaming",
    "music",
    "culture",
    "media business",
    "box office",
    "awards",
    "publishing",
    "video games",
    "celebrity interview",
  ],
  local: [
    "local news",
    "city council",
    "public schools",
    "transportation",
    "housing",
    "public safety",
    "local business",
    "weather impacts",
    "community health",
    "regional economy",
    "infrastructure",
    "county government",
  ],
};

const categoryAnchorQueries: Record<string, string[]> = {
  top: ["latest news", "breaking news", "today's top news"],
  local: ["local news United States", "city local news", "regional news today"],
  business: ["business news", "markets news", "economy news"],
  technology: ["technology news", "tech news", "artificial intelligence news"],
  science: ["science news", "space news", "research news"],
  health: ["health news", "medical news", "public health news"],
  politics: ["politics news", "government news", "election news"],
  sports: ["sports news", "football basketball baseball news", "sports latest"],
  entertainment: ["entertainment news", "movies television music news", "streaming media news"],
  world: ["world news", "international news", "global news"],
};

const categoryFallbackFeeds: Record<string, string[]> = {
  top: ["https://feeds.bbci.co.uk/news/rss.xml", "https://feeds.npr.org/1001/rss.xml"],
  local: ["https://feeds.npr.org/1003/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/US.xml"],
  business: ["https://feeds.bbci.co.uk/news/business/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"],
  technology: ["https://feeds.bbci.co.uk/news/technology/rss.xml", "https://www.theverge.com/rss/index.xml"],
  science: ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml"],
  health: ["https://feeds.bbci.co.uk/news/health/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml"],
  politics: ["https://feeds.npr.org/1014/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"],
  sports: ["https://feeds.bbci.co.uk/sport/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml"],
  entertainment: ["https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml"],
  world: ["https://feeds.bbci.co.uk/news/world/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"],
};

export class WebSearchNewsProvider implements NewsProvider {
  readonly name = "web-search";
  readonly kind = "rss" as const;
  private readonly parser = new Parser();

  isConfigured() {
    return true;
  }

  async health(): Promise<NewsProviderHealth> {
    return {
      name: this.name,
      kind: this.kind,
      configured: true,
      status: "ok",
      message: "Bing News RSS search is available without credentials and prefers publisher article URLs.",
      checkedAt: new Date().toISOString(),
    };
  }

  async getHeadlines(input: { category?: string; limit?: number; query?: string; location?: string }) {
    const limit = input.limit ?? 25;
    const queries = buildSearchQueries(input);
    const timeoutMs = Number(process.env.WEB_NEWS_SEARCH_TIMEOUT_MS || process.env.NEWS_PROVIDER_TIMEOUT_MS || 12000);
    const maxAgeHours = Number(process.env.WEB_NEWS_MAX_AGE_HOURS || 48);
    const feedResults = await Promise.allSettled(
      queries.map((query) => withTimeout(this.parser.parseURL(buildSearchUrl(query)), timeoutMs)),
    );
    const stories = (
      await Promise.all(
        feedResults.flatMap((result) => {
          if (result.status !== "fulfilled") return [];
          const feed = result.value;
          return (feed.items as SearchRssItem[]).slice(0, Math.ceil(limit / queries.length) + 3).map(async (item): Promise<RawNewsStory> => {
            const parsed = parseGoogleNewsTitle(item.title || "");
            const articleUrl = await resolveArticleUrl(item.link || item.guid);
            const sourceName = normalizeSourceName(parsed.sourceName, articleUrl, feed.title);
            return {
              title: parsed.title || item.title,
              summary: item.contentSnippet || stripHtml(item.content || "") || buildSummary(sourceName),
              sourceName,
              sourceType: "Web Search",
              category: input.category || "top",
              publishedAt: item.isoDate || item.pubDate,
              articleUrl,
              providerName: this.name,
              sourceUrl: articleUrl ? originOf(articleUrl) : undefined,
              importanceScore: scoreImportance(sourceName),
              freshnessScore: 76,
            };
          });
        }),
      )
    ).slice(0, limit * 2);
    const relevantStories = stories.filter((story) => isRelevantStory(story, input));
    const relevanceScopedStories = relevantStories.length ? relevantStories : stories;
    const freshStories = relevanceScopedStories.filter((story) => isFreshStory(story, maxAgeHours));
    const candidates = freshStories.length ? freshStories : relevanceScopedStories.filter((story) => isFreshStory(story, maxAgeHours * 2));
    const scopedStories = candidates.length ? candidates : [];
    let directPublisherArticles = scopedStories.filter(
      (story) =>
        story.articleUrl &&
        !isAggregatorUrl(story.articleUrl) &&
        looksLikeArticleUrl(story.articleUrl) &&
        looksLikeArticleTitle(story.title),
    );
    if (directPublisherArticles.length < limit && !input.query) {
      const fallbackStories = await this.getCategoryFallbackArticles(input.category || "top", limit, timeoutMs, maxAgeHours);
      directPublisherArticles = uniqueByUrl([...directPublisherArticles, ...fallbackStories]);
    }
    return uniqueByUrl(directPublisherArticles).slice(0, limit);
  }

  private async getCategoryFallbackArticles(category: string, limit: number, timeoutMs: number, maxAgeHours: number) {
    const feeds = categoryFallbackFeeds[category] || categoryFallbackFeeds.top;
    const feedResults = await Promise.allSettled(feeds.map((feedUrl) => withTimeout(this.parser.parseURL(feedUrl), timeoutMs)));
    const stories = feedResults.flatMap((result): RawNewsStory[] => {
      if (result.status !== "fulfilled") return [];
      const feed = result.value;
      return (feed.items as SearchRssItem[]).slice(0, limit).map((item) => {
        const parsed = parseGoogleNewsTitle(item.title || "");
        const articleUrl = extractTargetUrl(item.link || item.guid);
        const sourceName = normalizeSourceName(parsed.sourceName, articleUrl, feed.title);
        return {
          title: parsed.title || item.title,
          summary: item.contentSnippet || stripHtml(item.content || "") || buildSummary(sourceName),
          sourceName,
          sourceType: "Subject Feed",
          category,
          publishedAt: item.isoDate || item.pubDate,
          articleUrl,
          providerName: this.name,
          sourceUrl: articleUrl ? originOf(articleUrl) : undefined,
          importanceScore: scoreImportance(sourceName),
          freshnessScore: 78,
        };
      });
    });

    return stories.filter(
      (story) =>
        isFreshStory(story, maxAgeHours) &&
        story.articleUrl &&
        !isAggregatorUrl(story.articleUrl) &&
        looksLikeArticleUrl(story.articleUrl) &&
        looksLikeArticleTitle(story.title),
    );
  }
}

function buildSearchQueries(input: { category?: string; query?: string; location?: string }) {
  const requested = input.query?.trim();
  const location = input.location ? ` ${input.location}` : "";
  if (requested) return [`${requested}${location} latest news today`];
  const category = input.category || "top";
  return uniqueStrings([...buildCategoryAnchors(category), ...buildCategoryQueries(category)])
    .slice(0, 7)
    .map((query) => `${query}${location} latest news today`);
}

function buildSearchUrl(query: string) {
  const base = process.env.WEB_NEWS_SEARCH_BASE_URL || "https://www.bing.com/news/search";
  const url = new URL(base);
  url.searchParams.set("q", query);
  if (url.hostname.includes("bing.com")) {
    url.searchParams.set("format", "RSS");
    url.searchParams.set("mkt", "en-US");
  } else {
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("gl", "US");
    url.searchParams.set("ceid", "US:en");
  }
  return url.toString();
}

function buildCategoryQueries(category: string) {
  const pool = categoryTopicPools[category] || categoryTopicPools.top;
  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  return Array.from({ length: Math.min(4, pool.length) }, (_, index) => pool[(bucket + index * 3) % pool.length]);
}

function buildCategoryAnchors(category: string) {
  return categoryAnchorQueries[category] || categoryAnchorQueries.top;
}

function parseGoogleNewsTitle(value: string) {
  const [title, ...sourceParts] = value.split(" - ");
  return {
    title: title?.trim(),
    sourceName: sourceParts.join(" - ").trim(),
  };
}

function buildSummary(sourceName: string | undefined) {
  return `${sourceName || "A public news source"} reported this story. Open the linked article for the full publisher report and context.`;
}

function normalizeSourceName(parsedSource: string | undefined, articleUrl: string | undefined, feedTitle: string | undefined) {
  const source = parsedSource?.trim();
  if (source && !/bingnews|google news/i.test(source)) return source;
  const fromUrl = sourceNameFromUrl(articleUrl);
  if (fromUrl) return fromUrl;
  return feedTitle && !/bingnews|google news/i.test(feedTitle) ? feedTitle : "Public News Search";
}

function sourceNameFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");
    const [name] = hostname.split(".");
    return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return undefined;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function scoreImportance(sourceName: string | undefined) {
  if (!sourceName) return 64;
  const normalized = sourceName.toLowerCase();
  if (/(reuters|associated press|ap news|bbc|npr)/.test(normalized)) return 84;
  if (/(guardian|new york times|washington post|cnbc|bloomberg)/.test(normalized)) return 78;
  return 70;
}

async function resolveArticleUrl(value: string | undefined) {
  const cleaned = extractTargetUrl(value);
  if (!cleaned || !isAggregatorUrl(cleaned)) return cleaned;

  try {
    const response = await fetch(cleaned, {
      redirect: "follow",
      headers: {
        "User-Agent": process.env.RSS_USER_AGENT || "HeadlineFlow/1.0",
      },
    });
    const finalUrl = response.url;
    if (finalUrl && !isAggregatorUrl(finalUrl)) return finalUrl;

    const html = await response.text();
    const canonical = findCanonicalUrl(html);
    return canonical || cleaned;
  } catch {
    return cleaned;
  }
}

function extractTargetUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const target = url.searchParams.get("url") || url.searchParams.get("u") || url.searchParams.get("r");
    if (target && /^https?:\/\//i.test(target)) return target;
    return url.toString();
  } catch {
    return undefined;
  }
}

function isAggregatorUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");
    return hostname === "news.google.com" || hostname === "bing.com" || hostname === "msn.com";
  } catch {
    return false;
  }
}

function looksLikeArticleUrl(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase();
    if (path === "/" || path.length < 12) return false;
    if (/(\/topics?\/|\/tags?\/|\/category\/|\/section\/|\/search\/|\/author\/|\/page\/)/i.test(path)) return false;
    if (url.searchParams.has("page") && path.split("/").filter(Boolean).length <= 2) return false;
    if (/\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(path)) return false;
    if (/(\/article\/|\/articles\/|\/story\/|\/stories\/|\/news\/|\/\d{4}\/\d{2}\/|\/\d{4}\/|\/\d{6}\/\d{2}\/|\/\d{8}\/)/i.test(path)) return true;
    if (/\.(html|htm)$/i.test(path)) return true;
    return path.split("/").filter(Boolean).length >= 2 && /[a-z0-9]-[a-z0-9]/.test(path);
  } catch {
    return false;
  }
}

function looksLikeArticleTitle(value: string | undefined) {
  if (!value) return false;
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;
  if (/^(artificial intelligence|technology|space|science|business|politics|sports|health|world news)$/i.test(value.trim())) return false;
  return true;
}

function isFreshStory(story: RawNewsStory, maxAgeHours: number) {
  if (!story.publishedAt) return false;
  const publishedAt = new Date(story.publishedAt).getTime();
  if (Number.isNaN(publishedAt)) return false;
  const ageHours = (Date.now() - publishedAt) / 36e5;
  return ageHours >= 0 && ageHours <= maxAgeHours;
}

function isRelevantStory(story: RawNewsStory, input: { category?: string; query?: string }) {
  const haystack = [story.title, story.summary, story.sourceName, story.articleUrl].filter(Boolean).join(" ").toLowerCase();
  const rawTokens = (input.query || (categoryTopicPools[input.category || "top"] || categoryTopicPools.top).join(" "))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/);
  const stopWords = new Set([
    "news",
    "latest",
    "today",
    "top",
    "stories",
    "story",
    "public",
    "major",
    "updates",
    "developing",
    "current",
    "events",
    "and",
    "the",
    "with",
  ]);
  const tokens = [...new Set(rawTokens.filter((token) => token.length > 3 && !stopWords.has(token)))];
  if (!tokens.length) return true;
  return tokens.some((token) => haystack.includes(token));
}

function findCanonicalUrl(html: string) {
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return [canonical, ogUrl].find((url) => url && /^https?:\/\//i.test(url) && !isAggregatorUrl(url));
}

function originOf(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function uniqueByUrl(stories: RawNewsStory[]) {
  const seen = new Set<string>();
  return stories.filter((story) => {
    if (!story.articleUrl || seen.has(story.articleUrl)) return false;
    seen.add(story.articleUrl);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Web news search timed out.")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
