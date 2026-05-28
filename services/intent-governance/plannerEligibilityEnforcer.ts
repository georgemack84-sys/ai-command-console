import type { GovernedIntent } from "@/types/governedIntent";

export function enforcePlannerEligibility(governedIntent: GovernedIntent) {
  return (
    governedIntent.semanticValid
    && governedIntent.governanceApproved
    && governedIntent.replaySafe
    && governedIntent.freezeSafe
    && governedIntent.ambiguityResolved
    && governedIntent.unsafeAssumptionsDetected === false
    && governedIntent.protectedTargetValidated
    && governedIntent.plannerEligible
  );
}
