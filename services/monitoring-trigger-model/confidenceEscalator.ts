import type { ConfidenceEscalation, MonitoringCautionState, MonitoringTrigger } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

function cautionFromConfidence(confidenceScore: number): MonitoringCautionState {
  if (confidenceScore <= 0.2) {
    return "frozen-recommended";
  }
  if (confidenceScore <= 0.45) {
    return "escalated";
  }
  if (confidenceScore <= 0.7) {
    return "restricted";
  }
  return "observe";
}

export function deriveConfidenceTrigger(input: {
  confidenceScore: number;
  previousConfidenceScore: number;
  createdAt: string;
  replayBindings: readonly string[];
  governanceBindings: readonly string[];
  overrideBindings: readonly string[];
  evidenceHashes: readonly string[];
  lineageHash: string;
}): { trigger: MonitoringTrigger; escalation: ConfidenceEscalation } {
  const cautionState = cautionFromConfidence(input.confidenceScore);
  const severity =
    cautionState === "frozen-recommended"
      ? "critical"
      : cautionState === "escalated"
        ? "high"
        : cautionState === "restricted"
          ? "moderate"
          : "low";

  const trigger: MonitoringTrigger = Object.freeze({
    triggerId: hashTriggerValue("monitoring-trigger-confidence-id", {
      createdAt: input.createdAt,
      confidenceScore: input.confidenceScore,
      lineageHash: input.lineageHash,
    }),
    triggerType: "confidence",
    severity,
    cautionState,
    confidenceScore: input.confidenceScore,
    replayBindings: input.replayBindings,
    governanceBindings: input.governanceBindings,
    overrideBindings: input.overrideBindings,
    evidenceHashes: input.evidenceHashes,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  const escalation: ConfidenceEscalation = Object.freeze({
    escalationId: hashTriggerValue("monitoring-trigger-confidence-escalation", {
      previousConfidenceScore: input.previousConfidenceScore,
      currentConfidenceScore: input.confidenceScore,
      createdAt: input.createdAt,
      lineageHash: input.lineageHash,
    }),
    previousConfidenceScore: input.previousConfidenceScore,
    currentConfidenceScore: input.confidenceScore,
    cautionState,
    uncertaintyAmplified: input.confidenceScore < input.previousConfidenceScore,
    evidenceHashes: input.evidenceHashes,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  return { trigger, escalation };
}
