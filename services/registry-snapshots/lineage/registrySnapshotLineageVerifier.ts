import type { RegistrySnapshot, RegistrySnapshotFailure, RegistrySnapshotValidationResult } from "../registrySnapshotTypes";
import { REGISTRY_SNAPSHOT_ERROR_CODES } from "../registrySnapshotTypes";

function failure(
  code: RegistrySnapshotFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistrySnapshotFailure {
  return { code, message, path, expected, actual };
}

export function verifyRegistrySnapshotLineage(
  snapshot: RegistrySnapshot,
  parentSnapshot?: RegistrySnapshot | null,
  allowGenesis = false,
): RegistrySnapshotValidationResult {
  const failures: RegistrySnapshotFailure[] = [];
  const parentHash = snapshot.manifest.parentSnapshotHash;

  if (!parentHash) {
    if (!allowGenesis) {
      failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_PARENT_MISSING, "registry snapshot parent is missing", "manifest.parentSnapshotHash"));
    }
  } else if (!parentSnapshot) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_PARENT_MISSING, "registry snapshot parent could not be resolved", "manifest.parentSnapshotHash", parentHash, null));
  } else {
    if (parentSnapshot.manifest.registrySnapshotHash !== parentHash) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_LINEAGE_INVALID,
        "registry snapshot parent hash does not match resolved parent snapshot",
        "manifest.parentSnapshotHash",
        parentSnapshot.manifest.registrySnapshotHash,
        parentHash,
      ));
    }
    if (snapshot.manifest.snapshotVersion !== parentSnapshot.manifest.snapshotVersion + 1) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_LINEAGE_INVALID,
        "registry snapshot version chain is not append-only",
        "manifest.snapshotVersion",
        parentSnapshot.manifest.snapshotVersion + 1,
        snapshot.manifest.snapshotVersion,
      ));
    }
    if (snapshot.manifest.snapshotVersion <= parentSnapshot.manifest.snapshotVersion) {
      failures.push(failure(
        REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_IMMUTABILITY_VIOLATION,
        "registry snapshot lineage rewrite detected",
        "manifest.snapshotVersion",
      ));
    }
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}
