import { clampMetric } from "../stability/stabilityMetrics";
import type { ValidationOutcome } from "./types";
import { dedupeReasons } from "./validationPolicies";

export function validateContainment(input: {
  convergence?: Record<string, unknown>;
  resilience?: Record<string, unknown>;
  readiness?: Record<string, unknown>;
  containmentVerified?: boolean;
}): ValidationOutcome & { containmentConfidence: number; containmentRequired: boolean } {
  const blockedReasons: string[] = [];
  const containmentRequired = Boolean(
    input.convergence?.requiresContainment
      || input.resilience?.requiresContainment
      || (Number(input.readiness?.containmentConfidence ?? 1) < 0.55),
  );

  if (input.containmentVerified === false) blockedReasons.push("containment_verification_failed");
  if (containmentRequired && Number(input.readiness?.containmentConfidence ?? 0) < 0.55) blockedReasons.push("containment_confidence_low");

  const containmentConfidence = clampMetric(
    Number(input.readiness?.containmentConfidence ?? (containmentRequired ? 0.4 : 0.8)),
    0.05,
  );

  return {
    valid: blockedReasons.length === 0,
    freezeActivated: blockedReasons.includes("containment_verification_failed"),
    containmentActivated: containmentRequired,
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons: dedupeReasons(blockedReasons),
    containmentConfidence,
    containmentRequired,
  };
}
