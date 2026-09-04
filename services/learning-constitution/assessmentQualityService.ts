import { evaluateAssessmentResponse } from "./assessmentEvaluationService";
import type { AssessmentEvaluationType } from "@/types/learning-constitution";

type GoldCase = Readonly<{ id: string; evaluation_type: AssessmentEvaluationType; answer: string; rubric: Readonly<Record<string, unknown>>; expected_score: number }>;
type HumanReviewedCase = Readonly<{ id: string; deterministic_score: number; human_score: number }>;
type PracticalOutcome = Readonly<{ profile_score: number; practical_score: number }>;
type ItemObservation = Readonly<{ item_id: string; item_score: number; learner_profile_score: number; duration_seconds: number; human_score?: number }>;

const mean = (values: readonly number[]): number | null => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const correlation = (pairs: readonly Readonly<{ left: number; right: number }>[]): number | null => {
  if (pairs.length < 2) return null;
  const leftMean = mean(pairs.map((pair) => pair.left))!; const rightMean = mean(pairs.map((pair) => pair.right))!;
  const numerator = pairs.reduce((sum, pair) => sum + (pair.left - leftMean) * (pair.right - rightMean), 0);
  const leftVariance = pairs.reduce((sum, pair) => sum + (pair.left - leftMean) ** 2, 0); const rightVariance = pairs.reduce((sum, pair) => sum + (pair.right - rightMean) ** 2, 0);
  return leftVariance && rightVariance ? numerator / Math.sqrt(leftVariance * rightVariance) : null;
};

export const evaluateAssessmentGoldSet = (cases: readonly GoldCase[]) => cases.map((test) => ({ id: test.id, expected_score: test.expected_score, actual_score: evaluateAssessmentResponse({ evaluation_type: test.evaluation_type, answer: test.answer, rubric: test.rubric, rubric_version: "gold-v1" }).score })).map((result) => ({ ...result, passed: result.actual_score === result.expected_score }));
export const evaluateRubricConsistency = (cases: readonly HumanReviewedCase[]) => ({ sample_count: cases.length, mean_absolute_difference: mean(cases.map((item) => Math.abs(item.deterministic_score - item.human_score))) ?? 0, passed: (mean(cases.map((item) => Math.abs(item.deterministic_score - item.human_score))) ?? Infinity) <= 0.1 });
export const evaluateProfilePrediction = (outcomes: readonly PracticalOutcome[]) => { const value = correlation(outcomes.map((outcome) => ({ left: outcome.profile_score, right: outcome.practical_score }))); return { sample_count: outcomes.length, correlation: value, passed: outcomes.length >= 3 && value !== null && value >= 0.6 }; };

export const calculateAssessmentItemQuality = (observations: readonly ItemObservation[]) => Object.entries(observations.reduce<Record<string, ItemObservation[]>>((groups, observation) => ({ ...groups, [observation.item_id]: [...(groups[observation.item_id] ?? []), observation] }), {})).map(([item_id, entries]) => ({ item_id, sample_count: entries.length, ambiguity_rate: entries.length ? entries.filter((entry) => entry.human_score !== undefined && Math.abs(entry.item_score - entry.human_score) > 0.2).length / entries.length : 0, average_completion_seconds: mean(entries.map((entry) => entry.duration_seconds)) ?? 0, discrimination: correlation(entries.map((entry) => ({ left: entry.item_score, right: entry.learner_profile_score }))), failure_rate: entries.length ? entries.filter((entry) => entry.item_score < 0.4).length / entries.length : 0 }));

export const buildAssessmentMonitoringSnapshot = (input: Readonly<{ failed_sessions: number; scoring_errors: number; profile_calculation_regressions: number }>) => ({ ...input, healthy: input.failed_sessions === 0 && input.scoring_errors === 0 && input.profile_calculation_regressions === 0 });

export const assessAssessmentReleaseReadiness = (input: Readonly<{ gold: ReturnType<typeof evaluateAssessmentGoldSet>; consistency: ReturnType<typeof evaluateRubricConsistency>; prediction: ReturnType<typeof evaluateProfilePrediction>; monitoring: ReturnType<typeof buildAssessmentMonitoringSnapshot> }>) => ({ release_id: "assessment-engine-v1-release", passed: input.gold.every((result) => result.passed) && input.consistency.passed && input.prediction.passed && input.monitoring.healthy, checks: [{ check_id: "gold-set", passed: input.gold.every((result) => result.passed) }, { check_id: "rubric-consistency", passed: input.consistency.passed }, { check_id: "profile-prediction", passed: input.prediction.passed }, { check_id: "runtime-monitoring", passed: input.monitoring.healthy }], rollback: { flag: "assessment_engine_v1", mode: "DISABLED" } });
