import { describe, expect, it } from "vitest";
import { resolveReplayRegistrySnapshot } from "@/services/registry-snapshots";
import { buildRegistrySnapshotStoreFixture } from "@/tests/registry-snapshots/helpers";

describe("registry snapshot replay resolution", () => {
  it("resolves frozen registry evidence by snapshot hash and id", () => {
    const { store, genesis } = buildRegistrySnapshotStoreFixture();

    expect(resolveReplayRegistrySnapshot(store, { registrySnapshotHash: genesis.manifest.registrySnapshotHash }).snapshot?.manifest.snapshotId).toBe(genesis.manifest.snapshotId);
    expect(resolveReplayRegistrySnapshot(store, { snapshotId: genesis.manifest.snapshotId }).snapshot?.manifest.registrySnapshotHash).toBe(genesis.manifest.registrySnapshotHash);
  });

  it("fails closed for missing or mutated snapshots and never falls back to live registry", () => {
    const { store, genesis } = buildRegistrySnapshotStoreFixture();

    expect(resolveReplayRegistrySnapshot(store, { snapshotId: "missing" }).failures[0]?.code).toBe("REGISTRY_SNAPSHOT_MISSING");

    store.save({
      ...genesis,
      manifest: {
        ...genesis.manifest,
        snapshotId: "mutated",
        manifestHash: "mutated-hash",
      },
    });

    const result = resolveReplayRegistrySnapshot(store, { snapshotId: "mutated" });
    expect(result.snapshot).toBeUndefined();
    expect(result.failures.some((failure) => failure.code === "REGISTRY_SNAPSHOT_IMMUTABILITY_VIOLATION")).toBe(true);
  });
});
