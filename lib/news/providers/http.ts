export async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": process.env.RSS_USER_AGENT || "HeadlineFlow/1.0",
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function configuredUrl(baseUrl: string | undefined, path: string, params: Record<string, string | number | undefined>) {
  if (!baseUrl) return null;
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}
