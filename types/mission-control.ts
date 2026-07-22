export type MissionControlOutcome = "PASS" | "FAIL" | "PRUNED";
export type MissionLifecycleState = "PLANNED" | "ACTIVE" | "PAUSED" | "COMPLETED";

export type MissionControlFailure =
  | "P4_10_OPERATIONAL_INTELLIGENCE_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "PROGRAM_1_CONSTITUTIONAL_REGISTRY_INVALID"
  | "PROGRAM_1_SHARED_VOCABULARY_INVALID"
  | "PROGRAM_2_CCI_SERVICES_INVALID"
  | "PROGRAM_3_CAF_SERVICES_INVALID"
  | "CERTIFIED_INTERFACES_INVALID"
  | "MISSION_CONTROL_APPLICATION_MISSING"
  | "MISSION_WORKSPACE_MISSING"
  | "MISSION_DASHBOARD_MISSING"
  | "MISSION_TIMELINE_MISSING"
  | "MISSION_MANAGEMENT_MISSING"
  | "MISSION_LIFECYCLE_NON_DETERMINISTIC"
  | "STRATEGIC_WORKSPACE_MISSING"
  | "STRATEGIC_INTELLIGENCE_MISSING"
  | "RECOMMENDATION_CENTER_MISSING"
  | "CAF_RECOMMENDATION_INTEGRATION_MISSING"
  | "RECOMMENDATION_AUTHORIZATION_ATTEMPTED"
  | "OPERATOR_WORKSPACE_MISSING"
  | "APPROVAL_REQUEST_VIEW_MISSING"
  | "WARNING_VIEW_MISSING"
  | "VISUALIZATION_FRAMEWORK_MISSING"
  | "MISSION_VISUALIZATION_MISSING"
  | "OPERATIONAL_INTELLIGENCE_INTEGRATION_MISSING"
  | "REPLAY_AUDIT_VIEWER_MISSING"
  | "P4_9_OUTPUT_CONSUMPTION_MISSING"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "GOVERNANCE_WORKSPACE_MISSING"
  | "CONSTITUTIONAL_STATUS_NOT_VISIBLE"
  | "CONFIGURATION_MISSING"
  | "CERTIFIED_INTERFACE_CONTRACTS_MISSING"
  | "PLATFORM_GOVERNANCE_ATTEMPTED"
  | "AUTHORITY_ENFORCEMENT_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "SAFETY_ENFORCEMENT_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "CERTIFICATION_OWNERSHIP_ATTEMPTED"
  | "IDENTITY_INFRASTRUCTURE_ATTEMPTED"
  | "REGISTRY_INFRASTRUCTURE_ATTEMPTED"
  | "SHARED_PLATFORM_SERVICE_OWNERSHIP_ATTEMPTED"
  | "APPLICATION_CERTIFICATION_FAILED"
  | "ECOSYSTEM_DEPLOYMENT_NOT_READY"
  | "CERTIFICATION_PRUNED";

export type MissionControlScenario = "BASELINE" | MissionControlFailure;
export type MissionControlInput = Readonly<{ scenario?: MissionControlScenario; application_id?: string; tenant_id?: string; mission_id?: string }>;

export type MissionControlApplication = Readonly<{
  application_id: string;
  application_name: "Mission Control";
  tenant_id: string;
  constitutional_binding_ref: string;
  application_certification_ref: string;
  experience_modules: readonly string[];
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type MissionWorkspace = Readonly<{
  workspace_id: string;
  mission_id: string;
  modules: readonly string[];
  dashboard_ref: string;
  timeline_ref: string;
  context_ref: string;
  situation_overview_ref: string;
  navigator_ref: string;
  integrity_hash: string;
}>;

export type MissionManagementRecord = Readonly<{
  management_id: string;
  mission_id: string;
  lifecycle_state: MissionLifecycleState;
  registry_ref: string;
  objective_refs: readonly string[];
  milestone_refs: readonly string[];
  history_refs: readonly string[];
  deterministic_lifecycle: boolean;
  integrity_hash: string;
}>;

export type StrategicIntelligenceWorkspace = Readonly<{
  intelligence_id: string;
  strategic_view_refs: readonly string[];
  operational_assessment_refs: readonly string[];
  trend_analysis_refs: readonly string[];
  risk_visualization_refs: readonly string[];
  opportunity_visualization_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationCenter = Readonly<{
  center_id: string;
  caf_recommendation_refs: readonly string[];
  queue_ref: string;
  detail_view_refs: readonly string[];
  explanation_view_refs: readonly string[];
  confidence_view_refs: readonly string[];
  evidence_link_refs: readonly string[];
  presents_recommendations_only: boolean;
  authorizes_execution: boolean;
  integrity_hash: string;
}>;

export type OperatorWorkspace = Readonly<{
  operator_workspace_id: string;
  approval_request_refs: readonly string[];
  warning_view_refs: readonly string[];
  decision_history_refs: readonly string[];
  escalation_queue_ref: string;
  notification_center_ref: string;
  functional: boolean;
  integrity_hash: string;
}>;

export type MissionVisualizationFramework = Readonly<{
  visualization_id: string;
  mission_map_refs: readonly string[];
  capability_view_refs: readonly string[];
  dependency_view_refs: readonly string[];
  operational_health_refs: readonly string[];
  timeline_view_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayAuditViewer = Readonly<{
  viewer_id: string;
  replay_viewer_ref: string;
  audit_viewer_ref: string;
  evidence_viewer_ref: string;
  timeline_reconstruction_ref: string;
  forensic_visualization_ref: string;
  consumes_p4_9_outputs: boolean;
  executes_replay: boolean;
  integrity_hash: string;
}>;

export type GovernanceWorkspace = Readonly<{
  governance_workspace_id: string;
  governance_status_ref: string;
  compliance_dashboard_ref: string;
  constitutional_status_ref: string;
  approval_status_ref: string;
  authority_visualization_ref: string;
  fully_visible: boolean;
  enforces_authority: boolean;
  integrity_hash: string;
}>;

export type MissionConfiguration = Readonly<{
  configuration_id: string;
  user_preference_refs: readonly string[];
  workspace_layout_refs: readonly string[];
  notification_rule_refs: readonly string[];
  dashboard_configuration_refs: readonly string[];
  visualization_setting_refs: readonly string[];
  integrity_hash: string;
}>;

export type MissionIntegrationRegistry = Readonly<{
  integration_id: string;
  program_1_refs: readonly string[];
  cci_service_refs: readonly string[];
  caf_service_refs: readonly string[];
  ecosystem_application_refs: readonly string[];
  certified_sdk_refs: readonly string[];
  certified_interface_contract_refs: readonly string[];
  all_integrations_certified: boolean;
  integrity_hash: string;
}>;

export type MissionControlCertification = Readonly<{
  certification_id: string;
  outcome: MissionControlOutcome;
  phase_ready: boolean;
  application_implemented: boolean;
  mission_lifecycle_operational: boolean;
  strategic_workspaces_available: boolean;
  operator_workspaces_functional: boolean;
  recommendations_integrated: boolean;
  operational_intelligence_integrated: boolean;
  replay_audit_forensics_integrated: boolean;
  governance_status_visible: boolean;
  certified_integrations_only: boolean;
  constitutionally_advisory: boolean;
  application_certified: boolean;
  ecosystem_deployment_ready: boolean;
  no_platform_authority_ownership: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly MissionControlFailure[];
  integrity_hash: string;
}>;

export type MissionControlResult = Readonly<{
  phase_version: "mission-control/v4.11";
  phase_identifier: "MissionControl";
  operational_intelligence_ref: "application-observability-operational-intelligence/v4.10";
  replay_audit_forensics_ref: "application-replay-audit-forensics/v4.9";
  application: MissionControlApplication;
  mission_workspace: MissionWorkspace;
  mission_management: MissionManagementRecord;
  strategic_intelligence: StrategicIntelligenceWorkspace;
  recommendation_center: RecommendationCenter;
  operator_workspace: OperatorWorkspace;
  visualization_framework: MissionVisualizationFramework;
  replay_audit_viewer: ReplayAuditViewer;
  governance_workspace: GovernanceWorkspace;
  configuration: MissionConfiguration;
  integrations: MissionIntegrationRegistry;
  certification: MissionControlCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MissionControlValidation = Readonly<{
  valid: boolean;
  outcome: MissionControlOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  application_valid: boolean;
  workspace_valid: boolean;
  management_valid: boolean;
  strategic_valid: boolean;
  recommendations_valid: boolean;
  operators_valid: boolean;
  visualization_valid: boolean;
  replay_audit_valid: boolean;
  governance_valid: boolean;
  configuration_valid: boolean;
  integrations_valid: boolean;
  certification_valid: boolean;
  failures: readonly MissionControlFailure[];
  integrity_hash: string;
}>;

export type MissionControlBundle = Readonly<{
  doctrine: Readonly<{
    version: "mission-control/v4.11";
    owns_mission_control_application: true;
    owns_mission_management: true;
    owns_recommendation_presentation: true;
    owns_operator_workflows: true;
    owns_application_experience: true;
    owns_platform_governance: false;
    owns_authority_enforcement: false;
    owns_policy_enforcement: false;
    owns_safety_enforcement: false;
    executes_replay: false;
    owns_evidence_storage: false;
    owns_certification_services: false;
    owns_identity_infrastructure: false;
    owns_registry_infrastructure: false;
  }>;
  result: MissionControlResult;
  validation: MissionControlValidation;
}>;
