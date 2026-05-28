import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { RegistrySnapshotSignature } from "./registrySignatureTypes";

type TestSignatureInput = Readonly<{
  snapshotId: string;
  registrySnapshotHash: string;
  signedBy: string;
  signingKeyId: string;
}>;

function buildSignaturePayload(input: TestSignatureInput) {
  return {
    snapshotId: input.snapshotId,
    registrySnapshotHash: input.registrySnapshotHash,
    signedBy: input.signedBy,
    signingKeyId: input.signingKeyId,
    trustScope: "registry-snapshot-signing",
  };
}

export function createDeterministicRegistrySnapshotSignatureForTests(
  input: TestSignatureInput & Readonly<{ signedAt: string }>,
): RegistrySnapshotSignature {
  return {
    snapshotId: input.snapshotId,
    registrySnapshotHash: input.registrySnapshotHash,
    signedBy: input.signedBy,
    signingKeyId: input.signingKeyId,
    signedAt: input.signedAt,
    signature: hashStableContent("GOVERNANCE", buildSignaturePayload(input)),
  };
}

export function deriveExpectedRegistrySnapshotSignature(input: TestSignatureInput): string {
  return hashStableContent("GOVERNANCE", buildSignaturePayload(input));
}

