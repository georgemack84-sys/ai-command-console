import type { AdaptationStateMachineResult } from "@/types/adaptation-state-machine";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveAuthorityLevel = "OBSERVATION" | "ANALYSIS" | "RECOMMENDATION" | "SIMULATION" | "ADVISORY_SUPPORT";
export type ProhibitedAuthorityLevel = "EXECUTION_AUTHORITY" | "GOVERNANCE_AUTHORITY" | "CERTIFICATION_AUTHORITY" | "APPROVAL_AUTHORITY" | "CONSTITUTIONAL_AUTHORITY";
export type AuthorityBindingDecision = "PASS" | "REJECT";
export type AuthorityBindingValidationState = "PASS" | "FAIL";

export type AuthorityGovernanceCheck =
  | "STATE_MACHINE"
  | "AUTHORITY_SCOPE"
  | "AUTHORITY_LEVEL"
  | "GOVERNANCE_BINDING"
  | "CONSTITUTIONAL_BINDING"
  | "OPERATOR_SUPREMACY"
  | "SEPARATION_OF_DUTIES"
  | "REPLAY_BINDING"
  | "CERTIFICATION_BINDING"
  | "TENANT_ISOLATION"
  | "INTEGRITY"
  | "ADVISORY_ONLY";

export type AuthorityGovernanceFailure =
  | "ADAPTATION_STATE_MACHINE_INVALID"
  | "AUTHORITY_EXCEEDS_ASSIGNED_SCOPE"
  | "AUTHORITY_LEVEL_PROHIBITED"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "CONSTITUTIONAL_MUTATION_ATTEMPTED"
  | "OPERATOR_AUTHORITY_BYPASSED"
  | "OPERATOR_SUPREMACY_VIOLATED"
  | "SEPARATION_OF_DUTIES_VIOLATED"
  | "UNAUTHORIZED_DELEGATION"
  | "RECURSIVE_DELEGATION"
  | "IMPLICIT_PERMISSION"
  | "PRIVILEGE_ESCALATION"
  | "HIDDEN_AUTHORITY"
  | "HIDDEN_EXECUTION_AUTHORITY"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_PREREQUISITES_MISSING"
  | "TENANT_AUTHORITY_CROSSOVER"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_AUTHORITY_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type AuthorityGovernanceBinding = Readonly<{
  binding_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_component: string;
  authority_scope: "TENANT" | "MISSION" | "PROPOSAL" | "ADAPTIVE_COMPONENT";
  authority_level: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  requested_authority: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  validated_authority: AdaptiveAuthorityLevel | "NONE";
  governance_policy_refs: readonly string[];
  constitutional_refs: readonly string[];
  operator_authority_required: boolean;
  governance_review_required: boolean;
  certification_required: boolean;
  separation_of_duties_verified: boolean;
  authority_validation_status: AuthorityBindingDecision;
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type AuthorityDecision = Readonly<{
  decision_id: string;
  binding_id: string;
  adaptive_component: string;
  requested_authority: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  validated_authority: AdaptiveAuthorityLevel | "NONE";
  governance_validation: AuthorityBindingDecision;
  constitutional_validation: AuthorityBindingDecision;
  operator_validation: AuthorityBindingDecision;
  separation_of_duties_status: AuthorityBindingDecision;
  validation_outcome: AuthorityBindingDecision;
  reason: string;
  integrity_hash: string;
}>;

export type AuthorityReplayModel = Readonly<{
  replay_model_id: string;
  binding_id: string;
  authority_requested: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  authority_assigned: AdaptiveAuthorityLevel | "NONE";
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  operator_required: boolean;
  validation_outcome: AuthorityBindingDecision;
  replay_refs: readonly string[];
  deterministic_reconstruction: boolean;
  integrity_reproducible: boolean;
  integrity_hash: string;
}>;

export type AuthorityGovernanceCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly AuthorityGovernanceCheck[];
  authority_scope_valid: boolean;
  authority_level_valid: boolean;
  governance_bound: boolean;
  constitutionally_valid: boolean;
  operator_supremacy_preserved: boolean;
  separation_of_duties_verified: boolean;
  replay_verified: boolean;
  certification_bound: boolean;
  tenant_isolation_preserved: boolean;
  advisory_only_preserved: boolean;
  integrity_verified: boolean;
  failure_analysis: readonly AuthorityGovernanceFailure[];
  certification_decision: AuthorityBindingValidationState;
  integrity_hash: string;
}>;

export type AuthorityGovernanceLedgerRecord = Readonly<{
  record_id: string;
  adaptive_component: string;
  tenant_id: string;
  mission_scope: readonly string[];
  requested_authority: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  validated_authority: AdaptiveAuthorityLevel | "NONE";
  governance_validation: AuthorityBindingDecision;
  constitutional_validation: AuthorityBindingDecision;
  operator_validation: AuthorityBindingDecision;
  separation_of_duties_status: AuthorityBindingDecision;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type AuthorityGovernanceValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  state_machine_valid: boolean;
  authority_within_scope: boolean;
  prohibited_authority_absent: boolean;
  governance_approved: boolean;
  constitutional_valid: boolean;
  operator_supremacy_preserved: boolean;
  separation_of_duties_verified: boolean;
  replay_bound: boolean;
  certification_bound: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly AuthorityGovernanceFailure[];
  integrity_hash: string;
}>;

export type AuthorityGovernanceBindingInput = Readonly<{
  adaptation_state?: AdaptationStateMachineResult;
  role?: VisibilityRole;
  requested_authority?: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel;
  scenario?:
    | "BASELINE"
    | "STATE_MACHINE_INVALID"
    | "AUTHORITY_SCOPE_EXCEEDED"
    | "PROHIBITED_AUTHORITY"
    | "MISSING_GOVERNANCE"
    | "GOVERNANCE_BYPASS"
    | "CONSTITUTIONAL_FAILURE"
    | "CONSTITUTIONAL_MUTATION"
    | "OPERATOR_BYPASS"
    | "OPERATOR_SUPREMACY_VIOLATION"
    | "SEPARATION_OF_DUTIES"
    | "UNAUTHORIZED_DELEGATION"
    | "RECURSIVE_DELEGATION"
    | "IMPLICIT_PERMISSION"
    | "PRIVILEGE_ESCALATION"
    | "HIDDEN_AUTHORITY"
    | "HIDDEN_EXECUTION_AUTHORITY"
    | "MISSING_REPLAY"
    | "MISSING_CERTIFICATION"
    | "TENANT_CROSSOVER"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type AuthorityGovernanceBindingResult = Readonly<{
  binding_version: "authority-governance-binding/v1";
  adaptation_state: AdaptationStateMachineResult;
  binding: AuthorityGovernanceBinding;
  authority_decision: AuthorityDecision;
  replay_model: AuthorityReplayModel;
  certification_report: AuthorityGovernanceCertificationReport;
  authority_ledger: readonly AuthorityGovernanceLedgerRecord[];
  validation: AuthorityGovernanceValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  authority_granted: boolean;
  permits_execution: false;
  mutates_governance: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AuthorityGovernanceBindingFoundation = Readonly<{
  binding_version: "authority-governance-binding/v1";
  checks: readonly AuthorityGovernanceCheck[];
  allowed_authority_levels: readonly AdaptiveAuthorityLevel[];
  result: AuthorityGovernanceBindingResult;
}>;
