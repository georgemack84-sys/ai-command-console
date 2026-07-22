import type { ReplayAuditCertificationResult } from "@/types/decision-replay-audit-certification-gate";

export type DecisionObservabilityLifecycleState = "REGISTERED" | "INITIALIZED" | "POPULATED" | "VALIDATED" | "VISIBLE" | "ACTIVE" | "UPDATED" | "ARCHIVED";
export type DecisionDashboardState = "DRAFT" | "READY" | "VISIBLE" | "ACTIVE" | "ARCHIVED" | "BLOCKED";
export type DecisionDashboardType = "DECISION_OVERVIEW" | "GOVERNANCE_STATUS" | "REPLAY_AUDIT" | "OPERATOR_ACTIONS" | "ANALYTICS_CERTIFICATION";
export type DecisionVisualizationType = "TIMELINE" | "DEPENDENCY_GRAPH" | "STATUS_PANEL" | "QUEUE" | "HEAT_MAP" | "METRIC_SERIES" | "EVIDENCE_TABLE";
export type DecisionWidgetCategory = "DECISION" | "PRIORITY" | "RISK" | "GOVERNANCE" | "REPLAY" | "CERTIFICATION" | "OPERATOR" | "ANALYTICS";
export type VisibilityRole = "OPERATOR" | "GOVERNANCE" | "AUDITOR" | "ADMINISTRATOR" | "SYSTEM";
export type VisibilityPermission = "VIEW_DECISIONS" | "VIEW_GOVERNANCE" | "VIEW_REPLAY" | "VIEW_CERTIFICATION" | "VIEW_OPERATOR_ACTIONS" | "MANAGE_DASHBOARD_CONFIG" | "POPULATE_DASHBOARD";
export type DecisionObservabilityValidationOutcome = "VALID" | "BLOCKED";

export type DecisionObservabilityFailure =
  | "OBSERVABILITY_CONTRACT_INCOMPLETE"
  | "DASHBOARD_SCHEMA_MISSING"
  | "VISUALIZATION_CONTRACT_MISSING"
  | "WIDGET_REGISTRY_INCONSISTENT"
  | "UNKNOWN_LIFECYCLE_STATE"
  | "AUTHORIZATION_RULE_BYPASSED"
  | "GOVERNANCE_VISIBILITY_HIDDEN"
  | "CONSTITUTIONAL_STATUS_HIDDEN"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_STATUS_ABSENT"
  | "CROSS_TENANT_INFORMATION_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "VISUALIZATION_NOT_REPRODUCIBLE"
  | "DASHBOARD_REPLAY_MISMATCH"
  | "HIDDEN_ORCHESTRATION_STATE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type DecisionObservabilityContractRecord = Readonly<{
  observability_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  dashboard_state: DecisionDashboardState;
  lifecycle_state: DecisionObservabilityLifecycleState;
  visualization_refs: readonly string[];
  widget_refs: readonly string[];
  timeline_refs: readonly string[];
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  operator_action_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  updated_at: string;
}>;

export type DecisionDashboardSchema = Readonly<{
  dashboard_id: string;
  dashboard_name: string;
  dashboard_type: DecisionDashboardType;
  dashboard_version: "decision-dashboard-schema/v1";
  tenant_scope: "TENANT_ONLY";
  visibility_scope: readonly VisibilityRole[];
  widget_refs: readonly string[];
  filters: readonly string[];
  layout: readonly string[];
  refresh_policy: "ON_REPLAY" | "ON_EVIDENCE_UPDATE" | "ON_OPERATOR_QUERY";
  replay_ref: string;
  certification_status: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  integrity_hash: string;
}>;

export type DecisionVisualizationContract = Readonly<{
  visualization_id: string;
  visualization_type: DecisionVisualizationType;
  source_contract: string;
  data_source: string;
  rendering_rules: readonly string[];
  filter_rules: readonly string[];
  authorization_rules: readonly string[];
  replay_reference: string;
  deterministic_rendering: boolean;
  integrity_hash: string;
}>;

export type DecisionDashboardWidget = Readonly<{
  widget_id: string;
  widget_name: string;
  widget_category: DecisionWidgetCategory;
  widget_version: "decision-dashboard-widget/v1";
  visualization_type: DecisionVisualizationType;
  data_source: string;
  permissions: readonly VisibilityPermission[];
  refresh_policy: "ON_REPLAY" | "ON_EVIDENCE_UPDATE" | "ON_OPERATOR_QUERY";
  replay_ref: string;
  execution_authority: false;
  integrity_hash: string;
}>;

export type VisibilityAuthorization = Readonly<{
  authorization_id: string;
  role: VisibilityRole;
  permissions: readonly VisibilityPermission[];
  dashboard_refs: readonly string[];
  widget_refs: readonly string[];
  tenant_scope: "TENANT_ONLY";
  governance_scope: "VISIBLE" | "RESTRICTED";
  replay_scope: "VISIBLE" | "RESTRICTED";
  certification_scope: "VISIBLE" | "RESTRICTED";
  may_modify_governance: false;
  may_override_authority: false;
  integrity_hash: string;
}>;

export type DecisionObservabilityValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: DecisionObservabilityFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionObservabilityValidation = Readonly<{
  validation_id: string;
  observability_id: string;
  validation_outcome: DecisionObservabilityValidationOutcome;
  schema_complete: boolean;
  dashboards_complete: boolean;
  visualizations_deterministic: boolean;
  widgets_registered: boolean;
  authorization_valid: boolean;
  governance_visible: boolean;
  constitutional_visible: boolean;
  replay_consistent: boolean;
  certification_visible: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly DecisionObservabilityFailure[];
  integrity_hash: string;
}>;

export type DecisionObservabilityInput = Readonly<{
  certification_result?: ReplayAuditCertificationResult;
  scenario?:
    | "BASELINE"
    | "MISSING_CONTRACT"
    | "MISSING_DASHBOARD_SCHEMA"
    | "MISSING_VISUALIZATION"
    | "MISSING_WIDGET_REGISTRY"
    | "UNKNOWN_LIFECYCLE"
    | "AUTHORIZATION_BYPASS"
    | "HIDE_GOVERNANCE"
    | "HIDE_CONSTITUTIONAL"
    | "MISSING_REPLAY_REFS"
    | "MISSING_CERTIFICATION_STATUS"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "NONDETERMINISTIC_RENDERING"
    | "DASHBOARD_REPLAY_MISMATCH"
    | "HIDDEN_ORCHESTRATION"
    | "EXECUTION_AUTHORITY";
}>;

export type DecisionObservabilityResult = Readonly<{
  observability_version: "decision-observability-contract/v1";
  certification_result: ReplayAuditCertificationResult;
  contract: DecisionObservabilityContractRecord | null;
  dashboards: readonly DecisionDashboardSchema[];
  visualizations: readonly DecisionVisualizationContract[];
  widget_registry: readonly DecisionDashboardWidget[];
  authorizations: readonly VisibilityAuthorization[];
  validation_tests: readonly DecisionObservabilityValidationTest[];
  validation: DecisionObservabilityValidation;
  deterministic: true;
  advisory_only: true;
  mutates_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionObservabilityFoundation = Readonly<{
  observability_version: "decision-observability-contract/v1";
  lifecycle_states: readonly DecisionObservabilityLifecycleState[];
  dashboard_types: readonly DecisionDashboardType[];
  visualization_types: readonly DecisionVisualizationType[];
  widget_categories: readonly DecisionWidgetCategory[];
  roles: readonly VisibilityRole[];
  result: DecisionObservabilityResult;
}>;
