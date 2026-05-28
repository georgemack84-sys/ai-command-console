import { describe, expect, it } from "vitest";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { verifyRegistryTrustAuthority } from "@/services/registry-trust";
import {
  buildRegistryTrustAuthorityFixture,
  buildRegistryTrustContextFixture,
  buildRegistryTrustFixture,
} from "@/tests/registry-trust/helpers";

describe("registry signer trust", () => {
  it("passes for a known active signer", () => {
    const { authority, context, signature } = buildRegistryTrustFixture();
    const result = verifyRegistryTrustAuthority(authority, signature, context);

    expect(result.ok).toBe(true);
  });

  it("fails for an unknown signer", () => {
    const { context, signature } = buildRegistryTrustFixture();
    const result = verifyRegistryTrustAuthority(null, signature, context);

    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNER_UNKNOWN);
  });

  it("fails for a revoked signer", () => {
    const { context, signature } = buildRegistryTrustFixture();
    const authority = buildRegistryTrustAuthorityFixture({ status: "revoked" });
    const result = verifyRegistryTrustAuthority(authority, signature, context);

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNER_REVOKED)).toBe(true);
  });

  it("fails when the signer is outside the allowed environment", () => {
    const { signature } = buildRegistryTrustFixture();
    const context = buildRegistryTrustContextFixture({ environment: "production" });
    const restrictedAuthority = buildRegistryTrustAuthorityFixture({ allowedEnvironments: ["staging"] });
    const result = verifyRegistryTrustAuthority(restrictedAuthority, signature, context);

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_AUTHORITY_INVALID)).toBe(true);
  });

  it("fails when the signing key does not match", () => {
    const { context, signature } = buildRegistryTrustFixture();
    const authority = buildRegistryTrustAuthorityFixture({ signingKeyId: "key-999" });
    const result = verifyRegistryTrustAuthority(authority, signature, context);

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_KEY_UNKNOWN)).toBe(true);
  });
});
