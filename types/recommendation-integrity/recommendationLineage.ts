import type { RecommendationIntegrityState } from "./recommendationStates";

export type RecommendationLineageEntry = Readonly<{
  entryId: string;
  recommendationId: string;
  coordinationId: string;
  recommendationState: RecommendationIntegrityState;
  createdAt: string;
  deterministicHash: string;
}>;

export type RecommendationLineage = Readonly<{
  lineageId: string;
  entries: readonly RecommendationLineageEntry[];
  lineageHash: string;
}>;
