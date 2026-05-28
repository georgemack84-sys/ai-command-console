import { clampMetric } from "../stability/stabilityMetrics";
import type { ValidationOutcome } from "./types";
import { dedupeReasons } from "./validationPolicies";

export function validateReplayIntegrity(input: {
  replayVerificationState?: string;
  replayDivergenceCount?: number;
  immutableEvidenceValid?: boolean;
  simulationLineage?: string[];
  decisionForecastLineageIds?: string[];
  replayCorrupted?: boolean;
}): ValidationOutcome & { integrityConfidence: number; containmentRequired: boolean } {
  const blockedReasons: string[] = [];
  const divergenceCount = input.replayDivergenceCount ?? 0;

  if (input.replayCorrupted) blockedReasons.push("replay_corruption_detected");
  if (input.immutableEvidenceValid === false) blockedReasons.push("immutable_replay_evidence_invalid");
  if ((input.replayVerificationState || "") === "DIVERGED") blockedReasons.push("replay_divergence_detected");
  if ((input.simulationLineage?.length || 0) === 0) blockedReasons.push("missing_simulation_lineage");
  if ((input.decisionForecastLineageIds?.length || 0) === 0) blockedReasons.push("missing_decision_forecast_lineage");

  const integrityConfidence = clampMetric(
    1
      - (input.replayCorrupted ? 0.5 : 0)
      - (input.immutableEvidenceValid === false ? 0.25 : 0)
      - Math.min(divergenceCount * 0.12, 0.24)
      - ((input.simulationLineage?.length || 0) === 0 ? 0.1 : 0),
    0.05,
  );

  const containmentRequired = blockedReasons.includes("replay_divergence_detected")
    || blockedReasons.includes("replay_corruption_detected");

  return {
    valid: blockedReasons.length === 0,
    freezeActivated: blockedReasons.includes("replay_corruption_detected")
      || blockedReasons.includes("immutable_replay_evidence_invalid"),
    containmentActivated: containmentRequired,
    containmentRequired,
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons: dedupeReasons(blockedReasons),
    integrityConfidence,
  };
}
