import { describe, expect, it } from "vitest";
import { verifyRegistrySnapshotSignature } from "@/services/registry-signatures";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";

describe("registry signature verification", () => {
  it("passes for a valid detached signature", () => {
    const { snapshot, signature } = buildRegistryTrustFixture();
    const result = verifyRegistrySnapshotSignature(snapshot, signature);

    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails when the signature is missing", () => {
    const { snapshot } = buildRegistryTrustFixture();
    const result = verifyRegistrySnapshotSignature(snapshot, null);

    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe(REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_MISSING);
  });

  it("fails when the signature references the wrong snapshot hash", () => {
    const { snapshot, signature } = buildRegistryTrustFixture();
    const result = verifyRegistrySnapshotSignature(snapshot, {
      ...signature,
      registrySnapshotHash: "sha256-wrong",
    });

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_HASH_MISMATCH)).toBe(true);
  });

  it("fails when the signature is forged", () => {
    const { snapshot, signature } = buildRegistryTrustFixture();
    const result = verifyRegistrySnapshotSignature(snapshot, {
      ...signature,
      signature: "sha256-forged",
    });

    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_INVALID)).toBe(true);
  });
});

