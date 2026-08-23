import type { AssessmentEvaluationType, CompetencyDimension } from "./assessment";

export type AdaptiveAssessmentItem = Readonly<{ id: string; position: number; skill_id: string; evaluation_type: AssessmentEvaluationType; competency_dimensions: readonly CompetencyDimension[] }>;
export type AdaptiveAssessmentResponse = Readonly<{ item_id: string; score: number | null }>;
export type AdaptiveAssessmentDecision = Readonly<{
  state: "CONTINUE" | "READY_TO_COMPLETE";
  next_item_id?: string;
  reason: string;
  covered_competencies: readonly CompetencyDimension[];
  insufficient_competencies: readonly CompetencyDimension[];
  skipped_item_ids: readonly string[];
}>;
