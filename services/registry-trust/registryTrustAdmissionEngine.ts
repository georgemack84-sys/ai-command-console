import {
  admitRegistrySnapshot,
  type RegistrySnapshot,
  type RegistrySnapshotAdmissionResult,
} from "@/services/registry-snapshots";
import {
  REGISTRY_TRUST_ERROR_CODES,
  type RegistrySnapshotSignature,
} from "@/services/registry-signatures";
import { validateRegistryPromotion, type RegistrySnapshotProvenance } from "@/services/registry-provenance";
import { verifyRegistryTrust } from "./registryTrustVerifier";
import type {
  RegistryTrustAdmissionResult,
  RegistryTrustVerificationContext,
} from "./registryTrustTypes";
import type { RegistryTrustAuthorityStore } from "./registryTrustAuthorityStore";

function fail(
  code: "REGISTRY_TRUST_FAILURE",
  reason: string,
  snapshot?: RegistrySnapshot,
): RegistryTrustAdmissionResult {
  return {
    ok: false,
    code,
    reason,
    snapshotId: snapshot?.manifest.snapshotId,
    registrySnapshotHash: snapshot?.manifest.registrySnapshotHash,
    blockingCode: REGISTRY_TRUST_ERROR_CODES.EXECUTION_BLOCKED_UNTRUSTED_REGISTRY,
  };
}

export function admitTrustedRegistrySnapshot(input: Readonly<{
  snapshot: RegistrySnapshot;
  parentSnapshot?: RegistrySnapshot | null;
  signature?: RegistrySnapshotSignature | null;
  provenance?: RegistrySnapshotProvenance | null;
  authorityStore: RegistryTrustAuthorityStore;
  context: RegistryTrustVerificationContext;
  snapshotAdmission?: RegistrySnapshotAdmissionResult;
}>): RegistryTrustAdmissionResult {
  const snapshotAdmission =
    input.snapshotAdmission ??
    admitRegistrySnapshot(input.snapshot, input.parentSnapshot, !input.snapshot.manifest.parentSnapshotHash);

  if (!snapshotAdmission.approved) {
    return fail(
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE,
      "registry snapshot trust admission cannot proceed because 4.3I snapshot admission failed",
      input.snapshot,
    );
  }

  if (!input.signature) {
    return fail(
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE,
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_SIGNATURE_MISSING,
      input.snapshot,
    );
  }

  const authority =
    input.authorityStore.getByAuthorityId(input.signature.signedBy) ??
    input.authorityStore.getBySigningKeyId(input.signature.signingKeyId);

  const trust = verifyRegistryTrust({
    snapshot: input.snapshot,
    parentSnapshot: input.parentSnapshot,
    signature: input.signature,
    provenance: input.provenance,
    authority,
    context: input.context,
  });

  if (!trust.ok || !trust.authority || !input.provenance) {
    return fail(
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE,
      trust.failures[0]?.code ?? REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE,
      input.snapshot,
    );
  }

  const promotion = validateRegistryPromotion(input.provenance);
  if (!promotion.ok) {
    return fail(
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_TRUST_FAILURE,
      promotion.failures[0]?.code ?? REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_PATH_INVALID,
      input.snapshot,
    );
  }

  return {
    ok: true,
    snapshotId: input.snapshot.manifest.snapshotId,
    registrySnapshotHash: input.snapshot.manifest.registrySnapshotHash,
    integrityVerified: true,
    snapshotAdmissionVerified: true,
    signatureVerified: true,
    trustVerified: true,
    provenanceVerified: true,
    promotionVerified: true,
    signature: input.signature,
    provenance: input.provenance,
    authority: trust.authority,
  };
}
