import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchWeatherContext,
  loadCachedWeather,
  saveCachedWeather,
} from "./weather-adapter";

const weather = {
  city: "New York",
  temperature: 19,
  weatherCode: 0,
  sunrise: "2026-09-19T06:40",
  sunset: "2026-09-19T18:58",
};

describe("weather adapter", () => {
  beforeEach(() => window.localStorage.clear());

  it("caches the last valid weather response", () => {
    saveCachedWeather(weather);

    expect(loadCachedWeather()).toMatchObject({ weather });
  });

  it("retries a transient request failure before succeeding", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(weather), { status: 200 }),
      );
    const onRetry = vi.fn();

    await expect(
      fetchWeatherContext({
        adapterUrl: "https://adapter.example",
        city: "New York",
        fetchImpl,
        onRetry,
        sleep: async () => undefined,
      }),
    ).resolves.toEqual(weather);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(2);
  });

  it("does not retry a client-side adapter response", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Provide a valid city name." }), {
        status: 400,
      }),
    );

    await expect(
      fetchWeatherContext({
        adapterUrl: "https://adapter.example",
        city: "",
        fetchImpl,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("Provide a valid city name.");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
