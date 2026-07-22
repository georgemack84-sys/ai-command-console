export type StevnOutcome = "PASS" | "FAIL" | "PRUNED";
export type StevnLifecycleStatus = "REGISTERED" | "DESIGNING" | "IMPLEMENTING" | "INTEGRATING" | "VALIDATING" | "CERTIFICATION_IN_PROGRESS" | "CERTIFIED" | "RELEASE_CANDIDATE" | "ACTIVE" | "SUSPENDED" | "DEPRECATED" | "RETIRED" | "REVOKED";
export type StevnCertificationStatus = "NOT_CERTIFIED" | "CERTIFICATION_IN_PROGRESS" | "CERTIFIED" | "CERTIFICATION_SUSPENDED" | "CERTIFICATION_REVOKED" | "CERTIFICATION_EXPIRED";
export type StevnCertificationDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type StevnCapabilityClass = "APPLICATION_NATIVE" | "CCI_CONSUMED" | "CAF_COMPOSED" | "MISSION_CONTROL_CONSUMED" | "STEVN_FRAMEWORK_CONSUMED" | "EXTERNAL_GOVERNED_SERVICE" | "PROHIBITED";
export type StevnInterfaceClass = "READ_ONLY" | "ADVISORY_INPUT" | "ADVISORY_OUTPUT" | "GOVERNED_COMMAND_REQUEST" | "EVENT_SUBSCRIPTION" | "EVIDENCE_REFERENCE" | "REPLAY_REFERENCE" | "PROHIBITED";
export type StevnDivergenceClass = "INPUT" | "CONFIGURATION" | "DEPENDENCY" | "POLICY" | "MODEL" | "CAPABILITY" | "ORDERING" | "TEMPORAL" | "AUTHORITY" | "OPERATOR" | "OUTPUT" | "UNEXPLAINED" | "NONDETERMINISTIC";

export type StevnFailure =
  | "P4_11_MISSION_CONTROL_INVALID"
  | "P4_10_OPERATIONAL_INTELLIGENCE_INVALID"
  | "P4_9_REPLAY_AUDIT_INVALID"
  | "P4_8_GOVERNANCE_BINDING_INVALID"
  | "P4_7_EVIDENCE_GOVERNANCE_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "PROGRAM_2_CCI_INVALID"
  | "PROGRAM_3_CAF_INVALID"
  | "STEVN_APPLICATION_MISSING"
  | "APPLICATION_CONSTITUTION_MISSING"
  | "APPLICATION_FRAMEWORK_DISTINCTION_MISSING"
  | "AMBIGUOUS_STEVN_TERMINOLOGY"
  | "FRAMEWORK_OWNERSHIP_CONFLICT"
  | "NAMESPACE_COLLISION"
  | "APPLICATION_REGISTRATION_MISSING"
  | "IDENTITY_RECORD_MISSING"
  | "CAPABILITY_MAP_MISSING"
  | "HIDDEN_CAPABILITY"
  | "CAPABILITY_DEPENDENCY_UNAVAILABLE"
  | "DOMAIN_MODEL_MISSING"
  | "WORKFLOW_STATE_MODEL_INVALID"
  | "EXPERIENCE_LAYER_MISSING"
  | "OPERATOR_WARNING_VIEW_MISSING"
  | "CCI_INTEGRATION_MISSING"
  | "LOCAL_CCI_DUPLICATION_ATTEMPTED"
  | "CAF_INTEGRATION_MISSING"
  | "CAF_GATE_SEQUENCE_INVALID"
  | "UNDECLARED_AGENT_CAPABILITY"
  | "MISSION_CONTROL_INTEGRATION_MISSING"
  | "FRAMEWORK_INTERFACE_UNAUTHORIZED"
  | "GOVERNANCE_BINDING_MISSING"
  | "AUTHORITY_EXPANSION"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_BYPASS"
  | "POLICY_UNAVAILABLE"
  | "EVIDENCE_INDEX_MISSING"
  | "MATERIAL_EVIDENCE_MISSING"
  | "EVIDENCE_STORAGE_DUPLICATED"
  | "REPLAY_ANALYSIS_MISSING"
  | "UNEXPLAINED_DIVERGENCE"
  | "NONDETERMINISTIC_BEHAVIOR"
  | "REPLAY_ENGINE_DUPLICATED"
  | "OBSERVABILITY_MISSING"
  | "DEPENDENCY_HEALTH_UNOBSERVABLE"
  | "SECURITY_MODEL_INVALID"
  | "TENANT_ISOLATION_FAILURE"
  | "PRIVILEGE_ESCALATION_UNBLOCKED"
  | "LIFECYCLE_RECORD_MISSING"
  | "ROLLBACK_UNAVAILABLE"
  | "CERTIFICATION_FAILED"
  | "UNCERTIFIED_DEPENDENCY"
  | "SECURITY_FINDING_UNRESOLVED"
  | "UNCERTIFIED_ACTIVATION_PATH"
  | "PRODUCTION_ACTIVATION_MISSING"
  | "RELEASE_ARTIFACT_MISMATCH"
  | "CERTIFICATION_PRUNED";

export type StevnScenario = "BASELINE" | StevnFailure;
export type StevnInput = Readonly<{ scenario?: StevnScenario; application_id?: string; tenant_id?: string; session_id?: string }>;

export type StevnRecord = Readonly<{
  record_id: string;
  application_id: string;
  tenant_id: string;
  version: "stevn-application/v4.17";
  lifecycle_status: StevnLifecycleStatus;
  created_at: "2026-07-18T00:00:00.000Z";
  refs: readonly string[];
  source_refs: readonly string[];
  policy_refs: readonly string[];
  authority_refs: readonly string[];
  operator_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type StevnFoundation = StevnRecord & Readonly<{
  application_name: "STEVN Application";
  application_namespace: "civitas.application.stevn";
  framework_namespace: "mission_control.framework.stevn";
  owns_application: true;
  owns_framework: false;
  advisory_boundary: true;
  distinction_contract_ref: string;
  registration_ref: string;
  namespace_collision_free: boolean;
}>;

export type StevnCapabilityBinding = StevnRecord & Readonly<{ classifications: readonly StevnCapabilityClass[]; hidden_capabilities: readonly string[]; degradation_matrix_ref: string }>;
export type StevnDomainModel = StevnRecord & Readonly<{ core_records: readonly string[]; deterministic_identifiers: boolean; workflow_state_model_valid: boolean }>;
export type StevnExperience = StevnRecord & Readonly<{ views: readonly string[]; provenance_visible: boolean; warnings_visible: boolean; hidden_autonomy: boolean }>;
export type StevnIntegration = StevnRecord & Readonly<{ cci_bindings: readonly string[]; caf_gate_sequence: readonly string[]; mission_control_interfaces: readonly StevnInterfaceClass[]; framework_interfaces: readonly StevnInterfaceClass[]; duplicates_shared_infrastructure: boolean; unauthorized_framework_access: boolean }>;
export type StevnGovernance = StevnRecord & Readonly<{ authority_gate_ref: string; policy_gate_ref: string; safety_gate_ref: string; approval_routing_ref: string; operator_disposition_refs: readonly string[]; expands_authority: boolean; bypasses_governance: boolean; bypasses_operator: boolean }>;
export type StevnEvidence = StevnRecord & Readonly<{ evidence_index_refs: readonly string[]; source_registry_refs: readonly string[]; provenance_view_refs: readonly string[]; material_evidence_complete: boolean; owns_canonical_storage: boolean }>;
export type StevnReplay = StevnRecord & Readonly<{ replay_request_refs: readonly string[]; divergence_classes: readonly StevnDivergenceClass[]; unexplained_divergence: boolean; nondeterministic_divergence: boolean; executes_replay_engine: boolean }>;
export type StevnOperations = StevnRecord & Readonly<{ dashboard_views: readonly string[]; dependency_health_observable: boolean; incident_status_visible: boolean; certification_status_visible: boolean }>;
export type StevnSecurity = StevnRecord & Readonly<{ tenant_isolation_validated: boolean; namespace_spoofing_detected: boolean; privilege_escalation_blocked: boolean; access_control_matrix_ref: string }>;
export type StevnLifecycle = StevnRecord & Readonly<{ release_manifest_ref: string; version_lineage_ref: string; rollback_plan_ref: string; rollback_validated: boolean; activation_prevented_when_uncertified: boolean }>;
export type StevnCertification = Readonly<{ certification_id: string; status: StevnCertificationStatus; decision: StevnCertificationDecision; outcome: StevnOutcome; phase_ready: boolean; distinction_verified: boolean; namespace_integrity: boolean; capability_complete: boolean; integrations_validated: boolean; governance_compliant: boolean; evidence_complete: boolean; replay_passed: boolean; observability_operational: boolean; tenant_isolation_passed: boolean; rollback_ready: boolean; production_ready: boolean; no_out_of_scope_ownership: boolean; failures: readonly StevnFailure[]; integrity_hash: string }>;
export type StevnActivation = StevnRecord & Readonly<{ production_environment_ref: string; certificate_ref: string; release_artifact_ref: string; activation_authority_ref: string; activated: boolean }>;

export type StevnResult = Readonly<{
  phase_version: "stevn-application/v4.17";
  phase_identifier: "STEVNApplication";
  mission_control_ref: "mission-control/v4.11";
  foundation: StevnFoundation;
  capabilities: StevnCapabilityBinding;
  domain_model: StevnDomainModel;
  experience: StevnExperience;
  integrations: StevnIntegration;
  governance: StevnGovernance;
  evidence: StevnEvidence;
  replay: StevnReplay;
  operations: StevnOperations;
  security: StevnSecurity;
  lifecycle: StevnLifecycle;
  certification: StevnCertification;
  activation: StevnActivation;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StevnValidation = Readonly<{
  valid: boolean;
  outcome: StevnOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  capabilities_valid: boolean;
  domain_valid: boolean;
  experience_valid: boolean;
  integrations_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  replay_valid: boolean;
  operations_valid: boolean;
  security_valid: boolean;
  lifecycle_valid: boolean;
  certification_valid: boolean;
  activation_valid: boolean;
  failures: readonly StevnFailure[];
  integrity_hash: string;
}>;

export type StevnBundle = Readonly<{
  doctrine: Readonly<{ version: "stevn-application/v4.17"; owns_stevn_application: true; owns_stevn_framework: false; owns_mission_control_architecture: false; owns_cci_infrastructure: false; owns_caf_runtime: false; owns_governance_engines: false; owns_replay_engine: false; owns_evidence_storage: false; owns_certification_engine: false; advisory_boundary: true }>;
  result: StevnResult;
  validation: StevnValidation;
}>;
