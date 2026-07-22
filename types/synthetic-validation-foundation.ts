export type SyntheticValidationStatus = "REGISTERED" | "CONFIGURED" | "VALIDATED" | "AUTHORIZED" | "EXECUTING" | "COMPLETED" | "REPLAYABLE" | "ARCHIVED";
export type SyntheticValidationScopeCategory = "MISSION_VALIDATION" | "STRATEGY_VALIDATION" | "RECOMMENDATION_VALIDATION" | "GOVERNANCE_VALIDATION" | "POLICY_VALIDATION" | "RISK_VALIDATION" | "CONFIDENCE_VALIDATION" | "REPLAY_VALIDATION" | "RESILIENCE_VALIDATION" | "SCALE_VALIDATION" | "ADVERSARIAL_VALIDATION";
export type SyntheticValidationOutcome = "APPROVED" | "REJECTED";
export type SyntheticValidationFailure = "ADVISORY_BOUNDARY_BREACH" | "AUTHORITY_HIERARCHY_BREACH" | "NON_DETERMINISTIC_EXECUTION" | "REPLAY_PACKAGE_INCOMPLETE" | "GOVERNANCE_NOT_APPROVED" | "TENANT_ISOLATION_BREACH" | "INVALID_LIFECYCLE_TRANSITION" | "MISSING_POLICY_MANIFEST" | "MISSING_GOVERNANCE_CONTEXT" | "IDENTITY_MUTATION" | "LINEAGE_INCOMPLETE" | "AUDIT_INCOMPLETE" | "UNAUTHORIZED_OPERATIONAL_ACTION";
export type SyntheticValidationScenario = "BASELINE" | SyntheticValidationFailure;

export type SyntheticValidationInput = Readonly<{
  scenario?: SyntheticValidationScenario;
  tenant_id?: string;
  validation_name?: string;
  validation_scope?: SyntheticValidationScopeCategory;
  owner?: string;
}>;

export type SyntheticValidationContract = Readonly<{
  contract_version: "synthetic-validation-foundation/v14.1";
  definition: string;
  constitutional_authority_order: readonly ["CONSTITUTION", "GOVERNANCE_AUTHORITY", "OPERATOR_AUTHORITY", "SYNTHETIC_VALIDATION"];
  advisory_only: boolean;
  deterministic_execution_required: boolean;
  replay_required: boolean;
  audit_required: boolean;
  governance_approval_required: boolean;
  tenant_isolation_required: boolean;
  operational_execution_allowed: false;
  integrity_hash: string;
}>;

export type ValidationLifecycleContract = Readonly<{
  lifecycle_id: string;
  states: readonly SyntheticValidationStatus[];
  transition_order: readonly SyntheticValidationStatus[];
  cannot_skip_stages: boolean;
  cannot_regress_without_governed_replay: boolean;
  cannot_execute_before_authorization: boolean;
  completed_results_immutable: boolean;
  archive_requires_replay_certification: boolean;
  invalid_transitions: readonly string[];
  integrity_hash: string;
}>;

export type ValidationScopeRegistryEntry = Readonly<{
  validation_id: string;
  validation_name: string;
  validation_type: "SYNTHETIC_VALIDATION";
  tenant_id: string;
  mission_scope: string;
  validation_scope: SyntheticValidationScopeCategory;
  objectives: readonly string[];
  simulation_targets: readonly string[];
  policy_manifest_ref: string;
  governance_scope: string;
  replay_scope: string;
  owner: string;
  creation_timestamp: string;
  integrity_hash: string;
}>;

export type SyntheticValidationRecord = Readonly<{
  validation_id: string;
  validation_name: string;
  validation_version: "14.1";
  tenant_id: string;
  mission_scope: string;
  validation_type: "SYNTHETIC_VALIDATION";
  validation_scope: SyntheticValidationScopeCategory;
  validation_status: SyntheticValidationStatus;
  owner: string;
  policy_manifest_ref: string;
  governance_context_ref: string;
  execution_profile_ref: string;
  configuration_ref: string;
  replay_package_ref: string;
  lineage_ref: string;
  audit_ref: string;
  origin_ref: string;
  created_timestamp: string;
  completed_timestamp: string | null;
  integrity_hash: string;
}>;

export type SyntheticValidationGovernanceModel = Readonly<{
  governance_model_id: string;
  approved_governance: boolean;
  authority_hierarchy_preserved: boolean;
  tenant_isolation_enforced: boolean;
  unauthorized_execution_rejected: boolean;
  fail_closed_on_governance_violation: boolean;
  immutable_audit_preserved: boolean;
  replay_ownership_preserved: boolean;
  integrity_hash: string;
}>;

export type SyntheticValidationReplayModel = Readonly<{
  replay_model_id: string;
  preserves_configuration: boolean;
  preserves_execution_ordering: boolean;
  preserves_dependency_graph: boolean;
  preserves_governance_decisions: boolean;
  preserves_policy_manifest: boolean;
  preserves_evidence_inputs: boolean;
  preserves_outputs: boolean;
  preserves_integrity_verification: boolean;
  preserves_lifecycle_transitions: boolean;
  preserves_audit_history: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type SyntheticValidationFoundationResult = Readonly<{
  phase_version: "synthetic-validation-foundation/v14.1";
  phase_identifier: "SyntheticValidationFoundation";
  contract: SyntheticValidationContract;
  lifecycle: ValidationLifecycleContract;
  registry_entry: ValidationScopeRegistryEntry;
  identity_record: SyntheticValidationRecord;
  governance: SyntheticValidationGovernanceModel;
  replay: SyntheticValidationReplayModel;
  deterministic_execution: Readonly<{ scheduling: true; dependency_ordering: true; policy_binding: true; governance_resolution: true; evidence_qualification: true; state_transitions: true; completion_semantics: true; integrity_hash: string }>;
  advisory_constraints: readonly string[];
  failures: readonly SyntheticValidationFailure[];
  outcome: SyntheticValidationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SyntheticValidationFoundationValidation = Readonly<{
  valid: boolean;
  outcome: SyntheticValidationOutcome;
  contract_valid: boolean;
  lifecycle_valid: boolean;
  registry_valid: boolean;
  identity_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  deterministic_valid: boolean;
  advisory_valid: boolean;
  failures: readonly SyntheticValidationFailure[];
  integrity_hash: string;
}>;

export type SyntheticValidationFoundationBundle = Readonly<{
  doctrine: Readonly<{
    version: "synthetic-validation-foundation/v14.1";
    constitutional_root_for_phase_14: true;
    advisory_only_boundary_immutable: true;
    deterministic_lifecycle_required: true;
    immutable_identity_required: true;
    replay_required_before_archive: true;
    foundation_for: readonly string[];
  }>;
  result: SyntheticValidationFoundationResult;
  validation: SyntheticValidationFoundationValidation;
}>;
