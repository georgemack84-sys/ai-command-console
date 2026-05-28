import type { DependencyDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectDependencyDrift(input: {
  dependencyLineageId: string;
  dependencySafe: boolean;
}): DependencyDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("dependency-drift-inspection", input),
  });
}
