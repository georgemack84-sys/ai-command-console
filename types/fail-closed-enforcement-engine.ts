import type { AuthorityApprovalResolverResult } from "@/types/authority-approval-requirement-resolver";
import type { CertificationReplayValidatorResult } from "@/types/certification-replay-requirement-validator";
import type { ConstitutionalDecisionValidationResult } from "@/types/constitutional-decision-validator";
import type { GovernanceDecisionContractValidation, GovernanceDecisionRecord, GovernanceEnforcementState } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";
import type { IntegrityLineageVerifierResult } from "@/types/integrity-immutable-lineage-verification";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type EnforcementBlockingCondition =
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_EVIDENCE_MISSING"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_UNRESOLVED"
  | "REPLAY_UNAVAILABLE"
  | "CERTIFICATION_MISSING"
  | "INTEGRITY_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_VIOLATION"
  | "UNKNOWN_VALIDATION_STATE"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "INCOMPLETE_VALIDATION_RECORD"
  | "DUPLICATE_ENFORCEMENT_EVALUATION"
  | "INVALID_APPROVAL_REFERENCE"
  | "CORRUPTED_VALIDATION_METADATA"
  | "UNAUTHORIZED_FAIL_CLOSED_ENFORCEMENT_ACCESS";

export type EnforcementValidationSnapshot = Readonly<{
  validation_ref: string;
  validation_type: "governance" | "governance_policy" | "constitutional" | "authority" | "tenant" | "certification" | "replay" | "integrity" | "lineage";
  validation_result: string;
  fail_closed: boolean;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  ledger_refs: readonly string[];
  integrity_hash: string;
}>;

export type EnforcementEvaluationRecord = Readonly<{
  enforcement_evaluation_id: string;
  governance_decision_id: string;
  mission_id: string;
  tenant_id: string;
  governance_result: string;
  constitutional_result: string;
  authority_result: string;
  tenant_result: string;
  certification_result: string;
  replay_result: string;
  integrity_result: string;
  lineage_result: string;
  enforcement_outcome: GovernanceEnforcementState;
  blocking_conditions: readonly EnforcementBlockingCondition[];
  escalation_requirements: readonly string[];
  approval_requirements: readonly string[];
  evidence_refs: readonly string[];
  replay_ref: string;
  created_at: string;
  integrity_hash: string;
}>;

export type EnforcementDecisionReport = Readonly<{
  report_id: string;
  governance_decision_id: string;
  validation_summary: readonly EnforcementValidationSnapshot[];
  blocking_conditions: readonly EnforcementBlockingCondition[];
  approval_requirements: readonly string[];
  escalation_requirements: readonly string[];
  enforcement_outcome: GovernanceEnforcementState;
  enforcement_rationale: readonly string[];
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type EnforcementLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  enforcement_outcome: GovernanceEnforcementState;
  validation_results: readonly string[];
  blocking_conditions: readonly EnforcementBlockingCondition[];
  approval_requirements: readonly string[];
  escalation_requirements: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type FailClosedRule = Readonly<{
  rule_id: string;
  blocking_condition: EnforcementBlockingCondition;
  enforcement_outcome: "FAIL_CLOSED";
  mandatory: true;
}>;

export type FailClosedEnforcementInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  governance_validation?: GovernanceDecisionContractValidation;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_result?: ConstitutionalDecisionValidationResult;
  authority_result?: AuthorityApprovalResolverResult;
  tenant_result?: TenantIsolationValidatorResult;
  certification_replay_result?: CertificationReplayValidatorResult;
  integrity_lineage_result?: IntegrityLineageVerifierResult;
  existing_enforcement_evaluation_ids?: readonly string[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type FailClosedEnforcementValidation = Readonly<{
  validation_state: "VALID" | "FAILED_CLOSED";
  fail_closed: boolean;
  failures: readonly EnforcementBlockingCondition[];
  checks: Readonly<{
    governance_complete: boolean;
    constitutional_complete: boolean;
    authority_complete: boolean;
    tenant_complete: boolean;
    certification_complete: boolean;
    replay_complete: boolean;
    integrity_complete: boolean;
    lineage_complete: boolean;
    approvals_valid: boolean;
    metadata_intact: boolean;
  }>;
}>;

export type FailClosedEnforcementResult = Readonly<{
  enforcement_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  governance_validation: GovernanceDecisionContractValidation;
  governance_policy_result: GovernancePolicyValidationResult;
  constitutional_result: ConstitutionalDecisionValidationResult;
  authority_result: AuthorityApprovalResolverResult;
  tenant_result: TenantIsolationValidatorResult;
  certification_replay_result: CertificationReplayValidatorResult;
  integrity_lineage_result: IntegrityLineageVerifierResult;
  rule_registry: readonly FailClosedRule[];
  evaluation_record: EnforcementEvaluationRecord;
  decision_report: EnforcementDecisionReport;
  ledger_records: readonly EnforcementLedgerRecord[];
  validation: FailClosedEnforcementValidation;
  replay_hash: string;
  failures: readonly EnforcementBlockingCondition[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type FailClosedEnforcementReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  enforcement_outcome: GovernanceEnforcementState;
  blocking_conditions: readonly EnforcementBlockingCondition[];
  approval_requirements: readonly string[];
  escalation_requirements: readonly string[];
  report_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly EnforcementBlockingCondition[];
  integrity_hash: string;
}>;

export type FailClosedEnforcementObservability = Readonly<{
  enforcement_evaluation_events: number;
  fail_closed_events: number;
  blocking_condition_events: number;
  approval_requirement_events: number;
  escalation_events: number;
  enforcement_outcome_events: number;
  replay_verification_events: number;
  ledger_append_events: number;
}>;

export type FailClosedEnforcementFoundation = Readonly<{
  engine_version: "fail-closed-enforcement-engine/v1";
  enforcement_outcomes: readonly GovernanceEnforcementState[];
  rule_registry: readonly FailClosedRule[];
  result: FailClosedEnforcementResult;
  replay: FailClosedEnforcementReplay;
  observability: FailClosedEnforcementObservability;
}>;
