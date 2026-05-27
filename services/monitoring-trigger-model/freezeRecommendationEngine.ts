import type { FreezeRecommendation, MonitoringTrigger, TriggerCorrelation } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

export function deriveFreezeRecommendations(input: {
  triggers: readonly MonitoringTrigger[];
  correlations: readonly TriggerCorrelation[];
  createdAt: string;
}): readonly FreezeRecommendation[] {
  const recommendations: FreezeRecommendation[] = [];

  for (const trigger of input.triggers) {
    if (trigger.cautionState !== "frozen-recommended") {
      continue;
    }
    const reason =
      trigger.triggerType === "replay"
        ? "replay_mismatch"
        : trigger.triggerType === "governance"
          ? "governance_uncertainty"
          : trigger.triggerType === "confidence"
            ? "confidence_collapse"
            : "integrity_drift";
    recommendations.push(Object.freeze({
      recommendationId: hashTriggerValue("monitoring-freeze-recommendation-id", {
        triggerId: trigger.triggerId,
        createdAt: input.createdAt,
      }),
      reason,
      severity: trigger.severity === "critical" ? "critical" : "high",
      evidenceHashes: trigger.evidenceHashes,
      lineageHash: trigger.lineageHash,
      createdAt: input.createdAt,
    }));
  }

  for (const correlation of input.correlations) {
    recommendations.push(Object.freeze({
      recommendationId: hashTriggerValue("monitoring-freeze-recommendation-correlation-id", {
        correlationId: correlation.correlationId,
        createdAt: input.createdAt,
      }),
      reason: "trigger_correlation",
      severity: correlation.resultingSeverity === "critical" ? "critical" : "high",
      evidenceHashes: correlation.evidenceHashes,
      lineageHash: correlation.correlationId,
      createdAt: input.createdAt,
    }));
  }

  return Object.freeze(recommendations);
}
