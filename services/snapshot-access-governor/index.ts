import type { ConstitutionalGovernanceInput, SnapshotAccessGrant } from "@/types/constitutional-governance";

export function evaluateSnapshotAccess(input: ConstitutionalGovernanceInput): SnapshotAccessGrant {
  const branchAuthorityValid = input.snapshots.every((snapshot) => snapshot.immutable && Boolean(snapshot.lineageId));
  const visibleSnapshotIds = branchAuthorityValid ? input.snapshots.map((snapshot) => snapshot.snapshotId) : [];
  const disputedSnapshots = input.snapshots.some((snapshot) => !snapshot.integrityHash || !snapshot.replayHash);

  return Object.freeze({
    decision: !branchAuthorityValid ? "DENY" : disputedSnapshots ? "ESCALATE" : "ALLOW",
    visibleSnapshotIds: Object.freeze([...visibleSnapshotIds]),
    branchAuthorityValid,
    forensicVisibility: !branchAuthorityValid ? "DENIED" : disputedSnapshots ? "DISPUTED" : "VISIBLE",
    evidenceLinks: Object.freeze(
      input.snapshots.map((snapshot) => ({
        label: `Snapshot ${snapshot.snapshotType}`,
        authority: "4.4F.deterministic-snapshot-engine" as const,
        hash: snapshot.integrityHash,
        ref: snapshot.snapshotId,
      })),
    ),
  });
}
