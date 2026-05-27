import type { RegistrySnapshot } from "@/services/registry-snapshots";
import {
  REGISTRY_TRUST_ERROR_CODES,
  type RegistrySignatureVerificationFailure,
  type RegistrySignatureVerificationResult,
  type RegistrySnapshotSignature,
} from "./registrySignatureTypes";
import { deriveExpectedRegistrySnapshotSignature } from "./registrySignatureTestSigner";

function failure(
  code: RegistrySignatureVerificationFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistrySignatureVerificationFailure {
  return { code, message, path, expected, actual };
}

export function verifyRegistrySnapshotSignature(
  snapshot: RegistrySnapshot,
  signature?: RegistrySnapshotSignature | null,
): RegistrySignatureVerificationResult {
  if (!signature) {
    return {
      ok: false,
      snapshotId: snapshot.manifest.snapshotId,
      registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
      failures: [
        failure(
          REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_MISSING,
          "registry snapshot signature is required",
          "signature",
        ),
      ],
    };
  }

  const failures: RegistrySignatureVerificationFailure[] = [];

  if (signature.snapshotId !== snapshot.manifest.snapshotId) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_INVALID,
        "registry snapshot signature references a different snapshot",
        "signature.snapshotId",
        snapshot.manifest.snapshotId,
        signature.snapshotId,
      ),
    );
  }

  if (signature.registrySnapshotHash !== snapshot.manifest.registrySnapshotHash) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_HASH_MISMATCH,
        "registry snapshot signature hash does not match the frozen snapshot hash",
        "signature.registrySnapshotHash",
        snapshot.manifest.registrySnapshotHash,
        signature.registrySnapshotHash,
      ),
    );
  }

  const expectedSignature = deriveExpectedRegistrySnapshotSignature({
    snapshotId: snapshot.manifest.snapshotId,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
    signedBy: signature.signedBy,
    signingKeyId: signature.signingKeyId,
  });

  if (signature.signature !== expectedSignature) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_INVALID,
        "registry snapshot signature verification failed",
        "signature.signature",
        expectedSignature,
        signature.signature,
      ),
    );
  }

  return {
    ok: failures.length === 0,
    snapshotId: snapshot.manifest.snapshotId,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
    failures,
  };
}

