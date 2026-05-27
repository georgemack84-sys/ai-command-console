import { hashStableContent } from "./stable-content-hasher";
import type { MigrationProof, VersionedReplayArtifact } from "./versioning-types";

export function buildMigrationProof(input: {
  sourceArtifact: VersionedReplayArtifact;
  targetArtifact: VersionedReplayArtifact;
}): MigrationProof {
  const sourceHash = input.sourceArtifact.contentHash;
  const targetHash = input.targetArtifact.contentHash;
  const migrationChain = input.targetArtifact.migrationLineage.map((entry) => `${entry.fromVersion}->${entry.toVersion}`);
  const replayCompatibilityResult =
    input.sourceArtifact.immutableReplayIdentityRoot.initialReplaySnapshotHash
    === input.targetArtifact.immutableReplayIdentityRoot.initialReplaySnapshotHash
      ? "PRESERVED"
      : "BROKEN";
  const governanceImpact = input.targetArtifact.governanceImpact;

  const proofCore = {
    sourceHash,
    targetHash,
    migrationChain,
    replayCompatibilityResult,
    governanceImpact,
  };

  return {
    ...proofCore,
    proofHash: hashStableContent("MIGRATION_LINEAGE", proofCore),
  };
}
