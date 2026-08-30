import Parser from "rss-parser";
import {
  getHeadlineFlowLinkResolutionMaxAttempts,
  getHeadlineFlowLinkResolutionTimeoutMs,
  getHeadlineFlowRssTimeoutMs,
  getRssUserAgent,
} from "@/src/config/env";
import { getArticleUrlRejectionReason } from "@/src/server/headline-flow/domain/article-url-filter";
import type { ArticleCandidate, HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";
import type { NewsProvider, NewsProviderFetchInput, NewsProviderRuntimeDiagnostics } from "@/src/server/headline-flow/providers/types";
import { assertSafeSourceUrl, resolveSafeRedirectUrl } from "@/src/server/security/server-url-policy";

type RssClient = Pick<Parser, "parseString">;
type Fetcher = typeof fetch;

type RssMediaValue =
  | string
  | {
      url?: string;
      href?: string;
      type?: string;
      medium?: string;
      $?: {
        url?: string;
        href?: string;
        type?: string;
        medium?: string;
      };
    };

type GoogleNewsRssItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  enclosure?: RssMediaValue;
  "media:content"?: RssMediaValue | RssMediaValue[];
  "media:thumbnail"?: RssMediaValue | RssMediaValue[];
  mediaContent?: RssMediaValue | RssMediaValue[];
  mediaThumbnail?: RssMediaValue | RssMediaValue[];
  source?: string | { _: string; $?: { url?: string } } | { text?: string; url?: string };
};

type GoogleNewsRssFeed = {
  title?: string;
  link?: string;
  items?: GoogleNewsRssItem[];
};

type PublisherFeed = {
  topic: HeadlineFlowTopic;
  sourceName: string;
  url: string;
};

const TOPIC_QUERIES: Record<HeadlineFlowTopic, string> = {
  world: "world news",
  politics: "politics news",
  business: "business news",
  technology: "technology news",
  science: "science news",
  health: "health news",
  sports: "sports news",
  entertainment: "entertainment news",
  general: "top news",
};

const PUBLISHER_FEEDS: PublisherFeed[] = [
  { topic: "world", sourceName: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { topic: "politics", sourceName: "NPR", url: "https://feeds.npr.org/1014/rss.xml" },
  { topic: "business", sourceName: "NPR", url: "https://feeds.npr.org/1006/rss.xml" },
  { topic: "technology", sourceName: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { topic: "science", sourceName: "ScienceDaily", url: "https://www.sciencedaily.com/rss/top/science.xml" },
  { topic: "health", sourceName: "NPR", url: "https://feeds.npr.org/1128/rss.xml" },
  { topic: "sports", sourceName: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { topic: "entertainment", sourceName: "BBC News", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
  { topic: "general", sourceName: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
];

const COVERAGE_TOPICS = Object.keys(TOPIC_QUERIES) as HeadlineFlowTopic[];
const FRESHNESS_WINDOW_HOURS = 48;
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});
const MAX_LINK_RESOLUTION_REDIRECTS = 4;

function googleNewsSearchUrl(query: string, now: Date) {
  const params = new URLSearchParams({
    q: `${query} when:2d`,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  params.set("_", String(now.getTime()));
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function appendUniqueArticles(target: ArticleCandidate[], candidates: ArticleCandidate[]) {
  const seen = new Set(
    target
      .map((article) => article.canonicalUrl || article.providerArticleId)
      .filter((value): value is string => Boolean(value)),
  );

  for (const candidate of candidates) {
    const key = candidate.canonicalUrl || candidate.providerArticleId;
    if (key && seen.has(key)) {
      continue;
    }
    if (key) {
      seen.add(key);
    }
    target.push(candidate);
  }
}

function parsePublishedAt(item: GoogleNewsRssItem, fallback: Date) {
  const parsed = new Date(item.isoDate || item.pubDate || "");
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function sourceName(item: GoogleNewsRssItem, feedTitle?: string) {
  if (typeof item.source === "string" && item.source.trim()) {
    return item.source.trim();
  }
  if (item.source && typeof item.source === "object") {
    if ("_" in item.source && typeof item.source._ === "string" && item.source._.trim()) {
      return item.source._.trim();
    }
    if ("text" in item.source && typeof item.source.text === "string" && item.source.text.trim()) {
      return item.source.text.trim();
    }
  }
  const sourceFromTitle = sourceNameFromTitle(item.title);
  if (sourceFromTitle) {
    return sourceFromTitle;
  }
  return feedTitle?.replace(/^Google News\s*-\s*/i, "").trim() || "Google News";
}

function sourceNameFromTitle(title?: string) {
  const parts = title?.split(" - ").map((part) => part.trim()).filter(Boolean) ?? [];
  const source = parts.length > 1 ? parts.at(-1) : null;
  return source && source.length <= 80 ? source : null;
}

function cleanGoogleNewsTitle(title: string, source: string) {
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title.trim();
}

function getRssItemRejectionReason(item: GoogleNewsRssItem) {
  const text = `${item.title ?? ""} ${item.link ?? ""}`.toLowerCase();
  if (/\blive\b/.test(text) || /\bvideo\b/.test(text) || /\bwatch\b/.test(text) || /\bstream\b/.test(text)) {
    return "live_or_video_item";
  }
  return null;
}

function asArray<T>(value: T | T[] | undefined) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function decodeHtmlUrl(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

function extractHtmlImageUrl(html?: string) {
  const match = html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ? decodeHtmlUrl(match[1]) : null;
}

function mediaValueUrl(value?: RssMediaValue | null) {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return value.url || value.href || value.$?.url || value.$?.href || null;
}

function mediaValueLooksLikeImage(value?: RssMediaValue | null) {
  if (!value || typeof value === "string") {
    return true;
  }
  const type = value.type || value.$?.type;
  const medium = value.medium || value.$?.medium;
  if (type && !type.toLowerCase().startsWith("image/")) {
    return false;
  }
  if (medium && medium.toLowerCase() !== "image") {
    return false;
  }
  return true;
}

function safeRssImageUrl(value?: string | null) {
  if (!value) {
    return null;
  }
  try {
    return assertSafeSourceUrl(decodeHtmlUrl(value)).toString();
  } catch {
    return null;
  }
}

function extractRssImageUrl(item: GoogleNewsRssItem) {
  const mediaCandidates: RssMediaValue[] = [
    ...asArray(item.mediaContent),
    ...asArray(item["media:content"]),
    ...asArray(item.mediaThumbnail),
    ...asArray(item["media:thumbnail"]),
    ...asArray(item.enclosure),
  ];
  const htmlCandidates = [extractHtmlImageUrl(item.content), extractHtmlImageUrl(item.contentSnippet)];
  let rejected = 0;

  for (const candidate of mediaCandidates) {
    if (!mediaValueLooksLikeImage(candidate)) {
      continue;
    }
    const rawUrl = mediaValueUrl(candidate);
    if (!rawUrl) {
      continue;
    }
    const safeUrl = safeRssImageUrl(rawUrl);
    if (safeUrl) {
      return { imageUrl: safeUrl, rejected, imageSource: "media_rss" };
    }
    rejected += 1;
  }

  for (const rawUrl of htmlCandidates) {
    if (!rawUrl) {
      continue;
    }
    const safeUrl = safeRssImageUrl(rawUrl);
    if (safeUrl) {
      return { imageUrl: safeUrl, rejected, imageSource: "html_img" };
    }
    rejected += 1;
  }

  return { imageUrl: null, rejected, imageSource: "none" };
}

function isGoogleNewsArticleLink(link: string) {
  try {
    const url = new URL(link);
    return url.hostname === "news.google.com" && url.pathname.includes("/rss/articles/");
  } catch {
    return false;
  }
}

type LinkResolutionResult =
  | { status: "resolved"; url: string }
  | { status: "unresolved"; url: string; reason: string }
  | { status: "rejected"; url: string; reason: string };

function interleaveTopicArticles(topicArticles: Map<HeadlineFlowTopic, ArticleCandidate[]>, limit: number) {
  const interleaved: ArticleCandidate[] = [];
  let index = 0;

  while (interleaved.length < limit) {
    let added = false;
    for (const topic of COVERAGE_TOPICS) {
      const article = topicArticles.get(topic)?.[index];
      if (!article) {
        continue;
      }
      interleaved.push(article);
      added = true;
      if (interleaved.length >= limit) {
        break;
      }
    }
    if (!added) {
      break;
    }
    index += 1;
  }

  return interleaved;
}

export class GoogleNewsRssProvider implements NewsProvider {
  readonly id = "rss";
  private linkResolutionRemaining = 0;
  private runtimeDiagnostics: NewsProviderRuntimeDiagnostics = {
    configured: true,
    rejectedArticleUrls: [],
    rejectedOutOfWindow: 0,
    rejectedTopicMismatch: 0,
    linkResolution: {
      attempted: 0,
      resolved: 0,
      unresolved: 0,
      rejected: 0,
      direct: 0,
      skipped: 0,
    },
    imageExtraction: {
      attempted: 0,
      found: 0,
      fallback: 0,
      rejected: 0,
    },
    discoveryStrategy: "rss_broad",
    freshnessWindowHours: FRESHNESS_WINDOW_HOURS,
    topicCoverage: {
      attemptedTopics: [],
      fulfilledTopics: [],
      topicArticleCounts: {},
      lowYieldTopics: [],
      failedTopics: [],
    },
    rawResponse: {
      responseCount: 0,
      totalTextLength: 0,
      lastTextLength: 0,
      parseStrategies: [],
      parsedArticleCount: 0,
      parseErrors: [],
    },
    error: null,
  };

  constructor(
    private readonly fetcher: Fetcher = fetch,
    private readonly rssParser: RssClient = parser,
  ) {}

  getRuntimeDiagnostics() {
    return this.runtimeDiagnostics;
  }

  async fetchLatest(input: NewsProviderFetchInput): Promise<ArticleCandidate[]> {
    this.runtimeDiagnostics = {
      configured: true,
      rejectedArticleUrls: [],
      rejectedOutOfWindow: 0,
      rejectedTopicMismatch: 0,
      linkResolution: {
        attempted: 0,
        resolved: 0,
        unresolved: 0,
        rejected: 0,
        direct: 0,
        skipped: 0,
      },
      imageExtraction: {
        attempted: 0,
        found: 0,
        fallback: 0,
        rejected: 0,
      },
      discoveryStrategy: input.topic ? "rss_targeted" : "rss_broad",
      freshnessWindowHours: FRESHNESS_WINDOW_HOURS,
      topicCoverage: {
        attemptedTopics: input.topic ? [input.topic] : COVERAGE_TOPICS,
        fulfilledTopics: [],
        topicArticleCounts: {},
        lowYieldTopics: [],
        failedTopics: [],
      },
      rawResponse: {
        responseCount: 0,
        totalTextLength: 0,
        lastTextLength: 0,
        parseStrategies: ["publisher_rss_first"],
        parsedArticleCount: 0,
        parseErrors: [],
      },
      error: null,
    };

    const topics = input.topic ? [input.topic as HeadlineFlowTopic] : COVERAGE_TOPICS;
    const requestedLimit = input.limit ?? 18;
    const perTopicLimit = input.topic ? requestedLimit : Math.max(2, Math.ceil(requestedLimit / topics.length));
    const articles: ArticleCandidate[] = [];
    const articlesByTopic = new Map<HeadlineFlowTopic, ArticleCandidate[]>();
    this.linkResolutionRemaining = getHeadlineFlowLinkResolutionMaxAttempts();

    for (const topic of topics) {
      try {
        const topicArticles = await this.fetchTopic(input, topic, perTopicLimit);
        if (topicArticles.length > 0) {
          this.runtimeDiagnostics.topicCoverage?.fulfilledTopics.push(topic);
        } else {
          this.runtimeDiagnostics.topicCoverage?.lowYieldTopics?.push(topic);
          this.runtimeDiagnostics.topicCoverage?.failedTopics.push({
            topic,
            error: "no_recent_articles_in_freshness_window",
          });
        }
        if (this.runtimeDiagnostics.topicCoverage?.topicArticleCounts) {
          this.runtimeDiagnostics.topicCoverage.topicArticleCounts[topic] = topicArticles.length;
        }
        articlesByTopic.set(topic, topicArticles);
        articles.push(...topicArticles);
      } catch (error) {
        this.runtimeDiagnostics.topicCoverage?.failedTopics.push({
          topic,
          error: error instanceof Error ? error.message : String(error),
        });
        this.runtimeDiagnostics.error = error instanceof Error ? error.message : String(error);
      }
    }

    if (!input.topic) {
      return interleaveTopicArticles(articlesByTopic, requestedLimit);
    }

    return articles.slice(0, requestedLimit);
  }

  private async fetchTopic(input: NewsProviderFetchInput, topic: HeadlineFlowTopic, limit: number) {
    const articles: ArticleCandidate[] = [];
    const publisherFeeds = PUBLISHER_FEEDS.filter((feed) => feed.topic === topic);

    for (const feed of publisherFeeds) {
      try {
        appendUniqueArticles(articles, await this.fetchFeed(input, topic, limit - articles.length, feed.url, feed.sourceName));
      } catch (error) {
        this.runtimeDiagnostics.rawResponse?.parseErrors.push(
          `${feed.sourceName}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (articles.length >= limit) {
        return articles;
      }
    }

    if (articles.length < limit) {
      appendUniqueArticles(
        articles,
        await this.fetchFeed(input, topic, limit - articles.length, googleNewsSearchUrl(TOPIC_QUERIES[topic] ?? topic, input.now)),
      );
    }
    return articles;
  }

  private async fetchFeed(input: NewsProviderFetchInput, topic: HeadlineFlowTopic, limit: number, url: string, preferredSourceName?: string) {
    if (limit <= 0) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getHeadlineFlowRssTimeoutMs());

    try {
      const safeUrl = assertSafeSourceUrl(url).toString();
      const response = await this.fetcher(safeUrl, {
        headers: {
          "User-Agent": getRssUserAgent(),
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`rss_fetch_failed_${response.status}`);
      }

      const xml = await response.text();
      this.runtimeDiagnostics.rawResponse!.responseCount += 1;
      this.runtimeDiagnostics.rawResponse!.totalTextLength += xml.length;
      this.runtimeDiagnostics.rawResponse!.lastTextLength = xml.length;
      this.runtimeDiagnostics.rawResponse!.parseStrategies.push(preferredSourceName ? "publisher_rss" : "google_news_rss");

      const feed = (await this.rssParser.parseString(xml)) as GoogleNewsRssFeed;
      const items = Array.isArray(feed.items) ? feed.items : [];
      this.runtimeDiagnostics.rawResponse!.parsedArticleCount += items.length;
      const cutoff = input.now.getTime() - FRESHNESS_WINDOW_HOURS * 60 * 60 * 1000;
      const articles: ArticleCandidate[] = [];

      for (const item of items) {
        const itemRejectionReason = getRssItemRejectionReason(item);
        if (itemRejectionReason) {
          this.runtimeDiagnostics.rejectedArticleUrls?.push({
            url: item.link || "",
            reason: itemRejectionReason,
            title: item.title || null,
          });
          continue;
        }

        const link = item.link?.trim();
        if (!link) {
          continue;
        }
        const reason = isGoogleNewsArticleLink(link) ? null : getArticleUrlRejectionReason(link);
        if (reason) {
          this.runtimeDiagnostics.rejectedArticleUrls?.push({
            url: link,
            reason,
            title: item.title || null,
          });
          continue;
        }

        const publishedAt = parsePublishedAt(item, input.now);
        if (publishedAt.getTime() < cutoff || publishedAt.getTime() > input.now.getTime()) {
          this.runtimeDiagnostics.rejectedOutOfWindow = (this.runtimeDiagnostics.rejectedOutOfWindow ?? 0) + 1;
          continue;
        }

        const resolvedLink = await this.resolveArticleLink(link);
        if (resolvedLink.status === "rejected") {
          this.runtimeDiagnostics.rejectedArticleUrls?.push({
            url: link,
            reason: `link_resolution_${resolvedLink.reason}`,
            title: item.title || null,
          });
          continue;
        }

        const canonicalUrl = resolvedLink.url;
        const resolvedReason = getArticleUrlRejectionReason(canonicalUrl);
        if (resolvedReason) {
          this.runtimeDiagnostics.rejectedArticleUrls?.push({
            url: canonicalUrl,
            reason: `resolved_${resolvedReason}`,
            title: item.title || null,
          });
          continue;
        }

        const source = sourceName(item, preferredSourceName ?? feed.title);
        const image = extractRssImageUrl(item);
        if (this.runtimeDiagnostics.imageExtraction) {
          this.runtimeDiagnostics.imageExtraction.attempted += 1;
          this.runtimeDiagnostics.imageExtraction.rejected += image.rejected;
          if (image.imageUrl) {
            this.runtimeDiagnostics.imageExtraction.found += 1;
          } else {
            this.runtimeDiagnostics.imageExtraction.fallback += 1;
          }
        }

        articles.push({
          providerId: this.id,
          providerArticleId: item.guid || link,
          sourceName: source,
          sourceUrl: canonicalUrl,
          title: cleanGoogleNewsTitle(item.title || link, source),
          description: item.contentSnippet || item.content || null,
          canonicalUrl,
          imageUrl: image.imageUrl,
          author: null,
          publishedAt,
          retrievedAt: input.now,
          topics: [topic],
          rawReference: {
            discoveryProvider: preferredSourceName ? "publisher_rss" : this.id,
            feedUrl: safeUrl,
            originalUrl: link,
            linkResolutionStatus: resolvedLink.status,
            imageSource: image.imageSource,
          },
        });

        if (articles.length >= limit) {
          break;
        }
      }

      return articles;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async resolveArticleLink(link: string): Promise<LinkResolutionResult> {
    const diagnostics = this.runtimeDiagnostics.linkResolution;

    if (!isGoogleNewsArticleLink(link)) {
      if (diagnostics) {
        diagnostics.direct += 1;
      }
      return { status: "unresolved", url: link, reason: "direct_link" };
    }

    if (this.linkResolutionRemaining <= 0) {
      if (diagnostics) {
        diagnostics.skipped += 1;
      }
      return { status: "unresolved", url: link, reason: "resolution_budget_exhausted" };
    }

    this.linkResolutionRemaining -= 1;
    if (diagnostics) {
      diagnostics.attempted += 1;
    }

    let currentUrl: string;
    try {
      currentUrl = assertSafeSourceUrl(link).toString();
    } catch {
      if (diagnostics) {
        diagnostics.rejected += 1;
      }
      return { status: "rejected", url: link, reason: "unsafe_source" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getHeadlineFlowLinkResolutionTimeoutMs());

    try {
      for (let redirectCount = 0; redirectCount < MAX_LINK_RESOLUTION_REDIRECTS; redirectCount += 1) {
        const response = await this.fetcher(currentUrl, {
          headers: {
            "User-Agent": getRssUserAgent(),
            Accept: "text/html,application/xhtml+xml",
          },
          redirect: "manual",
          signal: controller.signal,
        });

        if (response.status < 300 || response.status >= 400) {
          if (diagnostics) {
            diagnostics.unresolved += 1;
          }
          return { status: "unresolved", url: link, reason: `status_${response.status}` };
        }

        const location = response.headers.get("location");
        if (!location) {
          if (diagnostics) {
            diagnostics.unresolved += 1;
          }
          return { status: "unresolved", url: link, reason: "missing_location" };
        }

        let nextUrl: string;
        try {
          nextUrl = resolveSafeRedirectUrl(location, currentUrl);
        } catch {
          if (diagnostics) {
            diagnostics.rejected += 1;
          }
          return { status: "rejected", url: link, reason: "unsafe_redirect" };
        }

        if (!isGoogleNewsArticleLink(nextUrl)) {
          if (diagnostics) {
            diagnostics.resolved += 1;
          }
          return { status: "resolved", url: nextUrl };
        }

        currentUrl = nextUrl;
      }

      if (diagnostics) {
        diagnostics.unresolved += 1;
      }
      return { status: "unresolved", url: link, reason: "too_many_redirects" };
    } catch (error) {
      if (diagnostics) {
        diagnostics.unresolved += 1;
      }
      return {
        status: "unresolved",
        url: link,
        reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "fetch_error",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
