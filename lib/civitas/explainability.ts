import type { Headline } from "@/types/headline";

export function explainStory(story: Headline) {
  return {
    whyThisStory: `${story.title} is available in the active category and passed normalization, validation, and filtering.`,
    whyThisRanking: `Ranking used importance ${story.importanceScore}, freshness ${story.freshnessScore}, category match, and source diversity.`,
    whyThisImage: story.image ? "The story supplied a safe validated image URL." : "No safe article image was available, so the category fallback visual was selected.",
    whyThisSource: `${story.source.name} supplied the normalized record and source identity metadata.`,
    whyThisTrustScore: story.trust?.explanation ?? "Trust evaluation is disabled for this response.",
    whyHidden: story.hidden ? "The story is locally hidden by the viewer." : "The story is not hidden.",
    whyRecommended: "Recommendation engines are an extension point and are disabled by default.",
  };
}
