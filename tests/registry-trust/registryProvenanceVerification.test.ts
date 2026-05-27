import { describe, expect, it } from "vitest";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { verifyRegistryProvenance, validateRegistryPromotion } from "@/services/registry-provenance";
import { buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("registry provenance verification", () => {
  it("passes for valid provenance", () => {
    const { snapshot, parentSnapshot, provenance } = buildRegistryTrustFixture();
    const result = verifyRegistryProvenance(snapshot, provenance, parentSnapshot);

    expect(result.ok).toBe(true);
  });

  it("fails when provenance is missing", () => {
    const { snapshot, parentSnapshot } = buildRegistryTrustFixture();
    const result = verifyRegistryProvenance(snapshot, null, parentSnapshot);

    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_MISSING);
  });

  it("fails when provenance references a different snapshot", () => {
    const { snapshot, parentSnapshot, provenance } = buildRegistryTrustFixture();
    const result = verifyRegistryProvenance(snapshot, {
      ...provenance,
      registrySnapshotHash: "sha256-other",
    }, parentSnapshot);

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_HASH_MISMATCH)).toBe(true);
  });

  it("fails when approval chain is missing for production promotion", () => {
    const result = validateRegistryPromotion({
      ...buildRegistryTrustFixture().provenance,
      promotionStage: "production",
      previousPromotionStage: "staging",
      approvalChainHash: undefined,
    });

    expect(result.ok).toBe(false);
  });
});

