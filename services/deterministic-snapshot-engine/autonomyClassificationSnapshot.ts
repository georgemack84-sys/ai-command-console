import type { ConstitutionalSnapshotBuildInput } from "@/types/deterministic-snapshot-engine";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export function captureAutonomyClassificationSnapshot(
  input: ConstitutionalSnapshotBuildInput,
): unknown {
  return canonicalizeSnapshotValue({
    kind: "autonomy_classification",
    autonomyLevel: input.autonomyLevel,
    supervisionRequirements: input.supervisionRequirements ?? [],
    revocationEligible: input.revocationEligible ?? true,
    sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
  });
}
