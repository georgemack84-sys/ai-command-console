import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionFreezeDecision,
} from "./productionTrustTypes";

export function recommendProductionFreeze(input: {
  certificationTrusted: boolean;
  registryIntegrityValid: boolean;
  replayValid: boolean;
  governanceValid: boolean;
  adversarialValidationPassed: boolean;
  runtimeSupported: boolean;
  unknownMutationDetected?: boolean;
}): ProductionFreezeDecision {
  const freeze =
    !input.certificationTrusted ||
    !input.registryIntegrityValid ||
    !input.replayValid ||
    !input.governanceValid ||
    !input.adversarialValidationPassed ||
    !input.runtimeSupported ||
    input.unknownMutationDetected === true;

  const reasonCode = freeze ? PRODUCTION_TRUST_ERROR_CODES.PRODUCTION_FREEZE_REQUIRED : undefined;
  return {
    freeze,
    reasonCode,
    reason: freeze ? "production trust is unsafe and freeze is required" : "production trust remains safe",
    freezeHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      certificationTrusted: input.certificationTrusted,
      registryIntegrityValid: input.registryIntegrityValid,
      replayValid: input.replayValid,
      governanceValid: input.governanceValid,
      adversarialValidationPassed: input.adversarialValidationPassed,
      runtimeSupported: input.runtimeSupported,
      unknownMutationDetected: input.unknownMutationDetected ?? false,
    }),
  };
}
