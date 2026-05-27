import { hashStableContent } from "./stable-content-hasher";
import type { DeterministicMigrationResult, MigrationStep, VersionedReplayArtifact } from "./versioning-types";

function success(output: VersionedReplayArtifact): DeterministicMigrationResult {
  return { ok: true, output };
}

function bumpVersion(input: VersionedReplayArtifact, toVersion: string): VersionedReplayArtifact {
  const migrated = {
    ...input,
    version: toVersion,
  } satisfies VersionedReplayArtifact;

  return {
    ...migrated,
    contentHash: hashStableContent("PLAN", {
      version: migrated.version,
      immutableReplayIdentityRoot: migrated.immutableReplayIdentityRoot,
      replayLineageInvariant: migrated.replayLineageInvariant,
      approvalImpact: migrated.approvalImpact,
      governanceImpact: migrated.governanceImpact,
      replayAuditAnchors: {
        executionTruthHash: migrated.replayAuditResult.executionTruthHash,
        executionCompatibilityHash: migrated.replayAuditResult.executionCompatibilityHash,
        replaySnapshotHash: migrated.replayAuditResult.replaySnapshotHash,
      },
    }),
  };
}

const MIGRATIONS: readonly MigrationStep[] = Object.freeze([
  {
    fromVersion: "4.2H",
    toVersion: "4.2H.1",
    migrate(input) {
      return success(bumpVersion(input, "4.2H.1"));
    },
  },
  {
    fromVersion: "4.2H.1",
    toVersion: "4.2I",
    migrate(input) {
      return success(bumpVersion(input, "4.2I"));
    },
  },
]);

export function getMigrationSteps(): readonly MigrationStep[] {
  return MIGRATIONS;
}
