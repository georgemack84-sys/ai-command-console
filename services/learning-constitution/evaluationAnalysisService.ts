import type { EvaluationAnalysis, EvaluationObservation, EvaluationTransferProfile } from "../../types/learning-constitution/evaluationEngine";
import type { PracticeTransferLevel } from "../../types/learning-constitution/practiceEngine";

const levels: readonly PracticeTransferLevel[] = ["EXACT", "MODIFIED", "NOVEL", "AMBIGUOUS", "EDGE", "ADVERSARIAL"];
const average = (values: readonly number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const rounded = (value: number | null) => value === null ? null : Number(value.toFixed(4));
const daysSince = (then: string, now: string) => (new Date(now).getTime() - new Date(then).getTime()) / 86_400_000;

/** Derives transparent calibration, consistency, transfer, and recency signals from valid retained observations. */
export class EvaluationAnalysisService {
  analyze(input: Readonly<{ analysisId: string; skillId: string; observations: readonly EvaluationObservation[]; analyzedAt: string }>): EvaluationAnalysis {
    const valid = input.observations.filter((item) => item.evaluation.skillId === input.skillId && item.validity.status === "VALID" && item.response.evaluationId === item.evaluation.evaluationId && item.score.evaluationId === item.evaluation.evaluationId);
    const confidencePairs = valid.filter((item) => item.response.selfReportedConfidence !== null).map((item) => ({ confidence: item.response.selfReportedConfidence!, score: item.score.overallScore }));
    const meanConfidence = average(confidencePairs.map((item) => item.confidence)); const meanObservedScore = average(confidencePairs.map((item) => item.score)); const meanAbsoluteError = average(confidencePairs.map((item) => Math.abs(item.confidence - item.score)));
    const calibrationState = confidencePairs.length < 3 ? "INSUFFICIENT_EVIDENCE" : meanAbsoluteError! <= 0.1 ? "WELL_CALIBRATED" : meanConfidence! > meanObservedScore! ? "OVERCONFIDENT" : "UNDERCONFIDENT";
    const scores = valid.map((item) => item.score.overallScore); const scoreRange = scores.length ? Math.max(...scores) - Math.min(...scores) : null; const difficulties = valid.map((item) => item.evaluation.difficulty); const difficultyRange = difficulties.length ? Math.max(...difficulties) - Math.min(...difficulties) : null;
    const consistencyState = valid.length < 3 ? "INSUFFICIENT_EVIDENCE" : scoreRange! <= 0.15 ? "CONSISTENT" : "VARIABLE";
    const transfer = Object.fromEntries(levels.map((level) => { const values = valid.filter((item) => item.transferLevel === level).map((item) => item.score.overallScore); return [level, { sampleSize: values.length, meanScore: rounded(average(values)) }]; })) as EvaluationTransferProfile;
    const lastValidEvidenceAt = valid.map((item) => item.score.scoredAt).sort().at(-1) ?? null; const age = lastValidEvidenceAt ? daysSince(lastValidEvidenceAt, input.analyzedAt) : null;
    const recency = age === null ? "NO_VALID_EVIDENCE" : age <= 30 ? "CURRENT" : age <= 90 ? "AGING" : age <= 180 ? "STALE" : "REVALIDATION_REQUIRED";
    return { analysisId: input.analysisId, skillId: input.skillId, calibration: { sampleSize: confidencePairs.length, meanConfidence: rounded(meanConfidence), meanObservedScore: rounded(meanObservedScore), meanAbsoluteError: rounded(meanAbsoluteError), state: calibrationState }, consistency: { sampleSize: valid.length, meanScore: rounded(average(scores)), scoreRange: rounded(scoreRange), contextCount: new Set(valid.map((item) => item.contextKey)).size, difficultyRange: rounded(difficultyRange), state: consistencyState }, transfer, lastValidEvidenceAt, recency, analyzedAt: input.analyzedAt, masteryEffect: "NONE", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
}
