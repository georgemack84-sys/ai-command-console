import type { AssessmentRecommendation, CompetencyDimension } from "@/types/learning-constitution";

type Profile = Readonly<{ knowledge: number | null; application: number | null; troubleshooting: number | null; retention: number | null; calibration: number | null }>;
type EvaluatedItem = Readonly<{ skill_id: string; score: number }>;
const threshold = 0.7;

const gapReason = (dimension: CompetencyDimension, score: number | null): string => score === null ? `${dimension.toLowerCase()} has insufficient evidence.` : `${dimension.toLowerCase()} is below the targeted diagnostic threshold (${Math.round(score * 100)}%).`;

export const buildAssessmentRecommendation = (input: Readonly<{ id: string; session_id: string; learner_id: string; target_skill_id: string; profile: Profile; evaluated_items: readonly EvaluatedItem[]; now: Date }>): AssessmentRecommendation => {
  const dimensions: readonly [CompetencyDimension, number | null][] = [["KNOWLEDGE", input.profile.knowledge], ["APPLICATION", input.profile.application], ["TROUBLESHOOTING", input.profile.troubleshooting], ["CALIBRATION", input.profile.calibration]];
  const priority_gaps = dimensions.filter(([, score]) => score === null || score < threshold).map(([competency, score]) => ({ competency, reason: gapReason(competency, score) }));
  const lowestItem = [...input.evaluated_items].sort((left, right) => left.score - right.score || left.skill_id.localeCompare(right.skill_id))[0];
  const instructional_starting_point = priority_gaps.length && lowestItem ? lowestItem.skill_id : input.target_skill_id;
  const retestDays = priority_gaps.length ? 7 : 30;
  return { id: input.id, session_id: input.session_id, learner_id: input.learner_id, instructional_starting_point, priority_gaps, retest_at: new Date(input.now.getTime() + retestDays * 24 * 60 * 60 * 1000).toISOString() };
};
