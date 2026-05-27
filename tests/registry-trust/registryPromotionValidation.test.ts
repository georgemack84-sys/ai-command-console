import { describe, expect, it } from "vitest";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { validateRegistryPromotion } from "@/services/registry-provenance";
import { buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("registry promotion validation", () => {
  it("allows development to validation", () => {
    const { provenance } = buildRegistryTrustFixture();
    const result = validateRegistryPromotion({
      ...provenance,
      previousPromotionStage: "development",
      promotionStage: "validation",
    });

    expect(result.ok).toBe(true);
  });

  it("allows validation to staging", () => {
    const { provenance } = buildRegistryTrustFixture();
    const result = validateRegistryPromotion(provenance);
    expect(result.ok).toBe(true);
  });

  it("allows staging to production", () => {
    const { provenance } = buildRegistryTrustFixture();
    const result = validateRegistryPromotion({
      ...provenance,
      previousPromotionStage: "staging",
      promotionStage: "production",
      approvalChainHash: "sha256-approval-chain",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects development to production without explicit approval", () => {
    const { provenance } = buildRegistryTrustFixture();
    const result = validateRegistryPromotion({
      ...provenance,
      previousPromotionStage: "development",
      promotionStage: "production",
      explicitPromotionApproval: false,
    });

    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_PATH_INVALID);
  });
});

