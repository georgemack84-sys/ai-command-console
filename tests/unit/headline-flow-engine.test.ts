import { describe, expect, it } from "vitest";
import { deduplicateHeadlines } from "@/lib/news/deduplicateHeadlines";
import { mapCategory } from "@/lib/news/categories";
import { normalizeHeadline } from "@/lib/news/normalizeHeadline";
import { rankHeadlines } from "@/lib/news/rankHeadlines";
import { headlineFlowSettingsSchema, parseStoredSettings } from "@/lib/storage/localSettings";
import { sourceInitials } from "@/lib/utils/initials";
import type { Headline } from "@/types/headline";

const baseRaw = {
  title: "Test headline about resilient public infrastructure",
  summary: "A concise mock summary explains the major facts without including unsafe publisher markup.",
  sourceName: "Mock News Network",
  category: "technology",
  publishedAt: "2026-07-19T12:00:00.000Z",
  articleUrl: "https://example.com/story",
  importanceScore: 70,
  freshnessScore: 80,
};

describe("Headline Flow engine", () => {
  it("normalizes clean stories and attaches fallback metadata", () => {
    const story = normalizeHeadline({ ...baseRaw, title: " <b>Infrastructure teams test display network</b> " });

    expect(story?.title).toBe("Infrastructure teams test display network");
    expect(story?.source.initials).toBe("MNN");
    expect(story?.visualFallback?.symbol).toBe("TECH");
  });

  it("rejects invalid article URLs", () => {
    expect(normalizeHeadline({ ...baseRaw, articleUrl: "javascript:alert(1)" })).toBeNull();
  });

  it("maps provider category variants into known channels", () => {
    expect(mapCategory("global affairs")).toBe("world");
    expect(mapCategory("market watch")).toBe("business");
    expect(mapCategory("metro")).toBe("local");
  });

  it("generates source initials predictably", () => {
    expect(sourceInitials("The Daily Planet")).toBe("TDP");
    expect(sourceInitials("Wired")).toBe("WI");
  });

  it("deduplicates similar headlines and keeps the stronger story", () => {
    const a = normalizeHeadline({ ...baseRaw, articleUrl: "https://example.com/a", imageUrl: "https://example.com/a.jpg" }) as Headline;
    const b = normalizeHeadline({
      ...baseRaw,
      title: "Infrastructure teams test resilient display network",
      articleUrl: "https://example.com/b",
      importanceScore: 20,
      freshnessScore: 20,
    }) as Headline;

    expect(deduplicateHeadlines([a, b])).toHaveLength(1);
    expect(deduplicateHeadlines([a, b])[0].articleUrl).toBe("https://example.com/a");
  });

  it("ranks with deterministic score weights", () => {
    const lower = normalizeHeadline({ ...baseRaw, articleUrl: "https://example.com/lower", importanceScore: 20 }) as Headline;
    const higher = normalizeHeadline({ ...baseRaw, articleUrl: "https://example.com/higher", importanceScore: 90 }) as Headline;

    expect(rankHeadlines([lower, higher], "technology")[0].articleUrl).toBe("https://example.com/higher");
  });

  it("validates and falls back for settings", () => {
    expect(headlineFlowSettingsSchema.parse(parseStoredSettings(null)).slideDurationSeconds).toBe(10);
    expect(parseStoredSettings("{bad json").defaultCategory).toBe("top");
  });

  it("preserves image data when a safe image URL is provided", () => {
    const story = normalizeHeadline({ ...baseRaw, imageUrl: "https://example.com/image.jpg", imageCredit: "Example" });
    expect(story?.image?.credit).toBe("Example");
  });
});
