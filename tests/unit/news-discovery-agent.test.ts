import { describe, expect, it, vi } from "vitest";
import { LocalNewsDiscoveryAgent, getNewsDiscoveryPrompt } from "@/lib/news/discovery/NewsDiscoveryAgent";
import { newsDiscoveryResponseSchema } from "@/lib/news/discovery/schemas";

describe("News Discovery Agent", () => {
  it("exposes the reusable discovery prompt", () => {
    const prompt = getNewsDiscoveryPrompt();
    expect(prompt.prompt).toContain("Never fabricate news");
    expect(prompt.version).toBe("1.0.0");
  });

  it("returns normalized discovery stories from configured providers", async () => {
    vi.stubEnv("NEWS_PROVIDERS", "mock");
    const agent = new LocalNewsDiscoveryAgent();
    const response = await agent.execute({ category: "technology", limit: 3, timeWindowHours: 720 });

    expect(newsDiscoveryResponseSchema.parse(response).agent).toBe("headline-flow-news-discovery");
    expect(response.stories[0].articleUrl).toMatch(/^https:\/\//);
    expect(response.stories[0].reasonSelected).toMatch(/Selected because|category fallback|image/i);
    vi.unstubAllEnvs();
  });

  it("qualifies safety constraints for local discovery", async () => {
    const qualification = await new LocalNewsDiscoveryAgent().qualify();
    expect(qualification.qualified).toBe(true);
    expect(qualification.evidence.join(" ")).toContain("Does not invent");
  });
});
