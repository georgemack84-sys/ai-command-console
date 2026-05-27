import { clampMetric } from "../stability/stabilityMetrics";
import type { ConstitutionalResilienceAssessment, ResilienceTelemetryEvent, StabilizationEvaluation } from "./resilienceTypes";

export function buildStabilizationTelemetry({
  resilience,
  stabilization,
}: {
  resilience: ConstitutionalResilienceAssessment;
  stabilization: StabilizationEvaluation;
}): ResilienceTelemetryEvent[] {
  return [
    {
      eventType: "resilience.stabilization_confidence",
      value: clampMetric(stabilization.stabilizationConfidence, 1),
      timestamp: resilience.generatedAt,
    },
    {
      eventType: "resilience.collapse_probability",
      value: clampMetric(resilience.collapseProbability, 1),
      timestamp: resilience.generatedAt,
    },
  ];
}
