import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type {
  RegistryCompatibilityRecord,
  RegistryGovernanceRecord,
  RegistryRollbackRecord,
  RegistrySchemaRecord,
  RegistrySnapshot,
  RegistrySnapshotContent,
  RegistrySnapshotManifest,
} from "../registrySnapshotTypes";

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .map(([key, nested]) => [key, stripUndefined(nested)]),
    );
  }
  return value;
}

function sortObjectValues<T>(value: Readonly<Record<string, T>>) {
  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, value[key]] as const);
}

function normalizeTools(tools: readonly RegistrySnapshotContent["tools"][number][]) {
  return [...tools]
    .sort((left, right) => left.canonicalId.localeCompare(right.canonicalId))
    .map((tool) => stripUndefined(tool));
}

function normalizeSchemas(schemas: readonly RegistrySchemaRecord[]) {
  return [...schemas]
    .sort((left, right) => left.ref.localeCompare(right.ref))
    .map((schema) => ({
      ref: schema.ref,
      content: stripUndefined(schema.content),
    }));
}

function normalizeGovernance(governance: Readonly<Record<string, RegistryGovernanceRecord>>) {
  return sortObjectValues(governance).map(([canonicalId, record]) => ({
    canonicalId,
    governanceMetadata: stripUndefined(record.governanceMetadata),
    governanceRestrictions: stripUndefined(record.governanceRestrictions),
  }));
}

function normalizeCompatibility(compatibility: Readonly<Record<string, RegistryCompatibilityRecord>>) {
  return sortObjectValues(compatibility).map(([canonicalId, record]) => ({
    canonicalId,
    registryHash: record.registryHash,
    capabilityHash: record.capabilityHash,
    supportsReplay: record.supportsReplay,
    rollbackSupported: record.rollbackSupported,
    migrationTargets: [...record.migrationTargets].sort((left, right) => left.localeCompare(right)),
    migrationTypes: [...record.migrationTypes].sort((left, right) => left.localeCompare(right)),
  }));
}

function normalizeRollback(rollback: Readonly<Record<string, RegistryRollbackRecord>>) {
  return sortObjectValues(rollback).map(([canonicalId, record]) => ({
    canonicalId,
    rollbackSupported: record.rollbackSupported,
    rollbackMetadata: stripUndefined(record.rollbackMetadata),
    policyRollback: stripUndefined(record.policyRollback),
  }));
}

function normalizePolicies(policies: RegistrySnapshotContent["policies"]) {
  return sortObjectValues(policies).map(([ref, policy]) => ({
    ref,
    policy: stripUndefined(policy),
  }));
}

function normalizeLineage(lineage: RegistrySnapshotContent["lineage"]) {
  return {
    schemaVersion: lineage.schemaVersion,
    lineages: [...lineage.lineages]
      .sort((left, right) => left.lineageId.localeCompare(right.lineageId))
      .map((entry) => {
        const normalizedEntry = stripUndefined(entry) as Record<string, unknown>;
        return {
          ...normalizedEntry,
        versions: [...entry.versions].sort((left, right) => left.localeCompare(right)),
        deprecatedVersions: [...entry.deprecatedVersions].sort((left, right) => left.localeCompare(right)),
        versionRecords: [...entry.versionRecords]
          .sort((left, right) => left.canonicalId.localeCompare(right.canonicalId))
          .map((record) => stripUndefined(record)),
        };
      }),
  };
}

function normalizeMigrations(migrations: RegistrySnapshotContent["migrations"]) {
  return {
    schemaVersion: migrations.schemaVersion,
    migrations: [...migrations.migrations]
      .sort((left, right) => `${left.lineageId}:${left.fromVersion}:${left.toVersion}`.localeCompare(`${right.lineageId}:${right.fromVersion}:${right.toVersion}`))
      .map((migration) => stripUndefined(migration)),
  };
}

export function hashSnapshotTools(tools: RegistrySnapshotContent["tools"]) {
  return hashStableContent("TOOL_REGISTRY", normalizeTools(tools));
}

export function hashSnapshotSchemas(schemas: readonly RegistrySchemaRecord[]) {
  return hashStableContent("TOOL_REGISTRY", normalizeSchemas(schemas));
}

export function hashSnapshotPolicies(policies: RegistrySnapshotContent["policies"]) {
  return hashStableContent("TOOL_REGISTRY", normalizePolicies(policies));
}

export function hashSnapshotGovernance(governance: RegistrySnapshotContent["governance"]) {
  return hashStableContent("GOVERNANCE", normalizeGovernance(governance));
}

export function hashSnapshotCompatibility(compatibility: RegistrySnapshotContent["compatibility"]) {
  return hashStableContent("REPLAY_BINDING", normalizeCompatibility(compatibility));
}

export function hashSnapshotRollback(rollback: RegistrySnapshotContent["rollback"]) {
  return hashStableContent("REPLAY_BINDING", normalizeRollback(rollback));
}

export function hashSnapshotLineage(lineage: RegistrySnapshotContent["lineage"], migrations: RegistrySnapshotContent["migrations"]) {
  return hashStableContent("MIGRATION_LINEAGE", {
    lineages: normalizeLineage(lineage),
    migrations: normalizeMigrations(migrations),
  });
}

export function hashRegistrySnapshotContent(content: RegistrySnapshotContent) {
  const toolsHash = hashSnapshotTools(content.tools);
  const schemasHash = hashSnapshotSchemas(content.schemas);
  const policiesHash = hashSnapshotPolicies(content.policies);
  const governanceHash = hashSnapshotGovernance(content.governance);
  const compatibilityHash = hashSnapshotCompatibility(content.compatibility);
  const rollbackHash = hashSnapshotRollback(content.rollback);
  const lineageHash = hashSnapshotLineage(content.lineage, content.migrations);

  const registrySnapshotHash = hashStableContent("TOOL_REGISTRY", {
    toolsHash,
    schemasHash,
    policiesHash,
    governanceHash,
    compatibilityHash,
    rollbackHash,
    lineageHash,
  });

  return {
    toolsHash,
    schemasHash,
    policiesHash,
    governanceHash,
    compatibilityHash,
    rollbackHash,
    lineageHash,
    registrySnapshotHash,
  };
}

export function hashRegistrySnapshotManifest(
  manifest: Omit<RegistrySnapshotManifest, "manifestHash" | "snapshotId" | "createdAt">,
) {
  return hashStableContent("TOOL_REGISTRY", stripUndefined(manifest));
}

export function hashRegistrySnapshot(snapshot: RegistrySnapshot) {
  return hashStableContent("TOOL_REGISTRY", {
    manifestHash: snapshot.manifest.manifestHash,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
  });
}
