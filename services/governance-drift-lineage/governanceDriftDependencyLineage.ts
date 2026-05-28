import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function buildGovernanceDriftDependencyLineage(input: {
  dependencyLineageId: string;
  dependencySafe: boolean;
}) {
  return Object.freeze({
    dependencyLineageId: input.dependencyLineageId,
    dependencySafe: input.dependencySafe,
    dependencyHash: hashGovernanceDriftValue("dependency-lineage", input),
  });
}
