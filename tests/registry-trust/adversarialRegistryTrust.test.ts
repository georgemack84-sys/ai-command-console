import { describe, expect, it } from "vitest";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { admitTrustedRegistrySnapshot } from "@/services/registry-trust";
import { buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("adversarial registry trust", () => {
  it("rejects signer substitution even when the snapshot hash is valid", () => {
    const { snapshot, parentSnapshot, provenance, authorityStore, context, signature } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature: {
        ...signature,
        signedBy: "malicious-authority",
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

  it("rejects provenance rewrites", () => {
    const { snapshot, parentSnapshot, provenance, authorityStore, context, signature } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature,
      provenance: {
        ...provenance,
        snapshotId: "registry-snapshot-attacker",
      },
      authorityStore,
      context,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.reason).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID);
  });

  it("rejects direct promotion to production without authority", () => {
    const { snapshot, parentSnapshot, provenance, authorityStore, context, signature } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature,
      provenance: {
        ...provenance,
        previousPromotionStage: "development",
        promotionStage: "production",
        explicitPromotionApproval: false,
      },
      authorityStore,
      context: {
        ...context,
        promotionStage: "production",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.reason).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_PATH_INVALID);
  });
});
