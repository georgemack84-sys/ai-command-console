import type { RegistryTrustErrorCode } from "@/services/registry-signatures";

export type RegistryPromotionStage =
  | "development"
  | "validation"
  | "staging"
  | "production";

export type RegistrySnapshotProvenance = Readonly<{
  snapshotId: string;
  registrySnapshotHash: string;
  parentSnapshotId?: string;
  parentSnapshotHash?: string;
  promotionStage: RegistryPromotionStage;
  previousPromotionStage?: RegistryPromotionStage;
  approvedBy?: string;
  approvalChainHash?: string;
  governanceSnapshotHash?: string;
  signedBy: string;
  rollback?: boolean;
  explicitPromotionApproval?: boolean;
}>;

export type RegistryProvenanceVerificationFailure = Readonly<{
  code: RegistryTrustErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type RegistryProvenanceVerificationResult = Readonly<{
  ok: boolean;
  failures: readonly RegistryProvenanceVerificationFailure[];
}>;

export type RegistryPromotionValidationResult = Readonly<{
  ok: boolean;
  failures: readonly RegistryProvenanceVerificationFailure[];
}>;

