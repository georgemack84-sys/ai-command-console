export type SyntheticEnvironmentLifecycleState = "DEFINED" | "REGISTERED" | "CONFIGURED" | "QUALIFIED" | "ACTIVE" | "SUSPENDED" | "RETIRED" | "ARCHIVED";
export type SyntheticEnvironmentType = "DEVELOPMENT" | "VALIDATION" | "REPLAY" | "CERTIFICATION" | "STRESS_TEST" | "CHAOS_TEST" | "ADVERSARIAL_TEST" | "SCALE_TEST" | "FAILURE_SIMULATION" | "COMPLIANCE_TEST";
export type SyntheticEnvironmentQualificationOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "DISQUALIFIED";
export type SyntheticEnvironmentOutcome = "APPROVED" | "REJECTED";
export type SyntheticEnvironmentFailure = "FOUNDATION_NOT_APPROVED" | "IDENTITY_MUTATION" | "VERSION_MUTATION" | "CONFIGURATION_INCOMPLETE" | "DEPENDENCY_INTEGRITY_FAILURE" | "NON_DETERMINISTIC_CONFIGURATION" | "REPLAY_DIVERGENCE" | "GOVERNANCE_NOT_APPROVED" | "TENANT_ISOLATION_BREACH" | "EXECUTION_ISOLATION_BREACH" | "SECURITY_CONTROL_FAILURE" | "UNQUALIFIED_ACTIVATION" | "AUDIT_LEDGER_MUTABLE" | "ADVISORY_BOUNDARY_BREACH" | "UNDEFINED_ENVIRONMENT_TYPE";
export type SyntheticEnvironmentScenario = "BASELINE" | SyntheticEnvironmentFailure | "CONDITIONAL_QUALIFICATION";

export type SyntheticEnvironmentArchitectureInput = Readonly<{
  scenario?: SyntheticEnvironmentScenario;
  tenant_scope?: string;
  environment_name?: string;
  environment_type?: SyntheticEnvironmentType;
  owner?: string;
}>;

export type SyntheticEnvironmentContract = Readonly<{
  contract_version: "synthetic-environment-architecture/v14.2";
  synthetic_validation_contract_ref: string;
  deterministic_identity_required: boolean;
  immutable_lifecycle_required: boolean;
  reproducible_configuration_required: boolean;
  qualification_required_before_use: boolean;
  tenant_isolation_required: boolean;
  execution_isolation_required: boolean;
  production_isolation_required: boolean;
  advisory_only: boolean;
  operational_execution_authority: false;
  allowed_environment_types: readonly SyntheticEnvironmentType[];
  lifecycle_states: readonly SyntheticEnvironmentLifecycleState[];
  integrity_hash: string;
}>;

export type SyntheticEnvironmentRecord = Readonly<{
  environment_id: string;
  environment_name: string;
  environment_type: SyntheticEnvironmentType;
  version_id: string;
  configuration_version: string;
  lifecycle_state: SyntheticEnvironmentLifecycleState;
  qualification_status: SyntheticEnvironmentQualificationOutcome;
  qualification_refs: readonly string[];
  tenant_scope: string;
  isolation_profile: string;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_hash: string;
  created_by: string;
  created_timestamp: string;
  retired_timestamp: string | null;
  archived_timestamp: string | null;
}>;

export type SyntheticEnvironmentVersionRecord = Readonly<{
  version_id: string;
  parent_version: string | null;
  configuration_lineage: readonly string[];
  change_rationale: string;
  compatibility_status: "COMPATIBLE" | "CONDITIONALLY_COMPATIBLE" | "INCOMPATIBLE";
  replay_compatibility: boolean;
  qualification_status: SyntheticEnvironmentQualificationOutcome;
  supersession_history: readonly string[];
  immutable: boolean;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentConfiguration = Readonly<{
  configuration_id: string;
  runtime_configuration: string;
  infrastructure_profile: string;
  dependency_versions: readonly string[];
  service_topology: readonly string[];
  seed_configuration: string;
  deterministic_execution_parameters: readonly string[];
  tenant_isolation_settings: readonly string[];
  security_profile: string;
  governance_configuration: string;
  immutable_after_qualification: boolean;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentQualificationReport = Readonly<{
  qualification_id: string;
  outcome: SyntheticEnvironmentQualificationOutcome;
  configuration_complete: boolean;
  dependencies_verified: boolean;
  deterministic_configuration: boolean;
  replay_ready: boolean;
  security_verified: boolean;
  governance_compliant: boolean;
  tenant_isolation_verified: boolean;
  constitutional_constraints_satisfied: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type SyntheticEnvironmentIsolationReport = Readonly<{
  isolation_id: string;
  tenant_isolation: boolean;
  execution_isolation: boolean;
  storage_isolation: boolean;
  network_isolation: boolean;
  credential_isolation: boolean;
  artifact_isolation: boolean;
  replay_isolation: boolean;
  governance_isolation: boolean;
  boundary_violations: readonly string[];
  integrity_hash: string;
}>;

export type SyntheticEnvironmentReplayContract = Readonly<{
  replay_id: string;
  identical_configuration: boolean;
  identical_dependency_versions: boolean;
  identical_execution_ordering: boolean;
  identical_environment_state: boolean;
  identical_qualification_state: boolean;
  identical_governance_evaluation: boolean;
  divergence_is_constitutional_event: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentGovernanceValidation = Readonly<{
  governance_validation_id: string;
  canonical_owner: boolean;
  qualification_prior_to_activation: boolean;
  immutable_lineage_preserved: boolean;
  immutable_audit_history_preserved: boolean;
  replay_compatibility_preserved: boolean;
  unauthorized_modification_prohibited: boolean;
  constitutional_constraints_preserved: boolean;
  advisory_only_boundary_maintained: boolean;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentAuditLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "REGISTERED" | "CONFIGURATION_VALIDATED" | "QUALIFICATION_DECIDED" | "LIFECYCLE_TRANSITIONED" | "REPLAY_VALIDATED" | "GOVERNANCE_APPROVED" | "INTEGRITY_VALIDATED" | "RETIREMENT_RECORDED";
  environment_id: string;
  sequence: number;
  evidence_refs: readonly string[];
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentInvariant = Readonly<{
  invariant_id: "SIA-001" | "SIA-002" | "SIA-003" | "SIA-004" | "SIA-005" | "SIA-006" | "SIA-007" | "SIA-008" | "SIA-009" | "SIA-010";
  name: string;
  satisfied: boolean;
  failure_reason: SyntheticEnvironmentFailure | null;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentArchitectureResult = Readonly<{
  phase_version: "synthetic-environment-architecture/v14.2";
  phase_identifier: "SyntheticEnvironmentArchitecture";
  foundation_ref: string;
  contract: SyntheticEnvironmentContract;
  registry: readonly SyntheticEnvironmentRecord[];
  environment: SyntheticEnvironmentRecord;
  lifecycle: Readonly<{ lifecycle_id: string; states: readonly SyntheticEnvironmentLifecycleState[]; transition_order: readonly SyntheticEnvironmentLifecycleState[]; invalid_transitions_rejected: boolean; lifecycle_replayable: boolean; integrity_hash: string }>;
  version_registry: readonly SyntheticEnvironmentVersionRecord[];
  configuration: SyntheticEnvironmentConfiguration;
  qualification: SyntheticEnvironmentQualificationReport;
  isolation: SyntheticEnvironmentIsolationReport;
  replay: SyntheticEnvironmentReplayContract;
  governance: SyntheticEnvironmentGovernanceValidation;
  audit_ledger: readonly SyntheticEnvironmentAuditLedgerEntry[];
  invariants: readonly SyntheticEnvironmentInvariant[];
  failures: readonly SyntheticEnvironmentFailure[];
  outcome: SyntheticEnvironmentOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SyntheticEnvironmentArchitectureValidation = Readonly<{
  valid: boolean;
  outcome: SyntheticEnvironmentOutcome;
  contract_valid: boolean;
  registry_valid: boolean;
  lifecycle_valid: boolean;
  version_valid: boolean;
  configuration_valid: boolean;
  qualification_valid: boolean;
  isolation_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  audit_valid: boolean;
  invariants_valid: boolean;
  failures: readonly SyntheticEnvironmentFailure[];
  integrity_hash: string;
}>;

export type SyntheticEnvironmentArchitectureBundle = Readonly<{
  doctrine: Readonly<{
    version: "synthetic-environment-architecture/v14.2";
    foundation_phase: "synthetic-validation-foundation/v14.1";
    qualification_outcomes: readonly SyntheticEnvironmentQualificationOutcome[];
    environment_types: readonly SyntheticEnvironmentType[];
    constitutional_invariants: readonly SyntheticEnvironmentInvariant["invariant_id"][];
  }>;
  result: SyntheticEnvironmentArchitectureResult;
  validation: SyntheticEnvironmentArchitectureValidation;
}>;
