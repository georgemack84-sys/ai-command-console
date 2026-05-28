import { clampMetric } from "../stability/stabilityMetrics";
import type { ContinuityConvergenceInput } from "./convergenceTypes";

export type ConvergenceCorrelationResult = {
  continuityConfidence: number;
  replayConfidence: number;
  survivabilityConfidence: number;
  escalationStabilityConfidence: number;
  reasons: string[];
};

export function correlateConvergenceSignals(input: ContinuityConvergenceInput): ConvergenceCorrelationResult {
  const continuityConfidence = clampMetric(input.continuity?.continuityConfidence, 0.3);
  const replayConfidence = clampMetric(1 - (input.stability?.replayInstabilityScore || 0), 0.35);
  const survivabilityConfidence = clampMetric(input.stability?.survivabilityScore, 0.3);
  const escalationStabilityConfidence = clampMetric(
    (input.escalation?.blocked || input.escalation?.frozen)
      ? 0.25
      : 1 - (input.stability?.escalationPressure || 0),
    0.35,
  );

  return {
    continuityConfidence,
    replayConfidence,
    survivabilityConfidence,
    escalationStabilityConfidence,
    reasons: Array.from(new Set([
      ...(input.stability?.disputed ? ["stability_disputed"] : []),
      ...(input.escalation?.blocked ? ["escalation_blocked"] : []),
      ...(input.escalation?.frozen ? ["escalation_frozen"] : []),
      ...(input.verification?.disputed ? ["verification_disputed"] : []),
    ])),
  };
}
