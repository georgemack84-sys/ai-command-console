import { ConstitutionalResilienceState } from "./constitutionalResilienceEngine";

export function determineContinuityMode(input: {
  resilienceState: ConstitutionalResilienceState;
  continuityConfidence: number;
  survivabilityProjection: number;
  uncertaintyLevel: number;
  blockedReasons: string[];
}) {
  if (input.blockedReasons.length > 0 || input.uncertaintyLevel >= 0.6) {
    return "GOVERNANCE_PROTECTED" as const;
  }
  if ([ConstitutionalResilienceState.CONSTITUTIONAL_EMERGENCY, ConstitutionalResilienceState.FROZEN].includes(input.resilienceState)) {
    return ConstitutionalResilienceState.FROZEN;
  }
  if (input.continuityConfidence < 0.55 || input.survivabilityProjection < 0.55) {
    return ConstitutionalResilienceState.CONTINUITY_ACTIVE;
  }
  return input.resilienceState;
}
