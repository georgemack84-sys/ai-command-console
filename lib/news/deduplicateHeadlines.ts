import type { Headline } from "@/types/headline";

export function deduplicateHeadlines(stories: Headline[]) {
  const kept: Headline[] = [];
  for (const story of stories) {
    const duplicateIndex = kept.findIndex((candidate) => isLikelyDuplicate(story, candidate));
    if (duplicateIndex === -1) {
      kept.push(story);
      continue;
    }
    kept[duplicateIndex] = chooseBetterStory(kept[duplicateIndex], story);
  }
  return kept;
}

export function isLikelyDuplicate(a: Headline, b: Headline) {
  if (a.articleUrl === b.articleUrl) return true;
  const aTitle = normalizeTitle(a.title);
  const bTitle = normalizeTitle(b.title);
  if (aTitle === bTitle) return true;
  return titleSimilarity(aTitle, bTitle) >= 0.3;
}

function chooseBetterStory(a: Headline, b: Headline) {
  const aScore = a.importanceScore + a.freshnessScore + (a.image ? 8 : 0) + Math.min(a.summary.length / 30, 8);
  const bScore = b.importanceScore + b.freshnessScore + (b.image ? 8 : 0) + Math.min(b.summary.length / 30, 8);
  return bScore > aScore ? b : a;
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function titleSimilarity(a: string, b: string) {
  const aWords = new Set(a.split(" ").filter((word) => word.length > 3));
  const bWords = new Set(b.split(" ").filter((word) => word.length > 3));
  const intersection = [...aWords].filter((word) => bWords.has(word)).length;
  const union = new Set([...aWords, ...bWords]).size || 1;
  return intersection / union;
}
