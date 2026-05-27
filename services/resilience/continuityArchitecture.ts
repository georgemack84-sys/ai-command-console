import { ConstitutionalResilienceState, type ConstitutionalResilienceAssessment } from "./constitutionalResilienceEngine";
import { determineContinuityMode } from "./continuityPolicies";

export type ContinuityArchitecture = {
  mode: ConstitutionalResilienceState | "GOVERNANCE_PROTECTED";
  protectedDomains: string[];
  frozenDomains: string[];
  isolatedDomains: string[];
  continuityPreserved: boolean;
};

export function buildContinuityArchitecture(input: {
  assessment: ConstitutionalResilienceAssessment;
  survivabilityCard: {
    continuityConfidence: number;
  };
  strategicForecast: {
    survivabilityProjection: number;
    uncertaintyLevel: number;
  };
  blockedReasons: string[];
}) : ContinuityArchitecture {
  const mode = determineContinuityMode({
    resilienceState: input.assessment.resilienceState,
    continuityConfidence: input.survivabilityCard.continuityConfidence,
    survivabilityProjection: input.strategicForecast.survivabilityProjection,
    uncertaintyLevel: input.strategicForecast.uncertaintyLevel,
    blockedReasons: input.blockedReasons,
  });

  return {
    mode,
    protectedDomains: input.assessment.survivableDomains,
    frozenDomains: mode === "GOVERNANCE_PROTECTED" || mode === ConstitutionalResilienceState.FROZEN
      ? Array.from(new Set([...input.assessment.failingDomains, ...input.assessment.isolatedDomains]))
      : input.assessment.failingDomains,
    isolatedDomains: input.assessment.isolatedDomains,
    continuityPreserved: input.survivabilityCard.continuityConfidence >= 0.55 && input.strategicForecast.uncertaintyLevel < 0.6,
  };
}
