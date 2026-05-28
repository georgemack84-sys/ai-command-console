import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionDefinition, SafeActionReplayEvidence } from "@/types/safe-action-catalog";
import { hashSafeActionValue } from "./safeActionHasher";

export function bindSafeActionReplay(
  readinessProfile: AutonomyReadinessProfile,
  definition: SafeActionDefinition,
): SafeActionReplayEvidence {
  const actionSchemaHash = hashSafeActionValue("safe-action-schema", definition);
  const snapshotLineageHash = hashSafeActionValue(
    "safe-action-snapshot-lineage",
    readinessProfile.snapshotLineageHashes,
  );
  const disputed =
    readinessProfile.replayBinding.disputed ||
    readinessProfile.snapshotLineageHashes.length === 0 ||
    readinessProfile.derivedState === "disputed";

  return Object.freeze({
    ...readinessProfile.replayBinding,
    required: true,
    valid: !disputed && readinessProfile.replayBinding.deterministic,
    actionSchemaHash,
    readinessHash: readinessProfile.readinessHash,
    snapshotLineageHash,
  });
}
