import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionCertificationInput,
  type ProductionCertificationRecord,
  type ProductionTrustError,
} from "./productionTrustTypes";

export function createProductionCertificationRecord(
  input: ProductionCertificationInput,
): { record?: ProductionCertificationRecord; errors: readonly ProductionTrustError[] } {
  const errors: ProductionTrustError[] = [];

  if (!input.trustCertification.certified) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_CERTIFICATION_FAILED,
      message: "adversarial certification did not pass",
      path: "trustCertification",
    });
  }
  if (!input.trustedSnapshotAdmission.ok) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_INTEGRITY_FAILURE,
      message: "trusted snapshot admission failed",
      path: "trustedSnapshotAdmission",
    });
  }
  if (!input.runtimeValidation.bindingCompatibility.valid || !input.runtimeValidation.certification.valid) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.TOOL_RUNTIME_UNSUPPORTED,
      message: "runtime validation is not production-ready",
      path: "runtimeValidation",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  const registryHash = input.snapshot.manifest.registrySnapshotHash;
  const governanceHash = input.snapshot.manifest.governanceHash;
  const replayHash = input.runtimeValidation.attestation.attestationHash;
  const integrityHash = hashFailurePayload("EVIDENCE_BUNDLE", {
    manifestHash: input.snapshot.manifest.manifestHash,
    validationHash: input.runtimeValidation.validationHash,
    trustHash: input.trustedSnapshotAdmission.registrySnapshotHash,
  });

  const payload = {
    certificationId: `${registryHash}:${input.issuedAt}`,
    registryHash,
    governanceHash,
    replayHash,
    integrityHash,
    adversarialCertificationHash: input.trustCertification.resultHash,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    certifiedBy: input.certifiedBy,
    certificationStatus: "certified" as const,
  };

  return {
    record: {
      ...payload,
      certificationHash: hashFailurePayload("EVIDENCE_BUNDLE", payload),
    },
    errors,
  };
}
