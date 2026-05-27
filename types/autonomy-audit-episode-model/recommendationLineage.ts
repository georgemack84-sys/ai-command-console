export type RecommendationLineage = Readonly<{
  recommendationId: string;
  recommendationType:
    | "maintain_observation"
    | "escalate_review"
    | "preserve_freeze_recommendation"
    | "prepare_handoff_review";
  summary: string;
  confidenceScore: number;
  evidenceHashes: readonly string[];
  governanceHashes: readonly string[];
  createdAt: string;
}>;
