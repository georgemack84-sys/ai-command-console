import { categoryLabels } from "@/lib/news/categories";
import type { Headline } from "@/types/headline";

export type HeadlineVideoScene = {
  id: string;
  startSecond: number;
  endSecond: number;
  label: string;
  subtitle: string;
  visualCue: "headline" | "footage" | "narration" | "why-it-matters";
};

export type HeadlineVideoComposition = {
  storyId: string;
  durationSeconds: number;
  narrationScript: string;
  subtitleBeats: HeadlineVideoScene[];
  whyItMatters: string;
  backgroundKind: "article-image" | "category-motion";
  backgroundUrl?: string;
  credit?: string;
  categoryLabel: string;
};

const DEFAULT_DURATION_SECONDS = 12;

export function composeHeadlineVideo(story: Headline): HeadlineVideoComposition {
  const narrationScript = buildNarrationScript(story);
  const whyItMatters = buildWhyItMatters(story);

  return {
    storyId: story.id,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    narrationScript,
    subtitleBeats: [
      {
        id: `${story.id}-headline`,
        startSecond: 0,
        endSecond: 2,
        label: "Headline",
        subtitle: story.title,
        visualCue: "headline",
      },
      {
        id: `${story.id}-context`,
        startSecond: 2,
        endSecond: 5,
        label: "Context",
        subtitle: sentenceFromSummary(story.summary, 0),
        visualCue: "footage",
      },
      {
        id: `${story.id}-narration`,
        startSecond: 5,
        endSecond: 9,
        label: "AI Narration",
        subtitle: sentenceFromSummary(story.summary, 1) || story.summary,
        visualCue: "narration",
      },
      {
        id: `${story.id}-impact`,
        startSecond: 9,
        endSecond: 12,
        label: "Why It Matters",
        subtitle: whyItMatters,
        visualCue: "why-it-matters",
      },
    ],
    whyItMatters,
    backgroundKind: story.image?.url ? "article-image" : "category-motion",
    backgroundUrl: story.image?.url,
    credit: story.image?.credit || story.source.name,
    categoryLabel: categoryLabels[story.category],
  };
}

function buildNarrationScript(story: Headline) {
  return `${story.title}. ${story.summary} Why it matters: ${buildWhyItMatters(story)}`;
}

function buildWhyItMatters(story: Headline) {
  if (story.explanation?.whyRecommended) return story.explanation.whyRecommended;
  if (story.explanation?.whyThisStory) return story.explanation.whyThisStory;
  const category = categoryLabels[story.category].toLowerCase();
  return `This ${category} story is worth watching because it combines a high-priority update with fresh source reporting from ${story.source.name}.`;
}

function sentenceFromSummary(summary: string, index: number) {
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences[index] || sentences[0] || summary;
}
