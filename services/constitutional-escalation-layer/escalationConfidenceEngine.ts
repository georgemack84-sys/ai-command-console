import type { ConstitutionalEscalationEvidence, ConstitutionalEscalationError } from "@/types/constitutional-escalation-layer";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { createEscalationError } from "./escalationErrors";

export function evaluateEscalationConfidence(input: {
  monitoringModel: MonitoringTriggerModel;
  generatedAt: string;
}): Readonly<{
  confidenceTooLow: boolean;
  suggestedMinimumSeverity: ConstitutionalEscalationEvidence["suggestedMinimumSeverity"];
  errors: readonly ConstitutionalEscalationError[];
}> {
  const current = input.monitoringModel.confidenceEscalation.currentConfidenceScore;
  const previous = input.monitoringModel.confidenceEscalation.previousConfidenceScore;
  const invalid = !Number.isFinite(current) || current < 0 || current > 1;
  const confidenceTooLow = invalid || current < 0.5 || current < previous;

  return Object.freeze({
    confidenceTooLow,
    suggestedMinimumSeverity: invalid ? "E5" : confidenceTooLow ? "E2" : "E0",
    errors: Object.freeze(
      invalid
        ? [createEscalationError("ESCALATION_CONFIDENCE_MISSING", "Confidence inputs must be bounded within 0..1.", "monitoringModel.confidenceEscalation")]
        : [],
    ),
  });
}
