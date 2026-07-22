import { describe, expect, it } from "vitest";
import { composeHeadlineVideo } from "@/lib/news/video/composeHeadlineVideo";
import type { Headline } from "@/types/headline";

const story: Headline = {
  id: "video-story",
  title: "NASA successfully tests a new lunar navigation system",
  summary: "The agency completed a test of navigation tools for future moon missions. Engineers say the results could improve landing accuracy.",
  source: { name: "Example Space", initials: "ES" },
  category: "science",
  publishedAt: "2026-07-19T12:00:00.000Z",
  articleUrl: "https://example.com/space",
  image: { url: "https://example.com/space.jpg", alt: "Lunar mission equipment", credit: "Example Space" },
  importanceScore: 82,
  freshnessScore: 90,
  saved: false,
  hidden: false,
};

describe("Headline video composition", () => {
  it("builds a 12-second timeline from story metadata", () => {
    const composition = composeHeadlineVideo(story);

    expect(composition.durationSeconds).toBe(12);
    expect(composition.backgroundKind).toBe("article-image");
    expect(composition.backgroundUrl).toBe("https://example.com/space.jpg");
    expect(composition.subtitleBeats.map((beat) => [beat.startSecond, beat.endSecond])).toEqual([
      [0, 2],
      [2, 5],
      [5, 9],
      [9, 12],
    ]);
    expect(composition.narrationScript).toContain(story.title);
    expect(composition.whyItMatters).toContain("Example Space");
  });

  it("uses category motion when no article image is available", () => {
    const composition = composeHeadlineVideo({ ...story, image: undefined });

    expect(composition.backgroundKind).toBe("category-motion");
    expect(composition.backgroundUrl).toBeUndefined();
  });
});
