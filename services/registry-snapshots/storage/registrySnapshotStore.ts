import fs from "node:fs";
import path from "node:path";
import { getCanonicalRegistryDocument, getCanonicalRegistryLineages, getCanonicalRegistryMigrationManifests, getCanonicalRegistryPolicies } from "@/services/registry/toolRegistry";
import type { CanonicalToolRegistryEntry, ToolPolicy } from "@/schemas/toolRegistrySchema";
import type {
  RegistryCompatibilityRecord,
  RegistryGovernanceRecord,
  RegistryRollbackRecord,
  RegistrySchemaRecord,
  RegistrySnapshot,
  RegistrySnapshotBuildInput,
  RegistrySnapshotContent,
} from "../registrySnapshotTypes";
import { buildRegistrySnapshotManifest } from "../manifests/registrySnapshotManifestBuilder";

const REGISTRY_ROOT = path.resolve(process.cwd(), "tool-registry");

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readSchemaRecord(ref: string): RegistrySchemaRecord {
  const filePath = path.join(REGISTRY_ROOT, ref);
  const content = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  return { ref, content };
}

function buildGovernanceRecord(entry: CanonicalToolRegistryEntry): RegistryGovernanceRecord {
  return {
    canonicalId: entry.canonicalId,
    governanceMetadata: entry.governanceMetadata,
    governanceRestrictions: entry.governanceRestrictions,
  };
}

function buildCompatibilityRecord(
  entry: CanonicalToolRegistryEntry,
  migrationTypes: readonly string[],
  migrationTargets: readonly string[],
): RegistryCompatibilityRecord {
  return {
    canonicalId: entry.canonicalId,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    supportsReplay: entry.supportsReplay,
    rollbackSupported: entry.rollbackSupported,
    migrationTargets,
    migrationTypes,
  };
}

function buildRollbackRecord(entry: CanonicalToolRegistryEntry, policy: ToolPolicy): RegistryRollbackRecord {
  return {
    canonicalId: entry.canonicalId,
    rollbackSupported: entry.rollbackSupported,
    rollbackMetadata: entry.rollbackMetadata ?? null,
    policyRollback: policy.rollback,
  };
}

export function buildRegistrySnapshotContent(): RegistrySnapshotContent {
  const document = getCanonicalRegistryDocument();
  const lineages = getCanonicalRegistryLineages();
  const migrations = getCanonicalRegistryMigrationManifests();
  const policiesByRef = getCanonicalRegistryPolicies();

  const schemaRefs = Array.from(
    new Set(
      document.tools.flatMap((entry) => [entry.inputSchemaRef, entry.outputSchemaRef]),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const schemas = schemaRefs.map(readSchemaRecord);

  const governance = Object.fromEntries(
    document.tools.map((entry) => [entry.canonicalId, buildGovernanceRecord(entry)]),
  );

  const compatibility = Object.fromEntries(
    document.tools.map((entry) => {
      const relatedMigrations = migrations.migrations.filter((migration) => migration.lineageId === entry.lineageId && migration.fromVersion === entry.version);
      return [
        entry.canonicalId,
        buildCompatibilityRecord(
          entry,
          relatedMigrations.map((migration) => migration.migrationType),
          relatedMigrations.map((migration) => migration.toVersion),
        ),
      ];
    }),
  );

  const rollback = Object.fromEntries(
    document.tools.map((entry) => [
      entry.canonicalId,
      buildRollbackRecord(entry, policiesByRef[entry.policyRef]),
    ]),
  );

  return {
    tools: document.tools,
    schemas,
    policies: policiesByRef,
    governance,
    compatibility,
    rollback,
    lineage: lineages,
    migrations,
  };
}

export function buildRegistrySnapshot(input: RegistrySnapshotBuildInput): RegistrySnapshot {
  const content = buildRegistrySnapshotContent();
  return {
    manifest: buildRegistrySnapshotManifest(input, content),
    content,
  };
}

export function createRegistrySnapshotStore(initialSnapshots: readonly RegistrySnapshot[] = []) {
  let snapshots = initialSnapshots.map((snapshot) => clone(snapshot));

  return {
    list() {
      return snapshots.map((snapshot) => clone(snapshot));
    },
    save(snapshot: RegistrySnapshot) {
      snapshots = [...snapshots, clone(snapshot)];
      return clone(snapshot);
    },
    getById(snapshotId: string) {
      const snapshot = snapshots.find((candidate) => candidate.manifest.snapshotId === snapshotId);
      return snapshot ? clone(snapshot) : null;
    },
    getByHash(registrySnapshotHash: string) {
      const snapshot = snapshots.find((candidate) => candidate.manifest.registrySnapshotHash === registrySnapshotHash);
      return snapshot ? clone(snapshot) : null;
    },
  };
}
