import { clampMetric } from "../stability/stabilityMetrics";
import type { ValidationOutcome } from "./types";
import { dedupeReasons } from "./validationPolicies";

export function validateEscalationSurvivability(input: {
  escalationCoordination?: Record<string, unknown>;
  loopDetected?: boolean;
}): ValidationOutcome & { operatorVisible: boolean; reliabilityScore: number; lineageIds: string[] } {
  const blockedReasons: string[] = [];
  const coordination = input.escalationCoordination || {};

  if (input.loopDetected) blockedReasons.push("escalation_loop_detected");
  if (((coordination.conflictingEscalations as unknown[]) || []).length > 0) blockedReasons.push("escalation_conflict_detected");
  if (!coordination.escalationLineageId) blockedReasons.push("missing_escalation_lineage");

  const operatorVisible = coordination.requiresOperatorVisibility !== false;
  if (!operatorVisible) blockedReasons.push("operator_visibility_lost");

  const reliabilityScore = clampMetric(
    Number(coordination.confidence ?? 0.75)
      - (input.loopDetected ? 0.35 : 0)
      - ((((coordination.conflictingEscalations as unknown[]) || []).length > 0) ? 0.2 : 0)
      - (!operatorVisible ? 0.2 : 0),
    0.05,
  );

  return {
    valid: blockedReasons.length === 0,
    freezeActivated: Boolean(input.loopDetected || ((coordination.conflictingEscalations as unknown[]) || []).length > 0 || coordination.frozen),
    containmentActivated: false,
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons: dedupeReasons(blockedReasons),
    operatorVisible,
    reliabilityScore,
    lineageIds: coordination.escalationLineageId ? [String(coordination.escalationLineageId)] : [],
  };
}
