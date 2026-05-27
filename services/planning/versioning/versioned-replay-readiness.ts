import { hashExecutionCompatibilityContract } from "../execution-compatibility";
import type { ReplayAuditResult } from "../replay-audit";
import { hashReplayInputSnapshot } from "../replay-audit";
import { createVersioningFailure } from "./versioning-errors";
import { assessGovernanceMigrationImpact, validateLineagePreservation } from "./governance-migration-validator";
import { migrateVersionedArtifact } from "./migration-engine";
import { buildMigrationAuditEvents } from "./migration-audit-events";
import { buildMigrationProof } from "./migration-proof";
import { buildImmutableReplayIdentityRoot } from "./replay-identity-root";
import { buildReplayLineageInvariant } from "./replay-lineage";
import { getSchemaRegistryEntry } from "./schema-registry";
import { hashStableContent } from "./stable-content-hasher";
import type {
  VersionedReplayArtifact,
  VersionedReplayReadinessResult,
  VersioningBuildInput,
} from "./versioning-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

function isReady(result: ReplayAuditResult) {
  return result.verdict === "REPLAY_AUDIT_READY" && result.artifacts;
}

function buildSourceArtifact(input: VersioningBuildInput): VersionedReplayArtifact {
  const root = buildImmutableReplayIdentityRoot(input.replayAuditResult, input.executionCompatibilityContract);
  const replayLineageInvariant = buildReplayLineageInvariant(root, []);
  const sourceVersion = input.replayAuditResult.artifacts?.replayInputSnapshot.snapshotVersion ?? "4.2H";
  const entry = getSchemaRegistryEntry(sourceVersion);
  const schemaHash = entry?.schemaHash ?? hashStableContent("GOVERNANCE", { sourceVersion, artifactType: "replay-audit-result" });

  const contentHash = hashStableContent("PLAN", {
    sourceVersion,
    executionTruthHash: root.executionTruthHash,
    executionCompatibilityHash: root.executionCompatibilityHash,
    replaySnapshotHash: root.initialReplaySnapshotHash,
    replayProofHash: input.replayAuditResult.replayProofHash,
    auditArtifactHash: input.replayAuditResult.auditArtifactHash,
    evidenceReferenceHash: input.replayAuditResult.evidenceReferenceHash,
  });

  return {
    artifactType: "replay-audit-result",
    version: sourceVersion,
    replayAuditResult: input.replayAuditResult,
    executionCompatibilityContract: input.executionCompatibilityContract,
    immutableReplayIdentityRoot: root,
    replayLineageInvariant,
    migrationLineage: [],
    approvalImpact: "PRESERVED",
    governanceImpact: "PRESERVED",
    schemaHash,
    contentHash,
  };
}

export function buildVersionedReplayReadiness(input: VersioningBuildInput): VersionedReplayReadinessResult {
  const failures = [];
  if (!isReady(input.replayAuditResult)) {
    return {
      ok: false,
      failures: [createVersioningFailure("REPLAY_COMPATIBILITY_FAILED", "Phase 4.2I requires a ready 4.2H replay/audit artifact.", "replayAuditResult")],
    };
  }

  const replayArtifacts = input.replayAuditResult.artifacts;
  const computedCompatibilityHash = hashExecutionCompatibilityContract({
    executionTruthHash: input.executionCompatibilityContract.executionTruthHash,
    approvalContracts: input.executionCompatibilityContract.approvalContracts,
    rollbackContracts: input.executionCompatibilityContract.rollbackContracts,
    compensationContracts: input.executionCompatibilityContract.compensationContracts,
    authorityGraph: input.executionCompatibilityContract.authorityGraph,
    escalationGraph: input.executionCompatibilityContract.escalationGraph,
    compatibilitySnapshot: input.executionCompatibilityContract.compatibilitySnapshot,
  });

  if (computedCompatibilityHash !== input.executionCompatibilityContract.executionCompatibilityHash) {
    failures.push(createVersioningFailure(
      "HASH_LINEAGE_MISMATCH",
      "Execution compatibility contract hash drift detected before migration.",
      "executionCompatibilityContract.executionCompatibilityHash",
    ));
  }

  if (input.replayAuditResult.executionCompatibilityHash !== input.executionCompatibilityContract.executionCompatibilityHash) {
    failures.push(createVersioningFailure(
      "REPLAY_COMPATIBILITY_FAILED",
      "Replay audit result does not preserve the execution compatibility hash.",
      "replayAuditResult.executionCompatibilityHash",
    ));
  }

  if (input.replayAuditResult.executionTruthHash !== input.executionCompatibilityContract.executionTruthHash) {
    failures.push(createVersioningFailure(
      "REPLAY_COMPATIBILITY_FAILED",
      "Replay audit result does not preserve the execution truth hash.",
      "replayAuditResult.executionTruthHash",
    ));
  }

  if (replayArtifacts && replayArtifacts.compatibilityReference.executionCompatibilityHash !== input.executionCompatibilityContract.executionCompatibilityHash) {
    failures.push(createVersioningFailure(
      "HASH_LINEAGE_MISMATCH",
      "Compatibility reference diverged from the execution compatibility contract hash.",
      "replayAuditResult.artifacts.compatibilityReference.executionCompatibilityHash",
    ));
  }

  if (replayArtifacts && replayArtifacts.compatibilityReference.executionTruthHash !== input.executionCompatibilityContract.executionTruthHash) {
    failures.push(createVersioningFailure(
      "HASH_LINEAGE_MISMATCH",
      "Compatibility reference diverged from the execution truth hash.",
      "replayAuditResult.artifacts.compatibilityReference.executionTruthHash",
    ));
  }

  if (replayArtifacts) {
    const replaySnapshotHash = hashReplayInputSnapshot(replayArtifacts.replayInputSnapshot);
    if (replaySnapshotHash !== input.replayAuditResult.replaySnapshotHash || replaySnapshotHash !== replayArtifacts.replaySnapshotHash) {
      failures.push(createVersioningFailure(
        "REPLAY_COMPATIBILITY_FAILED",
        "Replay snapshot hash drift detected before migration.",
        "replayAuditResult.replaySnapshotHash",
      ));
    }
  }

  if (failures.length > 0) {
    return {
      ok: false,
      failures,
    };
  }

  const sourceArtifact = buildSourceArtifact(input);
  const sourceEntry = getSchemaRegistryEntry(sourceArtifact.version);
  const targetVersion = input.targetVersion ?? "4.2I";
  const targetEntry = getSchemaRegistryEntry(targetVersion);
  if (!sourceEntry || !targetEntry) {
    return {
      ok: false,
      failures: [createVersioningFailure("SCHEMA_REGISTRY_MISSING", "Schema registry entry missing for source or target version.", "schemaRegistry")],
    };
  }
  if (sourceEntry.deprecated || targetEntry.deprecated) {
    return {
      ok: false,
      failures: [createVersioningFailure("VERSION_UNSUPPORTED", "Deprecated schema versions are blocked.", "schemaRegistry")],
    };
  }

  const migrated = migrateVersionedArtifact(sourceArtifact, targetVersion);
  if (!migrated.ok) {
    return {
      ok: false,
      failures: migrated.failures,
    };
  }

  const governance = assessGovernanceMigrationImpact(
    sourceArtifact.executionCompatibilityContract,
    migrated.artifact.executionCompatibilityContract,
  );
  failures.push(...governance.failures);

  const artifact: VersionedReplayArtifact = deepFreeze({
    ...migrated.artifact,
    replayLineageInvariant: buildReplayLineageInvariant(sourceArtifact.immutableReplayIdentityRoot, migrated.migrationLineage),
    approvalImpact: governance.approvalImpact,
    governanceImpact: governance.governanceImpact,
  });

  failures.push(...validateLineagePreservation(artifact));

  const migrationProof = buildMigrationProof({
    sourceArtifact,
    targetArtifact: artifact,
  });
  const auditEvents = buildMigrationAuditEvents({
    artifact,
    migrationProof,
  });

  if (failures.length > 0) {
    return {
      ok: false,
      artifact,
      migrationProof,
      auditEvents,
      failures,
    };
  }

  return {
    ok: true,
    artifact,
    migrationProof,
    auditEvents,
    failures: [],
  };
}
