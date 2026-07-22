export type ProvingProvisioningOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ProvingIdentityKind = "ENVIRONMENT" | "EXECUTION" | "SERVICE" | "OPERATOR" | "AUTOMATION" | "WORKLOAD";
export type ProvingProvisioningLifecycleState = "REQUESTED" | "PROVISIONING" | "INITIALIZING" | "VALIDATING" | "READY" | "ACTIVE" | "SUSPENDED" | "RETIRING" | "ARCHIVED";
export type ProvingEnvironmentClass = "DEVELOPMENT" | "CONTROLLED" | "GOVERNED" | "CERTIFICATION_GRADE";
export type ProvingProvisioningEnvironmentType = "DEVELOPMENT" | "SANDBOX" | "VALIDATION" | "QUALIFICATION" | "CERTIFICATION" | "REPLAY" | "REGRESSION" | "PERFORMANCE" | "LOAD" | "SECURITY" | "CHAOS" | "COMPLIANCE" | "EXPERIMENTAL";

export type ProvingProvisioningFailure =
  | "P6_1_FOUNDATION_INVALID"
  | "ENVIRONMENT_IDENTITY_MISSING"
  | "GLOBAL_ID_NOT_UNIQUE"
  | "IMMUTABLE_IDENTITY_VIOLATION"
  | "ENVIRONMENT_OWNERSHIP_MISSING"
  | "ENVIRONMENT_CLASSIFICATION_MISSING"
  | "ENVIRONMENT_REGISTRY_MISSING"
  | "ENVIRONMENT_REGISTRY_INCOMPLETE"
  | "IDENTITY_REGISTRY_MISSING"
  | "IDENTITY_LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_FAILURE"
  | "MULTI_TENANT_BINDING_DETECTED"
  | "TENANT_BOUNDARY_CROSSED"
  | "NAMESPACE_ISOLATION_FAILURE"
  | "NAMESPACE_NOT_UNIQUE"
  | "NAMESPACE_MUTATED"
  | "PROVISIONING_PIPELINE_MISSING"
  | "PROVISIONING_NONDETERMINISTIC"
  | "TRUST_DOMAIN_BINDING_MISSING"
  | "POLICY_ATTACHMENT_MISSING"
  | "SERVICE_DEPLOYMENT_MISSING"
  | "STORAGE_ALLOCATION_MISSING"
  | "EVENT_REGISTRATION_MISSING"
  | "AUDIT_INITIALIZATION_MISSING"
  | "LIFECYCLE_MODEL_MISSING"
  | "LIFECYCLE_TRANSITION_UNGOVERNED"
  | "LIFECYCLE_AUDIT_EVIDENCE_MISSING"
  | "RETIREMENT_MODEL_MISSING"
  | "RETIRED_ENVIRONMENT_REACTIVATED"
  | "IDENTITY_REUSED_AFTER_RETIREMENT"
  | "EVIDENCE_PRESERVATION_MISSING"
  | "ARCHIVAL_NOT_IMMUTABLE"
  | "LINEAGE_MISSING"
  | "LINEAGE_OVERWRITE_DETECTED"
  | "REPLAY_IDENTITY_REFERENCE_MUTABLE"
  | "CONFIGURATION_NOT_REPRODUCIBLE"
  | "ISOLATION_POLICY_VIOLATION_NOT_FAIL_CLOSED"
  | "PLATFORM_IDENTITY_OWNERSHIP_VIOLATION"
  | "DEPLOYMENT_INFRASTRUCTURE_OWNERSHIP_VIOLATION"
  | "RUNTIME_ORCHESTRATION_OWNERSHIP_VIOLATION"
  | "PROVING_EXECUTION_OWNERSHIP_VIOLATION"
  | "VALIDATION_LOGIC_OWNERSHIP_VIOLATION"
  | "CERTIFICATION_OWNERSHIP_VIOLATION"
  | "TRUST_DECISION_OWNERSHIP_VIOLATION"
  | "P6_2_VERIFY_001_FAILED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type ProvingProvisioningScenario = "BASELINE" | ProvingProvisioningFailure;
export type ProvingProvisioningInput = Readonly<{ scenario?: ProvingProvisioningScenario; environment_id?: string; tenant_id?: string; namespace?: string }>;

export type ProvingEnvironmentIdentity = Readonly<{
  environment_id: string;
  name: string;
  namespace: string;
  tenant_id: string;
  trust_domain: string;
  environment_class: ProvingEnvironmentClass;
  environment_type: ProvingProvisioningEnvironmentType;
  owner: string;
  creator: string;
  creation_authority: string;
  creation_time: string;
  lifecycle_status: ProvingProvisioningLifecycleState;
  isolation_policy: string;
  configuration_version: string;
  parent_environment: string;
  replay_compatibility: boolean;
  audit_chain: readonly string[];
  lineage_id: string;
  globally_unique: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ProvingEnvironmentRegistry = Readonly<{
  registry_id: string;
  environments: readonly ProvingEnvironmentIdentity[];
  owner_index: readonly string[];
  tenant_index: readonly string[];
  namespace_index: readonly string[];
  trust_domain_index: readonly string[];
  lifecycle_index: readonly ProvingProvisioningLifecycleState[];
  provisioning_history_refs: readonly string[];
  retirement_metadata_refs: readonly string[];
  immutable_except_lifecycle_progression: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ProvingIdentityRecord = Readonly<{
  identity_id: string;
  identity_kind: ProvingIdentityKind;
  environment_id: string;
  tenant_id: string;
  namespace: string;
  lineage_ref: string;
  immutable: boolean;
  traceable: boolean;
  integrity_hash: string;
}>;

export type ProvingIdentityRegistry = Readonly<{
  registry_id: string;
  environment_identities: readonly ProvingIdentityRecord[];
  execution_identities: readonly ProvingIdentityRecord[];
  service_identities: readonly ProvingIdentityRecord[];
  operator_identities: readonly ProvingIdentityRecord[];
  automation_identities: readonly ProvingIdentityRecord[];
  workload_identities: readonly ProvingIdentityRecord[];
  complete_lineage: boolean;
  integrity_hash: string;
}>;

export type ProvingIsolationPolicy = Readonly<{
  policy_id: string;
  tenant: boolean;
  namespace: boolean;
  identity: boolean;
  storage: boolean;
  network: boolean;
  compute: boolean;
  execution: boolean;
  secrets: boolean;
  configuration: boolean;
  messaging: boolean;
  telemetry: boolean;
  evidence: boolean;
  audit: boolean;
  replay: boolean;
  policies: boolean;
  fail_closed: boolean;
  tenant_sharing_prohibited_until_federation: boolean;
  integrity_hash: string;
}>;

export type ProvingProvisioningPipeline = Readonly<{
  pipeline_id: string;
  steps: readonly string[];
  identity_assignment: boolean;
  namespace_creation: boolean;
  policy_attachment: boolean;
  trust_domain_binding: boolean;
  infrastructure_provisioning: boolean;
  service_deployment: boolean;
  storage_allocation: boolean;
  event_registration: boolean;
  audit_initialization: boolean;
  deterministic: boolean;
  repeatable: boolean;
  integrity_hash: string;
}>;

export type ProvingLifecycleGovernance = Readonly<{
  lifecycle_id: string;
  states: readonly ProvingProvisioningLifecycleState[];
  governed_progression: boolean;
  transition_audit_evidence: readonly string[];
  suspended_recoverable: boolean;
  retired_never_reactivated: boolean;
  archived_immutable: boolean;
  integrity_hash: string;
}>;

export type ProvingRetirementModel = Readonly<{
  retirement_id: string;
  execution_shutdown: boolean;
  evidence_preservation: boolean;
  immutable_archival: boolean;
  lineage_completion: boolean;
  identity_retention: boolean;
  identity_reuse_prevented: boolean;
  reactivation_prevented: boolean;
  integrity_hash: string;
}>;

export type ProvingProvisioningLineage = Readonly<{
  lineage_id: string;
  actor: string;
  authority: string;
  timestamp: string;
  configuration_ref: string;
  provisioning_source: string;
  parent_environment: string;
  cloned_environment: string;
  lifecycle_transition_refs: readonly string[];
  governance_approval_refs: readonly string[];
  immutable: boolean;
  overwrite_prevented: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ProvingProvisioningInvariant = Readonly<{ invariant_id: string; description: string; satisfied: boolean; evidence_ref: string; integrity_hash: string }>;
export type ProvingProvisioningVerification = Readonly<{
  verification_id: "P6.2-VERIFY-001";
  globally_unique_immutable_identity: boolean;
  registry_complete: boolean;
  exact_single_tenant_binding: boolean;
  identity_lineage_complete: boolean;
  deterministic_repeatable_provisioning: boolean;
  lifecycle_governed_auditable: boolean;
  isolation_enforced: boolean;
  retirement_preserves_lineage: boolean;
  replay_reproducible_with_immutable_identity: boolean;
  invariants_satisfied: boolean;
  passed: boolean;
  integrity_hash: string;
}>;

export type ProvingProvisioningBoundary = Readonly<{
  boundary_id: string;
  owns_proving_execution: false;
  owns_simulations: false;
  owns_validation_logic: false;
  owns_certification: false;
  owns_trust_decisions: false;
  owns_deployment_infrastructure: false;
  owns_platform_identity: false;
  owns_runtime_orchestration: false;
  integrity_hash: string;
}>;

export type ProvingProvisioningReadiness = Readonly<{
  readiness_id: string;
  outcome: ProvingProvisioningOutcome;
  phase_ready: boolean;
  identity_ready: boolean;
  environment_registry_ready: boolean;
  identity_registry_ready: boolean;
  tenant_isolation_ready: boolean;
  namespace_isolation_ready: boolean;
  provisioning_ready: boolean;
  lifecycle_ready: boolean;
  retirement_ready: boolean;
  lineage_ready: boolean;
  verification_ready: boolean;
  boundaries_respected: boolean;
  failures: readonly ProvingProvisioningFailure[];
  integrity_hash: string;
}>;

export type ProvingProvisioningResult = Readonly<{
  phase_version: "proving-environment-identity-isolation-provisioning/v6.2";
  phase_identifier: "ProvingEnvironmentIdentityIsolationProvisioning";
  foundation_ref: "proving-architecture-environment-foundation/v6.1";
  environment_identity: ProvingEnvironmentIdentity;
  environment_registry: ProvingEnvironmentRegistry;
  identity_registry: ProvingIdentityRegistry;
  isolation_policy: ProvingIsolationPolicy;
  provisioning_pipeline: ProvingProvisioningPipeline;
  lifecycle: ProvingLifecycleGovernance;
  retirement: ProvingRetirementModel;
  lineage: ProvingProvisioningLineage;
  invariants: readonly ProvingProvisioningInvariant[];
  verification: ProvingProvisioningVerification;
  boundaries: ProvingProvisioningBoundary;
  readiness: ProvingProvisioningReadiness;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProvingProvisioningValidation = Readonly<{
  valid: boolean;
  outcome: ProvingProvisioningOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  identity_valid: boolean;
  environment_registry_valid: boolean;
  identity_registry_valid: boolean;
  isolation_valid: boolean;
  provisioning_valid: boolean;
  lifecycle_valid: boolean;
  retirement_valid: boolean;
  lineage_valid: boolean;
  invariants_valid: boolean;
  verification_valid: boolean;
  boundaries_valid: boolean;
  readiness_valid: boolean;
  failures: readonly ProvingProvisioningFailure[];
  integrity_hash: string;
}>;

export type ProvingProvisioningBundle = Readonly<{
  doctrine: Readonly<{
    version: "proving-environment-identity-isolation-provisioning/v6.2";
    owns_proving_identities: true;
    owns_environment_identities: true;
    owns_tenant_isolation: true;
    owns_environment_lifecycle: true;
    owns_environment_registry: true;
    owns_proving_execution: false;
    owns_validation_logic: false;
    owns_certification: false;
    owns_trust_decisions: false;
    owns_deployment_infrastructure: false;
    owns_platform_identity: false;
    owns_runtime_orchestration: false;
  }>;
  result: ProvingProvisioningResult;
  validation: ProvingProvisioningValidation;
}>;
