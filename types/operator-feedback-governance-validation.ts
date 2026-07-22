import type { OperatorFeedbackLedgerResult } from "@/types/operator-feedback-ledger";

export type FeedbackGovernanceCompliance = "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "NON_COMPLIANT";
export type FeedbackGovernanceEscalation = "INFORMATIONAL" | "ADVISORY" | "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_REVIEW" | "CRITICAL_ESCALATION";
export type FeedbackGovernanceState = "VALIDATED" | "HALTED";

export type FeedbackGovernanceFailure =
  | "GOVERNANCE_METADATA_MISSING"
  | "AUTHORITY_UNDEFINED"
  | "AUTHORITY_EXCEEDED"
  | "ROLE_MISMATCH"
  | "UNAUTHORIZED_OPERATOR"
  | "CROSS_TENANT_AUTHORITY"
  | "GOVERNANCE_RESTRICTION_VIOLATED"
  | "CONSTITUTIONAL_RULES_UNAVAILABLE"
  | "POLICY_VERSION_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "TENANT_OWNERSHIP_AMBIGUOUS"
  | "ESCALATION_RULES_INVALID"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "CONSTITUTIONAL_BYPASS_ATTEMPT"
  | "ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT"
  | "HISTORICAL_RECORD_MUTATION_ATTEMPT"
  | "OPERATOR_AUTHORITY_EXPANSION_ATTEMPT"
  | "LEDGER_NOT_CERTIFIED";

export type FeedbackGovernanceScenario =
  | "BASELINE"
  | "INFORMATIONAL"
  | "ADVISORY"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "CRITICAL_ESCALATION"
  | "HIGH_RISK_FEEDBACK"
  | "MISSING_GOVERNANCE_METADATA"
  | "AUTHORITY_UNDEFINED"
  | "AUTHORITY_EXCEEDED"
  | "ROLE_MISMATCH"
  | "UNAUTHORIZED_OPERATOR"
  | "CROSS_TENANT_AUTHORITY"
  | "GOVERNANCE_RESTRICTION_VIOLATED"
  | "CONSTITUTIONAL_RULES_UNAVAILABLE"
  | "POLICY_VERSION_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "TENANT_OWNERSHIP_AMBIGUOUS"
  | "ESCALATION_RULES_INVALID"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "CONSTITUTIONAL_BYPASS_ATTEMPT"
  | "ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT"
  | "HISTORICAL_RECORD_MUTATION_ATTEMPT"
  | "OPERATOR_AUTHORITY_EXPANSION_ATTEMPT"
  | "LEDGER_FAILURE";

export type FeedbackGovernanceEvaluation = Readonly<{
  evaluation_id: string;
  domain: "GOVERNANCE" | "AUTHORITY" | "CONSTITUTIONAL" | "POLICY";
  status: FeedbackGovernanceCompliance;
  applicable_rules: readonly string[];
  allowed_actions: readonly string[];
  prohibited_actions: readonly string[];
  explanation: string;
  integrity_hash: string;
}>;

export type FeedbackEscalationDecision = Readonly<{
  escalation_id: string;
  category: FeedbackGovernanceEscalation;
  governance_review_required: boolean;
  simulation_required: boolean;
  operator_approval_required: boolean;
  executive_approval_required: boolean;
  certification_review_required: boolean;
  downstream_progression_halted: boolean;
  integrity_hash: string;
}>;

export type FeedbackGovernanceDecisionRecord = Readonly<{
  governance_decision_id: string;
  feedback_id: string;
  validation_results: readonly FeedbackGovernanceCompliance[];
  authority_assessment: string;
  constitutional_assessment: string;
  policy_assessment: string;
  escalation_outcome: FeedbackGovernanceEscalation;
  reviewer: "governance_validator";
  timestamp: string;
  replay_refs: readonly string[];
  audit_refs: readonly string[];
  append_only: true;
  immutable: true;
  tenant_isolated: true;
  cryptographically_verifiable: true;
  integrity_hash: string;
}>;

export type FeedbackGovernanceExplanation = Readonly<{
  explanation_id: string;
  validation_outcome: string;
  applicable_governance_rules: readonly string[];
  authority_determination: string;
  constitutional_considerations: string;
  policy_evaluations: string;
  escalation_decision: FeedbackGovernanceEscalation;
  supporting_evidence: readonly string[];
  replay_references: readonly string[];
  traceable: true;
  integrity_hash: string;
}>;

export type FeedbackGovernanceAuditEvent = Readonly<{
  audit_event_id: string;
  governance_validation_id: string;
  validation_timestamp: string;
  rule_versions: readonly string[];
  authority_evaluation: FeedbackGovernanceCompliance;
  constitutional_evaluation: FeedbackGovernanceCompliance;
  policy_evaluation: FeedbackGovernanceCompliance;
  escalation_outcome: FeedbackGovernanceEscalation;
  governance_reviewer: "governance_validator";
  replay_identifier: string;
  integrity_verified: boolean;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type FeedbackGovernanceApiSurface = Readonly<{
  api_id: string;
  validate_governance: "POST /operator-feedback-governance-validation/validate";
  retrieve_authority: "POST /operator-feedback-governance-validation/authority";
  retrieve_constitutional: "POST /operator-feedback-governance-validation/constitutional";
  retrieve_policy: "POST /operator-feedback-governance-validation/policy";
  retrieve_escalation: "POST /operator-feedback-governance-validation/escalation";
  retrieve_registry: "POST /operator-feedback-governance-validation/registry";
  retrieve_explanation: "POST /operator-feedback-governance-validation/explanation";
  retrieve_audit: "POST /operator-feedback-governance-validation/audit";
  replay_validation: "POST /operator-feedback-governance-validation/replay";
  retrieve_contract: "GET /operator-feedback-governance-validation/contract";
  feedback_quality_analysis_supported: false;
  normalization_supported: false;
  adaptive_proposal_generation_supported: false;
  production_mutation_supported: false;
  governance_approval_execution_supported: false;
  policy_update_supported: false;
  constitutional_override_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackGovernanceValidationInput = Readonly<{
  scenario?: FeedbackGovernanceScenario;
  ledger_result?: OperatorFeedbackLedgerResult;
}>;

export type FeedbackGovernanceValidationResult = Readonly<{
  operator_feedback_governance_validation_version: "operator-feedback-governance-validation/v1";
  governance_rule_version: "operator-feedback-governance-rules/v1";
  api_surface: FeedbackGovernanceApiSurface;
  ledger_result: OperatorFeedbackLedgerResult;
  governance_validation: FeedbackGovernanceEvaluation;
  authority_validation: FeedbackGovernanceEvaluation;
  constitutional_validation: FeedbackGovernanceEvaluation;
  policy_validation: FeedbackGovernanceEvaluation;
  escalation_decision: FeedbackEscalationDecision;
  decision_registry_record: FeedbackGovernanceDecisionRecord;
  explanation: FeedbackGovernanceExplanation;
  audit_events: readonly FeedbackGovernanceAuditEvent[];
  validation_state: FeedbackGovernanceState;
  failures: readonly FeedbackGovernanceFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  explainable: true;
  tenant_isolated: boolean;
  governance_supremacy_enforced: true;
  constitutional_supremacy_enforced: true;
  authority_separation_enforced: true;
  advisory_only: true;
  fail_closed: boolean;
  modifies_production: false;
  changes_policy: false;
  alters_governance: false;
  overrides_constitutional_constraints: false;
  bypasses_approval_workflows: false;
  authorizes_adaptive_implementation: false;
  modifies_historical_records: false;
  expands_operator_authority: false;
}>;

export type FeedbackGovernanceValidationFoundation = Readonly<{
  operator_feedback_governance_validation_version: "operator-feedback-governance-validation/v1";
  api_surface: FeedbackGovernanceApiSurface;
  result: FeedbackGovernanceValidationResult;
}>;
