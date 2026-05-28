import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function buildReplayDependencyLineage(input: {
  recommendationLineageId: string;
  dependencySafe: boolean;
}) {
  return Object.freeze({
    dependencyLineageId: input.recommendationLineageId,
    dependencySafe: input.dependencySafe,
    dependencyHash: hashConstitutionalReplayValue("dependency-lineage", input),
  });
}
