import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ContinuousTrustMonitorResult,
  type ProductionCertificationRecord,
} from "./productionTrustTypes";

export function monitorProductionTrust(input: {
  certification: ProductionCertificationRecord;
  currentTime: string;
  driftDetected: boolean;
  registryDrift?: boolean;
  governanceDrift?: boolean;
  replayDrift?: boolean;
  integrityDrift?: boolean;
  runtimeCompatibilityDrift?: boolean;
  revoked?: boolean;
}): ContinuousTrustMonitorResult {
  let recommendation: ContinuousTrustMonitorResult["recommendation"] = "continue";
  let errorCode: ContinuousTrustMonitorResult["errorCode"];
  if (input.revoked) {
    recommendation = "deny";
    errorCode = PRODUCTION_TRUST_ERROR_CODES.DEPLOYMENT_TRUST_REVOKED;
  } else if (input.driftDetected || input.registryDrift || input.governanceDrift || input.replayDrift || input.integrityDrift || input.runtimeCompatibilityDrift) {
    recommendation = "freeze";
    errorCode = PRODUCTION_TRUST_ERROR_CODES.PRODUCTION_DRIFT_DETECTED;
  } else if (input.certification.expiresAt <= input.currentTime) {
    recommendation = "recertification";
    errorCode = PRODUCTION_TRUST_ERROR_CODES.RECERTIFICATION_REQUIRED;
  }

  return {
    healthy: recommendation === "continue",
    recommendation,
    errorCode,
    driftDetected: recommendation === "freeze",
    resultHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      recommendation,
      errorCode,
      certificationHash: input.certification.certificationHash,
    }),
  };
}
