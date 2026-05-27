import type {
  ToolAdapter,
  ToolMigrationManifestDocument,
  ToolPolicy,
  ToolRegistryDocument,
  ToolVersionLineageDocument,
} from "@/schemas/toolRegistrySchema";
import {
  getCanonicalRegistryAdapters,
  getCanonicalRegistryDocument,
  getCanonicalRegistryLineages,
  getCanonicalRegistryMigrationManifests,
  getCanonicalRegistryPolicies,
} from "@/services/registry/toolRegistry";

export function buildRegistryFixture() {
  return {
    document: getCanonicalRegistryDocument() as ToolRegistryDocument,
    lineages: getCanonicalRegistryLineages() as ToolVersionLineageDocument,
    migrationManifests: getCanonicalRegistryMigrationManifests() as ToolMigrationManifestDocument,
    policiesByRef: getCanonicalRegistryPolicies() as Record<string, ToolPolicy>,
    adaptersByRef: getCanonicalRegistryAdapters() as Record<string, ToolAdapter>,
  };
}

export function cloneFixture() {
  return JSON.parse(JSON.stringify(buildRegistryFixture())) as ReturnType<typeof buildRegistryFixture>;
}
