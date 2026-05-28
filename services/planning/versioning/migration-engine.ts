import { getMigrationSteps } from "./migration-registry";
import { createVersioningFailure } from "./versioning-errors";
import { getSchemaRegistryEntry } from "./schema-registry";
import { hashStableContent } from "./stable-content-hasher";
import type {
  MigrationLineageEntry,
  MigrationStep,
  SchemaVersion,
  VersionedReplayArtifact,
  VersioningFailure,
} from "./versioning-types";

export function resolveMigrationChain(
  fromVersion: SchemaVersion,
  toVersion: SchemaVersion,
  steps: readonly MigrationStep[] = getMigrationSteps(),
): { ok: true; chain: readonly MigrationStep[] } | { ok: false; failures: readonly VersioningFailure[] } {
  if (fromVersion === toVersion) {
    return { ok: true, chain: [] };
  }

  const failures: VersioningFailure[] = [];
  const chain: MigrationStep[] = [];
  let current = fromVersion;
  const visited = new Set<string>();

  while (current !== toVersion) {
    if (visited.has(current)) {
      failures.push(createVersioningFailure("MIGRATION_CHAIN_INVALID", `Migration loop detected at ${current}.`, "migrationChain"));
      return { ok: false, failures };
    }
    visited.add(current);

    const next = steps.find((step) => step.fromVersion === current);
    if (!next) {
      failures.push(createVersioningFailure("MIGRATION_STEP_UNSUPPORTED", `No migration step found from ${current} to ${toVersion}.`, "migrationChain"));
      return { ok: false, failures };
    }
    chain.push(next);
    current = next.toVersion;
  }

  return { ok: true, chain };
}

export function migrateVersionedArtifact(
  artifact: VersionedReplayArtifact,
  targetVersion: SchemaVersion,
  steps: readonly MigrationStep[] = getMigrationSteps(),
): { ok: true; artifact: VersionedReplayArtifact; migrationLineage: readonly MigrationLineageEntry[] } | { ok: false; failures: readonly VersioningFailure[] } {
  const sourceEntry = getSchemaRegistryEntry(artifact.version);
  const targetEntry = getSchemaRegistryEntry(targetVersion);
  if (!sourceEntry || !targetEntry) {
    return {
      ok: false,
      failures: [createVersioningFailure("SCHEMA_REGISTRY_MISSING", "Schema registry entry missing for source or target version.", "schemaRegistry")],
    };
  }

  const chainResolution = resolveMigrationChain(artifact.version, targetVersion, steps);
  if (!chainResolution.ok) {
    return chainResolution;
  }

  let current = artifact;
  const lineage: MigrationLineageEntry[] = [];

  for (const step of chainResolution.chain) {
    const migrated = step.migrate(current);
    if (!migrated.ok || !migrated.output) {
      return {
        ok: false,
        failures: [createVersioningFailure(migrated.errorCode ?? "MIGRATION_OUTPUT_INVALID", migrated.message ?? "Migration failed.", "migration")],
      };
    }

    if (
      migrated.output.immutableReplayIdentityRoot.executionTruthHash !== current.immutableReplayIdentityRoot.executionTruthHash
      || migrated.output.immutableReplayIdentityRoot.executionCompatibilityHash !== current.immutableReplayIdentityRoot.executionCompatibilityHash
      || migrated.output.immutableReplayIdentityRoot.initialReplaySnapshotHash !== current.immutableReplayIdentityRoot.initialReplaySnapshotHash
    ) {
      return {
        ok: false,
        failures: [createVersioningFailure("HASH_LINEAGE_MISMATCH", "Migration changed immutable replay identity anchors.", "immutableReplayIdentityRoot")],
      };
    }

    const lineageHash = hashStableContent("MIGRATION_LINEAGE", {
      fromVersion: step.fromVersion,
      toVersion: step.toVersion,
      sourceHash: current.contentHash,
      targetHash: migrated.output.contentHash,
    });
    lineage.push({
      fromVersion: step.fromVersion,
      toVersion: step.toVersion,
      lineageHash,
    });
    current = {
      ...migrated.output,
      migrationLineage: [...current.migrationLineage, ...lineage.slice(-1)],
    };
  }

  return {
    ok: true,
    artifact: current,
    migrationLineage: lineage,
  };
}
