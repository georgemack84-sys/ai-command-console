import type { RegistrySnapshot } from "@/services/registry-snapshots";
import {
  REGISTRY_TRUST_ERROR_CODES,
  verifyRegistrySnapshotSignature,
  type RegistrySnapshotSignature,
} from "@/services/registry-signatures";
import {
  verifyRegistryProvenance,
  type RegistrySnapshotProvenance,
} from "@/services/registry-provenance";
import type {
  RegistryTrustAuthority,
  RegistryTrustVerificationContext,
  RegistryTrustVerificationFailure,
  RegistryTrustVerificationResult,
} from "./registryTrustTypes";

function failure(
  code: RegistryTrustVerificationFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistryTrustVerificationFailure {
  return { code, message, path, expected, actual };
}

export function verifyRegistryTrustAuthority(
  authority: RegistryTrustAuthority | null,
  signature: RegistrySnapshotSignature,
  context: RegistryTrustVerificationContext,
): RegistryTrustVerificationResult {
  const failures: RegistryTrustVerificationFailure[] = [];

  if (!authority) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNER_UNKNOWN,
        "registry signing authority could not be found",
        "signature.signedBy",
        undefined,
        signature.signedBy,
      ),
    );
    return { ok: false, failures };
  }

  if (authority.signingKeyId !== signature.signingKeyId) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_KEY_UNKNOWN,
        "registry signing key does not match the trusted authority record",
        "signature.signingKeyId",
        authority.signingKeyId,
        signature.signingKeyId,
      ),
    );
  }

  if (authority.status === "revoked") {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNER_REVOKED,
        "registry signing authority has been revoked",
        "authority.status",
        "active",
        authority.status,
      ),
    );
  } else if (authority.status !== "active") {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_AUTHORITY_INVALID,
        "registry signing authority is not active",
        "authority.status",
        "active",
        authority.status,
      ),
    );
  }

  if (!authority.allowedEnvironments.includes(context.environment)) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_AUTHORITY_INVALID,
        "registry signing authority is not allowed in the requested environment",
        "authority.allowedEnvironments",
        authority.allowedEnvironments,
        context.environment,
      ),
    );
  }

  if (!authority.allowedPromotionStages.includes(context.promotionStage)) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_AUTHORITY_INVALID,
        "registry signing authority is not allowed for the requested promotion stage",
        "authority.allowedPromotionStages",
        authority.allowedPromotionStages,
        context.promotionStage,
      ),
    );
  }

  if (!authority.allowedTrustScopes.includes(context.trustScope)) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNING_AUTHORITY_INVALID,
        "registry signing authority is not allowed for the requested trust scope",
        "authority.allowedTrustScopes",
        authority.allowedTrustScopes,
        context.trustScope,
      ),
    );
  }

  return { ok: failures.length === 0, authority: failures.length === 0 ? authority : undefined, failures };
}

export function verifyRegistryTrust(input: Readonly<{
  snapshot: RegistrySnapshot;
  parentSnapshot?: RegistrySnapshot | null;
  signature?: RegistrySnapshotSignature | null;
  provenance?: RegistrySnapshotProvenance | null;
  authority: RegistryTrustAuthority | null;
  context: RegistryTrustVerificationContext;
}>): RegistryTrustVerificationResult {
  const signatureResult = verifyRegistrySnapshotSignature(input.snapshot, input.signature);
  const provenanceResult = verifyRegistryProvenance(input.snapshot, input.provenance, input.parentSnapshot);
  const authorityResult = input.signature
    ? verifyRegistryTrustAuthority(input.authority, input.signature, input.context)
    : { ok: false, failures: [] };

  const failures: RegistryTrustVerificationFailure[] = [
    ...signatureResult.failures,
    ...provenanceResult.failures,
    ...authorityResult.failures,
  ];

  return {
    ok: failures.length === 0,
    authority: failures.length === 0 ? authorityResult.authority : undefined,
    failures,
  };
}

