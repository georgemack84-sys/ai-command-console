import type { LearningObjectiveProfile, SelectionOutcome, StrategyOverride, StrategySelectionComparison, StrategySelectionRecord } from "../../types/learning-constitution/strategySelectionEngine";
const names = ["IMMEDIATE_ACCURACY", "NOVEL_ACCURACY", "RETENTION_ACCURACY", "CALIBRATION_ERROR", "ELAPSED_TIME_MINUTES", "TOKEN_COST", "TOOL_COST", "FAILURE_RATE"] as const;
const mean = (values: readonly number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
const aggregate = (outcomes: readonly SelectionOutcome[]) => ({
  sampleSize: outcomes.length,
  metrics: Object.fromEntries(names.map((name) => [name, mean(outcomes.flatMap((outcome) => outcome.metrics
    .filter((metric) => metric.metric === name && metric.availability === "OBSERVED" && metric.value !== null)
    .map((metric) => metric.value!)))])),
});
/** Read-only, cohort-limited comparison of teacher overrides and system recommendations. It never asserts causation. */
export class StrategySelectionComparisonAnalyticsService {
  compare(input: Readonly<{ profile: LearningObjectiveProfile; selection: StrategySelectionRecord; overrides: readonly StrategyOverride[]; outcomes: readonly SelectionOutcome[] }>): StrategySelectionComparison {
    const valid = input.outcomes.filter((outcome) => outcome.selectionId === input.selection.selectionId && outcome.status === "COMPLETE" && !outcome.invalidEvidenceIds.length); const overrideIds = new Set(input.overrides.filter((item) => item.selectionId === input.selection.selectionId).map((item) => item.overrideId)); const system = valid.filter((outcome) => outcome.overrideId === null && outcome.strategyId === input.selection.selectedStrategyId); const humanOverride = valid.filter((outcome) => outcome.overrideId !== null && overrideIds.has(outcome.overrideId)); const count = system.length + humanOverride.length; const confidence = count < 3 ? "INSUFFICIENT" : count < 8 ? "EXPERIMENTAL" : count < 25 ? "PRELIMINARY" : "SUPPORTED";
    return { cohort: { primaryType: input.profile.primaryType, risk: input.profile.risk, currentMastery: input.profile.currentMastery }, system: aggregate(system), humanOverride: aggregate(humanOverride), confidence, interpretation: "OBSERVED_ASSOCIATION", causalClaim: false, reasons: ["Only complete, non-invalid outcomes for this single objective profile are included.", `${system.length} system-recommended and ${humanOverride.length} human-override outcomes are available.`, confidence === "INSUFFICIENT" ? "Insufficient evidence for comparative inference." : "Comparison is observational and does not establish causal superiority."] };
  }
}
