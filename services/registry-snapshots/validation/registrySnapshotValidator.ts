import type { RegistrySnapshot, RegistrySnapshotFailure, RegistrySnapshotValidationResult } from "../registrySnapshotTypes";
import { REGISTRY_SNAPSHOT_ERROR_CODES } from "../registrySnapshotTypes";
import { hashRegistrySnapshotContent, hashRegistrySnapshotManifest } from "../hashing/registrySnapshotHasher";

function failure(
  code: RegistrySnapshotFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistrySnapshotFailure {
  return { code, message, path, expected, actual };
}

export function validateRegistrySnapshot(snapshot: RegistrySnapshot): RegistrySnapshotValidationResult {
  const failures: RegistrySnapshotFailure[] = [];
  const { manifest, content } = snapshot;

  if (!content.tools.length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_MISSING, "registry snapshot is missing tools", "content.tools"));
  }
  if (!content.schemas.length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_SCHEMA_MISSING, "registry snapshot is missing schemas", "content.schemas"));
  }
  if (!Object.keys(content.policies).length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_POLICY_MISSING, "registry snapshot is missing policies", "content.policies"));
  }
  if (!Object.keys(content.governance).length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_GOVERNANCE_MISSING, "registry snapshot is missing governance metadata", "content.governance"));
  }
  if (!Object.keys(content.compatibility).length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_COMPATIBILITY_MISSING, "registry snapshot is missing compatibility map", "content.compatibility"));
  }
  if (!Object.keys(content.rollback).length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_ROLLBACK_MISSING, "registry snapshot is missing rollback contracts", "content.rollback"));
  }
  if (!content.lineage.lineages.length) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_LINEAGE_INVALID, "registry snapshot is missing lineage", "content.lineage"));
  }

  for (const tool of content.tools) {
    const inputSchemaPresent = content.schemas.some((schema) => schema.ref === tool.inputSchemaRef);
    const outputSchemaPresent = content.schemas.some((schema) => schema.ref === tool.outputSchemaRef);
    const policyPresent = Boolean(content.policies[tool.policyRef]);
    const governancePresent = Boolean(content.governance[tool.canonicalId]);
    const compatibilityPresent = Boolean(content.compatibility[tool.canonicalId]);
    const rollbackPresent = Boolean(content.rollback[tool.canonicalId]);
    const lineagePresent = content.lineage.lineages.some((lineage) => lineage.lineageId === tool.lineageId);

    if (!inputSchemaPresent || !outputSchemaPresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_SCHEMA_MISSING,
        "registry snapshot is missing frozen tool schema evidence",
        `content.schemas:${tool.canonicalId}`,
      ));
    }
    if (!policyPresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_POLICY_MISSING,
        "registry snapshot is missing frozen policy evidence",
        `content.policies:${tool.canonicalId}`,
      ));
    }
    if (!governancePresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_GOVERNANCE_MISSING,
        "registry snapshot is missing frozen governance evidence",
        `content.governance:${tool.canonicalId}`,
      ));
    }
    if (!compatibilityPresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_COMPATIBILITY_MISSING,
        "registry snapshot is missing frozen compatibility evidence",
        `content.compatibility:${tool.canonicalId}`,
      ));
    }
    if (!rollbackPresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_ROLLBACK_MISSING,
        "registry snapshot is missing frozen rollback evidence",
        `content.rollback:${tool.canonicalId}`,
      ));
    }
    if (!lineagePresent) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_LINEAGE_INVALID,
        "registry snapshot lineage is incomplete for a frozen tool version",
        `content.lineage:${tool.canonicalId}`,
      ));
    }

    if (tool.rollbackSupported && !content.rollback[tool.canonicalId]?.rollbackMetadata && !content.rollback[tool.canonicalId]?.policyRollback.supported) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_ROLLBACK_MISSING,
        "registry snapshot dropped required rollback evidence",
        `content.rollback:${tool.canonicalId}`,
      ));
    }
    if (!tool.governanceMetadata) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_GOVERNANCE_MISSING,
        "registry snapshot dropped required governance metadata",
        `content.tools:${tool.canonicalId}`,
      ));
    }
  }

  const hashes = hashRegistrySnapshotContent(content);
  if (manifest.registrySnapshotHash !== hashes.registrySnapshotHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "registry snapshot hash mismatch", "manifest.registrySnapshotHash", hashes.registrySnapshotHash, manifest.registrySnapshotHash));
  }
  if (manifest.toolsHash !== hashes.toolsHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "tools hash mismatch", "manifest.toolsHash", hashes.toolsHash, manifest.toolsHash));
  }
  if (manifest.schemasHash !== hashes.schemasHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "schemas hash mismatch", "manifest.schemasHash", hashes.schemasHash, manifest.schemasHash));
  }
  if (manifest.policiesHash !== hashes.policiesHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "policies hash mismatch", "manifest.policiesHash", hashes.policiesHash, manifest.policiesHash));
  }
  if (manifest.governanceHash !== hashes.governanceHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "governance hash mismatch", "manifest.governanceHash", hashes.governanceHash, manifest.governanceHash));
  }
  if (manifest.compatibilityHash !== hashes.compatibilityHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "compatibility hash mismatch", "manifest.compatibilityHash", hashes.compatibilityHash, manifest.compatibilityHash));
  }
  if (manifest.rollbackHash !== hashes.rollbackHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "rollback hash mismatch", "manifest.rollbackHash", hashes.rollbackHash, manifest.rollbackHash));
  }
  if (manifest.lineageHash !== hashes.lineageHash) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_HASH_MISMATCH, "lineage hash mismatch", "manifest.lineageHash", hashes.lineageHash, manifest.lineageHash));
  }

  const expectedManifestHash = hashRegistrySnapshotManifest({
    snapshotVersion: manifest.snapshotVersion,
    triggerType: manifest.triggerType,
    registrySnapshotHash: manifest.registrySnapshotHash,
    parentSnapshotHash: manifest.parentSnapshotHash,
    toolsHash: manifest.toolsHash,
    schemasHash: manifest.schemasHash,
    policiesHash: manifest.policiesHash,
    governanceHash: manifest.governanceHash,
    compatibilityHash: manifest.compatibilityHash,
    rollbackHash: manifest.rollbackHash,
    lineageHash: manifest.lineageHash,
    immutable: manifest.immutable,
    replayEligible: manifest.replayEligible,
    admissionStatus: manifest.admissionStatus,
  });
  if (expectedManifestHash !== manifest.manifestHash || expectedManifestHash !== manifest.snapshotId) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_IMMUTABILITY_VIOLATION, "registry snapshot manifest hash is invalid", "manifest.manifestHash", expectedManifestHash, manifest.manifestHash));
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}
