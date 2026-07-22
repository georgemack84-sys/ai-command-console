export type AuroraOutcome = "PASS" | "FAIL" | "PRUNED";

export type AuroraFailure =
  | "P4_14_PUBLISHER_OS_INVALID"
  | "P4_13_PBG_INVALID"
  | "P4_12_QCI_INVALID"
  | "P4_11_MISSION_CONTROL_INVALID"
  | "PROGRAM_1_FOUNDATION_INVALID"
  | "PROGRAM_2_CCI_INVALID"
  | "PROGRAM_3_CAF_INVALID"
  | "AURORA_APPLICATION_MISSING"
  | "AURORA_ARCHITECTURE_MISSING"
  | "MODULE_REGISTRY_MISSING"
  | "SERVICE_CONTRACTS_MISSING"
  | "DEPENDENCY_GRAPH_MISSING"
  | "CONSTITUTIONAL_INHERITANCE_MISSING"
  | "DOMAIN_SERVICES_MISSING"
  | "DOMAIN_WORKFLOWS_MISSING"
  | "ORCHESTRATION_LOGIC_MISSING"
  | "SERVICE_VALIDATION_MISSING"
  | "USER_EXPERIENCE_MISSING"
  | "DASHBOARDS_MISSING"
  | "ACCESSIBILITY_INVALID"
  | "WORKFLOW_ENGINE_MISSING"
  | "WORKFLOW_EXECUTION_FAILED"
  | "APPROVAL_INTEGRATION_MISSING"
  | "INTEGRATION_LAYER_MISSING"
  | "ECOSYSTEM_INTEGRATIONS_INVALID"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "AUTHORITY_INHERITANCE_INVALID"
  | "POLICY_VALIDATION_INVALID"
  | "SAFETY_VALIDATION_INVALID"
  | "EVIDENCE_INTEGRATION_MISSING"
  | "CANONICAL_EVIDENCE_REFS_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "OBSERVABILITY_MISSING"
  | "APPLICATION_INTELLIGENCE_MISSING"
  | "API_SUITE_MISSING"
  | "INTERFACE_GOVERNANCE_INVALID"
  | "VERSION_COMPATIBILITY_INVALID"
  | "AUTOMATION_SERVICES_MISSING"
  | "AUTOMATION_GOVERNANCE_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "SECURITY_CONFIGURATION_MISSING"
  | "VALIDATION_REPORTS_MISSING"
  | "DOCUMENTATION_MISSING"
  | "PRODUCTION_READINESS_MISSING"
  | "APPLICATION_CERTIFICATION_FAILED"
  | "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED"
  | "AUTHORITY_ENFORCEMENT_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "SAFETY_ENFORCEMENT_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "REPLAY_INFRASTRUCTURE_ATTEMPTED"
  | "IDENTITY_INFRASTRUCTURE_ATTEMPTED"
  | "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED"
  | "REGISTRY_INFRASTRUCTURE_ATTEMPTED"
  | "OBSERVABILITY_INFRASTRUCTURE_ATTEMPTED"
  | "PLATFORM_LIFECYCLE_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type AuroraScenario = "BASELINE" | AuroraFailure;
export type AuroraInput = Readonly<{ scenario?: AuroraScenario; application_id?: string; tenant_id?: string }>;

export type AuroraRecord = Readonly<{
  record_id: string;
  refs: readonly string[];
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type AuroraFoundation = AuroraRecord & Readonly<{
  application_id: string;
  application_name: "Aurora";
  tenant_id: string;
  constitutional_inheritance_ref: string;
  module_registry_ref: string;
  dependency_graph_ref: string;
}>;

export type AuroraGovernance = AuroraRecord & Readonly<{
  authority_gate_ref: string;
  policy_gate_ref: string;
  safety_gate_ref: string;
  authority_inheritance_verified: boolean;
  policy_validation_passed: boolean;
  safety_validation_passed: boolean;
  enforcement_owned: boolean;
}>;

export type AuroraEvidence = AuroraRecord & Readonly<{
  evidence_refs: readonly string[];
  provenance_refs: readonly string[];
  lineage_refs: readonly string[];
  audit_refs: readonly string[];
  replay_refs: readonly string[];
  references_canonical_cci_evidence: boolean;
  owns_evidence_storage: boolean;
}>;

export type AuroraSecurity = AuroraRecord & Readonly<{
  tenant_boundary_refs: readonly string[];
  authorization_integration_ref: string;
  namespace_isolation_ref: string;
  secure_configuration_ref: string;
  tenant_isolation_validated: boolean;
}>;

export type AuroraReadiness = AuroraRecord & Readonly<{
  validation_report_refs: readonly string[];
  documentation_refs: readonly string[];
  production_readiness_report_ref: string;
  application_certification_ref: string;
  replay_compatible: boolean;
  interoperability_verified: boolean;
  operational_readiness_approved: boolean;
}>;

export type AuroraCertification = Readonly<{
  certification_id: string;
  outcome: AuroraOutcome;
  phase_ready: boolean;
  architecture_complete: boolean;
  domain_services_operational: boolean;
  workflows_execute_successfully: boolean;
  governance_integration_passes: boolean;
  authority_inheritance_verified: boolean;
  policy_validation_verified: boolean;
  safety_validation_verified: boolean;
  tenant_isolation_validated: boolean;
  replay_compatibility_validated: boolean;
  evidence_generation_complete: boolean;
  observability_operational: boolean;
  interoperability_verified: boolean;
  documentation_complete: boolean;
  production_readiness_approved: boolean;
  application_certification_complete: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly AuroraFailure[];
  integrity_hash: string;
}>;

export type AuroraResult = Readonly<{
  phase_version: "aurora/v4.15";
  phase_identifier: "Aurora";
  publisher_os_ref: "publisher-os/v4.14";
  pbg_ref: "policy-business-governance/v4.13";
  qci_ref: "quantedge-compintel/v4.12";
  mission_control_ref: "mission-control/v4.11";
  foundation: AuroraFoundation;
  domain_services: AuroraRecord;
  user_experience: AuroraRecord;
  workflow_engine: AuroraRecord;
  integration_layer: AuroraRecord;
  governance: AuroraGovernance;
  evidence: AuroraEvidence;
  operations: AuroraRecord;
  api_suite: AuroraRecord;
  automation: AuroraRecord;
  security: AuroraSecurity;
  readiness: AuroraReadiness;
  certification: AuroraCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AuroraValidation = Readonly<{
  valid: boolean;
  outcome: AuroraOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  domain_valid: boolean;
  experience_valid: boolean;
  workflow_valid: boolean;
  integration_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  operations_valid: boolean;
  api_valid: boolean;
  automation_valid: boolean;
  security_valid: boolean;
  readiness_valid: boolean;
  certification_valid: boolean;
  failures: readonly AuroraFailure[];
  integrity_hash: string;
}>;

export type AuroraBundle = Readonly<{
  doctrine: Readonly<{
    version: "aurora/v4.15";
    owns_application_logic: true;
    owns_domain_services: true;
    owns_user_experience: true;
    owns_application_apis: true;
    owns_application_automation: true;
    owns_constitutional_governance: false;
    owns_authority_enforcement: false;
    owns_policy_enforcement: false;
    owns_safety_enforcement: false;
    owns_evidence_storage: false;
    owns_replay_infrastructure: false;
    owns_identity_infrastructure: false;
    owns_certification_infrastructure: false;
    owns_registry_infrastructure: false;
    owns_observability_infrastructure: false;
    owns_platform_lifecycle: false;
  }>;
  result: AuroraResult;
  validation: AuroraValidation;
}>;
