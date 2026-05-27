import type { ImmutableReplayIdentityRoot, MigrationLineageEntry, ReplayLineageInvariant } from "./versioning-types";

export function buildReplayLineageInvariant(
  root: ImmutableReplayIdentityRoot,
  migrationLineage: readonly MigrationLineageEntry[],
): ReplayLineageInvariant {
  return {
    originalExecutionTruthHash: root.executionTruthHash,
    originalExecutionCompatibilityHash: root.executionCompatibilityHash,
    replaySnapshotHash: root.initialReplaySnapshotHash,
    migrationLineageHashes: migrationLineage.map((entry) => entry.lineageHash),
  };
}
