import { describe, expect, it } from "vitest";
import { resolveReplayRegistrySnapshot } from "@/services/registry-snapshots";
import { createRegistrySnapshotStore } from "@/services/registry-snapshots";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { admitTrustedRegistrySnapshot } from "@/services/registry-trust";
import { buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("registry trust replay safety", () => {
  it("never falls back to the live registry when a frozen snapshot is missing", () => {
    const store = createRegistrySnapshotStore([]);
    const resolution = resolveReplayRegistrySnapshot(store, { snapshotId: "missing-snapshot" });

    expect(resolution.snapshot).toBeUndefined();
    expect(resolution.failures).not.toHaveLength(0);
  });

  it("rejects an untrusted snapshot during trust-aware replay admission", () => {
    const { snapshot, parentSnapshot, provenance, authorityStore, context, signature } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature: {
        ...signature,
        signature: "sha256-forged",
      },
      provenance,
      authorityStore,
      context,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.reason).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_INVALID);
  });

  it("rejects a provenance mismatch during replay", () => {
    const { snapshot, parentSnapshot, provenance, authorityStore, context, signature } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature,
      provenance: {
        ...provenance,
        parentSnapshotHash: "sha256-other",
      },
      authorityStore,
      context,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.reason).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_HASH_MISMATCH);
  });
});
