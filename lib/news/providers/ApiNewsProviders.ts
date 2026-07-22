import type { NewsProvider, NewsProviderHealth } from "@/lib/news/providers/NewsProvider";
import { configuredUrl, fetchJsonWithTimeout } from "@/lib/news/providers/http";
import type { RawNewsStory } from "@/types/headline";

type NewsApiArticle = {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: { name?: string };
};

type GNewsArticle = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  source?: { name?: string; url?: string };
};

type GuardianResult = {
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
  sectionName?: string;
  fields?: { trailText?: string; thumbnail?: string };
};

abstract class CredentialedJsonProvider implements NewsProvider {
  readonly kind = "api" as const;
  abstract readonly name: string;
  protected abstract readonly keyEnv: string;

  isConfigured() {
    return Boolean(process.env[this.keyEnv]);
  }

  async health(): Promise<NewsProviderHealth> {
    return {
      name: this.name,
      kind: this.kind,
      configured: this.isConfigured(),
      status: this.isConfigured() ? "ok" : "unconfigured",
      message: this.isConfigured() ? "Provider credentials are configured." : `${this.keyEnv} is not configured.`,
      checkedAt: new Date().toISOString(),
    };
  }

  abstract getHeadlines(input: { category?: string; limit?: number }): Promise<RawNewsStory[]>;
}

export class NewsApiProvider extends CredentialedJsonProvider {
  readonly name = "newsapi";
  protected readonly keyEnv = "NEWS_API_KEY";

  async getHeadlines(input: { category?: string; limit?: number }) {
    if (!this.isConfigured()) return [];
    const url = configuredUrl(process.env.NEWS_API_BASE_URL || "https://newsapi.org", "/v2/top-headlines", {
      apiKey: process.env.NEWS_API_KEY,
      category: input.category === "top" ? undefined : input.category,
      language: "en",
      pageSize: input.limit ?? 25,
    });
    const body = await fetchJsonWithTimeout<{ articles?: NewsApiArticle[] }>(url!, Number(process.env.NEWS_PROVIDER_TIMEOUT_MS || 7000));
    return (body.articles || []).map((article) => ({
      title: article.title,
      summary: article.description,
      sourceName: article.source?.name,
      sourceType: "NewsAPI",
      category: input.category || "top",
      publishedAt: article.publishedAt,
      articleUrl: article.url,
      imageUrl: article.urlToImage,
      providerName: this.name,
      importanceScore: 68,
      freshnessScore: 70,
    }));
  }
}

export class GNewsProvider extends CredentialedJsonProvider {
  readonly name = "gnews";
  protected readonly keyEnv = "GNEWS_API_KEY";

  async getHeadlines(input: { category?: string; limit?: number }) {
    if (!this.isConfigured()) return [];
    const url = configuredUrl(process.env.GNEWS_API_BASE_URL || "https://gnews.io", "/api/v4/top-headlines", {
      token: process.env.GNEWS_API_KEY,
      category: input.category === "top" ? "general" : input.category,
      lang: "en",
      max: input.limit ?? 25,
    });
    const body = await fetchJsonWithTimeout<{ articles?: GNewsArticle[] }>(url!, Number(process.env.NEWS_PROVIDER_TIMEOUT_MS || 7000));
    return (body.articles || []).map((article) => ({
      title: article.title,
      summary: article.description,
      sourceName: article.source?.name,
      sourceType: "GNews",
      category: input.category || "top",
      publishedAt: article.publishedAt,
      articleUrl: article.url,
      imageUrl: article.image,
      providerName: this.name,
      sourceUrl: article.source?.url,
      importanceScore: 66,
      freshnessScore: 70,
    }));
  }
}

export class GuardianProvider extends CredentialedJsonProvider {
  readonly name = "guardian";
  protected readonly keyEnv = "GUARDIAN_API_KEY";

  async getHeadlines(input: { category?: string; limit?: number }) {
    if (!this.isConfigured()) return [];
    const section = input.category && input.category !== "top" ? input.category : undefined;
    const url = configuredUrl(process.env.GUARDIAN_API_BASE_URL || "https://content.guardianapis.com", "/search", {
      "api-key": process.env.GUARDIAN_API_KEY,
      section,
      "show-fields": "trailText,thumbnail",
      "page-size": input.limit ?? 25,
    });
    const body = await fetchJsonWithTimeout<{ response?: { results?: GuardianResult[] } }>(url!, Number(process.env.NEWS_PROVIDER_TIMEOUT_MS || 7000));
    return (body.response?.results || []).map((result) => ({
      title: result.webTitle,
      summary: result.fields?.trailText,
      sourceName: "The Guardian",
      sourceType: "Guardian",
      category: result.sectionName || input.category || "top",
      publishedAt: result.webPublicationDate,
      articleUrl: result.webUrl,
      imageUrl: result.fields?.thumbnail,
      providerName: this.name,
      importanceScore: 72,
      freshnessScore: 70,
    }));
  }
}
