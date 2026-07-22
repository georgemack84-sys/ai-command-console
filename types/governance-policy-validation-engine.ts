import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";

export type GovernancePolicyCategory =
  | "Operational Governance"
  | "Mission Governance"
  | "Regulatory Compliance"
  | "Security Governance"
  | "Data Governance"
  | "Privacy Governance"
  | "Risk Governance"
  | "Financial Governance"
  | "Resource Governance"
  | "Certification Governance"
  | "Tenant Governance"
  | "Constitutional Governance Reference";

export type GovernancePolicyEnforcementLevel = "ADVISORY" | "CONDITIONAL" | "MANDATORY" | "BLOCKING";
export type GovernancePolicyStatus = "ACTIVE" | "DRAFT" | "DEPRECATED" | "EXPIRED" | "SUSPENDED";
export type GovernancePolicyValidationState = "VALID" | "CONDITIONAL" | "VIOLATION" | "UNKNOWN";

export type GovernancePolicyRule = Readonly<{
  policy_rule_id: string;
  policy_name: string;
  policy_version: "governance-policy-rule/v1";
  policy_category: GovernancePolicyCategory;
  evaluation_priority: number;
  evaluation_order: number;
  enforcement_level: GovernancePolicyEnforcementLevel;
  rule_expression: string;
  required_evidence: readonly string[];
  required_approvals: readonly string[];
  prohibited_actions: readonly string[];
  escalation_requirements: readonly string[];
  override_permissions: readonly string[];
  policy_status: GovernancePolicyStatus;
  effective_date: string;
  expiration_date?: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceRuleEvaluation = Readonly<{
  evaluation_id: string;
  policy_rule_id: string;
  validation_state: GovernancePolicyValidationState;
  evidence_satisfied: boolean;
  approvals_satisfied: boolean;
  prohibited_actions_detected: readonly string[];
  escalation_required: boolean;
  override_applied: boolean;
  explanation: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceOverrideResult = Readonly<{
  override_id: string;
  policy_rule_id: string;
  authorized: boolean;
  scope_valid: boolean;
  approval_ref: string;
  evidence_ref: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceValidationEvidence = Readonly<{
  validation_id: string;
  evaluated_rules: readonly string[];
  satisfied_rules: readonly string[];
  violated_rules: readonly string[];
  conditional_rules: readonly string[];
  approvals_verified: readonly string[];
  prohibited_actions_detected: readonly string[];
  governance_conflicts: readonly string[];
  escalation_requirements: readonly string[];
  override_results: readonly GovernanceOverrideResult[];
  validation_state: GovernancePolicyValidationState;
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceRuleLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  evaluated_policy_ids: readonly string[];
  evaluation_results: readonly GovernancePolicyValidationState[];
  governance_conflicts: readonly string[];
  override_results: readonly string[];
  escalation_results: readonly string[];
  validation_state: GovernancePolicyValidationState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type GovernancePolicyValidationFailureReason =
  | "GOVERNANCE_CONTRACT_INVALID"
  | "MISSING_POLICIES"
  | "CORRUPTED_POLICY_DEFINITION"
  | "INVALID_POLICY_VERSION"
  | "DUPLICATE_POLICY_IDENTIFIER"
  | "UNRESOLVED_POLICY_REFERENCE"
  | "POLICY_NOT_ACTIVE"
  | "CONFLICTING_POLICY_PRECEDENCE"
  | "MALFORMED_RULE_EXPRESSION"
  | "MISSING_EVIDENCE"
  | "INVALID_APPROVALS"
  | "PROHIBITED_ACTION_DETECTED"
  | "UNAUTHORIZED_OVERRIDE"
  | "GOVERNANCE_CONFLICT_DETECTED"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_HASH_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_POLICY_VALIDATOR_ACCESS"
  | "GOVERNANCE_RULE_LEDGER_FAILED";

export type GovernancePolicyValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly GovernancePolicyValidationFailureReason[];
  checks: Readonly<{
    contract_valid: boolean;
    policies_present: boolean;
    policies_active: boolean;
    policy_integrity_valid: boolean;
    evidence_complete: boolean;
    approvals_satisfied: boolean;
    prohibited_actions_absent: boolean;
    conflicts_absent: boolean;
    overrides_authorized: boolean;
    replay_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type GovernancePolicyValidationInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  policy_rules?: readonly GovernancePolicyRule[];
  approvals?: readonly string[];
  override_refs?: readonly string[];
  action_refs?: readonly string[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type GovernancePolicyValidationResult = Readonly<{
  policy_validation_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  policy_rules: readonly GovernancePolicyRule[];
  evaluations: readonly GovernanceRuleEvaluation[];
  evidence: GovernanceValidationEvidence;
  ledger_records: readonly GovernanceRuleLedgerRecord[];
  validation: GovernancePolicyValidation;
  replay_hash: string;
  failures: readonly GovernancePolicyValidationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernancePolicyValidationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  evaluated_policy_refs: readonly string[];
  evidence_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly GovernancePolicyValidationFailureReason[];
  integrity_hash: string;
}>;

export type GovernancePolicyValidationObservability = Readonly<{
  policy_loading_events: number;
  rule_evaluation_events: number;
  conflict_detection_events: number;
  override_evaluation_events: number;
  escalation_events: number;
  validation_completion_events: number;
  ledger_append_events: number;
  replay_verification_events: number;
}>;

export type GovernancePolicyValidationEngineFoundation = Readonly<{
  engine_version: "governance-policy-validation-engine/v1";
  policy_categories: readonly GovernancePolicyCategory[];
  enforcement_levels: readonly GovernancePolicyEnforcementLevel[];
  validation_states: readonly GovernancePolicyValidationState[];
  result: GovernancePolicyValidationResult;
  replay: GovernancePolicyValidationReplay;
  observability: GovernancePolicyValidationObservability;
}>;
