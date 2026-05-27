import type { ConstitutionalSnapshotEnvelope } from "@/types/deterministic-snapshot-engine";
import type { ProposalSnapshotBinding } from "@/types/proposal-lifecycle-engine";
import { hashProposalLifecycleValue } from "./proposalLifecycleHasher";

export function bindProposalSnapshots(snapshots: readonly ConstitutionalSnapshotEnvelope[]): ProposalSnapshotBinding {
  const snapshotLineageHashes = Object.freeze(
    snapshots.map((snapshot) => snapshot.lineageId).filter(Boolean).sort((left, right) => left.localeCompare(right)),
  );
  return Object.freeze({
    snapshotLineageHashes,
    snapshotLineageHash: hashProposalLifecycleValue("proposal-snapshot-lineage", snapshotLineageHashes),
    valid: snapshotLineageHashes.length > 0,
    disputed: snapshotLineageHashes.length === 0,
  });
}
