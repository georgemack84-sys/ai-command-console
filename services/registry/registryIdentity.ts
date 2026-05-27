import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import {
  type CanonicalToolRegistryEntry,
  type RegistryErrorCode,
  type ToolReplayBinding,
  type ToolVersionLineage,
} from "@/schemas/toolRegistrySchema";

import { REGISTRY_ERROR_CODES } from "./registryValidator";
import { deriveCapabilityHash, normalizeCapabilityMetadata, normalizeRuntimeCapabilities } from "./capabilityHash";

type RegistryIdentityFailure = {
  valid: boolean;
  reasons: RegistryErrorCode[];
};

const TOOL_STATUS_REQUIRING_PUBLICATION = new Set(["published", "deprecated", "blocked", "revoked"]);

function dedupeReasons(reasons: RegistryErrorCode[]) {
  return Array.from(new Set(reasons));
}

export function isStrictToolVersion(version: string) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version);
}

export function deriveCanonicalToolId(toolId: string, version: string) {
  return `${toolId}@${version}`;
}

export function deriveRegistryHash(entry: CanonicalToolRegistryEntry) {
  return hashStableContent("TOOL_REGISTRY", {
    toolId: entry.toolId,
    version: entry.version,
    canonicalId: deriveCanonicalToolId(entry.toolId, entry.version),
    lineageId: entry.toolId,
    inputSchemaRef: entry.inputSchemaRef,
    outputSchemaRef: entry.outputSchemaRef,
    policyRef: entry.policyRef,
    adapterRef: entry.adapterRef,
    category: entry.category,
    executionMode: entry.executionMode,
    riskLevel: entry.riskLevel,
    riskClass: entry.riskClass,
    approvalRequired: entry.approvalRequired,
    requiresApprovalDefault: entry.requiresApprovalDefault,
    supportsDryRun: entry.supportsDryRun,
    supportsReplay: entry.supportsReplay,
    rollbackSupported: entry.rollbackSupported,
    deterministicReplayMetadata: entry.deterministicReplayMetadata ?? null,
    rollbackMetadata: entry.rollbackMetadata ?? null,
    governanceRestrictions: entry.governanceRestrictions,
    parameterConstraints: entry.parameterConstraints,
    capabilities: [...entry.capabilities].sort(),
    runtimeCapabilities: normalizeRuntimeCapabilities(entry.runtimeCapabilities),
    capabilityMetadata: normalizeCapabilityMetadata(entry),
    capabilityHash: deriveCapabilityHash(entry),
    trustZoneRestrictions: entry.trustZoneRestrictions ?? null,
    governanceMetadata: entry.governanceMetadata,
    allowedTargets: [...entry.allowedTargets].sort(),
    deniedTargets: [...entry.deniedTargets].sort(),
    plannerEligible: entry.plannerEligible,
    enabled: entry.enabled,
    owner: entry.owner,
    description: entry.description,
    displayName: entry.displayName,
  });
}

export function validateCanonicalIdentity(entry: CanonicalToolRegistryEntry): RegistryIdentityFailure {
  const reasons: RegistryErrorCode[] = [];

  if (!entry.version) {
    reasons.push(REGISTRY_ERROR_CODES.MISSING_TOOL_VERSION);
  } else if (!isStrictToolVersion(entry.version)) {
    reasons.push(REGISTRY_ERROR_CODES.INVALID_TOOL_VERSION);
  }

  if (entry.canonicalId !== deriveCanonicalToolId(entry.toolId, entry.version)) {
    reasons.push(REGISTRY_ERROR_CODES.INVALID_CANONICAL_ID);
  }

  if (entry.lineageId !== entry.toolId) {
    reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
  }

  if (TOOL_STATUS_REQUIRING_PUBLICATION.has(entry.status) && !entry.publishedAt) {
    reasons.push(REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET);
  }

  if (entry.registryHash !== deriveRegistryHash(entry)) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_HASH_MISMATCH);
  }

  if (entry.capabilityHash !== deriveCapabilityHash(entry)) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_HASH_MISMATCH);
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateVersionLineage(lineage: ToolVersionLineage, entries: readonly CanonicalToolRegistryEntry[]): RegistryIdentityFailure {
  const reasons: RegistryErrorCode[] = [];
  const versions = new Set(lineage.versions);
  const recordsByVersion = new Map(lineage.versionRecords.map((record) => [record.version, record]));
  const registryEntries = entries.filter((entry) => entry.lineageId === lineage.lineageId);

  if (versions.size !== lineage.versions.length) {
    reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
  }

  if (!versions.has(lineage.latestVersion)) {
    reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
  }

  for (const deprecatedVersion of lineage.deprecatedVersions) {
    if (!versions.has(deprecatedVersion)) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
    }
  }

  for (const version of lineage.versions) {
    if (!recordsByVersion.has(version)) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
      continue;
    }

    const matchingEntry = registryEntries.find((entry) => entry.version === version);
    if (!matchingEntry) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
      continue;
    }

    const record = recordsByVersion.get(version)!;
    if (record.canonicalId !== deriveCanonicalToolId(lineage.lineageId, version)) {
      reasons.push(REGISTRY_ERROR_CODES.INVALID_CANONICAL_ID);
    }
    if (matchingEntry.registryHash !== record.registryHash) {
      reasons.push(REGISTRY_ERROR_CODES.IMMUTABLE_VERSION_MUTATION);
    }
    if (matchingEntry.capabilityHash !== record.capabilityHash) {
      reasons.push(REGISTRY_ERROR_CODES.IMMUTABLE_VERSION_MUTATION);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateReplayBinding(
  binding: ToolReplayBinding,
  entries: readonly CanonicalToolRegistryEntry[],
): RegistryIdentityFailure {
  const reasons: RegistryErrorCode[] = [];

  if (!binding.toolVersion) {
    reasons.push(REGISTRY_ERROR_CODES.MISSING_TOOL_VERSION);
    return { valid: false, reasons };
  }

  if (!isStrictToolVersion(binding.toolVersion)) {
    reasons.push(REGISTRY_ERROR_CODES.INVALID_TOOL_VERSION);
  }

  const expectedCanonicalId = deriveCanonicalToolId(binding.toolId, binding.toolVersion);
  if (binding.canonicalToolId && binding.canonicalToolId !== expectedCanonicalId) {
    reasons.push(REGISTRY_ERROR_CODES.REPLAY_BINDING_FAILURE);
  }

  const entry = entries.find((candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion);
  if (!entry) {
    reasons.push(REGISTRY_ERROR_CODES.REPLAY_BINDING_FAILURE);
    return { valid: false, reasons: dedupeReasons(reasons) };
  }

  if (entry.status === "draft" || entry.status === "blocked" || entry.status === "revoked") {
    reasons.push(REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET);
  }

  if (entry.registryHash !== binding.registryHash) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_HASH_MISMATCH);
  }

  if (entry.capabilityHash !== binding.capabilityHash) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH);
  }

  if (entry.canonicalId !== expectedCanonicalId) {
    reasons.push(REGISTRY_ERROR_CODES.REPLAY_BINDING_FAILURE);
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}
