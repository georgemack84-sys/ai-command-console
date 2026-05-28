import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  ENFORCEMENT_HARNESS_ERROR_CODES,
  type TrustCertificationInput,
  type TrustCertificationResult,
} from "./enforcementHarnessTypes";

export function certifyEnforcementTrust(
  input: TrustCertificationInput,
): TrustCertificationResult {
  const failedScenarioIds = input.results
    .filter((result) => {
      const expectedMatched = result.actualOutcome === result.expectedOutcome;
      return !expectedMatched || !result.deterministic || !result.replaySafe;
    })
    .map((result) => result.scenarioId);

  const certified = failedScenarioIds.length === 0;
  return {
    certified,
    certificationEligible: certified,
    errorCode: certified ? undefined : ENFORCEMENT_HARNESS_ERROR_CODES.CERTIFICATION_BLOCKED,
    resultHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      failedScenarioIds,
      results: input.results.map((result) => ({
        scenarioId: result.scenarioId,
        actualOutcome: result.actualOutcome,
        expectedOutcome: result.expectedOutcome,
        deterministic: result.deterministic,
        replaySafe: result.replaySafe,
      })),
    }),
    failedScenarioIds,
  };
}
