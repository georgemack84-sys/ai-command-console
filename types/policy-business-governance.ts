export type PbgOutcome = "PASS" | "FAIL" | "PRUNED";
export type PolicyLifecycleState = "DRAFT" | "REVIEW" | "PUBLISHED" | "RETIRED" | "SUPERSEDED";

export type PbgFailure =
  | "P4_12_QCI_INVALID"
  | "P4_11_MISSION_CONTROL_INVALID"
  | "PROGRAM_1_GOVERNANCE_INVALID"
  | "PROGRAM_2_CCI_SERVICES_INVALID"
  | "PROGRAM_3_CAF_GATES_INVALID"
  | "PBG_APPLICATION_MISSING"
  | "APPLICATION_FOUNDATION_MISSING"
  | "GOVERNANCE_DOMAIN_MODEL_MISSING"
  | "SERVICE_ARCHITECTURE_MISSING"
  | "APPLICATION_CONFIGURATION_MISSING"
  | "ORGANIZATION_REGISTRY_MISSING"
  | "GOVERNANCE_HIERARCHY_MISSING"
  | "OWNERSHIP_LINEAGE_INCOMPLETE"
  | "POLICY_REGISTRY_MISSING"
  | "POLICY_LIFECYCLE_NON_DETERMINISTIC"
  | "POLICY_VERSION_LINEAGE_INCOMPLETE"
  | "BUSINESS_RULE_REGISTRY_MISSING"
  | "POLICY_CATALOG_MISSING"
  | "RULE_LIBRARY_MISSING"
  | "CONSTITUTIONAL_SEPARATION_VIOLATED"
  | "WORKFLOW_ENGINE_MISSING"
  | "APPROVAL_ROUTING_NON_DETERMINISTIC"
  | "APPROVAL_PIPELINE_MISSING"
  | "DECISION_HISTORY_MISSING"
  | "ORGANIZATIONAL_GOVERNANCE_MISSING"
  | "GOVERNANCE_EVIDENCE_INCOMPLETE"
  | "POLICY_DISCOVERY_MISSING"
  | "POLICY_INDEX_INCOMPLETE"
  | "NOTIFICATION_SERVICE_MISSING"
  | "DELIVERY_TRACKING_MISSING"
  | "GOVERNANCE_DASHBOARD_MISSING"
  | "REPORTING_INCOMPLETE"
  | "INTEGRATION_CONTRACTS_INVALID"
  | "INTEROPERABILITY_INVALID"
  | "OBSERVABILITY_DIAGNOSTICS_MISSING"
  | "WORKFLOW_MONITORING_MISSING"
  | "READINESS_ASSESSMENT_MISSING"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "VALIDATION_REPORTS_MISSING"
  | "CONSUMER_READINESS_MISSING"
  | "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED"
  | "AUTHORITY_GATE_OWNERSHIP_ATTEMPTED"
  | "POLICY_GATE_OWNERSHIP_ATTEMPTED"
  | "SAFETY_GATE_OWNERSHIP_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "REPLAY_INFRASTRUCTURE_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "IDENTITY_INFRASTRUCTURE_ATTEMPTED"
  | "PRODUCTION_DEPLOYMENT_NOT_READY"
  | "CERTIFICATION_PRUNED";

export type PbgScenario = "BASELINE" | PbgFailure;
export type PbgInput = Readonly<{ scenario?: PbgScenario; application_id?: string; tenant_id?: string }>;

export type PbgFoundation = Readonly<{
  application_id: string;
  application_name: "Policy & Business Governance";
  tenant_id: string;
  foundation_ref: string;
  governance_domain_model_ref: string;
  service_architecture_ref: string;
  configuration_ref: string;
  boundaries_verified: boolean;
  integrity_hash: string;
}>;

export type OrganizationGovernanceModel = Readonly<{
  organization_registry_id: string;
  governance_hierarchy_ref: string;
  ownership_model_ref: string;
  departments: readonly string[];
  committees: readonly string[];
  ownership_lineage_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type PolicyLifecycleRecord = Readonly<{
  policy_registry_id: string;
  lifecycle_engine_ref: string;
  version_history_refs: readonly string[];
  lifecycle_states: readonly PolicyLifecycleState[];
  deterministic: boolean;
  version_lineage_complete: boolean;
  integrity_hash: string;
}>;

export type BusinessRuleManagement = Readonly<{
  rule_registry_id: string;
  policy_catalog_ref: string;
  rule_library_ref: string;
  organizational_policy_refs: readonly string[];
  operational_standard_refs: readonly string[];
  caf_policy_gate_ref: string;
  constitutional_separation_maintained: boolean;
  integrity_hash: string;
}>;

export type GovernanceWorkflowRecord = Readonly<{
  workflow_engine_id: string;
  approval_pipeline_ref: string;
  decision_history_ref: string;
  caf_approval_framework_ref: string;
  routing_deterministic: boolean;
  approvals_tracked: boolean;
  integrity_hash: string;
}>;

export type OrganizationalGovernanceRecord = Readonly<{
  governance_record_id: string;
  review_registry_ref: string;
  decision_ledger_ref: string;
  committee_decision_refs: readonly string[];
  governance_meeting_refs: readonly string[];
  evidence_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type PolicyCatalogDiscovery = Readonly<{
  catalog_id: string;
  search_service_ref: string;
  policy_index_ref: string;
  discoverable_policy_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type GovernanceNotificationRecord = Readonly<{
  notification_service_id: string;
  subscription_registry_ref: string;
  alert_manager_ref: string;
  notification_refs: readonly string[];
  cci_notification_infrastructure_ref: string;
  delivery_tracked: boolean;
  integrity_hash: string;
}>;

export type GovernanceDashboardReporting = Readonly<{
  dashboard_id: string;
  analytics_ref: string;
  report_refs: readonly string[];
  approval_metric_refs: readonly string[];
  organizational_report_refs: readonly string[];
  visible: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type PbgIntegrationRecord = Readonly<{
  integration_id: string;
  cci_contract_refs: readonly string[];
  caf_contract_refs: readonly string[];
  mission_control_contract_refs: readonly string[];
  ecosystem_application_refs: readonly string[];
  validated: boolean;
  interoperable: boolean;
  integrity_hash: string;
}>;

export type PbgReadinessRecord = Readonly<{
  readiness_id: string;
  operational_dashboard_ref: string;
  diagnostics_ref: string;
  health_report_ref: string;
  workflow_monitoring_ref: string;
  readiness_assessment_ref: string;
  certification_evidence_refs: readonly string[];
  validation_report_refs: readonly string[];
  consumer_readiness_ref: string;
  evidence_accepted: boolean;
  integrity_hash: string;
}>;

export type PbgCertification = Readonly<{
  certification_id: string;
  outcome: PbgOutcome;
  phase_ready: boolean;
  constitutionally_compliant: boolean;
  organizational_governance_operational: boolean;
  policy_lifecycle_operational: boolean;
  business_rules_managed: boolean;
  workflows_deterministic: boolean;
  approvals_tracked: boolean;
  governance_reporting_complete: boolean;
  integrations_validated: boolean;
  evidence_lineage_complete: boolean;
  replay_compatible: boolean;
  operationally_ready: boolean;
  production_deployment_ready: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly PbgFailure[];
  integrity_hash: string;
}>;

export type PolicyBusinessGovernanceResult = Readonly<{
  phase_version: "policy-business-governance/v4.13";
  phase_identifier: "PolicyBusinessGovernance";
  qci_ref: "quantedge-compintel/v4.12";
  mission_control_ref: "mission-control/v4.11";
  foundation: PbgFoundation;
  organization: OrganizationGovernanceModel;
  lifecycle: PolicyLifecycleRecord;
  rules: BusinessRuleManagement;
  workflows: GovernanceWorkflowRecord;
  organizational_governance: OrganizationalGovernanceRecord;
  catalog: PolicyCatalogDiscovery;
  notifications: GovernanceNotificationRecord;
  reporting: GovernanceDashboardReporting;
  integration: PbgIntegrationRecord;
  readiness: PbgReadinessRecord;
  certification: PbgCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PbgValidation = Readonly<{
  valid: boolean;
  outcome: PbgOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  organization_valid: boolean;
  lifecycle_valid: boolean;
  rules_valid: boolean;
  workflows_valid: boolean;
  governance_valid: boolean;
  catalog_valid: boolean;
  notifications_valid: boolean;
  reporting_valid: boolean;
  integration_valid: boolean;
  readiness_valid: boolean;
  certification_valid: boolean;
  failures: readonly PbgFailure[];
  integrity_hash: string;
}>;

export type PbgBundle = Readonly<{
  doctrine: Readonly<{
    version: "policy-business-governance/v4.13";
    owns_business_policy_management: true;
    owns_governance_workflow_management: true;
    owns_organizational_approval_processes: true;
    owns_policy_lifecycle_management: true;
    owns_governance_reporting: true;
    owns_constitutional_governance: false;
    owns_authority_gate: false;
    owns_policy_gate: false;
    owns_safety_gate: false;
    owns_policy_enforcement: false;
    owns_replay_infrastructure: false;
    owns_evidence_storage: false;
    owns_identity_infrastructure: false;
  }>;
  result: PolicyBusinessGovernanceResult;
  validation: PbgValidation;
}>;
