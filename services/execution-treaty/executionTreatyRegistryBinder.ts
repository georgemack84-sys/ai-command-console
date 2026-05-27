import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

export function bindRegistryTreatyEvidence(input: {
  snapshot: RegistrySnapshot;
  currentRegistrySnapshotHash?: string;
}): {
  registrySnapshotHash: string;
  registryLineageHash: string;
  failures: readonly ExecutionTreatyFailure[];
} {
  const failures: ExecutionTreatyFailure[] = [];
  if (!input.snapshot.manifest.registrySnapshotHash) {
    failures.push({
      code: "HANDOFF_REGISTRY_BINDING_MISSING",
      message: "registry snapshot hash is missing",
      path: "snapshot.manifest.registrySnapshotHash",
    });
  }
  if (input.currentRegistrySnapshotHash !== undefined
    && input.currentRegistrySnapshotHash !== input.snapshot.manifest.registrySnapshotHash) {
    failures.push({
      code: "HANDOFF_HASH_MISMATCH",
      message: "registry snapshot substitution detected",
      path: "currentRegistrySnapshotHash",
      expected: input.snapshot.manifest.registrySnapshotHash,
      actual: input.currentRegistrySnapshotHash,
    });
  }
  return {
    registrySnapshotHash: input.snapshot.manifest.registrySnapshotHash,
    registryLineageHash: input.snapshot.manifest.lineageHash,
    failures,
  };
}
