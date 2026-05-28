import { describe, expect, it } from "vitest";
import { buildRegistrySnapshot, verifyRegistrySnapshotLineage } from "@/services/registry-snapshots";
import { buildRegistrySnapshotFixture } from "@/tests/registry-snapshots/helpers";

describe("registry snapshot lineage", () => {
  it("accepts a valid parent chain", () => {
    const genesis = buildRegistrySnapshotFixture();
    const child = buildRegistrySnapshot({
      triggerType: "policy-change",
      createdAt: "2026-05-15T00:00:00.000Z",
      snapshotVersion: 2,
      parentSnapshot: genesis,
    });

    const result = verifyRegistrySnapshotLineage(child, genesis);
    expect(result.valid).toBe(true);
  });

  it("fails closed when parent is missing or altered", () => {
    const genesis = buildRegistrySnapshotFixture();
    const child = buildRegistrySnapshot({
      triggerType: "policy-change",
      createdAt: "2026-05-15T00:00:00.000Z",
      snapshotVersion: 2,
      parentSnapshot: genesis,
    });

    expect(verifyRegistrySnapshotLineage(child, null).valid).toBe(false);
    expect(verifyRegistrySnapshotLineage({
      ...child,
      manifest: { ...child.manifest, parentSnapshotHash: "spoofed-parent" },
    }, genesis).valid).toBe(false);
  });
});
