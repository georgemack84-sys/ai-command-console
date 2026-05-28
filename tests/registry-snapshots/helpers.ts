import { buildRegistrySnapshot, createRegistrySnapshotStore, type RegistrySnapshotBuildInput } from "@/services/registry-snapshots";

export function buildRegistrySnapshotFixture(
  override: Partial<RegistrySnapshotBuildInput> = {},
) {
  return buildRegistrySnapshot({
    triggerType: "version-publication",
    createdAt: "2026-05-15T00:00:00.000Z",
    snapshotVersion: 1,
    allowGenesis: true,
    ...override,
  });
}

export function buildRegistrySnapshotStoreFixture() {
  const genesis = buildRegistrySnapshotFixture();
  const store = createRegistrySnapshotStore([genesis]);
  return { store, genesis };
}
