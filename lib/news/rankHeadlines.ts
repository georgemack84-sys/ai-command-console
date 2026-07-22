import type { Headline, HeadlineCategory } from "@/types/headline";

export function rankHeadlines(stories: Headline[], category: HeadlineCategory | "top" = "top") {
  const sourceCounts = new Map<string, number>();
  return [...stories]
    .map((story, index) => {
      const seen = sourceCounts.get(story.source.name) ?? 0;
      sourceCounts.set(story.source.name, seen + 1);
      return {
        story,
        index,
        score:
          story.importanceScore * 0.48 +
          story.freshnessScore * 0.34 +
          (category === "top" || story.category === category ? 12 : 0) +
          (seen === 0 ? 6 : -8 * seen),
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ story }) => story);
}
