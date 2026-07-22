export type InterfaceLifecycleStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "ACTIVE" | "DEPRECATED" | "RETIRED" | "ARCHIVED";
export type InterfaceCompatibilityStatus = "COMPATIBLE" | "CONDITIONALLY_COMPATIBLE" | "INCOMPATIBLE" | "REQUIRES_UPGRADE" | "SUPERSEDED";
export type IntegrationValidationStatus = "NOT_VALIDATED" | "VALIDATION_IN_PROGRESS" | "VALIDATED" | "VALIDATION_FAILED" | "VALIDATION_SUSPENDED";
export type IntegrationContractType = "CCI_SERVICE" | "CAF_SERVICE" | "APPLICATION_SERVICE" | "EVENT_INTERFACE" | "MESSAGE_INTERFACE" | "WORKFLOW_INTERFACE";
export type ApplicationIntegrationOutcome = "PASS" | "FAIL" | "PRUNED";

export type ApplicationIntegrationFailure =
  | "P4_4_IDENTITY_INVALID"
  | "P4_5_CERTIFICATION_INVALID"
  | "PROGRAM_1_STANDARDS_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "PROGRAM_1_TERMINOLOGY_INVALID"
  | "CCI_INTEGRATION_INVALID"
  | "CAF_INTEGRATION_INVALID"
  | "CONTRACT_REGISTRY_MISSING"
  | "CONTRACT_NOT_VERSIONED"
  | "CONTRACT_LINEAGE_INCOMPLETE"
  | "INTERFACE_NOT_REGISTERED"
  | "INTERFACE_OWNER_MISSING"
  | "INTERFACE_NAMESPACE_UNGOVERNED"
  | "INTERFACE_VERSIONING_FAILED"
  | "INTERFACE_COMPATIBILITY_NOT_VALIDATED"
  | "BREAKING_CHANGE_UNGOVERNED"
  | "APPLICATION_GATEWAY_UNAVAILABLE"
  | "GATEWAY_AUTHENTICATION_MISSING"
  | "GATEWAY_AUTHORIZATION_MISSING"
  | "REQUEST_VALIDATION_MISSING"
  | "TENANT_ISOLATION_BROKEN"
  | "UNAUTHORIZED_PLATFORM_COUPLING"
  | "INTEGRATION_NOT_CONTRACT_DRIVEN"
  | "INTEROPERABILITY_CONTRACT_MISSING"
  | "INTEROPERABILITY_VALIDATION_FAILED"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_MUTABLE"
  | "CONSTITUTIONAL_GOVERNANCE_BYPASSED"
  | "CERTIFICATION_PRUNED";

export type ApplicationIntegrationScenario = "BASELINE" | ApplicationIntegrationFailure;
export type ApplicationIntegrationInput = Readonly<{ scenario?: ApplicationIntegrationScenario; tenant_id?: string }>;

export type IntegrationContract = Readonly<{
  integration_contract_id: string;
  application_id: string;
  provider_application_id: string;
  interface_id: string;
  contract_version: string;
  contract_type: IntegrationContractType;
  supported_operations: readonly string[];
  dependency_refs: readonly string[];
  compatibility_rules: readonly string[];
  authority_requirements: readonly string[];
  policy_requirements: readonly string[];
  certification_requirements: readonly string[];
  lifecycle_status: InterfaceLifecycleStatus;
  effective_date: string;
  retirement_date: string;
  versioned: boolean;
  contract_driven: boolean;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type CciIntegrationAdapter = Readonly<{
  adapter_id: string;
  registry_access: boolean;
  messaging: boolean;
  storage: boolean;
  evidence: boolean;
  identity: boolean;
  observability: boolean;
  validated: boolean;
  integrity_hash: string;
}>;

export type CafIntegrationAdapter = Readonly<{
  adapter_id: string;
  agent_invocation: boolean;
  workflow_invocation: boolean;
  reasoning_requests: boolean;
  capability_execution_contracts: boolean;
  governance_interaction: boolean;
  policy_enforcement: boolean;
  safety_integration: boolean;
  evidence_integration: boolean;
  operator_workflow_integration: boolean;
  validated: boolean;
  integrity_hash: string;
}>;

export type ApplicationGateway = Readonly<{
  gateway_id: string;
  routing: boolean;
  authentication: boolean;
  authorization: boolean;
  request_validation: boolean;
  protocol_translation: boolean;
  interface_enforcement: boolean;
  rate_governance: boolean;
  observability: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type InterfaceRecord = Readonly<{
  interface_id: string;
  application_id: string;
  namespace: string;
  interface_name: string;
  interface_version: string;
  interface_type: IntegrationContractType;
  owner: string;
  visibility: "ECOSYSTEM" | "TENANT" | "PRIVATE";
  compatibility_status: InterfaceCompatibilityStatus;
  lifecycle_status: InterfaceLifecycleStatus;
  certification_status: "CERTIFIED" | "NOT_CERTIFIED";
  dependency_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ApplicationIntegrationRecord = Readonly<{
  integration_id: string;
  source_application: string;
  target_application: string;
  integration_type: IntegrationContractType;
  gateway_used: boolean;
  interface_ref: string;
  contract_ref: string;
  tenant_scope: string;
  compatibility_result: InterfaceCompatibilityStatus;
  validation_result: IntegrationValidationStatus;
  certification_status: "CERTIFIED" | "NOT_CERTIFIED";
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type InterfaceGovernance = Readonly<{
  governance_id: string;
  interface_approval: boolean;
  interface_versioning: boolean;
  compatibility_validation: boolean;
  deprecation_governance: boolean;
  breaking_change_governance: boolean;
  lifecycle_governance: boolean;
  constitutional_compliance: boolean;
  namespace_ownership: boolean;
  integrity_hash: string;
}>;

export type IntegrationEvidence = Readonly<{
  evidence_id: string;
  contract_refs: readonly string[];
  interface_refs: readonly string[];
  gateway_refs: readonly string[];
  adapter_refs: readonly string[];
  interoperability_refs: readonly string[];
  governance_refs: readonly string[];
  audit_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationIntegrationCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationIntegrationOutcome;
  phase_ready: boolean;
  gateway_operational: boolean;
  interface_registry_implemented: boolean;
  contracts_versioned_governed: boolean;
  cci_pathways_validated: boolean;
  caf_pathways_validated: boolean;
  interoperability_enforced: boolean;
  interface_lifecycle_governed: boolean;
  compatibility_deterministic: boolean;
  evidence_immutable: boolean;
  tenant_isolation_preserved: boolean;
  constitutional_governance_enforced: boolean;
  failures: readonly ApplicationIntegrationFailure[];
  integrity_hash: string;
}>;

export type ApplicationIntegrationFrameworkResult = Readonly<{
  phase_version: "application-integration-framework/v4.6";
  phase_identifier: "ApplicationIntegrationFramework";
  application_identity_ref: "application-identity-tenancy-namespace/v4.4";
  application_certification_ref: "application-lifecycle-certification/v4.5";
  cci_services_ref: "Program 2 - CCI Shared Platform Services";
  caf_services_ref: "Program 3 - CAF Legion Services";
  program_1_standards_ref: "Program 1 - Constitutional Standards";
  integration_contract: IntegrationContract;
  cci_adapter: CciIntegrationAdapter;
  caf_adapter: CafIntegrationAdapter;
  application_gateway: ApplicationGateway;
  interface_record: InterfaceRecord;
  integration_record: ApplicationIntegrationRecord;
  interface_governance: InterfaceGovernance;
  evidence: IntegrationEvidence;
  certification: ApplicationIntegrationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationIntegrationValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationIntegrationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  contract_valid: boolean;
  cci_valid: boolean;
  caf_valid: boolean;
  gateway_valid: boolean;
  interface_valid: boolean;
  interoperability_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationIntegrationFailure[];
  integrity_hash: string;
}>;

export type ApplicationIntegrationBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-integration-framework/v4.6";
    owns_cci_integration: true;
    owns_caf_integration: true;
    owns_interface_governance: true;
    owns_application_interoperability_contracts: true;
    builds_applications: false;
    executes_applications: false;
    deploys_applications: false;
    bypasses_constitutional_governance: false;
  }>;
  result: ApplicationIntegrationFrameworkResult;
  validation: ApplicationIntegrationValidation;
}>;
