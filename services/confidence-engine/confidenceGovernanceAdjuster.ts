import type { DeterministicConfidenceInput } from "./types/confidenceTypes";

export function applyConfidenceGovernanceAdjustment(input: {
  rawScore: number;
  engineInput: DeterministicConfidenceInput;
}): number {
  const governanceStatus = input.engineInput.proposalGovernanceBindingResult.status;
  const enforcementStatus = input.engineInput.constitutionalEnforcementResult.status;

  let multiplier = 1;
  if (governanceStatus === "FROZEN" || enforcementStatus === "FROZEN") {
    multiplier = 0.7;
  } else if (governanceStatus === "REVOKED" || governanceStatus === "INVALID" || governanceStatus === "FAILED_CLOSED") {
    multiplier = 0.5;
  }

  return Number(Math.max(0, Math.min(1, input.rawScore * multiplier)).toFixed(3));
}
