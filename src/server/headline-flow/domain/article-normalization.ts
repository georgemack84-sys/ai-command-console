import { createHash } from "node:crypto";
import type { ArticleCandidate, ArticleRejection, CanonicalArticle, HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";
import { canonicalizeArticleUrl } from "@/src/server/headline-flow/domain/url";

function cleanText(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseDate(value: string | Date | null | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function normalizeTopic(topic: HeadlineFlowTopic | undefined): HeadlineFlowTopic {
  return topic || "general";
}

export function normalizeArticleCandidate(candidate: ArticleCandidate, now: Date): { article: CanonicalArticle; rejection?: never } | { article?: never; rejection: ArticleRejection } {
  const title = cleanText(candidate.title);
  const canonicalUrl = canonicalizeArticleUrl(candidate.canonicalUrl);
  const sourceUrl = canonicalizeArticleUrl(candidate.sourceUrl);
  const imageUrl = canonicalizeArticleUrl(candidate.imageUrl);
  const publishedAt = parseDate(candidate.publishedAt, now);
  const retrievedAt = parseDate(candidate.retrievedAt, now) || now;
  const rawReference = candidate.rawReference ?? null;

  if (!title) {
    return {
      rejection: {
        providerId: candidate.providerId,
        reason: "missing_title",
        title: null,
        rawReference,
      },
    };
  }
  if (!publishedAt) {
    return {
      rejection: {
        providerId: candidate.providerId,
        reason: "invalid_published_at",
        title,
        rawReference,
      },
    };
  }
  if (candidate.canonicalUrl && !canonicalUrl) {
    return {
      rejection: {
        providerId: candidate.providerId,
        reason: "invalid_url",
        title,
        rawReference,
      },
    };
  }

  const sourceName = cleanText(candidate.sourceName) || "Unknown source";
  const providerArticleId = cleanText(candidate.providerArticleId) || null;
  const description = cleanText(candidate.description) || null;
  const topics: HeadlineFlowTopic[] = candidate.topics?.length ? candidate.topics.map(normalizeTopic) : ["general"];
  const fingerprint = hash([
    canonicalUrl || "",
    title.toLowerCase(),
    sourceName.toLowerCase(),
    publishedAt.toISOString().slice(0, 13),
  ].join("|"));

  return {
    article: {
      id: `article_${hash(`${candidate.providerId}|${providerArticleId || canonicalUrl || fingerprint}`)}`,
      providerId: candidate.providerId,
      providerArticleId,
      source: {
        id: `source_${hash(`${candidate.providerId}|${sourceName.toLowerCase()}`)}`,
        name: sourceName,
        providerId: candidate.providerId,
        sourceType: "news_outlet",
        url: sourceUrl,
      },
      title,
      description,
      canonicalUrl,
      imageUrl,
      author: cleanText(candidate.author) || null,
      publishedAt,
      retrievedAt,
      topics,
      fingerprint,
      rawReference,
    },
  };
}

export function normalizeArticleCandidates(candidates: ArticleCandidate[], now: Date) {
  const articles: CanonicalArticle[] = [];
  const rejections: ArticleRejection[] = [];
  for (const candidate of candidates) {
    const result = normalizeArticleCandidate(candidate, now);
    if (result.article) {
      articles.push(result.article);
    } else {
      rejections.push(result.rejection);
    }
  }
  return { articles, rejections };
}
