import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateRecommendationReplay(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("fabricatedlineage") || normalized.includes("fabricatedevidence") || normalized.includes("confidencespoofing")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RECOMMENDATION_REPLAY_FAILURE",
      message: "Fabricated lineage, evidence, or confidence spoofing markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
