import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";

export type ConstitutionalRuleCategory =
  | "Constitutional Supremacy"
  | "Advisory-Only Operation"
  | "Authority Boundaries"
  | "Operator Supremacy"
  | "Governance Supremacy"
  | "Tenant Isolation Reference"
  | "Immutable Audit"
  | "Replay Integrity Reference"
  | "Explainability"
  | "Deterministic Execution"
  | "Certification Requirements"
  | "Security Principles";

export type ConstitutionalEnforcementLevel = "REFERENCE" | "MANDATORY" | "BLOCKING";
export type ConstitutionalValidationResultState = "COMPLIANT" | "CONDITIONAL" | "VIOLATION" | "UNKNOWN";

export type ConstitutionalRule = Readonly<{
  constitutional_rule_id: string;
  rule_name: string;
  rule_version: "constitutional-rule/v1";
  constitutional_article: string;
  constitutional_principle: ConstitutionalRuleCategory;
  priority: number;
  evaluation_order: number;
  enforcement_level: ConstitutionalEnforcementLevel;
  rule_expression: string;
  authority_constraints: readonly string[];
  advisory_constraints: readonly string[];
  prohibited_actions: readonly string[];
  conflict_resolution_priority: number;
  required_evidence: readonly string[];
  policy_references: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConstitutionalRuleEvaluation = Readonly<{
  evaluation_id: string;
  constitutional_rule_id: string;
  validation_result: ConstitutionalValidationResultState;
  evidence_satisfied: boolean;
  authority_satisfied: boolean;
  advisory_satisfied: boolean;
  prohibited_actions_detected: readonly string[];
  explanation: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConstitutionalEvidenceReport = Readonly<{
  report_id: string;
  governance_decision_id: string;
  evaluated_rules: readonly string[];
  satisfied_rules: readonly string[];
  violated_rules: readonly string[];
  conditional_rules: readonly string[];
  authority_results: readonly string[];
  advisory_results: readonly string[];
  prohibited_actions_detected: readonly string[];
  constitutional_conflicts: readonly string[];
  validation_result: ConstitutionalValidationResultState;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConstitutionalDecisionLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  constitutional_rule_ids: readonly string[];
  evaluation_results: readonly ConstitutionalValidationResultState[];
  authority_results: readonly string[];
  advisory_results: readonly string[];
  conflict_results: readonly string[];
  validation_result: ConstitutionalValidationResultState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type ConstitutionalDecisionValidationFailureReason =
  | "GOVERNANCE_CONTRACT_INVALID"
  | "GOVERNANCE_POLICY_INVALID"
  | "MISSING_CONSTITUTIONAL_RULES"
  | "CORRUPTED_CONSTITUTIONAL_DEFINITION"
  | "INVALID_CONSTITUTIONAL_VERSION"
  | "DUPLICATE_CONSTITUTIONAL_IDENTIFIER"
  | "UNRESOLVED_CONSTITUTIONAL_REFERENCE"
  | "MALFORMED_CONSTITUTIONAL_EXPRESSION"
  | "MISSING_EVIDENCE"
  | "AUTHORITY_AMBIGUITY"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "ADVISORY_AMBIGUITY"
  | "ADVISORY_ONLY_VIOLATION"
  | "PROHIBITED_EXECUTION_DETECTED"
  | "CONSTITUTIONAL_CONFLICT_DETECTED"
  | "CONSTITUTIONAL_SUPREMACY_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_CONSTITUTIONAL_VALIDATOR_ACCESS"
  | "CONSTITUTIONAL_LEDGER_FAILED";

export type ConstitutionalDecisionValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ConstitutionalDecisionValidationFailureReason[];
  checks: Readonly<{
    contract_valid: boolean;
    governance_policy_compatible: boolean;
    rules_present: boolean;
    rules_integrity_valid: boolean;
    evidence_complete: boolean;
    authority_boundaries_valid: boolean;
    advisory_only: boolean;
    prohibited_execution_absent: boolean;
    constitutional_conflicts_absent: boolean;
    constitutional_supremacy_preserved: boolean;
    replay_valid: boolean;
  }>;
}>;

export type ConstitutionalDecisionValidationInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_rules?: readonly ConstitutionalRule[];
  authority_refs?: readonly string[];
  action_refs?: readonly string[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ConstitutionalDecisionValidationResult = Readonly<{
  constitutional_validation_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_rules: readonly ConstitutionalRule[];
  evaluations: readonly ConstitutionalRuleEvaluation[];
  evidence_report: ConstitutionalEvidenceReport;
  ledger_records: readonly ConstitutionalDecisionLedgerRecord[];
  validation: ConstitutionalDecisionValidation;
  replay_hash: string;
  failures: readonly ConstitutionalDecisionValidationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalDecisionValidationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  evaluated_rule_refs: readonly string[];
  evidence_report_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ConstitutionalDecisionValidationFailureReason[];
  integrity_hash: string;
}>;

export type ConstitutionalDecisionValidationObservability = Readonly<{
  constitutional_loading_events: number;
  rule_evaluation_events: number;
  authority_validation_events: number;
  advisory_validation_events: number;
  execution_prohibition_events: number;
  constitutional_conflict_events: number;
  validation_completion_events: number;
  replay_verification_events: number;
  ledger_append_events: number;
}>;

export type ConstitutionalDecisionValidatorFoundation = Readonly<{
  validator_version: "constitutional-decision-validator/v1";
  rule_categories: readonly ConstitutionalRuleCategory[];
  enforcement_levels: readonly ConstitutionalEnforcementLevel[];
  validation_results: readonly ConstitutionalValidationResultState[];
  result: ConstitutionalDecisionValidationResult;
  replay: ConstitutionalDecisionValidationReplay;
  observability: ConstitutionalDecisionValidationObservability;
}>;
