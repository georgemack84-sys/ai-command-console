import type { RegistrySnapshot, RegistrySnapshotAdmissionResult, RegistrySnapshotFailure } from "../registrySnapshotTypes";
import { REGISTRY_SNAPSHOT_ERROR_CODES } from "../registrySnapshotTypes";
import { verifyRegistrySnapshotLineage } from "../lineage/registrySnapshotLineageVerifier";
import { validateRegistrySnapshot } from "../validation/registrySnapshotValidator";

function failure(
  code: RegistrySnapshotFailure["code"],
  message: string,
  path?: string,
): RegistrySnapshotFailure {
  return { code, message, path };
}

export function admitRegistrySnapshot(
  snapshot: RegistrySnapshot,
  parentSnapshot?: RegistrySnapshot | null,
  allowGenesis = false,
): RegistrySnapshotAdmissionResult {
  const validation = validateRegistrySnapshot(snapshot);
  const lineage = verifyRegistrySnapshotLineage(snapshot, parentSnapshot, allowGenesis);
  const failures: RegistrySnapshotFailure[] = [...validation.failures, ...lineage.failures];

  if (!snapshot.content.tools.every((tool) => tool.governanceMetadata)) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_GOVERNANCE_MISSING, "registry snapshot governance metadata is incomplete", "content.governance"));
  }
  if (!Object.values(snapshot.content.compatibility).every((record) => record.registryHash && record.capabilityHash)) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_COMPATIBILITY_MISSING, "registry snapshot compatibility evidence is incomplete", "content.compatibility"));
  }
  if (!Object.values(snapshot.content.rollback).every((record) => !record.rollbackSupported || record.rollbackMetadata || record.policyRollback.supported)) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_ROLLBACK_MISSING, "registry snapshot rollback evidence is incomplete", "content.rollback"));
  }
  if (!snapshot.manifest.replayEligible) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_REPLAY_UNSAFE, "registry snapshot is not replay eligible", "manifest.replayEligible"));
  }

  if (failures.length > 0) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_ADMISSION_REJECTED, "registry snapshot admission rejected"));
  }

  return {
    approved: failures.length === 0,
    replayEligible: snapshot.manifest.replayEligible && failures.length === 0,
    failures,
  };
}
