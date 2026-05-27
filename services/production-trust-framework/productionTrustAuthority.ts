import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionCertificationRecord,
  type ProductionTrustAuthorityResult,
} from "./productionTrustTypes";

export function verifyProductionTrustAuthority(input: {
  certification?: ProductionCertificationRecord;
  currentTime: string;
  authorityId: string;
  authorityStatus: "known" | "unknown";
  expectedRegistryHash: string;
  expectedReplayHash: string;
  expectedGovernanceHash: string;
  expectedIntegrityHash: string;
  revoked?: boolean;
  adversarialValidationPresent: boolean;
}): ProductionTrustAuthorityResult {
  if (!input.certification) {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_CERTIFICATION_FAILED,
        message: "production certification is missing",
        path: "certification",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", { missing: true }),
    };
  }
  if (input.certification.expiresAt < input.currentTime) {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.CERTIFICATION_EXPIRED,
        message: "production certification is expired",
        path: "certification.expiresAt",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", { expired: true }),
    };
  }
  if (input.revoked || input.certification.certificationStatus === "revoked") {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.DEPLOYMENT_TRUST_REVOKED,
        message: "production certification is revoked",
        path: "certification.certificationStatus",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", { revoked: true }),
    };
  }
  if (input.authorityStatus !== "known") {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.CERTIFICATION_AUTHORITY_UNKNOWN,
        message: "certification authority is unknown",
        path: "authorityStatus",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", { authorityStatus: input.authorityStatus }),
    };
  }
  if (!input.adversarialValidationPresent) {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_CERTIFICATION_FAILED,
        message: "adversarial validation evidence is missing",
        path: "adversarialValidationPresent",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", { adversarialValidationPresent: false }),
    };
  }
  if (input.certification.registryHash !== input.expectedRegistryHash
    || input.certification.replayHash !== input.expectedReplayHash
    || input.certification.governanceHash !== input.expectedGovernanceHash
    || input.certification.integrityHash !== input.expectedIntegrityHash
    || input.certification.certificationStatus !== "certified") {
    return {
      trusted: false,
      error: {
        code: PRODUCTION_TRUST_ERROR_CODES.CERTIFICATION_SIGNATURE_INVALID,
        message: "certification content does not match current trusted evidence",
        path: "certification",
      },
      resultHash: hashFailurePayload("EVIDENCE_BUNDLE", {
        certificationHash: input.certification.certificationHash,
        authorityId: input.authorityId,
      }),
    };
  }

  return {
    trusted: true,
    resultHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      authorityId: input.authorityId,
      certificationHash: input.certification.certificationHash,
    }),
  };
}
