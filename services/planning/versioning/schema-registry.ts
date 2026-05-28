import { hashStableContent } from "./stable-content-hasher";
import type { SchemaRegistryEntry, SchemaVersion } from "./versioning-types";

function createEntry(
  version: SchemaVersion,
  compatibilityLevel: SchemaRegistryEntry["compatibilityLevel"],
  deprecated: boolean,
  migrationTargets: readonly SchemaVersion[],
): SchemaRegistryEntry {
  const descriptor = {
    artifactType: "replay-audit-result" as const,
    version,
    compatibilityLevel,
    deprecated,
    migrationTargets,
  };

  return {
    ...descriptor,
    schemaHash: hashStableContent("EVIDENCE_BUNDLE", descriptor),
  };
}

const REGISTRY = Object.freeze([
  createEntry("4.2H", "REQUIRES_MIGRATION", false, ["4.2H.1"]),
  createEntry("4.2H.1", "REQUIRES_MIGRATION", false, ["4.2I"]),
  createEntry("4.2I", "IDENTICAL", false, []),
] satisfies readonly SchemaRegistryEntry[]);

export function getSchemaRegistry(): readonly SchemaRegistryEntry[] {
  return REGISTRY;
}

export function getSchemaRegistryEntry(version: SchemaVersion): SchemaRegistryEntry | undefined {
  return REGISTRY.find((entry) => entry.version === version);
}
