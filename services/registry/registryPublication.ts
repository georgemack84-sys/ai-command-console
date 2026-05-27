import type {
  CanonicalToolRegistryEntry,
  RegistryErrorCode,
  ToolMigrationManifest,
  ToolVersionLineage,
} from "@/schemas/toolRegistrySchema";

import { REGISTRY_ERROR_CODES } from "./registryValidator";
import { validateCanonicalIdentity, validateVersionLineage } from "./registryIdentity";

type PublicationValidationResult = {
  valid: boolean;
  reasons: RegistryErrorCode[];
};

function dedupeReasons(reasons: RegistryErrorCode[]) {
  return Array.from(new Set(reasons));
}

export function validatePublishedEntryImmutability(input: {
  entry: CanonicalToolRegistryEntry;
  lineage?: ToolVersionLineage;
}) : PublicationValidationResult {
  const reasons: RegistryErrorCode[] = [];
  const identity = validateCanonicalIdentity(input.entry);
  reasons.push(...identity.reasons);

  if (input.entry.status === "published" || input.entry.status === "deprecated" || input.entry.status === "blocked" || input.entry.status === "revoked") {
    if (!input.entry.publishedAt) {
      reasons.push(REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET);
    }

    if (input.lineage) {
      const matchingRecord = input.lineage.versionRecords.find((record) => record.version === input.entry.version);
      if (matchingRecord) {
        if (matchingRecord.registryHash !== input.entry.registryHash) {
          reasons.push(REGISTRY_ERROR_CODES.IMMUTABLE_VERSION_MUTATION);
        }
        if (matchingRecord.capabilityHash !== input.entry.capabilityHash) {
          reasons.push(REGISTRY_ERROR_CODES.IMMUTABLE_VERSION_MUTATION);
        }
      }
    }
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateMigrationManifest(input: {
  manifest: ToolMigrationManifest;
  lineage?: ToolVersionLineage;
}) : PublicationValidationResult {
  const reasons: RegistryErrorCode[] = [];

  if (input.lineage) {
    const knownVersions = new Set(input.lineage.versions);
    if (!knownVersions.has(input.manifest.fromVersion) || !knownVersions.has(input.manifest.toVersion)) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateRegistryPublicationState(input: {
  entries: readonly CanonicalToolRegistryEntry[];
  lineages: readonly ToolVersionLineage[];
}) : PublicationValidationResult {
  const reasons: RegistryErrorCode[] = [];

  for (const entry of input.entries) {
    const lineage = input.lineages.find((candidate) => candidate.lineageId === entry.lineageId);
    const immutability = validatePublishedEntryImmutability({ entry, lineage });
    reasons.push(...immutability.reasons);
  }

  for (const lineage of input.lineages) {
    const lineageValidation = validateVersionLineage(lineage, input.entries);
    reasons.push(...lineageValidation.reasons);
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}
