import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessConfidence(monitoringModel: MonitoringTriggerModel): Readonly<{
  confidenceValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const score = monitoringModel.confidenceEscalation.currentConfidenceScore;
  const confidenceValid =
    Number.isFinite(score)
    && score >= 0.6
    && !monitoringModel.confidenceEscalation.uncertaintyAmplified
    && monitoringModel.cautionState !== "frozen-recommended";

  return Object.freeze({
    confidenceValid,
    reasons: Object.freeze(
      confidenceValid ? ["Confidence remains sufficient for declarative readiness certification."] : ["Confidence collapse or uncertainty amplification requires caution."],
    ),
    errors: Object.freeze(
      confidenceValid ? [] : [createReadinessError("AUTONOMY_UNCERTAINTY_HIGH", "High uncertainty blocks constitutional readiness.", "monitoringModel.confidenceEscalation")],
    ),
  });
}
