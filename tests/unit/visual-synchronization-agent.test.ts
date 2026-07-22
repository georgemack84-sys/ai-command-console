import { describe, expect, it, vi } from "vitest";
import { VisualSynchronizationAgent, getVisualSynchronizationPrompt, synchronizeStoryVisuals } from "@/lib/news/visual/VisualSynchronizationAgent";
import type { Headline } from "@/types/headline";

const baseStory: Headline = {
  id: "visual-test-story",
  title: "A current event story with enough title words",
  summary: "A concise summary for the current event story.",
  source: { name: "Example News", initials: "EN" },
  category: "technology",
  publishedAt: "2026-07-19T12:00:00.000Z",
  articleUrl: "https://example.com/news/story",
  importanceScore: 70,
  freshnessScore: 80,
  saved: false,
  hidden: false,
};

describe("Visual Synchronization Agent", () => {
  it("exposes the reusable prompt", () => {
    expect(getVisualSynchronizationPrompt().prompt).toContain("Never fabricate visual evidence");
  });

  it("falls back when no image exists", async () => {
    const visual = await new VisualSynchronizationAgent().execute(baseStory);
    expect(visual.visualMode).toBe("CATEGORY_FALLBACK");
    expect(visual.fallback?.fallbackCategory).toBe("technology");
  });

  it("keeps validated story images", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
      })),
    );
    const [story] = await synchronizeStoryVisuals([
      {
        ...baseStory,
        image: { url: "https://example.com/news/story-image.jpg", alt: "Story image", credit: "Example News" },
      },
    ]);
    expect(story.visualMode).toBe("ARTICLE_IMAGE");
    expect(story.visualQualityScore).toBeGreaterThan(70);
    vi.unstubAllGlobals();
  });

  it("extracts publisher Open Graph images when normalized image is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: new Headers({ "content-type": "image/jpeg" }),
          };
        }
        return {
          ok: true,
          url,
          headers: new Headers({ "content-type": "text/html" }),
          text: async () =>
            '<html><head><meta property="og:image" content="/cdn/story.jpg"><meta property="og:image:alt" content="Publisher image"><meta property="og:site_name" content="Example News"></head></html>',
        };
      }),
    );

    const [story] = await synchronizeStoryVisuals([baseStory]);

    expect(story.visualMode).toBe("ARTICLE_IMAGE");
    expect(story.image?.url).toBe("https://example.com/cdn/story.jpg");
    expect(story.image?.credit).toBe("Example News");
    vi.unstubAllGlobals();
  });

  it("rejects unsuitable images and records the reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: new Headers({
              "content-type": "image/jpeg",
              "x-image-width": "120",
              "x-image-height": "80",
            }),
          };
        }
        return {
          ok: true,
          url,
          headers: new Headers({ "content-type": "text/html" }),
          text: async () => '<html><head><meta property="og:image" content="/cdn/tiny.jpg"></head></html>',
        };
      }),
    );

    const visual = await new VisualSynchronizationAgent().execute(baseStory);

    expect(visual.visualMode).toBe("CATEGORY_FALLBACK");
    expect(visual.rejectedReasons.join(" ")).toContain("resolution is too small");
    vi.unstubAllGlobals();
  });

  it("uses a publisher hero image when an Open Graph image is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "HEAD") {
          const targetUrl = String(url);
          return {
            ok: true,
            headers: new Headers({
              "content-type": targetUrl.includes("logo") ? "image/svg+xml" : "image/jpeg",
              "x-image-width": targetUrl.includes("hero") ? "1600" : "100",
              "x-image-height": targetUrl.includes("hero") ? "900" : "100",
            }),
          };
        }
        return {
          ok: true,
          url,
          headers: new Headers({ "content-type": "text/html" }),
          text: async () =>
            '<html><head><meta property="og:image" content="/assets/social-logo.png"><meta property="og:site_name" content="Example News"></head><body><img class="article-hero" src="/cdn/hero.jpg" alt="A newsroom photo"></body></html>',
        };
      }),
    );

    const visual = await new VisualSynchronizationAgent().execute(baseStory);

    expect(visual.visualMode).toBe("ARTICLE_IMAGE");
    expect(visual.image?.url).toBe("https://example.com/cdn/hero.jpg");
    expect(visual.image?.alt).toBe("A newsroom photo");
    expect(visual.rejectedReasons.join(" ")).toContain("resolution is too small");
    vi.unstubAllGlobals();
  });

  it("preserves an existing synchronized image during refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: new Headers({
              "content-type": "image/jpeg",
              "x-image-width": "1280",
              "x-image-height": "720",
            }),
          };
        }
        return {
          ok: true,
          url,
          headers: new Headers({ "content-type": "text/html" }),
          text: async () => '<html><head><meta property="og:image" content="/cdn/newer.jpg"></head></html>',
        };
      }),
    );

    const [story] = await synchronizeStoryVisuals([
      {
        ...baseStory,
        visualMode: "ARTICLE_IMAGE",
        image: { url: "https://example.com/cdn/existing.jpg", alt: "Existing image", credit: "Example News" },
      },
    ]);

    expect(story.visualMode).toBe("ARTICLE_IMAGE");
    expect(story.image?.url).toBe("https://example.com/cdn/existing.jpg");
    vi.unstubAllGlobals();
  });
});
