import type { RejectionAnalysisResult } from "@/types/recommendation-rejection-analysis";

export type OverrideCategory =
  | "IMPROVED_RECOMMENDATION"
  | "PARTIAL_IMPROVEMENT"
  | "MINOR_OPTIMIZATION"
  | "CONTEXT_CHANGED"
  | "RESOURCE_CONSTRAINT"
  | "MISSION_PRIORITY_CHANGE"
  | "TIMING_ADJUSTMENT"
  | "GOVERNANCE_REQUIRED"
  | "POLICY_ENFORCEMENT"
  | "CONSTITUTIONAL_PROTECTION"
  | "AUTHORITY_LIMITATION"
  | "ESCALATION_REQUIRED"
  | "APPROVAL_REQUIRED"
  | "RISK_REDUCTION"
  | "SAFETY_IMPROVEMENT"
  | "UNCERTAINTY_MITIGATION"
  | "BETTER_ALTERNATIVE"
  | "IMPROVED_EVIDENCE"
  | "CLARITY_IMPROVEMENT"
  | "ADDITIONAL_CONTEXT"
  | "WORKFLOW_PREFERENCE"
  | "ORGANIZATIONAL_STANDARD"
  | "OPERATOR_DISCRETION";

export type OverrideOutcomeAssessment = "IMPROVED_OUTCOME" | "EQUIVALENT_OUTCOME" | "DEGRADED_OUTCOME" | "REDUCED_RISK" | "INCREASED_RISK" | "GOVERNANCE_PRESERVED" | "OPERATIONAL_EFFICIENCY" | "INSUFFICIENT_EVIDENCE";
export type OverrideTrendPattern = "COMMONLY_MODIFIED_RECOMMENDATION" | "REPEATED_GOVERNANCE_OVERRIDE" | "REPEATED_AUTHORITY_OVERRIDE" | "RECURRING_WORKFLOW_MODIFICATION" | "RECURRING_EVIDENCE_IMPROVEMENT" | "FREQUENTLY_OVERRIDDEN_CATEGORY" | "INSUFFICIENT_EVIDENCE_PATTERN";
export type OverrideAnalysisState = "OVERRIDE_RECORDED" | "JUSTIFICATION_CAPTURED" | "COMPARISON_COMPLETED" | "OVERRIDE_CLASSIFIED" | "OUTCOME_EVALUATED" | "IMPROVEMENTS_IDENTIFIED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type OverrideAnalysisFailure =
  | "OVERRIDE_RECORD_MISSING"
  | "OPERATOR_ACTION_UNAVAILABLE"
  | "RECOMMENDATION_UNAVAILABLE"
  | "COMPARISON_INCOMPLETE"
  | "OVERRIDE_JUSTIFICATION_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "OVERRIDE_UNVERIFIABLE"
  | "SUPPORTING_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type OverrideAnalysisScenario =
  | "BASELINE"
  | "IMPROVED_RECOMMENDATION"
  | "PARTIAL_IMPROVEMENT"
  | "MINOR_OPTIMIZATION"
  | "CONTEXT_CHANGED"
  | "RESOURCE_CONSTRAINT"
  | "MISSION_PRIORITY_CHANGE"
  | "TIMING_ADJUSTMENT"
  | "GOVERNANCE_REQUIRED"
  | "POLICY_ENFORCEMENT"
  | "CONSTITUTIONAL_PROTECTION"
  | "AUTHORITY_LIMITATION"
  | "ESCALATION_REQUIRED"
  | "APPROVAL_REQUIRED"
  | "RISK_REDUCTION"
  | "SAFETY_IMPROVEMENT"
  | "UNCERTAINTY_MITIGATION"
  | "BETTER_ALTERNATIVE"
  | "IMPROVED_EVIDENCE"
  | "CLARITY_IMPROVEMENT"
  | "ADDITIONAL_CONTEXT"
  | "WORKFLOW_PREFERENCE"
  | "ORGANIZATIONAL_STANDARD"
  | "OPERATOR_DISCRETION"
  | "MISSING_OVERRIDE"
  | "MISSING_OPERATOR_ACTION"
  | "MISSING_RECOMMENDATION"
  | "INCOMPLETE_COMPARISON"
  | "MISSING_JUSTIFICATION"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "OVERRIDE_UNVERIFIABLE"
  | "SUPPORTING_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type OverrideAnalysisRecord = Readonly<{
  override_analysis_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  override_id: string;
  original_recommendation: string;
  modified_recommendation: string;
  operator_action: string;
  override_justification: string;
  override_categories: readonly OverrideCategory[];
  primary_override_category: OverrideCategory;
  authority_assessment: string;
  governance_assessment: string;
  recommendation_comparison: string;
  override_outcome_assessment: OverrideOutcomeAssessment;
  override_effectiveness_score: number;
  mission_impact: string;
  workflow_impact_score: number;
  improvement_opportunities: readonly string[];
  explanation: string;
  trend_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  advisory_only: true;
  infers_operator_intent: false;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type OverrideTrendRecord = Readonly<{
  trend_id: string;
  tenant_id: string;
  pattern: OverrideTrendPattern;
  categories: readonly OverrideCategory[];
  descriptive_only: true;
  modifies_future_recommendations: false;
  supporting_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OverrideAnalysisValidation = Readonly<{
  validation_id: string;
  state: OverrideAnalysisState;
  certified: boolean;
  failures: readonly OverrideAnalysisFailure[];
  override_recorded: boolean;
  justification_captured: boolean;
  comparison_completed: boolean;
  override_classified: boolean;
  outcome_evaluated: boolean;
  improvements_identified: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  evidence_complete: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type OverrideAnalysisLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  override_analysis_id: string;
  recommendation_ref: string;
  decision_ref: string;
  operator_override_ref: string;
  improvement_refs: readonly string[];
  trend_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type OverrideAnalysisApiSurface = Readonly<{
  api_id: string;
  analyze_override: "POST /override-analysis-engine/analyze";
  classify_override: "POST /override-analysis-engine/classify";
  compare_recommendation: "POST /override-analysis-engine/compare";
  evaluate_outcome: "POST /override-analysis-engine/outcome";
  generate_improvements: "POST /override-analysis-engine/improvements";
  validate_analysis: "POST /override-analysis-engine/validate";
  replay_analysis: "POST /override-analysis-engine/replay";
  retrieve_contract: "GET /override-analysis-engine/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type OverrideAnalysisInput = Readonly<{
  rejection?: RejectionAnalysisResult;
  scenario?: OverrideAnalysisScenario;
}>;

export type OverrideAnalysisResult = Readonly<{
  override_analysis_engine_version: "override-analysis-engine/v1";
  rejection: RejectionAnalysisResult;
  api_surface: OverrideAnalysisApiSurface;
  override_record: OverrideAnalysisRecord;
  trend_record: OverrideTrendRecord;
  validation: OverrideAnalysisValidation;
  ledger_record: OverrideAnalysisLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  override_signal_only: true;
  infers_operator_intent: false;
  adaptive_learning: false;
  modifies_recommendations: false;
  modifies_operator_actions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OverrideAnalysisFoundation = Readonly<{
  override_analysis_engine_version: "override-analysis-engine/v1";
  categories: readonly OverrideCategory[];
  api_surface: OverrideAnalysisApiSurface;
  result: OverrideAnalysisResult;
}>;
