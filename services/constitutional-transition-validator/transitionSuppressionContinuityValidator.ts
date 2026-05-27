import type { ConstitutionalTransitionInput } from "./types/constitutionalTransitionTypes";

const ALLOWED_SUPPRESSED_STATES = new Set(["frozen", "revoked", "rejected", "blocked", "denied", "audited"]);

export function validateSuppressionContinuity(input: ConstitutionalTransitionInput): boolean {
  if (!input.operatorAuthorityResult.suppression.suppressed) {
    return true;
  }
  if (!input.operatorAuthorityResult.suppression.continuityInvalidated) {
    return false;
  }
  return ALLOWED_SUPPRESSED_STATES.has(input.targetState);
}
