import { buildEscalationAuditRecord } from "./escalationAudit";
import { resolveEscalationConflicts } from "./escalationConflictResolver";
import { deriveEscalationLineage } from "./escalationLineage";
import { evaluateEscalationPolicy } from "./escalationPolicies";
import { evaluateEscalationRules } from "./escalationRules";
import { buildEscalationTelemetry } from "./escalationTelemetry";
import { evaluateEscalationThresholds } from "./escalationThresholds";
import type { EscalationCoordinationInput, EscalationCoordinationResult, EscalationCoordinationState } from "./contracts/escalationTypes";
import { requireEscalationVisibility } from "./escalationVisibility";
import { clampMetric } from "../stability/stabilityMetrics";

function deriveEscalationState({
  blocked,
  frozen,
  disputed,
  emergency,
  containment,
}: {
  blocked: boolean;
  frozen: boolean;
  disputed: boolean;
  emergency: boolean;
  containment: boolean;
}): EscalationCoordinationState["escalationState"] {
  if (blocked) return "BLOCKED";
  if (frozen) return "FROZEN";
  if (disputed) return "DISPUTED";
  if (emergency) return "EMERGENCY";
  if (containment) return "CONTAINED";
  return "ESCALATED";
}

export function coordinateEscalation(input: EscalationCoordinationInput): EscalationCoordinationResult {
  const rules = evaluateEscalationRules(input);
  const thresholds = evaluateEscalationThresholds(input.stabilityAssessment);
  const policy = evaluateEscalationPolicy({
    requestedType: input.requestedType === thresholds.recommendedType ? input.requestedType : thresholds.recommendedType,
    stabilityAssessment: input.stabilityAssessment,
  });
  const lineage = deriveEscalationLineage({
    input,
    existingEscalations: input.existingEscalations,
  });
  const conflicts = resolveEscalationConflicts({
    requestedType: input.requestedType,
    existingEscalations: input.existingEscalations,
  });
  const visibility = requireEscalationVisibility({
    escalationType: policy.escalationType,
    blocked: rules.blocked,
  });

  const blocked = rules.blocked || lineage.loopDetected;
  const frozen = rules.frozen || conflicts.frozen;
  const disputed = rules.disputed || input.stabilityAssessment.disputed;
  const escalationId = `escalation_${String(input.executionId || "system").toLowerCase()}_${policy.escalationType}_${input.timestamp}`;

  const state: EscalationCoordinationState = {
    escalationId,
    escalationType: policy.escalationType,
    escalationState: deriveEscalationState({
      blocked,
      frozen,
      disputed,
      emergency: policy.emergency,
      containment: policy.requiresContainment,
    }),
    escalationSeverity: policy.escalationSeverity,
    escalationSource: input.source,
    escalationReason: input.reason,
    evidence: [...input.evidence],
    escalationLineageId: lineage.escalationLineageId,
    parentEscalationId: lineage.parentEscalationId,
    conflictingEscalations: conflicts.conflictingEscalations,
    requiresContainment: policy.requiresContainment,
    requiresOperatorVisibility: visibility.requiresOperatorVisibility,
    frozen,
    blocked,
    blockReason: blocked ? Array.from(new Set([...rules.reasons, ...(lineage.loopDetected ? ["ESCALATION_LOOP_BLOCKED"] : [])])).join(",") : undefined,
    recommendedActions: Array.from(new Set([
      ...policy.recommendedActions,
      ...thresholds.reasons.map((reason) => `REVIEW_${reason.toUpperCase()}`),
    ])),
    confidence: clampMetric(
      (
        input.stabilityAssessment.confidence
        + input.stabilityAssessment.continuityConfidence
        + (blocked ? 0.05 : 0.25)
      ) / 2.25,
      0.3,
    ),
    timestamp: input.timestamp,
  };

  const audit = buildEscalationAuditRecord(state);
  const telemetryEvents = buildEscalationTelemetry(state);

  if (conflicts.conflictingEscalations.length > 0) {
    telemetryEvents.push({
      eventType: "escalation.conflict.detected",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  }
  if (lineage.loopDetected) {
    telemetryEvents.push({
      eventType: "escalation.loop_blocked",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  }

  return {
    ok: !blocked,
    state,
    audit,
    telemetryEvents,
  };
}
