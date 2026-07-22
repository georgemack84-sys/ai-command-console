/**
 * @typedef {{
 *   status: string,
 *   application: string,
 *   version: string,
 *   environment: string,
 *   components: Record<string, string | number>
 * }} HealthResponse
 */

const apiBaseUrl = globalThis.D2D_API_BASE_URL ?? "http://127.0.0.1:8010";

export class ApiClientError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiClientError";
    this.details = details;
  }
}

export async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 2000);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID?.() ?? "d2d-web-request",
      },
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new ApiClientError(payload.message ?? `Request failed with ${response.status}`, {
        status: response.status,
        requestId: response.headers.get("X-Request-ID") ?? payload.request_id,
        payload,
      });
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError("Unable to reach the API.", { cause: error.name });
  } finally {
    clearTimeout(timeout);
  }
}

export function renderHealthSummary(payload) {
  const database = payload.components?.database ?? "unknown";
  const postgres = payload.components?.postgres ?? "unknown";
  return `API ${payload.status} - database ${database} - PostgreSQL ${postgres}`;
}
