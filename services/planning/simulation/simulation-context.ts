import { hashStableContent } from "../versioning";
import type { VersionedReplayArtifact } from "../versioning";
import type { SimulationLineageContext } from "./simulation-types";

export function buildSimulationLineageContext(
  artifact: VersionedReplayArtifact,
): SimulationLineageContext {
  const replayIdentityRoot = hashStableContent("MIGRATION_LINEAGE", artifact.immutableReplayIdentityRoot);

  return {
    executionTruthHash: artifact.immutableReplayIdentityRoot.executionTruthHash,
    executionCompatibilityHash: artifact.immutableReplayIdentityRoot.executionCompatibilityHash,
    replaySnapshotHash: artifact.immutableReplayIdentityRoot.initialReplaySnapshotHash,
    replayIdentityRoot,
    migrationLineage: artifact.replayLineageInvariant.migrationLineageHashes,
  };
}
