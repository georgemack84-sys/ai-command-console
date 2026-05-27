import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { BackupManifest, BackupSnapshot } from "./backupTypes";
import { computeSectionHash, computeSnapshotHash } from "./snapshotSerializer";

function countSection(section: Record<string, unknown[]>) {
  return Object.values(section).reduce((total, entries) => total + entries.length, 0);
}

export function buildSnapshotManifest({
  snapshot,
  snapshotId,
}: {
  snapshot: BackupSnapshot;
  snapshotId: string;
}): BackupManifest {
  const executionIds = snapshot.executionState.executions
    .map((entry) => String(entry.id || ""))
    .filter(Boolean)
    .sort();
  const recoveryRequestIds = snapshot.recovery.requests
    .map((entry) => String(entry.recoveryRequestId || ""))
    .filter(Boolean)
    .sort();

  const sectionHashes = {
    executionState: computeSectionHash(snapshot.executionState),
    recovery: computeSectionHash(snapshot.recovery),
    sam: computeSectionHash(snapshot.sam),
  };

  return {
    snapshotId,
    tenantId: snapshot.tenantId,
    workspaceId: snapshot.workspaceId,
    generatedAt: snapshot.generatedAt,
    snapshotHash: computeSnapshotHash(snapshot),
    sectionHashes,
    recordCounts: {
      executionState: countSection(snapshot.executionState),
      recovery: countSection(snapshot.recovery),
      sam: countSection(snapshot.sam),
    },
    lineage: {
      executionIds,
      recoveryRequestIds,
    },
    completeness: hashPayloadDeterministically(sectionHashes).length > 0 ? "complete" : "partial",
  };
}
