import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import type {
  RegistryPromotionStage,
  RegistryPromotionValidationResult,
  RegistryProvenanceVerificationFailure,
  RegistrySnapshotProvenance,
} from "./registryProvenanceTypes";

const STAGE_ORDER: readonly RegistryPromotionStage[] = [
  "development",
  "validation",
  "staging",
  "production",
];

function failure(
  code: RegistryProvenanceVerificationFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistryProvenanceVerificationFailure {
  return { code, message, path, expected, actual };
}

function isKnownStage(stage: string | undefined): stage is RegistryPromotionStage {
  return Boolean(stage && STAGE_ORDER.includes(stage as RegistryPromotionStage));
}

export function validateRegistryPromotion(
  provenance?: RegistrySnapshotProvenance | null,
): RegistryPromotionValidationResult {
  const failures: RegistryProvenanceVerificationFailure[] = [];

  if (!provenance) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_MISSING,
        "registry snapshot provenance is required for promotion validation",
        "provenance",
      ),
    );
    return { ok: false, failures };
  }

  if (!isKnownStage(provenance.promotionStage)) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_STAGE_INVALID,
        "registry snapshot promotion stage is invalid",
        "provenance.promotionStage",
        STAGE_ORDER,
        provenance.promotionStage,
      ),
    );
    return { ok: false, failures };
  }

  if (provenance.previousPromotionStage !== undefined && !isKnownStage(provenance.previousPromotionStage)) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_STAGE_INVALID,
        "registry snapshot previous promotion stage is invalid",
        "provenance.previousPromotionStage",
        STAGE_ORDER,
        provenance.previousPromotionStage,
      ),
    );
    return { ok: false, failures };
  }

  if (!provenance.previousPromotionStage) {
    if (provenance.promotionStage === "production" && !provenance.approvalChainHash) {
      failures.push(
        failure(
          REGISTRY_TRUST_ERROR_CODES.REGISTRY_APPROVAL_CHAIN_MISSING,
          "registry snapshot promotion to production requires an approval chain hash",
          "provenance.approvalChainHash",
        ),
      );
      return { ok: false, failures };
    }
    return { ok: failures.length === 0, failures };
  }

  const previousIndex = STAGE_ORDER.indexOf(provenance.previousPromotionStage);
  const nextIndex = STAGE_ORDER.indexOf(provenance.promotionStage);

  if (provenance.promotionStage === "production" && !provenance.approvalChainHash) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_APPROVAL_CHAIN_MISSING,
        "registry snapshot promotion to production requires an approval chain hash",
        "provenance.approvalChainHash",
      ),
    );
    return { ok: false, failures };
  }

  if (nextIndex === previousIndex + 1) {
    return { ok: true, failures };
  }

  if (
    provenance.previousPromotionStage === "development" &&
    provenance.promotionStage === "production" &&
    provenance.explicitPromotionApproval &&
    provenance.approvalChainHash
  ) {
    return { ok: true, failures };
  }

  if (
    provenance.previousPromotionStage === "staging" &&
    provenance.promotionStage === "development" &&
    provenance.rollback
  ) {
    return { ok: true, failures };
  }

  failures.push(
    failure(
      REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROMOTION_PATH_INVALID,
      "registry snapshot promotion path is not allowed",
      "provenance.promotionStage",
      `${provenance.previousPromotionStage} -> ${provenance.promotionStage}`,
    ),
  );

  return { ok: false, failures };
}
