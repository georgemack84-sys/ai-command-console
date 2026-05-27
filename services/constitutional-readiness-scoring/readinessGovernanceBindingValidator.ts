import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  ReadinessGovernanceBinding,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function validateReadinessGovernanceBinding(input: ConstitutionalReadinessInput): {
  governanceBinding: ReadinessGovernanceBinding;
  errors: readonly ConstitutionalReadinessError[];
} {
  const governanceBound =
    input.constitutionalReplayResult.replayBinding.governanceBound
    && input.humanSupremacyResult.record.governanceBound
    && input.runtimeAdmissibilityResult.governanceBinding.governanceBound;
  const supremacyBound =
    input.humanSupremacyResult.replayBinding.governanceBound
    && input.humanSupremacyResult.record.enforcementState !== "INVALID";
  const containmentBound =
    input.antiEmergenceResult.replayBinding.governanceBound
    && input.antiEmergenceResult.record.governanceBound;
  const admissibilityBound =
    input.runtimeAdmissibilityResult.governanceBinding.governanceBound
    && input.runtimeAdmissibilityResult.governanceBinding.replayBound
    && input.runtimeAdmissibilityResult.governanceCheck.governanceBound
    && !input.runtimeAdmissibilityResult.governanceCheck.detached
    && !input.runtimeAdmissibilityResult.governanceCheck.driftDetected;

  const errors: ConstitutionalReadinessError[] = [];
  if (!governanceBound || !supremacyBound || !containmentBound || !admissibilityBound) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_GOVERNANCE_BINDING_INVALID",
      message: "Governance binding chain is incomplete across readiness inputs.",
      path: "governanceBinding",
    });
  }

  return Object.freeze({
    governanceBinding: Object.freeze({
      bindingId: hashReadinessValue("constitutional-readiness-governance-binding-id", {
        readinessId: input.readinessId,
      }),
      governanceBound,
      supremacyBound,
      containmentBound,
      admissibilityBound,
      deterministicHash: hashReadinessValue("constitutional-readiness-governance-binding", {
        governanceBound,
        supremacyBound,
        containmentBound,
        admissibilityBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
