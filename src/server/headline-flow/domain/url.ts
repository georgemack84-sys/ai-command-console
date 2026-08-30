const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

export function canonicalizeArticleUrl(value?: string | null) {
  if (!value) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return null;
  }
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  for (const param of Array.from(parsed.searchParams.keys())) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      parsed.searchParams.delete(param);
    }
  }
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}
