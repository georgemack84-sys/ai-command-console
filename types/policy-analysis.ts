export type PolicyAnalysisState = "CREATED" | "VALIDATED" | "REPLAYABLE" | "RESTRICTED" | "SUPERSEDED" | "INVALID" | "ARCHIVED";

export type PolicyAnalysisPolicyType =
  | "GOVERNANCE_POLICY"
  | "SECURITY_POLICY"
  | "RUNTIME_POLICY"
  | "AUTHORITY_POLICY"
  | "COMPLIANCE_POLICY"
  | "RISK_POLICY"
  | "CERTIFICATION_POLICY"
  | "TENANT_POLICY"
  | "MISSION_POLICY"
  | "RECOVERY_POLICY"
  | "VISIBILITY_POLICY"
  | "SIMULATION_POLICY";

export type PolicyInheritanceMode = "NONE" | "STRICT" | "CONDITIONAL" | "PARTIAL" | "BLOCKED";

export type PolicyAnalysisValidationState = "PASS" | "FAIL";

export type PolicyAnalysisFailureReason =
  | "POLICY_ANALYSIS_ID_MISSING"
  | "POLICY_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "POLICY_VERSION_MISSING"
  | "POLICY_NAME_MISSING"
  | "UNKNOWN_POLICY_TYPE"
  | "AUTHORITY_SCOPE_MISSING"
  | "GOVERNANCE_SCOPE_MISSING"
  | "CONSTRAINTS_MISSING"
  | "EXCEPTION_INVALID"
  | "PERMISSION_UNSCOPED"
  | "PROHIBITION_UNSCOPED"
  | "PROHIBITION_BYPASS_DETECTED"
  | "ENFORCEMENT_BOUNDARIES_MISSING"
  | "SOURCE_TRUTH_RECORDS_MISSING"
  | "TRUTH_TENANT_MISMATCH"
  | "LINEAGE_REFS_MISSING"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_OUTPUT_MISMATCH"
  | "TENANT_MISMATCH"
  | "IDENTIFIER_MUTATION"
  | "INVALID_ANALYSIS_STATE"
  | "INVALID_STATE_TRANSITION"
  | "CIRCULAR_INHERITANCE"
  | "ENFORCEMENT_LIMITS_MISSING"
  | "FOUNDATION_NOT_CERTIFIED";

export type PolicyAuthorityScope = Readonly<{
  governing_authority: string;
  approval_authority: string;
  review_authority: string;
  escalation_authority: string;
  operator_authority_required: boolean;
}>;

export type PolicyGovernanceScope = Readonly<{
  tenant_scope: string;
  mission_scope: string;
  system_scope: string;
  runtime_scope: "advisory_runtime" | "restricted_runtime" | "certification_runtime";
  risk_scope: string;
  certification_scope: "required" | "conditional" | "not_required";
  decision_scope: string;
  visibility_scope: string;
}>;

export type PolicyConstraint = Readonly<{
  constraint_id: string;
  category: "identity" | "tenant" | "authority" | "runtime" | "evidence" | "risk" | "certification" | "scope";
  rule: string;
  required: boolean;
  truth_reference: string;
}>;

export type PolicyException = Readonly<{
  exception_id: string;
  condition: string;
  allowed_behavior: string;
  authority_required: string;
  expiration_rule: string;
  truth_reference: string;
  replay_reference: string;
}>;

export type PolicyPermission = Readonly<{
  permission_id: string;
  behavior: string;
  scope: string;
  authority_ref: string;
}>;

export type PolicyProhibition = Readonly<{
  prohibition_id: string;
  behavior: string;
  scope: string;
  fail_closed: true;
}>;

export type PolicyEnforcementBoundaries = Readonly<{
  included_systems: readonly string[];
  excluded_systems: readonly string[];
  included_actions: readonly string[];
  excluded_actions: readonly string[];
  runtime_boundary: "advisory_only";
  operator_boundary: "operator_supremacy_preserved";
  governance_boundary: "constitution_supremacy_preserved";
  tenant_boundary: "tenant_scoped";
  max_authority: "advisory";
  blocked_actions: readonly string[];
  non_enforceable_domains: readonly string[];
  operator_override_rules: string;
  fail_closed_conditions: readonly string[];
}>;

export type PolicyTruthRecordRef = Readonly<{
  truth_record_id: string;
  event_type:
    | "POLICY_CREATED"
    | "POLICY_UPDATED"
    | "POLICY_SUPERSEDED"
    | "POLICY_RESTRICTED"
    | "POLICY_ARCHIVED"
    | "GOVERNANCE_DECISION"
    | "AUTHORITY_VALIDATION"
    | "RECOMMENDATION_GENERATED"
    | "VIOLATION_DETECTED"
    | "ESCALATION_TRIGGERED"
    | "RUNTIME_EVENT"
    | "CERTIFICATION_RESULT"
    | "REPLAY_RESULT";
  event_source: string;
  tenant_id: string;
  mission_id: string;
  lifecycle_state: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
  created_timestamp: string;
}>;

export type PolicyLineageRefs = Readonly<{
  parent_policy_id: string | null;
  child_policy_ids: readonly string[];
  superseded_policy_id: string | null;
  superseding_policy_id: string | null;
  inherited_policy_ids: readonly string[];
  related_policy_ids: readonly string[];
  dependency_refs: readonly string[];
  lineage_hash: string;
}>;

export type PolicyReplayRefs = Readonly<{
  input_snapshot_ref: string;
  policy_snapshot_ref: string;
  truth_snapshot_ref: string;
  analysis_algorithm_version: string;
  state_snapshot_ref: string;
  output_hash: string;
  replay_timestamp: string;
}>;

export type PolicyAnalysisRecord = Readonly<{
  schema_version: "policy-analysis-contract/v7B.1";
  policy_analysis_id: string;
  policy_id: string;
  tenant_id: string;
  policy_version: string;
  policy_name: string;
  policy_type: PolicyAnalysisPolicyType;
  authority_scope: PolicyAuthorityScope;
  governance_scope: PolicyGovernanceScope;
  constraints: readonly PolicyConstraint[];
  exceptions: readonly PolicyException[];
  permissions: readonly PolicyPermission[];
  prohibitions: readonly PolicyProhibition[];
  enforcement_boundaries: PolicyEnforcementBoundaries;
  source_truth_records: readonly PolicyTruthRecordRef[];
  lineage_refs: PolicyLineageRefs;
  replay_refs: PolicyReplayRefs;
  inheritance: Readonly<{
    inherits_from: readonly string[];
    inheritance_mode: PolicyInheritanceMode;
    inherited_constraints: readonly string[];
    inherited_exceptions: readonly string[];
    inheritance_limits: readonly string[];
  }>;
  supersession: Readonly<{
    supersedes: readonly string[];
    superseded_by: string | null;
    supersession_reason: string | null;
    effective_timestamp: string;
    historical_validity: "retained";
  }>;
  created_timestamp: string;
  analysis_state: PolicyAnalysisState;
  analysis_hash: string;
}>;

export type PolicyAnalysisValidationFailure = Readonly<{
  failure_id: string;
  reason: PolicyAnalysisFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type PolicyAnalysisValidationResult = Readonly<{
  validation_id: string;
  policy_analysis_id?: string;
  validation_state: PolicyAnalysisValidationState;
  failures: readonly PolicyAnalysisValidationFailure[];
  policy_analysis_hash?: string;
  deterministic: true;
  replayable: boolean;
  tenant_scoped: boolean;
  advisory_only: true;
}>;

export type PolicyAnalysisDoctrine = Readonly<{
  principles: readonly ("deterministic" | "replayable" | "tenant-scoped" | "versioned" | "auditable" | "lineage-preserving" | "truth-ledger-compatible" | "governance-safe" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  supported_policy_types: readonly PolicyAnalysisPolicyType[];
  allowed_state_transitions: Readonly<Record<PolicyAnalysisState, readonly PolicyAnalysisState[]>>;
}>;

export type PolicyAnalysisReplayResult = Readonly<{
  replay_id: string;
  policy_analysis_id: string;
  validation_state: PolicyAnalysisValidationState;
  failure_reason: PolicyAnalysisFailureReason | null;
  reconstructed_hash: string;
  expected_hash: string;
  final_state: PolicyAnalysisState;
}>;

export type PolicyAnalysisObservabilitySurface = Readonly<{
  policy_analysis_id: string;
  policy_id: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  governing_authority: string;
  applicable_scope: PolicyGovernanceScope;
  constraints: readonly PolicyConstraint[];
  exceptions: readonly PolicyException[];
  permissions: readonly PolicyPermission[];
  prohibitions: readonly PolicyProhibition[];
  enforcement_boundaries: PolicyEnforcementBoundaries;
  source_truth_records: readonly PolicyTruthRecordRef[];
  lineage_refs: PolicyLineageRefs;
  replay_refs: PolicyReplayRefs;
  analysis_state: PolicyAnalysisState;
  validation_failures: readonly PolicyAnalysisValidationFailure[];
}>;
