import type { ValidationOutcome } from "./types";
import { dedupeReasons } from "./validationPolicies";

export function validateGovernanceMutation(input: {
  runtimeMutationObserved?: boolean;
  postRoutesDetected?: boolean;
  restrictionReduced?: boolean;
  authorityGranted?: boolean;
}): ValidationOutcome {
  const blockedReasons: string[] = [];

  if (input.runtimeMutationObserved) blockedReasons.push("runtime_mutation_detected");
  if (input.postRoutesDetected) blockedReasons.push("post_route_detected");
  if (input.restrictionReduced) blockedReasons.push("restriction_downgrade_detected");
  if (input.authorityGranted) blockedReasons.push("autonomous_authority_detected");

  return {
    valid: blockedReasons.length === 0,
    freezeActivated: blockedReasons.length > 0,
    containmentActivated: false,
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons: dedupeReasons(blockedReasons),
  };
}
