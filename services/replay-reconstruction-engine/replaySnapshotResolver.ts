import type { ExecutionTreatyPackage } from "@/types/execution-treaty";

export type ReplaySnapshotResolution = Readonly<{
  valid: boolean;
  replaySnapshotHash?: string;
  replayBindingHash?: string;
  registrySnapshotHash?: string;
  governanceSnapshotHash?: string;
  approvalChainHash?: string;
  provenanceHash?: string;
  treatyEvidenceHash?: string;
  errors: readonly string[];
}>;

export function resolveReplaySnapshotBindings(
  treaty: ExecutionTreatyPackage,
): ReplaySnapshotResolution {
  const errors: string[] = [];
  if (!treaty.manifest.replaySnapshotHash || !treaty.manifest.replayBindingHash) {
    errors.push("REPLAY_SNAPSHOT_MISSING");
  }
  if (!treaty.manifest.registrySnapshotHash || !treaty.manifest.governanceSnapshotHash) {
    errors.push("REPLAY_EVIDENCE_INCOMPLETE");
  }

  return Object.freeze({
    valid: errors.length === 0,
    replaySnapshotHash: treaty.manifest.replaySnapshotHash,
    replayBindingHash: treaty.manifest.replayBindingHash,
    registrySnapshotHash: treaty.manifest.registrySnapshotHash,
    governanceSnapshotHash: treaty.manifest.governanceSnapshotHash,
    approvalChainHash: treaty.manifest.approvalChainHash,
    provenanceHash: treaty.manifest.provenanceHash,
    treatyEvidenceHash: treaty.hashes.evidenceHash,
    errors: Object.freeze(errors),
  });
}
