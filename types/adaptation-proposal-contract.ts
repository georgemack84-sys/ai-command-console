import type { OperatorFeedbackCertificationGateResult } from "@/types/operator-feedback-certification-gate";

export type AdaptationType =
  | "STRATEGY_IMPROVEMENT"
  | "CONFIDENCE_CALIBRATION"
  | "RISK_RECALIBRATION"
  | "GOVERNANCE_REFINEMENT"
  | "EVIDENCE_REQUIREMENT"
  | "SIMULATION_REQUIREMENT"
  | "OPERATOR_WORKFLOW";

export type AdaptationProposalLifecycleState =
  | "DRAFT"
  | "VALIDATED"
  | "REQUIRES_SIMULATION"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_REVIEW"
  | "APPROVED_FOR_CERTIFICATION"
  | "CERTIFIED"
  | "REJECTED"
  | "SUPPRESSED"
  | "ROLLED_BACK"
  | "ARCHIVED";

export type AdaptationProposalValidationState = "CERTIFIED" | "PENDING_EVIDENCE" | "FAILED";

export type AdaptationProposalFailure =
  | "PROPOSAL_ID_MISSING"
  | "TENANT_MISSING"
  | "ADAPTATION_TYPE_MISSING"
  | "EVIDENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_ANALYSIS_MISSING"
  | "CONSTITUTIONAL_ANALYSIS_MISSING"
  | "AUTHORITY_ANALYSIS_MISSING"
  | "BENEFIT_ANALYSIS_MISSING"
  | "RISK_ANALYSIS_MISSING"
  | "OPERATOR_IMPACT_MISSING"
  | "LIFECYCLE_STATE_INVALID"
  | "INTEGRITY_HASH_INVALID"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "PROPOSAL_HASH_MISMATCH"
  | "SCHEMA_VERSION_MISMATCH"
  | "PROPOSAL_LINEAGE_INCOMPLETE"
  | "ADVISORY_ONLY_GUARANTEE_VIOLATED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "RECOMMENDATION_DEPLOYMENT_ATTEMPT"
  | "MODEL_RETRAINING_ATTEMPT"
  | "GOVERNANCE_CHANGE_ATTEMPT"
  | "CONFIDENCE_CALIBRATION_ATTEMPT"
  | "RISK_CALIBRATION_ATTEMPT"
  | "STRATEGY_MUTATION_ATTEMPT"
  | "EVIDENCE_MODIFICATION_ATTEMPT"
  | "OPERATOR_BYPASS_ATTEMPT";

export type AdaptationProposalScenario =
  | "BASELINE"
  | "CONFIDENCE"
  | "RISK"
  | "GOVERNANCE"
  | "EVIDENCE_REQUIREMENT"
  | "SIMULATION_REQUIREMENT"
  | "OPERATOR_WORKFLOW"
  | "MISSING_PROPOSAL_ID"
  | "MISSING_TENANT"
  | "MISSING_ADAPTATION_TYPE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE_ANALYSIS"
  | "MISSING_CONSTITUTIONAL_ANALYSIS"
  | "MISSING_AUTHORITY_ANALYSIS"
  | "MISSING_BENEFIT_ANALYSIS"
  | "MISSING_RISK_ANALYSIS"
  | "MISSING_OPERATOR_IMPACT"
  | "INVALID_LIFECYCLE_STATE"
  | "INVALID_INTEGRITY_HASH"
  | "CROSS_TENANT_REFERENCE"
  | "SCHEMA_VERSION_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "ADVISORY_ONLY_VIOLATION"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "RECOMMENDATION_DEPLOYMENT_ATTEMPT"
  | "MODEL_RETRAINING_ATTEMPT"
  | "GOVERNANCE_CHANGE_ATTEMPT"
  | "CONFIDENCE_CALIBRATION_ATTEMPT"
  | "RISK_CALIBRATION_ATTEMPT"
  | "STRATEGY_MUTATION_ATTEMPT"
  | "EVIDENCE_MODIFICATION_ATTEMPT"
  | "OPERATOR_BYPASS_ATTEMPT";

export type AdaptationProposalAnalysis = Readonly<{
  analysis_id: string;
  summary: string;
  impacts: readonly string[];
  constraints: readonly string[];
  required: true;
  integrity_hash: string;
}>;

export type AdaptationProposalRollbackPlan = Readonly<{
  rollback_plan_id: string;
  rollback_strategy: string;
  rollback_scope: string;
  rollback_prerequisites: readonly string[];
  rollback_evidence_refs: readonly string[];
  rollback_replay_refs: readonly string[];
  required: true;
  integrity_hash: string;
}>;

export type AdaptationProposalApprovalRequirements = Readonly<{
  operator_approval_required: true;
  governance_approval_required: true;
  certification_approval_required: true;
  executive_governance_required: boolean;
  allowed_approvers: readonly string[];
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationRequirements = Readonly<{
  certification_gate: "operator-feedback-certification-gate/v1";
  required_evidence: readonly string[];
  replay_validation_required: true;
  simulation_validation_required: true;
  governance_approval_required: true;
  integrity_hash: string;
}>;

export type AdaptationProposal = Readonly<{
  proposal_id: string;
  proposal_version: "adaptation-proposal/v1";
  tenant_id: string;
  proposal_creation_timestamp: string;
  proposal_generator_version: "adaptation-proposal-contract/v1";
  contract_version: "adaptation-proposal-contract/v1";
  proposal_uuid: string;
  proposal_namespace: string;
  mission_scope: string;
  workflow_scope: string;
  recommendation_scope: string;
  capability_scope: string;
  strategy_scope: string;
  confidence_scope: string;
  risk_scope: string;
  evidence_scope: string;
  governance_scope: string;
  operator_visibility_scope: string;
  adaptation_type: AdaptationType;
  proposal_summary: string;
  proposed_change: string;
  reason_for_change: string;
  supporting_outcome_refs: readonly string[];
  supporting_pattern_refs: readonly string[];
  supporting_feedback_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_recommendation_history_refs: readonly string[];
  supporting_replay_history_refs: readonly string[];
  supporting_simulation_history_refs: readonly string[];
  expected_benefit: AdaptationProposalAnalysis;
  expected_risk: AdaptationProposalAnalysis;
  confidence_score: number;
  risk_score: number;
  governance_impact: AdaptationProposalAnalysis;
  constitutional_impact: AdaptationProposalAnalysis;
  authority_impact: AdaptationProposalAnalysis;
  operator_impact: AdaptationProposalAnalysis;
  simulation_required: true;
  replay_required: true;
  approval_required: true;
  certification_required: true;
  rollback_plan_required: true;
  approval_requirements: AdaptationProposalApprovalRequirements;
  certification_requirements: AdaptationProposalCertificationRequirements;
  rollback_plan: AdaptationProposalRollbackPlan;
  proposal_state: AdaptationProposalLifecycleState;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  advisory_only: true;
  mutates_production: false;
  mutates_policy: false;
  deploys_recommendations: false;
  retrains_models: false;
  changes_governance: false;
  calibrates_confidence: false;
  calibrates_risk: false;
  mutates_strategy: false;
  modifies_evidence: false;
  bypasses_operator: false;
  integrity_hash: string;
}>;

export type AdaptationProposalValidationReport = Readonly<{
  validation_id: string;
  state: AdaptationProposalValidationState;
  certified: boolean;
  failures: readonly AdaptationProposalFailure[];
  identity_valid: boolean;
  scope_valid: boolean;
  intent_valid: boolean;
  evidence_complete: boolean;
  benefit_complete: boolean;
  risk_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  authority_complete: boolean;
  operator_impact_complete: boolean;
  simulation_required: boolean;
  replay_complete: boolean;
  approval_required: boolean;
  certification_required: boolean;
  rollback_complete: boolean;
  lifecycle_state_valid: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  advisory_only_enforced: boolean;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type AdaptationProposalApiSurface = Readonly<{
  api_id: string;
  validate_proposal: "POST /adaptation-proposal-contract/validate";
  retrieve_proposal: "POST /adaptation-proposal-contract/proposal";
  retrieve_schema: "GET /adaptation-proposal-contract/schema";
  retrieve_contract: "GET /adaptation-proposal-contract/contract";
  replay_validation: "POST /adaptation-proposal-contract/replay";
  inspect_contract: "POST /adaptation-proposal-contract/inspect";
  proposal_mutation_supported: false;
  production_mutation_supported: false;
  policy_mutation_supported: false;
  recommendation_deployment_supported: false;
  model_retraining_supported: false;
  governance_change_supported: false;
  confidence_calibration_supported: false;
  risk_calibration_supported: false;
  strategy_mutation_supported: false;
  evidence_modification_supported: false;
  operator_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationProposalContractInput = Readonly<{
  scenario?: AdaptationProposalScenario;
  certification_result?: OperatorFeedbackCertificationGateResult;
  proposal?: Partial<AdaptationProposal>;
}>;

export type AdaptationProposalContractResult = Readonly<{
  adaptation_proposal_contract_version: "adaptation-proposal-contract/v1";
  schema_version: "adaptation-proposal-schema/v1";
  api_surface: AdaptationProposalApiSurface;
  certification_result: OperatorFeedbackCertificationGateResult;
  proposal: AdaptationProposal;
  validation_report: AdaptationProposalValidationReport;
  validation_state: AdaptationProposalValidationState;
  failures: readonly AdaptationProposalFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_enforced: boolean;
  constitutional_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  fail_closed: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationProposalContractFoundation = Readonly<{
  adaptation_proposal_contract_version: "adaptation-proposal-contract/v1";
  schema_fields: readonly string[];
  legal_lifecycle_states: readonly AdaptationProposalLifecycleState[];
  api_surface: AdaptationProposalApiSurface;
  result: AdaptationProposalContractResult;
}>;
