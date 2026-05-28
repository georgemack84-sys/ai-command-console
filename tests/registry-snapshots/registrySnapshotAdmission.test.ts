import { describe, expect, it } from "vitest";
import { admitRegistrySnapshot } from "@/services/registry-snapshots";
import { buildRegistrySnapshotFixture } from "@/tests/registry-snapshots/helpers";

describe("registry snapshot admission", () => {
  it("approves a complete valid snapshot", () => {
    const snapshot = buildRegistrySnapshotFixture();
    const result = admitRegistrySnapshot(snapshot, null, true);

    expect(result.approved).toBe(true);
    expect(result.replayEligible).toBe(true);
  });

  it("rejects missing governance, compatibility, replay safety, and hash mismatches", () => {
    const snapshot = buildRegistrySnapshotFixture();
    const rejected = {
      ...snapshot,
      manifest: {
        ...snapshot.manifest,
        replayEligible: false,
      },
      content: {
        ...snapshot.content,
        governance: {},
        compatibility: {},
      },
    };

    const result = admitRegistrySnapshot(rejected, null, true);
    expect(result.approved).toBe(false);
    expect(result.failures.some((failure) => failure.code === "REGISTRY_SNAPSHOT_ADMISSION_REJECTED")).toBe(true);
  });
});
