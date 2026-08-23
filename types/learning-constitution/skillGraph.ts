export const SKILL_NODE_STATUSES = ["ACTIVE", "DEPRECATED"] as const;
export type SkillNodeStatus = (typeof SKILL_NODE_STATUSES)[number];

export const SKILL_EDGE_TYPES = ["CONTAINS", "PREREQUISITE", "RELATED"] as const;
export type SkillEdgeType = (typeof SKILL_EDGE_TYPES)[number];

export const SKILL_EVIDENCE_KINDS = ["ASSESSMENT", "PRACTICAL_TASK", "SELF_REPORT", "INSTRUCTOR_REVIEW"] as const;
export type SkillEvidenceKind = (typeof SKILL_EVIDENCE_KINDS)[number];
export const SKILL_EVIDENCE_OUTCOMES = ["PASS", "PARTIAL", "FAIL", "OBSERVED"] as const;
export type SkillEvidenceOutcome = (typeof SKILL_EVIDENCE_OUTCOMES)[number];
export const SKILL_EVALUATORS = ["SYSTEM", "HUMAN", "LEARNER"] as const;
export type SkillEvaluator = (typeof SKILL_EVALUATORS)[number];

export type SkillNode = Readonly<{
  id: string; slug: string; name: string; description: string; status: SkillNodeStatus;
  prerequisites: readonly string[]; mastery: number | null; confidence: number;
  last_evaluated: string | null; retention_score: number | null; evidence: readonly string[];
  created_at: string; updated_at: string; model_version: string;
}>;

export type SkillEdge = Readonly<{
  id: string; from_skill_id: string; to_skill_id: string; type: SkillEdgeType;
  strength?: number; rationale: string; created_at: string;
}>;

export type SkillEvidence = Readonly<{
  id: string; learner_id: string; skill_id: string; kind: SkillEvidenceKind; occurred_at: string;
  score?: number; outcome: SkillEvidenceOutcome; evaluator: SkillEvaluator;
  source_ref?: string; notes?: string; rubric_version?: string;
  assessment_session_id?: string; assessment_item_id?: string;
  evaluation_type?: import("./assessment").AssessmentEvaluationType;
  competency_dimensions?: readonly import("./assessment").CompetencyDimension[];
}>;

export const SKILL_READINESS_STATES = ["NOT_EVALUATED", "INSUFFICIENT_EVIDENCE", "AT_RISK", "READY"] as const;
export type SkillReadinessState = (typeof SKILL_READINESS_STATES)[number];

export type DerivedSkillState = Readonly<{
  learner_id: string; skill_id: string; mastery: number | null; confidence: number;
  retention_score: number | null; last_evaluated: string | null; display_state: SkillReadinessState;
  calculation_version: string; calculated_at: string; evidence_ids: readonly string[];
}>;

export type SkillStateCalculation = Readonly<{
  calculationVersion: string; asOf: string; practicalTaskWeight: number; assessmentWeight: number;
  instructorReviewWeight: number; selfReportWeight: number; evidenceHalfLifeDays: number;
  retentionHalfLifeDays: number; minimumMasteryEvidence: number; readyMasteryThreshold: number;
  atRiskRetentionThreshold: number;
}>;

export type EvaluationRubric = Readonly<{
  evaluation_id: string; evaluated_skill_id: string; rubric_version: string;
  exercised_skill_ids: readonly string[];
}>;
export type DiagnosisStatus = "RECOMMENDATION" | "INSUFFICIENT_EVIDENCE" | "NOT_LOCALIZED";
export type SkillRecommendation = Readonly<{
  status: DiagnosisStatus; target_skill_id?: string; blocked_skill_id: string;
  reason: string; graph_path: readonly string[]; evidence_ids: readonly string[];
  next_action: "PRACTICE" | "DIAGNOSTIC_EVALUATION" | "REASSESS";
  score?: number;
}>;
export type StudyPlan = Readonly<{
  recommendation: SkillRecommendation;
  steps: readonly Readonly<{ action: "PRACTICE" | "REASSESS" | "DIAGNOSTIC_EVALUATION"; skill_id: string; rationale: string }> [];
}>;

export type SkillGraphReadModel = Readonly<{
  nodes: readonly SkillNode[]; edges: readonly SkillEdge[];
  hierarchy: Readonly<Record<string, readonly string[]>>;
  prerequisites: Readonly<Record<string, readonly string[]>>;
}>;

export type FlatSkillRecord = Readonly<{ id: string; slug: string; name: string; description?: string }>;
export type FlatSkillMigration = Readonly<{ flatSkillId: string; skillNode: SkillNode }>;

export type SkillGraphMigrationReport = Readonly<{
  mapped: readonly FlatSkillMigration[]; unmapped: readonly FlatSkillRecord[];
  duplicated: readonly FlatSkillRecord[]; manual_review: readonly FlatSkillRecord[];
  fully_accounted_for: boolean;
}>;
export type LearningReadMode = "FLAT_LIST" | "SKILL_GRAPH";
export type SkillGraphCalibrationCase = Readonly<{ case_id: string; expected_target_skill_id?: string; actual: SkillRecommendation }>;
export type SkillGraphReleaseReport = Readonly<{ release_id: "skill-graph-v1-release"; passed: boolean; checks: readonly Readonly<{ check_id: string; passed: boolean; detail: string }>[]; rollback: Readonly<{ flag: "skill_graph_v1"; mode: "FLAT_LIST" }> }>;

export type SkillGraphRepository = Readonly<{
  createNode(node: SkillNode): Promise<SkillNode>;
  createEdge(edge: SkillEdge): Promise<SkillEdge>;
  appendEvidence(evidence: SkillEvidence): Promise<SkillEvidence>;
  getNode(id: string): Promise<SkillNode | undefined>;
  findNodeBySlug(slug: string): Promise<SkillNode | undefined>;
  findAllNodes(): Promise<readonly SkillNode[]>;
  findAllEdges(): Promise<readonly SkillEdge[]>;
  findEvidenceBySkillId(skillId: string): Promise<readonly SkillEvidence[]>;
}>;
