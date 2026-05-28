import { hashFailurePayload } from "@/services/failure-orchestration";
import type { FailureOrchestrationResult } from "@/services/failure-orchestration";
import type { TrustCertificationResult } from "@/services/enforcement-test-harness";
import { verifyFailureSnapshotIntegrity } from "@/services/enforcement-test-harness";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionTrustError,
  type SurvivabilityCertificationResult,
} from "./productionTrustTypes";

export function certifyProductionSurvivability(input: {
  failureState: FailureOrchestrationResult;
  trustCertification: TrustCertificationResult;
}): SurvivabilityCertificationResult {
  const errors: ProductionTrustError[] = [];
  const snapshotVerification = verifyFailureSnapshotIntegrity(input.failureState);

  if (!input.failureState.survivability.telemetryOperational
    || !input.failureState.survivability.auditOperational
    || !input.failureState.survivability.recoveryOperational
    || !input.failureState.survivability.operatorVisibilityOperational) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.RECOVERY_VALIDATION_FAILED,
      message: "survivability signals are not fully operational",
      path: "failureState.survivability",
    });
  }
  if (input.failureState.recovery.allowed && input.failureState.recovery.governanceReapprovalRequired) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.RECOVERY_VALIDATION_FAILED,
      message: "recovery bypassed staged governance re-approval",
      path: "failureState.recovery",
    });
  }
  if (input.failureState.rehydration.allowed) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.RECOVERY_VALIDATION_FAILED,
      message: "trust rehydration may not self-authorize during certification",
      path: "failureState.rehydration",
    });
  }
  if (!snapshotVerification.valid) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.RECOVERY_VALIDATION_FAILED,
      message: "failure snapshot is not hash stable",
      path: "failureState.snapshot",
    });
  }
  if (!input.trustCertification.certified) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.REGISTRY_CERTIFICATION_FAILED,
      message: "adversarial certification is not trusted",
      path: "trustCertification",
    });
  }

  return {
    valid: errors.length === 0,
    survivabilityHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      survivabilityHash: input.failureState.survivability.survivabilityHash,
      snapshotHash: input.failureState.snapshot.snapshotHash,
      trustCertificationHash: input.trustCertification.resultHash,
    }),
    errors,
  };
}
