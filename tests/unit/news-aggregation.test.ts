import { describe, expect, it, vi } from "vitest";
import { aggregateHeadlines } from "@/lib/news/aggregateHeadlines";
import { cacheStats } from "@/lib/news/cache";
import { getProviderHealth } from "@/lib/news/providers";

describe("real news provider aggregation", () => {
  it("aggregates configured providers and returns source statistics", async () => {
    vi.stubEnv("NEWS_PROVIDERS", "mock");
    const result = await aggregateHeadlines({ category: "technology", limit: 5, forceMock: false });

    expect(result.providers[0]).toMatchObject({ name: "mock", status: "fulfilled" });
    expect(result.stories.length).toBeGreaterThan(0);
    expect(result.sourceStats.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });

  it("reports provider health without requiring credentials", async () => {
    const health = await getProviderHealth();
    expect(health.map((provider) => provider.name)).toEqual(expect.arrayContaining(["mock", "web-search", "rss", "newsapi", "gnews", "guardian"]));
    expect(health.find((provider) => provider.name === "mock")?.status).toBe("ok");
  });

  it("tracks cache entries for repeated aggregation", async () => {
    vi.stubEnv("NEWS_PROVIDERS", "mock");
    await aggregateHeadlines({ category: "top", limit: 2 });
    expect(cacheStats().entries).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });
});
