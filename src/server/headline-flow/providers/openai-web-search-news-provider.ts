import OpenAI from "openai";
import { z } from "zod";
import { env, getHeadlineFlowWebSearchTimeoutMs } from "@/src/config/env";
import { getArticleUrlRejectionReason } from "@/src/server/headline-flow/domain/article-url-filter";
import type { ArticleCandidate, HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";
import type { NewsProvider, NewsProviderFetchInput, NewsProviderRuntimeDiagnostics } from "@/src/server/headline-flow/providers/types";

type ResponsesClient = Pick<OpenAI, "responses">;

const topicSchema = z.enum(["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"]);

const articleSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  canonicalUrl: z.string().url(),
  imageUrl: z.string().url().optional().nullable(),
  author: z.string().optional().nullable(),
  publishedAt: z.string().datetime({ offset: true }),
  topics: z.array(topicSchema).min(1).default(["general"]),
});

const searchResultSchema = z.object({
  articles: z.array(articleSchema),
});

const COVERAGE_TOPICS: HeadlineFlowTopic[] = ["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"];
const FRESHNESS_WINDOW_HOURS = 48;
type ParsedSearchResponse = {
  articles: z.infer<typeof articleSchema>[];
  strategy: "json" | "markdown_links" | "bare_urls" | "empty";
  error: string | null;
};

let cachedClient: OpenAI | null = null;

export function isOpenAIWebSearchConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}

function getClient(): ResponsesClient | null {
  if (!isOpenAIWebSearchConfigured() || typeof window !== "undefined") {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return cachedClient;
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function sourceNameFromUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown source";
  }
}

function titleFromUrl(value: string) {
  try {
    const slug = new URL(value).pathname.split("/").filter(Boolean).at(-1) ?? "Current event article";
    return slug
      .replace(/\.[a-z0-9]+$/i, "")
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Current event article";
  }
}

function inferPublishedAt(text: string, fallback: Date) {
  const isoMatch = text.match(/\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})\b/);
  if (isoMatch?.[0]) {
    const parsed = new Date(isoMatch[0]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const dateMatch = text.match(/\b20\d{2}-\d{2}-\d{2}\b/);
  if (dateMatch?.[0]) {
    const parsed = new Date(`${dateMatch[0]}T12:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback.toISOString();
}

function recoverMarkdownLinkArticles(text: string, input: NewsProviderFetchInput) {
  const articles: z.infer<typeof articleSchema>[] = [];
  const seen = new Set<string>();
  const topic = topicSchema.safeParse(input.topic).success ? (input.topic as HeadlineFlowTopic) : "general";
  const markdownLinkPattern = /\[([^\]]{8,220})\]\((https?:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownLinkPattern.exec(text)) !== null) {
    const title = match[1]?.trim();
    const canonicalUrl = match[2]?.trim();
    if (!title || !canonicalUrl || seen.has(canonicalUrl)) {
      continue;
    }
    seen.add(canonicalUrl);
    articles.push({
      sourceName: sourceNameFromUrl(canonicalUrl),
      sourceUrl: new URL(canonicalUrl).origin,
      title,
      description: null,
      canonicalUrl,
      imageUrl: null,
      author: null,
      publishedAt: inferPublishedAt(text.slice(Math.max(0, match.index - 180), match.index + match[0].length + 180), input.now),
      topics: [topic],
    });
  }
  return articles;
}

function recoverBareUrlArticles(text: string, input: NewsProviderFetchInput) {
  const articles: z.infer<typeof articleSchema>[] = [];
  const seen = new Set<string>();
  const topic = topicSchema.safeParse(input.topic).success ? (input.topic as HeadlineFlowTopic) : "general";
  const urlPattern = /https?:\/\/[^\s<>)\]}"]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    const canonicalUrl = match[0].replace(/[.,;:!?]+$/, "");
    if (seen.has(canonicalUrl)) {
      continue;
    }
    seen.add(canonicalUrl);
    const context = text.slice(Math.max(0, match.index - 220), match.index + canonicalUrl.length + 220);
    articles.push({
      sourceName: sourceNameFromUrl(canonicalUrl),
      sourceUrl: new URL(canonicalUrl).origin,
      title: titleFromUrl(canonicalUrl),
      description: context.replace(/\s+/g, " ").trim().slice(0, 220) || null,
      canonicalUrl,
      imageUrl: null,
      author: null,
      publishedAt: inferPublishedAt(context, input.now),
      topics: [topic],
    });
  }
  return articles;
}

function parseSearchResponse(text: string, input: NewsProviderFetchInput): ParsedSearchResponse {
  let jsonError: string | null = null;
  try {
    const parsed = JSON.parse(extractJsonObject(text)) as unknown;
    return {
      articles: searchResultSchema.parse(parsed).articles,
      strategy: "json",
      error: null,
    };
  } catch (error) {
    jsonError = error instanceof Error ? error.message : String(error);
  }

  const markdownArticles = recoverMarkdownLinkArticles(text, input);
  if (markdownArticles.length > 0) {
    return {
      articles: markdownArticles,
      strategy: "markdown_links",
      error: jsonError,
    };
  }

  const bareUrlArticles = recoverBareUrlArticles(text, input);
  if (bareUrlArticles.length > 0) {
    return {
      articles: bareUrlArticles,
      strategy: "bare_urls",
      error: jsonError,
    };
  }

  return {
    articles: [],
    strategy: "empty",
    error: jsonError,
  };
}

function cutoffFor(input: NewsProviderFetchInput) {
  return new Date(input.now.getTime() - FRESHNESS_WINDOW_HOURS * 60 * 60 * 1000);
}

function buildPrompt(input: NewsProviderFetchInput) {
  const requestedTopic = input.topic?.trim();
  const topicInstruction = requestedTopic
    ? `Focus only on the "${requestedTopic}" subject.`
    : [
        "Cover every subject with at least one article when available:",
        "world, politics, business, technology, science, health, sports, entertainment, general.",
      ].join(" ");

  return [
    "You are Headline Flow's article discovery agent.",
    `Current timestamp: ${input.now.toISOString()}.`,
    `Only return articles published between ${cutoffFor(input).toISOString()} and ${input.now.toISOString()}.`,
    topicInstruction,
    "Search the web freely for current news articles.",
    "Return article pages only. Do not return homepages, section pages, topic pages, live index pages, search pages, tag pages, or generic website URLs.",
    "Prefer canonical news article URLs with a specific slug, headline, source, publication timestamp, and article summary.",
    `Return up to ${input.limit ?? 18} total items as strict JSON using this shape:`,
    '{"articles":[{"sourceName":"string","sourceUrl":"https://source.example","title":"string","description":"string","canonicalUrl":"https://source.example/article-slug","imageUrl":null,"author":null,"publishedAt":"ISO-8601 timestamp with timezone","topics":["world"]}]}',
    "Do not include markdown or commentary outside JSON.",
  ].join("\n");
}

function topicsRepresentedBy(articles: ArticleCandidate[]) {
  return Array.from(
    new Set(
      articles
        .flatMap((article) => article.topics ?? [])
        .filter((topic): topic is HeadlineFlowTopic => COVERAGE_TOPICS.includes(topic as HeadlineFlowTopic)),
    ),
  );
}

function topicArticleCounts(articles: ArticleCandidate[]) {
  const counts: Record<string, number> = {};
  for (const article of articles) {
    for (const topic of article.topics ?? []) {
      counts[topic] = (counts[topic] ?? 0) + 1;
    }
  }
  return counts;
}

function dedupeByCanonicalUrl(articles: ArticleCandidate[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.canonicalUrl || article.providerArticleId;
    if (!key) {
      return true;
    }
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export class OpenAIWebSearchNewsProvider implements NewsProvider {
  readonly id = "web_search";
  private runtimeDiagnostics: NewsProviderRuntimeDiagnostics = {
    configured: false,
    rejectedArticleUrls: [],
    rejectedOutOfWindow: 0,
    rejectedTopicMismatch: 0,
    rawResponse: {
      responseCount: 0,
      totalTextLength: 0,
      lastTextLength: 0,
      parseStrategies: [],
      parsedArticleCount: 0,
      parseErrors: [],
    },
    discoveryStrategy: "targeted",
    freshnessWindowHours: FRESHNESS_WINDOW_HOURS,
    topicCoverage: {
      attemptedTopics: [],
      fulfilledTopics: [],
      topicArticleCounts: {},
      lowYieldTopics: [],
      failedTopics: [],
    },
    error: null,
  };

  constructor(private readonly client: ResponsesClient | null = getClient()) {}

  getRuntimeDiagnostics() {
    return this.runtimeDiagnostics;
  }

  async fetchLatest(input: NewsProviderFetchInput): Promise<ArticleCandidate[]> {
    this.runtimeDiagnostics = {
      configured: Boolean(this.client),
      rejectedArticleUrls: [],
      rejectedOutOfWindow: 0,
      rejectedTopicMismatch: 0,
      rawResponse: {
        responseCount: 0,
        totalTextLength: 0,
        lastTextLength: 0,
        parseStrategies: [],
        parsedArticleCount: 0,
        parseErrors: [],
      },
      discoveryStrategy: "targeted",
      freshnessWindowHours: FRESHNESS_WINDOW_HOURS,
      topicCoverage: {
        attemptedTopics: [],
        fulfilledTopics: [],
        topicArticleCounts: {},
        lowYieldTopics: [],
        failedTopics: [],
      },
      error: null,
    };

    if (!this.client) {
      this.runtimeDiagnostics.error = "missing_openai_api_key";
      return [];
    }

    if (!input.topic) {
      this.runtimeDiagnostics.discoveryStrategy = "broad";
      this.runtimeDiagnostics.topicCoverage = {
        attemptedTopics: COVERAGE_TOPICS,
        fulfilledTopics: [],
        topicArticleCounts: {},
        lowYieldTopics: [],
        failedTopics: [],
      };

      const broadArticles = await this.fetchTopicArticles({ ...input, limit: Math.max(input.limit ?? 18, COVERAGE_TOPICS.length) });
      const fulfilledTopics = topicsRepresentedBy(broadArticles);
      this.runtimeDiagnostics.topicCoverage.fulfilledTopics = fulfilledTopics;
      this.runtimeDiagnostics.topicCoverage.topicArticleCounts = topicArticleCounts(broadArticles);

      const missingTopics = COVERAGE_TOPICS.filter((topic) => !fulfilledTopics.includes(topic));
      if (!missingTopics.length) {
        return broadArticles.slice(0, input.limit ?? broadArticles.length);
      }

      this.runtimeDiagnostics.discoveryStrategy = "targeted_fill";
      const perTopicLimit = Math.max(1, Math.floor((input.limit ?? 18) / COVERAGE_TOPICS.length));
      const fillArticles: ArticleCandidate[] = [];
      for (const topic of missingTopics) {
        try {
          const articles = await this.fetchTopicArticles({ ...input, topic, limit: perTopicLimit });
          if (articles.length > 0) {
            fillArticles.push(...articles);
            this.runtimeDiagnostics.topicCoverage.fulfilledTopics = Array.from(
              new Set([...this.runtimeDiagnostics.topicCoverage.fulfilledTopics, topic]),
            );
            this.runtimeDiagnostics.topicCoverage.topicArticleCounts = topicArticleCounts([...broadArticles, ...fillArticles]);
          } else {
            this.runtimeDiagnostics.topicCoverage.lowYieldTopics?.push(topic);
            this.runtimeDiagnostics.topicCoverage.failedTopics.push({
              topic,
              error: "no_recent_articles_in_freshness_window",
            });
          }
        } catch (error) {
          this.runtimeDiagnostics.topicCoverage.lowYieldTopics?.push(topic);
          this.runtimeDiagnostics.topicCoverage.failedTopics.push({
            topic,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const combinedArticles = dedupeByCanonicalUrl([...broadArticles, ...fillArticles]);
      this.runtimeDiagnostics.topicCoverage.topicArticleCounts = topicArticleCounts(combinedArticles);
      return combinedArticles.slice(0, input.limit ?? combinedArticles.length);
    }

    this.runtimeDiagnostics.discoveryStrategy = "targeted";
    return this.fetchTopicArticles(input);
  }

  private async fetchTopicArticles(input: NewsProviderFetchInput): Promise<ArticleCandidate[]> {
    if (!this.client) {
      return [];
    }

    const timeoutMs = getHeadlineFlowWebSearchTimeoutMs();
    const timeoutError = new Error(`Headline Flow web search timed out after ${timeoutMs}ms.`);
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
    });

    const responsePromise = this.client.responses.create({
      model: env.HEADLINE_FLOW_WEB_SEARCH_MODEL,
      input: buildPrompt(input),
      max_output_tokens: 4_000,
      tools: [
        {
          type: "web_search",
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            country: "US",
            timezone: "America/New_York",
          },
        },
      ],
    });

    try {
      const response = (await Promise.race([responsePromise, timeoutPromise])) as Awaited<typeof responsePromise>;
      const outputText = response.output_text ?? "";
      const parsed = parseSearchResponse(outputText, input);
      if (this.runtimeDiagnostics.rawResponse) {
        this.runtimeDiagnostics.rawResponse.responseCount += 1;
        this.runtimeDiagnostics.rawResponse.totalTextLength += outputText.length;
        this.runtimeDiagnostics.rawResponse.lastTextLength = outputText.length;
        this.runtimeDiagnostics.rawResponse.parseStrategies.push(parsed.strategy);
        this.runtimeDiagnostics.rawResponse.parsedArticleCount += parsed.articles.length;
        if (parsed.error) {
          this.runtimeDiagnostics.rawResponse.parseErrors.push(parsed.error);
        }
      }
      const rawArticles = parsed.articles;
      const cutoff = cutoffFor(input).getTime();
      const topic = input.topic?.toLowerCase();
      const articles = rawArticles
        .filter((article) => {
          const reason = getArticleUrlRejectionReason(article.canonicalUrl);
          if (reason) {
            this.runtimeDiagnostics.rejectedArticleUrls?.push({
              url: article.canonicalUrl,
              reason,
              title: article.title || null,
            });
            return false;
          }
          return true;
        })
        .filter((article) => {
          const publishedAt = new Date(article.publishedAt).getTime();
          const inWindow = Number.isFinite(publishedAt) && publishedAt >= cutoff && publishedAt <= input.now.getTime();
          if (!inWindow) {
            this.runtimeDiagnostics.rejectedOutOfWindow = (this.runtimeDiagnostics.rejectedOutOfWindow ?? 0) + 1;
          }
          return inWindow;
        })
        .filter((article) => {
          const matchesTopic = !topic || article.topics.some((candidateTopic) => candidateTopic === topic);
          if (!matchesTopic) {
            this.runtimeDiagnostics.rejectedTopicMismatch = (this.runtimeDiagnostics.rejectedTopicMismatch ?? 0) + 1;
          }
          return matchesTopic;
        })
        .map<ArticleCandidate>((article, index) => ({
          providerId: this.id,
          providerArticleId: `${this.id}-${index}-${article.canonicalUrl}`,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          title: article.title,
          description: article.description,
          canonicalUrl: article.canonicalUrl,
          imageUrl: article.imageUrl,
          author: article.author,
          publishedAt: article.publishedAt,
          retrievedAt: input.now,
          topics: article.topics as HeadlineFlowTopic[],
          rawReference: {
            discoveryProvider: this.id,
          },
        }));

      return articles.slice(0, input.limit ?? articles.length);
    } catch (error) {
      this.runtimeDiagnostics.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
