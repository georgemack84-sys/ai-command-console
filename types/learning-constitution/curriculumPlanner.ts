import type { SkillEdge, SkillEvidence, SkillGraphReadModel, SkillNode } from "./skillGraph";

export type PlannerTargetLevel = "FOUNDATIONAL" | "PRACTICAL" | "TROUBLESHOOTING";
export type LearningPlanStatus = "READY" | "INSUFFICIENT_EVIDENCE" | "CONSTRAINED";
export type LessonActivityType = "DIAGNOSTIC" | "GUIDED_PRACTICE" | "SCENARIO_PRACTICE" | "REASSESSMENT";

export type PlannerAssessmentResult = Readonly<{ id: string; skill_id: string; completed_at: string; score: number | null; competencies: Readonly<Partial<Record<"knowledge" | "application" | "troubleshooting" | "retention" | "calibration", number | null>>>; evidence_ids: readonly string[] }>;
export type LearningHistoryEntry = Readonly<{ skill_id: string; event: "COMPLETED" | "SKIPPED" | "FAILED" | "STARTED"; occurred_at: string; lesson_id?: string }>;
export type PlannerSkillState = Readonly<{ skill_id: string; mastery: number | null; confidence: number; retention_score: number | null; last_evaluated: string | null; evidence_ids: readonly string[] }>;
export type CurriculumPlannerInput = Readonly<{
  learner_id: string;
  goal: Readonly<{ skill_id?: string; free_text: string; target_level?: PlannerTargetLevel }>;
  skill_graph: SkillGraphReadModel;
  assessment_results: readonly PlannerAssessmentResult[];
  learning_history: readonly LearningHistoryEntry[];
  constraints: Readonly<{ available_minutes_per_week?: number; target_date?: string; preferred_session_minutes?: number; excluded_topics?: readonly string[] }>;
  skill_states?: readonly PlannerSkillState[];
  evidence?: readonly SkillEvidence[];
}>;

export type PlanGap = Readonly<{ skill_id: string; competency: PlannerTargetLevel; reason: string; evidence_ids: readonly string[]; diagnostic: boolean }>;
export type PlannedLesson = Readonly<{ id: string; position: number; target_skill_id: string; target_competency: PlannerTargetLevel; objective: string; activity_type: LessonActivityType; estimated_minutes: number; prerequisite_path: readonly string[]; evidence_references: readonly string[]; why_this_lesson: string; completion_criterion: string; next_step: string }>;
export type LearningPlan = Readonly<{ version: "curriculum-plan-v1"; goal_summary: string; status: LearningPlanStatus; detected_gaps: readonly PlanGap[]; lessons: readonly PlannedLesson[]; rationale: string; assumptions: readonly string[]; generated_at: string }>;
export type PlannerGraph = Readonly<{ nodes: readonly SkillNode[]; edges: readonly SkillEdge[] }>;
