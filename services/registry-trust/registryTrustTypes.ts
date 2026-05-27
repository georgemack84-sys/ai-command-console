import type {
  RegistryTrustErrorCode,
  RegistrySnapshotSignature,
} from "@/services/registry-signatures";
import type {
  RegistryPromotionStage,
  RegistrySnapshotProvenance,
} from "@/services/registry-provenance";

export type RegistryTrustEnvironment =
  | "development"
  | "validation"
  | "staging"
  | "production";

export type RegistryTrustScope = "registry-snapshot-signing";

export type RegistryTrustAuthorityStatus = "active" | "inactive" | "revoked";

export type RegistryTrustAuthority = Readonly<{
  authorityId: string;
  signingKeyId: string;
  status: RegistryTrustAuthorityStatus;
  allowedEnvironments: readonly RegistryTrustEnvironment[];
  allowedPromotionStages: readonly RegistryPromotionStage[];
  allowedTrustScopes: readonly RegistryTrustScope[];
}>;

export type RegistryTrustVerificationFailure = Readonly<{
  code: RegistryTrustErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type RegistryTrustVerificationContext = Readonly<{
  environment: RegistryTrustEnvironment;
  promotionStage: RegistryPromotionStage;
  trustScope: RegistryTrustScope;
}>;

export type RegistryTrustVerificationResult = Readonly<{
  ok: boolean;
  authority?: RegistryTrustAuthority;
  failures: readonly RegistryTrustVerificationFailure[];
}>;

export type RegistryTrustAdmissionFailure = Readonly<{
  code: RegistryTrustErrorCode;
  reason: string;
  snapshotId?: string;
  registrySnapshotHash?: string;
  blockingCode?: RegistryTrustErrorCode;
}>;

export type RegistryTrustAdmissionSuccess = Readonly<{
  ok: true;
  snapshotId: string;
  registrySnapshotHash: string;
  integrityVerified: true;
  snapshotAdmissionVerified: true;
  signatureVerified: true;
  trustVerified: true;
  provenanceVerified: true;
  promotionVerified: true;
  signature: RegistrySnapshotSignature;
  provenance: RegistrySnapshotProvenance;
  authority: RegistryTrustAuthority;
}>;

export type RegistryTrustAdmissionResult =
  | RegistryTrustAdmissionSuccess
  | Readonly<{
      ok: false;
      code: RegistryTrustErrorCode;
      reason: string;
      snapshotId?: string;
      registrySnapshotHash?: string;
      blockingCode: RegistryTrustErrorCode;
    }>;

