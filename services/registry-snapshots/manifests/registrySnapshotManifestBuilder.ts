import type { RegistrySnapshotBuildInput, RegistrySnapshotContent, RegistrySnapshotManifest } from "../registrySnapshotTypes";
import { hashRegistrySnapshotContent, hashRegistrySnapshotManifest } from "../hashing/registrySnapshotHasher";

export function buildRegistrySnapshotManifest(
  input: RegistrySnapshotBuildInput,
  content: RegistrySnapshotContent,
): RegistrySnapshotManifest {
  const hashes = hashRegistrySnapshotContent(content);
  const replayCandidateIds = new Set(
    content.tools
      .filter((tool) => tool.status === "published" || tool.status === "deprecated")
      .map((tool) => tool.canonicalId),
  );
  const replayEligible = content.tools
    .filter((tool) => replayCandidateIds.has(tool.canonicalId))
    .every((tool) => tool.supportsReplay)
    && Object.entries(content.compatibility)
      .filter(([canonicalId]) => replayCandidateIds.has(canonicalId))
      .every(([, record]) => record.supportsReplay)
    && Object.entries(content.rollback)
      .filter(([canonicalId]) => replayCandidateIds.has(canonicalId))
      .every(([, record]) => !record.rollbackSupported || record.policyRollback.supported);

  const manifestBase = {
    snapshotVersion: input.snapshotVersion,
    triggerType: input.triggerType,
    registrySnapshotHash: hashes.registrySnapshotHash,
    parentSnapshotHash: input.parentSnapshot?.manifest.registrySnapshotHash,
    toolsHash: hashes.toolsHash,
    schemasHash: hashes.schemasHash,
    policiesHash: hashes.policiesHash,
    governanceHash: hashes.governanceHash,
    compatibilityHash: hashes.compatibilityHash,
    rollbackHash: hashes.rollbackHash,
    lineageHash: hashes.lineageHash,
    immutable: true as const,
    replayEligible,
    admissionStatus: replayEligible ? "approved" as const : "rejected" as const,
  };

  const manifestHash = hashRegistrySnapshotManifest(manifestBase);
  return {
    snapshotId: manifestHash,
    createdAt: input.createdAt,
    manifestHash,
    ...manifestBase,
  };
}
