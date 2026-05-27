import { describe, expect, it } from "vitest";
import { admitRegistrySnapshot } from "@/services/registry-snapshots";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { admitTrustedRegistrySnapshot, createRegistryTrustAuthorityStore } from "@/services/registry-trust";
import { buildRegistryTrustAuthorityFixture, buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("registry trust admission", () => {
  it("passes with a valid 4.3I snapshot and valid trust evidence", () => {
    const { snapshot, parentSnapshot, signature, provenance, authorityStore, context } = buildRegistryTrustFixture();
    const snapshotAdmission = admitRegistrySnapshot(snapshot, parentSnapshot, false);

    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature,
      provenance,
      authorityStore,
      context,
      snapshotAdmission,
    });

    expect(result.ok).toBe(true);
  });

  it("fails before trust acceptance when 4.3I snapshot admission fails", () => {
    const { snapshot, parentSnapshot, signature, provenance, authorityStore, context } = buildRegistryTrustFixture();
    const result = admitTrustedRegistrySnapshot({
      snapshot: {
        ...snapshot,
        manifest: {
          ...snapshot.manifest,
          replayEligible: false,
        },
      },
      parentSnapshot,
      signature,
      provenance,
      authorityStore,
      context,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.code).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE);
  });

  it("fails for a revoked signer", () => {
    const { snapshot, parentSnapshot, provenance, context, signature } = buildRegistryTrustFixture();
    const authorityStore = createRegistryTrustAuthorityStore([
      buildRegistryTrustAuthorityFixture({ status: "revoked" }),
    ]);
    const result = admitTrustedRegistrySnapshot({
      snapshot,
      parentSnapshot,
      signature,
      provenance,
      authorityStore,
      context,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected trust admission to fail");
    }
    expect(result.reason).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNER_REVOKED);
    expect(result.blockingCode).toBe(REGISTRY_TRUST_ERROR_CODES.EXECUTION_BLOCKED_UNTRUSTED_REGISTRY);
  });
});
