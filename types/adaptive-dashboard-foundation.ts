export type AdaptiveDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type DashboardValidationOutcome = "VALID" | "INVALID";
export type DashboardRole = "OPERATOR" | "REVIEWER" | "GOVERNANCE_AUTHORITY" | "AUDITOR" | "CERTIFICATION_TEAM";
export type DashboardTenantScope = "TENANT_PRIVATE" | "MISSION_SCOPED" | "GOVERNANCE_RESTRICTED" | "CERTIFICATION_RESTRICTED";
export type DashboardCertificationStatus = "CERTIFIED" | "PENDING" | "REJECTED";
export type DashboardWidgetType = "SUMMARY_CARD" | "TABLE" | "TIMELINE" | "EVIDENCE_VIEWER" | "REPLAY_VIEWER" | "TREND_CHART" | "HEAT_MAP" | "STATUS_INDICATOR" | "ALERT_PANEL" | "APPROVAL_QUEUE" | "CERTIFICATION_STATUS" | "LINEAGE_VIEWER";
export type DashboardViewId = "adaptive_overview" | "governance_review" | "replay_investigation" | "security_integrity" | "certification_readiness" | "tenant_isolation";
export type DashboardSortKey = "timestamp" | "priority" | "severity" | "confidence" | "mission" | "proposal_id" | "certification_state";
export type DashboardSearchDomain = "proposals" | "outcomes" | "evidence" | "operators" | "missions" | "simulations" | "governance_reviews" | "certification_records" | "replay_history" | "rollback_history";

export type AdaptiveDashboardScenario =
  | "BASELINE"
  | "DUPLICATE_VIEW"
  | "NONDETERMINISTIC_RENDERING"
  | "WIDGET_ORDER_DRIFT"
  | "LAYOUT_DRIFT"
  | "STATE_NOT_REPLAYABLE"
  | "NAVIGATION_BREAK"
  | "SEARCH_NONDETERMINISTIC"
  | "FILTER_SORT_DRIFT"
  | "MISSING_REPLAY_REF"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "UNAUTHORIZED_ROLE"
  | "FIELD_LEAK"
  | "TENANT_ISOLATION_BREACH"
  | "INTEGRITY_FAILURE"
  | "EXECUTION_AUTHORITY_EXPOSED";

export type AdaptiveDashboardFailure =
  | "DUPLICATE_VIEW_DETECTED"
  | "DASHBOARD_RENDERING_NONDETERMINISTIC"
  | "WIDGET_ORDER_NONDETERMINISTIC"
  | "LAYOUT_NOT_REPRODUCIBLE"
  | "STATE_NOT_REPLAYABLE"
  | "NAVIGATION_NOT_DETERMINISTIC"
  | "SEARCH_NOT_DETERMINISTIC"
  | "FILTER_SORT_NOT_DETERMINISTIC"
  | "REPLAY_REFERENCE_MISSING"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "RESTRICTED_FIELD_EXPOSED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED";

export type DashboardRenderingContract = Readonly<{
  contract_id: "adaptive-dashboard-rendering-contract";
  version: "adaptive-dashboard-foundation/v10.14.1";
  deterministic_rendering_required: true;
  layout_integrity_required: true;
  widget_ordering_required: true;
  data_ordering_required: true;
  replay_rendering_required: true;
  integrity_hash_validation_required: true;
  read_only: true;
  advisory_only: true;
  mutation_supported: false;
  approval_supported: false;
  production_state_changes_supported: false;
  integrity_hash: string;
}>;

export type DashboardViewRegistryEntry = Readonly<{
  view_id: DashboardViewId;
  view_name: string;
  owner: string;
  description: string;
  version: "v1";
  required_permissions: readonly DashboardRole[];
  tenant_scope: DashboardTenantScope;
  supported_widgets: readonly DashboardWidgetType[];
  navigation_route: string;
  replay_supported: boolean;
  certification_status: DashboardCertificationStatus;
  integrity_hash: string;
}>;

export type DashboardWidgetDefinition = Readonly<{
  widget_id: string;
  widget_type: DashboardWidgetType;
  supported_views: readonly DashboardViewId[];
  deterministic: boolean;
  replay_supported: boolean;
  filtering_supported: boolean;
  tenant_isolated: boolean;
  governance_restricted: boolean;
  permission_validated: boolean;
  render_order: number;
  integrity_hash: string;
}>;

export type DashboardLayoutDefinition = Readonly<{
  layout_id: string;
  view_id: DashboardViewId;
  template: "OVERVIEW_GRID" | "REVIEW_WORKSPACE" | "REPLAY_TIMELINE" | "AUDIT_CONSOLE";
  sections: readonly string[];
  widget_order: readonly string[];
  responsive_breakpoints: readonly string[];
  version: "v1";
  deterministic: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type DashboardStateRecord = Readonly<{
  state_id: string;
  selected_tenant: string;
  selected_mission: string;
  selected_view: DashboardViewId;
  filters: readonly string[];
  sorting: readonly DashboardSortKey[];
  search_query: string;
  timeline_position: string;
  replay_position: string;
  selected_proposal: string | null;
  navigation_history: readonly string[];
  reproducible: boolean;
  replayable: boolean;
  recoverable: boolean;
  integrity_hash: string;
}>;

export type DashboardNavigationRecord = Readonly<{
  navigation_id: string;
  from_view: DashboardViewId;
  to_view: DashboardViewId;
  route: string;
  breadcrumbs: readonly string[];
  preserves_replay_state: boolean;
  preserves_filters: boolean;
  preserves_tenant_boundary: boolean;
  preserves_security_context: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DashboardSearchRecord = Readonly<{
  search_id: string;
  domain: DashboardSearchDomain;
  query: string;
  result_refs: readonly string[];
  deterministic_order: boolean;
  replayable: boolean;
  permission_aware: boolean;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type DashboardFilterSortRecord = Readonly<{
  filter_id: string;
  standard_filters: readonly string[];
  sort_keys: readonly DashboardSortKey[];
  deterministic: boolean;
  tenant_isolated: boolean;
  role_restricted: boolean;
  integrity_hash: string;
}>;

export type DashboardReplayLink = Readonly<{
  replay_link_id: string;
  object_ref: string;
  evidence_lineage_ref: string;
  proposal_lineage_ref: string;
  certification_lineage_ref: string;
  governance_history_ref: string;
  simulation_history_ref: string;
  rollback_history_ref: string;
  replayable: boolean;
  integrity_hash: string;
}>;

export type DashboardPermissionDecision = Readonly<{
  permission_id: string;
  role: DashboardRole;
  tenant_id: string;
  view_id: DashboardViewId;
  allowed: boolean;
  restricted_fields: readonly string[];
  constitutional_policy_enforced: boolean;
  governance_restrictions_enforced: boolean;
  tenant_isolation_enforced: boolean;
  evidence_authorized: boolean;
  integrity_hash: string;
}>;

export type AdaptiveDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  mission_scope: string;
  dashboard_view: DashboardViewId;
  source_record_refs: readonly string[];
  visible_to_roles: readonly DashboardRole[];
  restricted_fields: readonly string[];
  summary: string;
  current_status: "NOMINAL" | "WARNING" | "BLOCKED";
  alerts: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveDashboardMetrics = Readonly<{
  rendering_latency_ms: number;
  rendering_failures: number;
  missing_widgets: number;
  broken_references: number;
  replay_failures: number;
  search_latency_ms: number;
  navigation_failures: number;
  stale_dashboard_data: number;
  integrity_verification_failures: number;
  permission_violations: number;
  integrity_hash: string;
}>;

export type AdaptiveDashboardValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: AdaptiveDashboardFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveDashboardApiSurface = Readonly<{
  api_id: string;
  establish_foundation: "POST /adaptive-dashboard-foundation/establish";
  retrieve_contract: "GET /adaptive-dashboard-foundation/contract";
  retrieve_views: "POST /adaptive-dashboard-foundation/views";
  retrieve_widgets: "POST /adaptive-dashboard-foundation/widgets";
  retrieve_layouts: "POST /adaptive-dashboard-foundation/layouts";
  retrieve_state: "POST /adaptive-dashboard-foundation/state";
  retrieve_navigation: "POST /adaptive-dashboard-foundation/navigation";
  retrieve_search: "POST /adaptive-dashboard-foundation/search";
  retrieve_filters: "POST /adaptive-dashboard-foundation/filters";
  retrieve_records: "POST /adaptive-dashboard-foundation/records";
  retrieve_replay: "POST /adaptive-dashboard-foundation/replay";
  retrieve_permissions: "POST /adaptive-dashboard-foundation/permissions";
  validate_foundation: "POST /adaptive-dashboard-foundation/validate";
  inspect_foundation: "POST /adaptive-dashboard-foundation/inspect";
  mutation_supported: false;
  approval_supported: false;
  production_state_changes_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveDashboardInput = Readonly<{
  scenario?: AdaptiveDashboardScenario;
  role?: DashboardRole;
  tenant_id?: string;
}>;

export type AdaptiveDashboardResult = Readonly<{
  adaptive_dashboard_foundation_version: "adaptive-dashboard-foundation/v10.14.1";
  foundation_identifier: "AdaptiveDashboardFoundation";
  status: AdaptiveDashboardStatus;
  api_surface: AdaptiveDashboardApiSurface;
  rendering_contract: DashboardRenderingContract;
  view_registry: readonly DashboardViewRegistryEntry[];
  widget_framework: readonly DashboardWidgetDefinition[];
  layout_engine: readonly DashboardLayoutDefinition[];
  state_manager: DashboardStateRecord;
  navigation_service: readonly DashboardNavigationRecord[];
  search_engine: readonly DashboardSearchRecord[];
  filtering_sorting: DashboardFilterSortRecord;
  replay_integration: readonly DashboardReplayLink[];
  permission_engine: readonly DashboardPermissionDecision[];
  dashboard_records: readonly AdaptiveDashboardRecord[];
  metrics: AdaptiveDashboardMetrics;
  validation_tests: readonly AdaptiveDashboardValidationTest[];
  validation_outcome: DashboardValidationOutcome;
  failures: readonly AdaptiveDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  governance_visible: boolean;
  constitutional_enforced: boolean;
  read_only: true;
  advisory_only: true;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveDashboardValidationResult = Readonly<{
  foundation_id: string | null;
  valid: boolean;
  validation_outcome: DashboardValidationOutcome;
  failures: readonly AdaptiveDashboardFailure[];
  integrity_hash_valid: boolean;
  replay_hash_valid: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type AdaptiveDashboardObservabilitySurface = Readonly<{
  foundation_id: string;
  status: AdaptiveDashboardStatus;
  validation_outcome: DashboardValidationOutcome;
  views: number;
  widgets: number;
  layouts: number;
  records: number;
  failed_tests: number;
  failures: readonly AdaptiveDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  read_only: boolean;
  integrity_hash: string;
}>;

export type AdaptiveDashboardFoundationContract = Readonly<{
  doctrine: Readonly<{
    version: "adaptive-dashboard-foundation/v10.14.1";
    principles: readonly string[];
    supported_widgets: readonly DashboardWidgetType[];
    supported_views: readonly DashboardViewId[];
    search_domains: readonly DashboardSearchDomain[];
    sort_keys: readonly DashboardSortKey[];
    read_only: true;
    advisory_only: true;
  }>;
  result: AdaptiveDashboardResult;
  validation: AdaptiveDashboardValidationResult;
  observability: AdaptiveDashboardObservabilitySurface;
}>;
