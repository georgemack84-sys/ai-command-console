import { hashFailurePayload } from "@/services/failure-orchestration";
import { certifyProductionSurvivability } from "./survivabilityCertificationEngine";
import { validateProductionReplayTrust } from "./replayTrustValidator";
import { validateGovernanceContinuity } from "./governanceContinuityValidator";
import { buildComplianceEvidenceBundle } from "./complianceEvidenceEngine";
import { verifyProductionTrustAuthority } from "./productionTrustAuthority";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionReadinessInput,
  type ProductionReadinessResult,
  type ProductionTrustError,
} from "./productionTrustTypes";

export function evaluateProductionReadiness(
  input: ProductionReadinessInput,
): ProductionReadinessResult {
  const registryHash = input.snapshot.manifest.registrySnapshotHash;
  const productionTrustId = hashFailurePayload("EVIDENCE_BUNDLE", {
    registryHash,
    certificationHash: input.certification.certificationHash,
  });

  const replayValidation = validateProductionReplayTrust({
    registryHash,
    replayHash: input.runtimeValidation.attestation.attestationHash,
    replayEligible: input.snapshot.manifest.replayEligible,
    attestationValid: input.runtimeValidation.attestation.valid,
    currentRegistryHash: input.currentRegistryHash,
    currentReplayHash: input.currentReplayHash,
    liveRegistryFallbackDetected: false,
  });
  const governanceValidation = validateGovernanceContinuity({
    governanceHash: input.snapshot.manifest.governanceHash,
    governanceEntries: Object.keys(input.snapshot.content.governance),
    approvalChainHash: input.attestationApprovalChainHash,
    policyMutationDetected: input.currentGovernanceHash !== undefined && input.currentGovernanceHash !== input.snapshot.manifest.governanceHash,
    bypassDetected: input.failureState.signals.some((signal) => signal.domain === "governance"),
    unknownAuthority: input.authorityStatus !== "known",
    directRuntimeAuthorization: false,
  });
  const survivabilityValidation = certifyProductionSurvivability({
    failureState: input.failureState,
    trustCertification: input.trustCertification,
  });

  const integrityVerified =
    input.trustedSnapshotAdmission.ok &&
    input.currentIntegrityHash !== undefined
      ? input.currentIntegrityHash === input.certification.integrityHash
      : input.trustedSnapshotAdmission.ok;
  const authority = verifyProductionTrustAuthority({
    certification: input.certification,
    currentTime: input.currentTime,
    authorityId: input.authorityId,
    authorityStatus: input.authorityStatus,
    expectedRegistryHash: registryHash,
    expectedReplayHash: input.runtimeValidation.attestation.attestationHash,
    expectedGovernanceHash: input.snapshot.manifest.governanceHash,
    expectedIntegrityHash: input.certification.integrityHash,
    revoked: Boolean(input.revocation),
    adversarialValidationPresent: input.trustCertification.certified,
  });

  const errors: ProductionTrustError[] = [
    ...replayValidation.errors,
    ...governanceValidation.errors,
    ...survivabilityValidation.errors,
  ];

  if (!integrityVerified) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_INTEGRITY_FAILURE,
      message: "integrity verification failed",
      path: "currentIntegrityHash",
    });
  }
  if (!input.runtimeValidation.bindingCompatibility.valid || !input.runtimeValidation.certification.valid) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.TOOL_RUNTIME_UNSUPPORTED,
      message: "runtime is not supported for production trust",
      path: "runtimeValidation",
    });
  }
  for (const failure of input.runtimeValidation.failures) {
    const failureCode = String(failure.code);
    if (
      failureCode === PRODUCTION_TRUST_ERROR_CODES.TOOL_RESOLUTION_AMBIGUOUS ||
      failureCode === PRODUCTION_TRUST_ERROR_CODES.TOOL_CAPABILITY_VIOLATION ||
      failureCode === PRODUCTION_TRUST_ERROR_CODES.TOOL_POLICY_INVALID
    ) {
      errors.push({
        code: failureCode as typeof PRODUCTION_TRUST_ERROR_CODES.TOOL_RESOLUTION_AMBIGUOUS
          | typeof PRODUCTION_TRUST_ERROR_CODES.TOOL_CAPABILITY_VIOLATION
          | typeof PRODUCTION_TRUST_ERROR_CODES.TOOL_POLICY_INVALID,
        message: failure.message,
        path: failure.path,
        expected: failure.expected,
        actual: failure.actual,
      });
    }
  }
  if (!input.trustCertification.certified) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_CERTIFICATION_FAILED,
      message: "adversarial validation did not certify trust",
      path: "trustCertification",
    });
  }
  if (!authority.trusted && authority.error) {
    errors.push(authority.error);
  }
  if (input.autonomousDeploymentRequested) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.AUTONOMOUS_DEPLOYMENT_DENIED,
      message: "autonomous deployment may not self-authorize",
      path: "autonomousDeploymentRequested",
    });
  }

  const status: ProductionReadinessResult["status"] =
    input.revocation
      ? "revoked"
      : errors.length > 0
        ? input.certification.expiresAt <= input.currentTime
          ? "requires_recertification"
          : "denied"
        : "certified";

  const evidence = buildComplianceEvidenceBundle({
    productionTrustId,
    certificationId: input.certification.certificationId,
    registryHash,
    certificationHash: input.certification.certificationHash,
    replayValidation: { valid: replayValidation.valid, hash: replayValidation.replayHash },
    governanceValidation: { valid: governanceValidation.valid, hash: governanceValidation.governanceHash },
    integrityValidation: { valid: integrityVerified, hash: input.certification.integrityHash },
    adversarialValidation: { valid: input.trustCertification.certified, hash: input.trustCertification.resultHash },
    survivabilityValidation: { valid: survivabilityValidation.valid, hash: survivabilityValidation.survivabilityHash },
    revocationStatus: status,
    forensicTimelineHash: input.harnessResults[0]?.evidence.timelineHash ?? hashFailurePayload("EVIDENCE_BUNDLE", { none: true }),
    generatedAt: input.currentTime,
  });

  return {
    certified: errors.length === 0 && status === "certified",
    status,
    productionTrustId,
    registryHash,
    certificationHash: input.certification.certificationHash,
    replayVerified: replayValidation.valid,
    governanceVerified: governanceValidation.valid,
    integrityVerified,
    survivabilityVerified: survivabilityValidation.valid,
    adversarialValidationPassed: input.trustCertification.certified,
    failClosedVerified: input.harnessResults.every(
      (result) =>
        result.actualOutcome === result.expectedOutcome &&
        result.deterministic &&
        result.replaySafe,
    ),
    errors,
    evidence,
  };
}
