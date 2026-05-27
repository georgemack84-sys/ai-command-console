import type { RegistrySnapshot, RegistrySnapshotFailure, RegistrySnapshotReplayResolutionInput } from "../registrySnapshotTypes";
import { REGISTRY_SNAPSHOT_ERROR_CODES } from "../registrySnapshotTypes";
import { validateRegistrySnapshot } from "../validation/registrySnapshotValidator";

function failure(code: RegistrySnapshotFailure["code"], message: string, path?: string): RegistrySnapshotFailure {
  return { code, message, path };
}

export function resolveReplayRegistrySnapshot(
  store: {
    getById(snapshotId: string): RegistrySnapshot | null;
    getByHash(registrySnapshotHash: string): RegistrySnapshot | null;
  },
  input: RegistrySnapshotReplayResolutionInput,
): { snapshot?: RegistrySnapshot; failures: readonly RegistrySnapshotFailure[] } {
  const failures: RegistrySnapshotFailure[] = [];

  const snapshot = input.snapshotId
    ? store.getById(input.snapshotId)
    : input.registrySnapshotHash
      ? store.getByHash(input.registrySnapshotHash)
      : null;

  if (!snapshot) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_MISSING, "registry snapshot could not be resolved from frozen storage"));
    return { failures };
  }

  const validation = validateRegistrySnapshot(snapshot);
  failures.push(...validation.failures);

  if (!snapshot.manifest.replayEligible) {
    failures.push(failure(REGISTRY_SNAPSHOT_ERROR_CODES.REGISTRY_SNAPSHOT_REPLAY_UNSAFE, "registry snapshot is not replay safe"));
  }

  return failures.length === 0
    ? { snapshot, failures }
    : { failures };
}
