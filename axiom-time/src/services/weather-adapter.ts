const weatherCacheKey = "axiom-time:weather-context";
const retryLimit = 3;

export interface WeatherContext {
  city: string;
  temperature: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

export interface CachedWeatherContext {
  fetchedAt: string;
  weather: WeatherContext;
}

interface FetchWeatherOptions {
  adapterUrl?: string;
  city: string;
  fetchImpl?: typeof fetch;
  onRetry?: (attempt: number) => void;
  sleep?: (milliseconds: number) => Promise<void>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWeatherContext = (value: unknown): value is WeatherContext =>
  isRecord(value) &&
  typeof value.city === "string" &&
  typeof value.temperature === "number" &&
  Number.isFinite(value.temperature) &&
  typeof value.weatherCode === "number" &&
  Number.isFinite(value.weatherCode) &&
  typeof value.sunrise === "string" &&
  Number.isFinite(Date.parse(value.sunrise)) &&
  typeof value.sunset === "string" &&
  Number.isFinite(Date.parse(value.sunset));

const isCachedWeatherContext = (
  value: unknown,
): value is CachedWeatherContext =>
  isRecord(value) &&
  typeof value.fetchedAt === "string" &&
  Number.isFinite(Date.parse(value.fetchedAt)) &&
  isWeatherContext(value.weather);

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

class WeatherResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const isRetryable = (error: unknown) =>
  !(error instanceof WeatherResponseError) || error.status >= 500;

export const loadCachedWeather = (): CachedWeatherContext | null => {
  try {
    const raw = window.localStorage.getItem(weatherCacheKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isCachedWeatherContext(value) ? value : null;
  } catch {
    return null;
  }
};

export const saveCachedWeather = (weather: WeatherContext) => {
  try {
    window.localStorage.setItem(
      weatherCacheKey,
      JSON.stringify({ fetchedAt: new Date().toISOString(), weather }),
    );
  } catch {
    // The live result remains available if device storage is unavailable.
  }
};

export const fetchWeatherContext = async ({
  adapterUrl,
  city,
  fetchImpl = fetch,
  onRetry,
  sleep = delay,
}: FetchWeatherOptions): Promise<WeatherContext> => {
  if (!adapterUrl) throw new Error("Weather adapter is unavailable offline.");

  const url = `${adapterUrl.replace(/\/$/, "")}/weather?city=${encodeURIComponent(city)}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
    try {
      const response = await fetchImpl(url);
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Weather lookup failed.";
        throw new WeatherResponseError(message, response.status);
      }
      if (!isWeatherContext(payload)) {
        throw new Error("Weather service returned an invalid response.");
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt === retryLimit || !isRetryable(error)) break;
      onRetry?.(attempt + 1);
      await sleep(attempt * 1_000);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Weather lookup failed.");
};
