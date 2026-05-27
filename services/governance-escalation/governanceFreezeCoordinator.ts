import type { CoordinationRiskProfile } from "@/types/escalation-aware-coordination";

export function shouldFreezeForGovernance(input: {
  risk: CoordinationRiskProfile;
  errorCodes: readonly string[];
}): boolean {
  return input.risk.freezeRequired
    || input.errorCodes.some((code) =>
      code.includes("REPLAY_AMBIGUITY")
      || code.includes("CONTAINMENT_BYPASS")
      || code.includes("SYNTHETIC_CONTINUITY")
      || code.includes("GOVERNANCE_MISMATCH"));
}
