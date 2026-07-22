import crypto from "node:crypto";
import { categoryFallbacks, mapCategory } from "@/lib/news/categories";
import { headlineSchema } from "@/lib/news/schemas";
import { toIsoDate } from "@/lib/utils/dates";
import { sourceInitials } from "@/lib/utils/initials";
import { toSafeUrl } from "@/lib/utils/urls";
import type { Headline, RawNewsStory } from "@/types/headline";

export function normalizeHeadline(raw: RawNewsStory): Headline | null {
  const title = cleanText(raw.title || "");
  const summary = concise(cleanText(raw.summary || ""));
  const articleUrl = toSafeUrl(raw.articleUrl);
  const publishedAt = toIsoDate(raw.publishedAt);
  const sourceName = cleanText(raw.sourceName || "Unknown Source");
  const category = mapCategory(raw.category);
  if (!title || !summary || !articleUrl || !publishedAt) return null;

  const imageUrl = toSafeUrl(raw.imageUrl);
  const story: Headline = {
    id: stableId(raw.id || articleUrl || title),
    title,
    summary,
    source: {
      name: sourceName,
      initials: sourceInitials(sourceName),
      type: raw.sourceType ? cleanText(raw.sourceType) : undefined,
    },
    category,
    publishedAt,
    articleUrl,
    image: imageUrl
      ? {
          url: imageUrl,
          alt: cleanText(raw.imageAlt || `${title} image`),
          credit: raw.imageCredit ? cleanText(raw.imageCredit) : undefined,
        }
      : undefined,
    visualFallback: categoryFallbacks[category],
    importanceScore: clampScore(raw.importanceScore ?? 50),
    freshnessScore: clampScore(raw.freshnessScore ?? freshnessFromDate(publishedAt)),
    saved: false,
    hidden: false,
  };

  const parsed = headlineSchema.safeParse(story);
  return parsed.success ? parsed.data : null;
}

export function normalizeHeadlines(rawStories: RawNewsStory[]) {
  return rawStories.map(normalizeHeadline).filter((story): story is Headline => Boolean(story));
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function concise(value: string) {
  if (value.length <= 260) return value;
  return `${value.slice(0, 257).trim()}...`;
}

function stableId(value: string) {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex").slice(0, 16);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function freshnessFromDate(value: string) {
  const ageHours = Math.max(0, (Date.now() - new Date(value).getTime()) / 36e5);
  return clampScore(100 - ageHours * 4);
}
