import { createServer } from "node:http";

const bodyLimit = 8_192;
const requestWindowMs = 60_000;
const requestLimit = 60;
const upstreamTimeoutMs = 8_000;

const json = (response, status, payload, origin) => {
  response.writeHead(status, {
    "access-control-allow-headers": "content-type, x-request-id",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": origin ?? "null",
    "content-type": "application/json; charset=utf-8",
    vary: "Origin",
  });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > bodyLimit)
      throw new Error("Request too large.");
  }
  return JSON.parse(body || "{}");
};

const validCity = (city) =>
  typeof city === "string" &&
  city.trim().length >= 2 &&
  city.trim().length <= 80 &&
  !/[\u0000-\u001f<>]/.test(city);

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isConfirmedCapabilityRequest = (value) =>
  isRecord(value) &&
  value.status === "CONFIRMED" &&
  typeof value.requestId === "string" &&
  /^[a-zA-Z0-9_-]{8,80}$/.test(value.requestId) &&
  typeof value.capability === "string" &&
  /^[a-z0-9.-]{3,80}$/.test(value.capability) &&
  isRecord(value.payload);

const normalizeWeather = (city, geocode, forecast) => ({
  city: geocode.name ?? city,
  temperature: forecast.current?.temperature_2m,
  weatherCode: forecast.current?.weather_code,
  sunrise: forecast.daily?.sunrise?.[0],
  sunset: forecast.daily?.sunset?.[0],
});

export function createAdapterServer({
  allowedOrigins = [],
  fetchImpl = fetch,
  propriumToken = process.env.AXIOM_PROPRIUM_TOKEN,
  propriumUrl = process.env.AXIOM_PROPRIUM_URL,
} = {}) {
  const requests = new Map();

  const originFor = (request) => {
    const origin = request.headers.origin;
    if (!origin) return null;
    return allowedOrigins.includes(origin) ? origin : undefined;
  };

  const isRateLimited = (request) => {
    const ip = request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const recent = (requests.get(ip) ?? []).filter(
      (timestamp) => timestamp > now - requestWindowMs,
    );
    recent.push(now);
    requests.set(ip, recent);
    return recent.length > requestLimit;
  };

  return createServer(async (request, response) => {
    const origin = originFor(request);
    if (origin === undefined) {
      json(response, 403, { error: "Origin is not allowed." }, null);
      return;
    }
    if (request.method === "OPTIONS") {
      json(response, 204, {}, origin);
      return;
    }
    if (isRateLimited(request)) {
      json(response, 429, { error: "Too many requests." }, origin);
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        json(response, 200, { status: "ok" }, origin);
        return;
      }

      if (request.method === "GET" && url.pathname === "/weather") {
        const city = url.searchParams.get("city")?.trim() ?? "";
        if (!validCity(city)) {
          json(response, 400, { error: "Provide a valid city name." }, origin);
          return;
        }
        const geocoding = await fetchImpl(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
          { signal: AbortSignal.timeout(upstreamTimeoutMs) },
        );
        const location = (await geocoding.json()).results?.[0];
        if (!geocoding.ok || !location) {
          json(response, 404, { error: "City was not found." }, origin);
          return;
        }
        const forecast = await fetchImpl(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto`,
          { signal: AbortSignal.timeout(upstreamTimeoutMs) },
        );
        const data = await forecast.json();
        const weather = normalizeWeather(city, location, data);
        if (
          !forecast.ok ||
          !Number.isFinite(weather.temperature) ||
          !Number.isFinite(weather.weatherCode) ||
          typeof weather.sunrise !== "string" ||
          typeof weather.sunset !== "string"
        ) {
          json(
            response,
            502,
            { error: "Weather service is unavailable." },
            origin,
          );
          return;
        }
        json(response, 200, weather, origin);
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/proprium/capability-requests"
      ) {
        const capabilityRequest = await readJson(request);
        if (!isConfirmedCapabilityRequest(capabilityRequest)) {
          json(
            response,
            400,
            {
              error: "Only confirmed, typed capability requests are accepted.",
            },
            origin,
          );
          return;
        }
        if (!propriumUrl || !propriumToken) {
          json(
            response,
            503,
            { error: "Proprium adapter is not configured." },
            origin,
          );
          return;
        }
        const upstream = await fetchImpl(propriumUrl, {
          method: "POST",
          headers: {
            authorization: `Bearer ${propriumToken}`,
            "content-type": "application/json",
            "x-request-id": capabilityRequest.requestId,
          },
          body: JSON.stringify(capabilityRequest),
          signal: AbortSignal.timeout(upstreamTimeoutMs),
        });
        const payload = await upstream.json().catch(() => ({}));
        json(
          response,
          upstream.ok ? 202 : 502,
          upstream.ok
            ? { accepted: true }
            : { error: payload.error ?? "Proprium rejected the request." },
          origin,
        );
        return;
      }

      json(response, 404, { error: "Not found." }, origin);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Adapter failure.";
      json(
        response,
        500,
        {
          error:
            message === "Request too large." ? message : "Adapter failure.",
        },
        origin,
      );
    }
  });
}
