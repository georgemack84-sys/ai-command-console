const SECTION_PATHS = new Set([
  "article",
  "articles",
  "business",
  "culture",
  "entertainment",
  "health",
  "latest",
  "live",
  "news",
  "politics",
  "science",
  "search",
  "sports",
  "technology",
  "topics",
  "us",
  "video",
  "videos",
  "world",
]);

const NON_ARTICLE_EXTENSIONS = /\.(avif|css|gif|ico|jpeg|jpg|js|json|mp3|mp4|pdf|png|svg|webm|webp|xml)$/i;
const DATE_SEGMENT_PATTERN = /(?:^|\/)(?:20\d{2})[/-](?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])(?:\/|$)/;

function slugLooksSpecific(value: string) {
  const normalized = value.replace(/\.[a-z0-9]+$/i, "");
  if (/^\d{10,}$/.test(normalized)) {
    return true;
  }
  if (normalized.length >= 10 && /[a-z]/i.test(normalized) && /\d/.test(normalized)) {
    return true;
  }

  const slug = value
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[-_]/)
    .filter((part) => /[a-z0-9]/i.test(part));
  return slug.length >= 4 || value.length >= 32;
}

export function getArticleUrlRejectionReason(value?: string | null) {
  if (!value) {
    return "missing_url";
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "invalid_url";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "invalid_protocol";
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  if (!pathname || pathname === "") {
    return "homepage";
  }

  if (NON_ARTICLE_EXTENSIONS.test(pathname)) {
    return "asset_url";
  }

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1)?.toLowerCase() ?? "";
  if (url.searchParams.has("q") || url.searchParams.has("s") || segments.some((segment) => segment.toLowerCase() === "search")) {
    return "search_page";
  }

  if (segments.length === 1 && SECTION_PATHS.has(lastSegment)) {
    return "section_page";
  }

  if (segments.length <= 2 && SECTION_PATHS.has(lastSegment)) {
    return "section_page";
  }

  if (!DATE_SEGMENT_PATTERN.test(pathname) && !slugLooksSpecific(lastSegment)) {
    return "not_article_like";
  }

  return null;
}

export function isLikelyArticleUrl(value?: string | null) {
  return getArticleUrlRejectionReason(value) === null;
}
