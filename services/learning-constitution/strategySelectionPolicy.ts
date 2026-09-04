import type { StrategySelectionPolicy } from "../../types/learning-constitution/strategySelectionEngine";

/** Versioned default policy. Deployments may replace this with an approved configuration source. */
export const DEFAULT_STRATEGY_SELECTION_POLICY: StrategySelectionPolicy = Object.freeze({
  policyVersion: "phase40-policy@1",
  minimumClassificationConfidence: 0.75,
  minimumEvidenceByRisk: { LOW: "NONE", MEDIUM: "PRELIMINARY", HIGH: "SUPPORTED", SECURITY_CRITICAL: "SUPPORTED" },
  weights: { objectiveFit: 1.2, historicalEffectiveness: 0.8, transfer: 1.1, retention: 1.1, learnerCompatibility: 0.8, evidenceStrength: 0.7, timeCost: 0.1, tokenCost: 0.05, toolCost: 0.05, failureRisk: 0.8 },
  exploration: { allowedRisk: "LOW", maximumCandidateScoreDelta: 5, requiresBaseline: true },
} satisfies StrategySelectionPolicy);
