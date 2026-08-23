export const ASSESSMENT_EVALUATION_TYPES = ["RECALL", "EXPLANATION", "APPLICATION", "DIAGNOSIS", "SCENARIO", "PRACTICAL_TASK", "ADVERSARIAL_SCENARIO"] as const;
export type AssessmentEvaluationType = (typeof ASSESSMENT_EVALUATION_TYPES)[number];

export const COMPETENCY_DIMENSIONS = ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING", "RETENTION", "CALIBRATION"] as const;
export type CompetencyDimension = (typeof COMPETENCY_DIMENSIONS)[number];

export const ASSESSMENT_SESSION_STATES = ["IN_PROGRESS", "COMPLETED", "ABANDONED"] as const;
export type AssessmentSessionState = (typeof ASSESSMENT_SESSION_STATES)[number];

export type AssessmentBlueprint = Readonly<{
  id: string; skill_id: string; version: string; objectives: readonly string[];
  assessed_skill_ids: readonly string[];
  target_competencies: readonly CompetencyDimension[];
  item_mix: Readonly<Record<AssessmentEvaluationType, number>>;
  item_plan: readonly Readonly<{ evaluation_type: AssessmentEvaluationType; skill_id: string; difficulty: number; competency_dimensions: readonly CompetencyDimension[]; required: boolean }> [];
  rules: Readonly<{
    early_stop: Readonly<{ enabled: boolean; minimum_items: number; required_competencies: readonly CompetencyDimension[] }>;
    escalation: Readonly<{ enabled: boolean; include_prerequisites: boolean; trigger_evaluation_types: readonly AssessmentEvaluationType[] }>;
    required_evaluation_types: readonly AssessmentEvaluationType[];
  }>;
}>;

export type AssessmentItem = Readonly<{
  id: string; skill_id: string; blueprint_id?: string; evaluation_type: AssessmentEvaluationType;
  prompt: string; expected_response_format: string; rubric: Readonly<Record<string, unknown>>;
  difficulty: number; version: string; competency_dimensions: readonly CompetencyDimension[];
  content?: Readonly<Record<string, unknown>>;
}>;

export type AssessmentSession = Readonly<{
  id: string; learner_id: string; blueprint_id: string; target_skill_ids: readonly string[];
  state: AssessmentSessionState; blueprint_version: string; started_at: string; completed_at?: string;
}>;

export type AssessmentResponse = Readonly<{
  id: string; session_id: string; item_id: string; answer: unknown; self_rated_confidence?: number;
  evaluation_result?: Readonly<Record<string, unknown>>; feedback?: string; submitted_at: string;
}>;

export type AssessmentEvaluationResult = Readonly<{
  evaluation_type: AssessmentEvaluationType; score: number; outcome: "PASS" | "PARTIAL" | "FAIL";
  matched_criteria: readonly string[]; missing_criteria: readonly string[];
  rationale: string; rubric_version: string;
}>;

export type CompetencyProfile = Readonly<{
  id: string; session_id: string; learner_id: string; skill_id: string;
  knowledge: number | null; application: number | null; troubleshooting: number | null;
  retention: number | null; calibration: number | null; score: number | null;
  confidence_interval: Readonly<{ lower: number; upper: number }>;
  evidence_count: number; calculation_version: string; calculated_at: string;
}>;

export type AssessmentRecommendation = Readonly<{
  id: string; session_id: string; learner_id: string; instructional_starting_point: string;
  priority_gaps: readonly Readonly<{ competency: CompetencyDimension; reason: string }> [];
  retest_at?: string;
}>;

export type AssessmentEvidenceMetadata = Readonly<{
  assessment_session_id?: string; assessment_item_id?: string;
  evaluation_type?: AssessmentEvaluationType;
  competency_dimensions?: readonly CompetencyDimension[];
}>;
