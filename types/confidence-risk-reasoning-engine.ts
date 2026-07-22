import type { ExplanationRecord, ExplanationType } from "@/types/explainability-contract";
import type { ReasoningGraph } from "@/types/evidence-policy-reasoning-graph";

export type ConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";
export type RiskLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNACCEPTABLE";
export type ConfidenceCategory = "EVIDENCE" | "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "AUTHORITY" | "REPLAY" | "INTEGRITY" | "OVERALL_DECISION";
export type RiskType = "OPERATIONAL" | "EXECUTION" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "POLICY" | "CONSTITUTIONAL" | "AUTHORITY" | "INTEGRITY" | "REPLAY" | "DEPENDENCY" | "RECOVERY";
export type ConfidenceEvolutionState = "INITIAL_ESTIMATE" | "PLANNING_VALIDATED" | "GOVERNANCE_VALIDATED" | "AUTHORITY_VALIDATED" | "EXECUTION_VALIDATED" | "SUPERVISION_VALIDATED" | "REPLAY_VERIFIED" | "FINAL_CONFIDENCE";
export type RiskEvolutionState = "IDENTIFIED" | "ANALYZED" | "CLASSIFIED" | "MITIGATION_PLANNED" | "MITIGATED" | "MONITORED" | "RESOLVED" | "ARCHIVED";
export type MitigationType = "retry" | "rollback" | "pause" | "escalation" | "operator review" | "contingency execution" | "degraded mode" | "safe termination";

export type ConfidenceRiskScenario =
  | "BASELINE"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_CONFIDENCE_FACTORS"
  | "UNREPRODUCIBLE_RISK_CLASSIFICATION"
  | "MISSING_GOVERNANCE_EVALUATIONS"
  | "MISSING_CONSTITUTIONAL_VALIDATION"
  | "INCOMPLETE_AUTHORITY_VALIDATION"
  | "INVALID_REPLAY_REFERENCE"
  | "CONFIDENCE_LINEAGE_GAP"
  | "RISK_LINEAGE_GAP"
  | "UNDOCUMENTED_MITIGATION"
  | "NONDETERMINISTIC_CALCULATION"
  | "CROSS_TENANT_REFERENCE"
  | "INTEGRITY_FAILURE"
  | "ADVISORY_ONLY_VIOLATION";

export type ConfidenceRiskFailure =
  | "SUPPORTING_EVIDENCE_INCOMPLETE"
  | "CONFIDENCE_FACTORS_MISSING"
  | "RISK_CLASSIFICATION_UNREPRODUCIBLE"
  | "GOVERNANCE_EVALUATIONS_ABSENT"
  | "CONSTITUTIONAL_VALIDATION_UNAVAILABLE"
  | "AUTHORITY_VALIDATION_INCOMPLETE"
  | "REPLAY_REFERENCE_INVALID"
  | "CONFIDENCE_LINEAGE_GAP_DETECTED"
  | "RISK_LINEAGE_GAP_DETECTED"
  | "MITIGATION_REASONING_UNDOCUMENTED"
  | "DETERMINISTIC_CALCULATION_FAILED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "ADVISORY_ONLY_VIOLATION";

export type ConfidenceAssessment = Readonly<{
  confidence_id: string;
  category: ConfidenceCategory;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  contributing_factors: readonly string[];
  positive_evidence: readonly string[];
  negative_evidence: readonly string[];
  historical_consistency: number;
  replay_consistency: number;
  integrity_status: "VERIFIED" | "FAILED";
  truth_reference: string;
  lineage_reference: string;
  replay_reference: string;
  assessment_hash: string;
}>;

export type RiskAssessment = Readonly<{
  risk_id: string;
  risk_type: RiskType;
  risk_score: number;
  risk_level: RiskLevel;
  likelihood: number;
  impact: number;
  supporting_evidence: readonly string[];
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  recommended_mitigations: readonly MitigationType[];
  truth_reference: string;
  lineage_reference: string;
  replay_reference: string;
  assessment_hash: string;
}>;

export type ConfidenceEvolutionPoint = Readonly<{
  state: ConfidenceEvolutionState;
  score: number;
  explanation: string;
  deterministic_order: number;
  lineage_reference: string;
  point_hash: string;
}>;

export type RiskEvolutionPoint = Readonly<{
  state: RiskEvolutionState;
  risk_level: RiskLevel;
  explanation: string;
  deterministic_order: number;
  lineage_reference: string;
  point_hash: string;
}>;

export type MitigationExplanation = Readonly<{
  mitigation_id: string;
  mitigation_type: MitigationType;
  selected: boolean;
  rationale: string;
  rejected_mitigations: readonly MitigationType[];
  governance_approval: string;
  authority_approval: string;
  expected_effectiveness: number;
  residual_risk: RiskLevel;
  mitigation_hash: string;
}>;

export type ConfidenceRiskReasoningRecord = Readonly<{
  reasoning_id: string;
  reasoning_version: "confidence-risk-reasoning/v8ALT.5.4";
  engine_version: "confidence-risk-reasoning-engine/v8ALT.5.4";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  plan_id: string;
  decision_id: string;
  explanation_id: string;
  graph_id: string | null;
  source_explanation: ExplanationRecord;
  source_graph: ReasoningGraph | null;
  confidence_assessments: readonly ConfidenceAssessment[];
  risk_assessments: readonly RiskAssessment[];
  confidence_evolution: readonly ConfidenceEvolutionPoint[];
  risk_evolution: readonly RiskEvolutionPoint[];
  mitigation_explanations: readonly MitigationExplanation[];
  confidence_narrative: string;
  risk_narrative: string;
  truth_reference: string;
  lineage_reference: string;
  replay_reference: string;
  advisory_only: true;
  plan_modified: boolean;
  execution_modified: boolean;
  evidence_modified: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  reasoning_hash: string;
}>;

export type ConfidenceRiskRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  records: readonly ConfidenceRiskReasoningRecord[];
  append_only: true;
  read_only: true;
  repository_hash: string;
}>;

export type ConfidenceRiskInput = Readonly<{
  scenario?: ConfidenceRiskScenario;
  tenant_id?: string;
  mission_id?: string;
  explanation?: ExplanationRecord;
  graph?: ReasoningGraph;
}>;

export type ConfidenceRiskValidationResult = Readonly<{
  reasoning_id: string | null;
  valid: boolean;
  evidence_complete: boolean;
  confidence_factors_complete: boolean;
  risk_reproducible: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  confidence_lineage_complete: boolean;
  risk_lineage_complete: boolean;
  mitigation_documented: boolean;
  deterministic_calculation_valid: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  advisory_only_enforced: boolean;
  failures: readonly ConfidenceRiskFailure[];
  validation_hash: string;
}>;

export type ConfidenceRiskReplayResult = Readonly<{
  replay_reference: string;
  reasoning_id: string;
  replay_type: "CONFIDENCE" | "RISK";
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ConfidenceRiskObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  record_count: number;
  confidence_categories: readonly ConfidenceCategory[];
  risk_types: readonly RiskType[];
  advisory_only: true;
  repository_hash: string;
}>;

export type ConfidenceRiskReasoningContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "confidence-risk-reasoning-engine/v8ALT.5.4";
    principles: readonly string[];
    confidence_levels: readonly ConfidenceLevel[];
    risk_levels: readonly RiskLevel[];
    confidence_categories: readonly ConfidenceCategory[];
    risk_types: readonly RiskType[];
    source_explanation_types: readonly ExplanationType[];
    advisory_only: true;
  }>;
  repository: ConfidenceRiskRepository;
  validation: ConfidenceRiskValidationResult;
  confidence_replay: ConfidenceRiskReplayResult;
  risk_replay: ConfidenceRiskReplayResult;
  observability: ConfidenceRiskObservabilitySurface;
}>;
