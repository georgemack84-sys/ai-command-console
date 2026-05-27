import { describe, expect, it } from "vitest";
import { buildRegistrySnapshotFixture } from "@/tests/registry-snapshots/helpers";

describe("registry snapshot determinism", () => {
  it("produces identical hashes for identical registry input", () => {
    const first = buildRegistrySnapshotFixture();
    const second = buildRegistrySnapshotFixture();

    expect(first.manifest.registrySnapshotHash).toBe(second.manifest.registrySnapshotHash);
    expect(first.manifest.manifestHash).toBe(second.manifest.manifestHash);
    expect(first.manifest.toolsHash).toBe(second.manifest.toolsHash);
  });

  it("keeps manifest hashing stable across repeated builds", () => {
    const first = buildRegistrySnapshotFixture();
    const second = buildRegistrySnapshotFixture();

    expect(first.manifest.snapshotId).toBe(second.manifest.snapshotId);
  });
});
