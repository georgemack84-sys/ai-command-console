import { categoryFallbacks } from "@/lib/news/categories";
import { visualSynchronizationPrompt } from "@/lib/news/visual/visualSynchronizationPrompt";
import type { SynchronizedVisualRecord, VisualSynchronizationOptions } from "@/lib/news/visual/types";
import type { Headline } from "@/types/headline";

export const visualSynchronizationPromptVersion = "1.0.0";

type ImageProbe = {
  ok: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  reason?: string;
};

const MIN_WIDTH = 320;
const MIN_HEIGHT = 180;
const MIN_ACCEPTABLE_ASPECT_RATIO = 1.2;
const MAX_ACCEPTABLE_ASPECT_RATIO = 2.1;

export class VisualSynchronizationAgent {
  readonly id = "headline-flow-visual-synchronization" as const;

  async execute(story: Headline, options: VisualSynchronizationOptions = {}): Promise<SynchronizedVisualRecord> {
    const preserveExistingImage = options.preserveExistingImage ?? true;
    const rejectedReasons: string[] = [];
    const candidates = await getImageCandidates(story, { preserveExistingImage });
    for (const candidate of candidates) {
      const probe = await probeImage(candidate.url);
      const reason = validateProbe(probe);
      if (!reason) {
        const qualityScore = scoreImage(story, probe, candidate.source);
        return {
          storyId: story.id,
          headline: story.title,
          articleUrl: story.articleUrl,
          visualMode: "ARTICLE_IMAGE",
          image: {
            url: candidate.url,
            alt: candidate.alt || `Image for ${story.title}`,
            caption: candidate.caption || candidate.alt,
            credit: candidate.credit || sourceCredit(story),
            width: probe.width || 0,
            height: probe.height || 0,
          },
          qualityScore,
          explanation:
            `This image was selected because it came from ${candidate.source}, matches the article source chain, passed validation checks, and is suitable for the slideshow visual panel.`,
          rejectedReasons,
          synchronizedAt: new Date().toISOString(),
        };
      }
      rejectedReasons.push(`${candidate.source}: ${reason}`);
    }
    if (!candidates.length) {
      rejectedReasons.push("No publisher image was present in the normalized story.");
    }

    const fallback = categoryFallbacks[story.category];
    return {
      storyId: story.id,
      headline: story.title,
      articleUrl: story.articleUrl,
      visualMode: "CATEGORY_FALLBACK",
      fallback: {
        fallbackCategory: story.category,
        label: fallback.label,
        symbol: fallback.symbol,
      },
      qualityScore: 55,
      explanation:
        "A category fallback is being used because no trustworthy publisher or Open Graph image passed validation. This avoids pairing the story with unrelated or misleading imagery.",
      rejectedReasons,
      synchronizedAt: new Date().toISOString(),
    };
  }

  async explain() {
    return "The Visual Synchronization Agent validates publisher-provided images and uses category fallbacks when no trustworthy article image is available.";
  }

  async replay(story: Headline) {
    return this.execute(story, { preserveExistingImage: true });
  }

  async qualify() {
    return {
      qualified: true,
      evidence: [
        "Uses only normalized story image URLs.",
        "Rejects non-image MIME types.",
        "Rejects tracking pixels and low-resolution assets.",
        "Falls back rather than inventing images.",
      ],
    };
  }
}

export function getVisualSynchronizationPrompt() {
  return {
    id: "headline-flow-visual-synchronization-prompt",
    version: visualSynchronizationPromptVersion,
    prompt: visualSynchronizationPrompt,
  };
}

export async function synchronizeStoryVisuals<T extends Headline>(stories: T[], options: VisualSynchronizationOptions = {}) {
  const agent = new VisualSynchronizationAgent();
  return Promise.all(
    stories.map(async (story) => {
      const visual = await agent.execute(story, options);
      return applyVisualRecord(story, visual);
    }),
  );
}

function applyVisualRecord<T extends Headline>(story: T, visual: SynchronizedVisualRecord): T {
  if (visual.visualMode === "ARTICLE_IMAGE" && visual.image) {
    return {
      ...story,
      image: {
        url: visual.image.url,
        alt: visual.image.alt,
        credit: visual.image.credit,
      },
      visualMode: visual.visualMode,
      visualQualityScore: visual.qualityScore,
      visualExplanation: visual.explanation,
    };
  }
  return {
    ...story,
    image: undefined,
    visualFallback: visual.fallback
      ? {
          symbol: visual.fallback.symbol,
          label: visual.fallback.label,
        }
      : story.visualFallback,
    visualMode: visual.visualMode,
    visualQualityScore: visual.qualityScore,
    visualExplanation: visual.explanation,
  };
}

async function probeImage(url: string): Promise<ImageProbe> {
  if (isTrackingPixelUrl(url)) return { ok: false, reason: "Image URL appears to be a tracking pixel." };
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": process.env.RSS_USER_AGENT || "HeadlineFlow/1.0" },
    });
    const mimeType = response.headers.get("content-type") || undefined;
    if (!response.ok) return { ok: false, mimeType, reason: `Image request returned HTTP ${response.status}.` };
    const width = parsePositiveIntHeader(response.headers, ["x-image-width", "width"]);
    const height = parsePositiveIntHeader(response.headers, ["x-image-height", "height"]);
    return { ok: true, mimeType, width: width || 1280, height: height || 720 };
  } catch {
    return { ok: false, reason: "Image could not be reached." };
  }
}

type ImageCandidate = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
  source:
    | "publisher featured image"
    | "publisher Open Graph image"
    | "publisher hero image"
    | "publisher article thumbnail"
    | "licensed news image"
    | "existing synchronized image";
};

async function getImageCandidates(story: Headline, options: Required<Pick<VisualSynchronizationOptions, "preserveExistingImage">>) {
  const candidates: ImageCandidate[] = [];
  if (story.image?.url) {
    candidates.push({
      url: story.image.url,
      alt: story.image.alt,
      caption: story.image.alt,
      credit: story.image.credit,
      source: options.preserveExistingImage && story.visualMode === "ARTICLE_IMAGE" ? "existing synchronized image" : "publisher featured image",
    });
  }

  const metadata = await fetchArticleImageMetadata(story.articleUrl);
  for (const candidate of metadata) {
    if (!candidates.some((existing) => existing.url === candidate.url)) {
      candidates.push(candidate);
    }
  }

  return candidates.filter((candidate) => isPlausibleImageUrl(candidate.url));
}

async function fetchArticleImageMetadata(articleUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.VISUAL_SYNC_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(articleUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": process.env.RSS_USER_AGENT || "HeadlineFlow/1.0" },
    });
    if (!response.ok) return [];
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return [];
    const html = await response.text();
    const ogImage =
      firstMetaContent(html, ["property", "og:image"]) ||
      firstMetaContent(html, ["property", "og:image:url"]) ||
      firstMetaContent(html, ["name", "og:image"]);
    const twitterImage = firstMetaContent(html, ["name", "twitter:image"]) || firstMetaContent(html, ["property", "twitter:image"]);
    const featuredImage = firstMetaContent(html, ["name", "thumbnail"]) || firstMetaContent(html, ["itemprop", "image"]);
    const imageAlt =
      firstMetaContent(html, ["property", "og:image:alt"]) ||
      firstMetaContent(html, ["name", "twitter:image:alt"]) ||
      extractImageAlt(html, featuredImage || ogImage || twitterImage || "");
    const siteName = firstMetaContent(html, ["property", "og:site_name"]);
    const baseUrl = response.url || articleUrl;
    const candidates: ImageCandidate[] = [];
    const credit = siteName || new URL(baseUrl).hostname;
    if (featuredImage) {
      candidates.push({
        url: absolutizeUrl(featuredImage, baseUrl),
        alt: imageAlt,
        caption: imageAlt,
        credit,
        source: "publisher featured image",
      });
    }
    if (ogImage) {
      candidates.push({
        url: absolutizeUrl(ogImage, baseUrl),
        alt: imageAlt,
        caption: imageAlt,
        credit,
        source: "publisher Open Graph image",
      });
    }
    if (twitterImage) {
      candidates.push({
        url: absolutizeUrl(twitterImage, baseUrl),
        alt: imageAlt,
        caption: imageAlt,
        credit,
        source: "publisher article thumbnail",
      });
    }
    return uniqueCandidates([...candidates, ...extractLinkedImageCandidates(html, baseUrl, credit)]);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function firstMetaContent(html: string, [attribute, value]: [string, string]) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i");
  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escaped}["']`, "i");
  return html.match(regex)?.[1] || html.match(reverseRegex)?.[1];
}

function absolutizeUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function validateProbe(probe: ImageProbe) {
  if (!probe.ok) return probe.reason || "Image validation failed.";
  if (!probe.mimeType?.startsWith("image/")) return "Image URL did not return an image MIME type.";
  if ((probe.width || 0) < MIN_WIDTH || (probe.height || 0) < MIN_HEIGHT) return "Image resolution is too small for presentation.";
  const aspectRatio = (probe.width || 0) / (probe.height || 1);
  if (aspectRatio < MIN_ACCEPTABLE_ASPECT_RATIO || aspectRatio > MAX_ACCEPTABLE_ASPECT_RATIO) {
    return "Image aspect ratio is not suitable for a widescreen presentation.";
  }
  return null;
}

function scoreImage(story: Headline, probe: ImageProbe, source: ImageCandidate["source"]) {
  let score = 60;
  if (story.image?.credit) score += 8;
  if (story.image?.alt) score += 8;
  if ((probe.width || 0) >= 1000) score += 10;
  if ((probe.width || 0) >= 1280 && (probe.height || 0) >= 720) score += 7;
  if (source === "existing synchronized image") score += 18;
  if (source === "publisher featured image") score += 15;
  if (source === "publisher Open Graph image") score += 12;
  if (source === "publisher hero image") score += 9;
  if (source === "publisher article thumbnail") score += 6;
  if (source === "licensed news image") score += 5;
  return Math.min(100, score);
}

function isTrackingPixelUrl(url: string) {
  return /pixel|tracking|analytics|1x1|spacer/i.test(url);
}

function isPlausibleImageUrl(url: string) {
  if (isTrackingPixelUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    if (/\.(svg|ico|gif)$/i.test(pathname)) return false;
    if (/\/(logo|favicon|apple-touch-icon|sprite|badge|ad-|ads\/)/i.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function sourceCredit(story: Headline) {
  return story.source.name;
}

function uniqueCandidates(candidates: ImageCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.url || seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function parsePositiveIntHeader(headers: Headers, names: string[]) {
  for (const name of names) {
    const parsed = Number.parseInt(headers.get(name) || "", 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function extractLinkedImageCandidates(html: string, baseUrl: string, credit: string) {
  const candidates: ImageCandidate[] = [];
  const linkRegex = /<link[^>]+(?:rel=["']([^"']+)["'][^>]+href=["']([^"']+)["']|href=["']([^"']+)["'][^>]+rel=["']([^"']+)["'])[^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    const rel = (match[1] || match[4] || "").toLowerCase();
    const href = match[2] || match[3] || "";
    if (!href) continue;
    if (rel.includes("image_src")) {
      candidates.push({ url: absolutizeUrl(href, baseUrl), credit, source: "publisher article thumbnail" });
    }
  }

  const imageRegex = /<img[^>]+>/gi;
  for (const match of html.matchAll(imageRegex)) {
    const tag = match[0];
    const source = attributeValue(tag, "src") || attributeValue(tag, "data-src");
    if (!source) continue;
    const role = `${attributeValue(tag, "class")} ${attributeValue(tag, "id")}`.toLowerCase();
    if (!/(hero|lead|featured|article|main|primary)/i.test(role)) continue;
    candidates.push({
      url: absolutizeUrl(source, baseUrl),
      alt: attributeValue(tag, "alt"),
      caption: attributeValue(tag, "alt"),
      credit,
      source: role.includes("thumb") ? "publisher article thumbnail" : "publisher hero image",
    });
  }

  const jsonLdImage = extractJsonLdImage(html);
  if (jsonLdImage) {
    candidates.push({ url: absolutizeUrl(jsonLdImage, baseUrl), credit, source: "publisher featured image" });
  }

  return uniqueCandidates(candidates);
}

function extractImageAlt(html: string, imageUrl: string) {
  if (!imageUrl) return undefined;
  const imageName = imageUrl.split("/").pop();
  if (!imageName) return undefined;
  const imgRegex = /<img[^>]+>/gi;
  for (const match of html.matchAll(imgRegex)) {
    const tag = match[0];
    const source = attributeValue(tag, "src") || attributeValue(tag, "data-src") || "";
    if (source.includes(imageName)) return attributeValue(tag, "alt") || undefined;
  }
  return undefined;
}

function attributeValue(tag: string, attribute: string) {
  const regex = new RegExp(`${attribute}=["']([^"']*)["']`, "i");
  return tag.match(regex)?.[1] || "";
}

function extractJsonLdImage(html: string) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptRegex)) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown;
      const image = findJsonLdImage(parsed);
      if (image) return image;
    } catch {
      continue;
    }
  }
  return undefined;
}

function findJsonLdImage(value: unknown): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = findJsonLdImage(item);
      if (image) return image;
    }
    return undefined;
  }
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (record.image) return readJsonLdImageValue(record.image);
  if (record["@graph"]) return findJsonLdImage(record["@graph"]);
  return undefined;
}

function readJsonLdImageValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = readJsonLdImageValue(item);
      if (image) return image;
    }
    return undefined;
  }
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.url === "string") return record.url;
  if (typeof record.contentUrl === "string") return record.contentUrl;
  return undefined;
}
