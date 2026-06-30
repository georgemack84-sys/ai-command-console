export type VisibilityDashboardType = "EXECUTION_DASHBOARD" | "AUTONOMY_DASHBOARD" | "GOVERNANCE_DASHBOARD" | "CONFIDENCE_DASHBOARD" | "RISK_DASHBOARD" | "INTERVENTION_DASHBOARD";
export type VisibilityWidgetType = "TIMELINE_WIDGET" | "STATE_WIDGET" | "GRAPH_WIDGET" | "STATUS_WIDGET" | "CONFIDENCE_WIDGET" | "RISK_WIDGET" | "INTERVENTION_WIDGET" | "REPLAY_WIDGET" | "LINEAGE_WIDGET" | "INTEGRITY_WIDGET" | "EVIDENCE_WIDGET";
export type VisualizationState = "INITIALIZED" | "LOADING" | "READY" | "STALE" | "DEGRADED" | "BLOCKED" | "RESTRICTED" | "ERROR" | "ARCHIVED";
export type VisibilityFreshnessState = "CURRENT" | "STALE" | "DEGRADED" | "UNAVAILABLE" | "RESTRICTED";
export type VisibilityValidationOutcome = "VALID" | "CONDITIONAL" | "INVALID" | "BLOCKED";
export type VisibilityAccessLevel = "MISSION_OPERATOR" | "MISSION_OBSERVER" | "GOVERNANCE_OFFICER" | "AUDITOR" | "SECURITY_OFFICER";

export type MissionControlVisibilityScenario =
  | "BASELINE"
  | "MISSING_SCHEMA"
  | "MISSING_DASHBOARD"
  | "MISSING_WIDGET_REGISTRY"
  | "MISSING_STANDARDS"
  | "MISSING_IMMUTABLE_IDS"
  | "MISSING_TIMESTAMPS"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_LINEAGE_REFERENCE"
  | "MISSING_INTEGRITY_HASH"
  | "MISSING_EVIDENCE_REFERENCE"
  | "NONDETERMINISTIC_ORDERING"
  | "WIDGET_MUTATION_AUTHORITY"
  | "HIDDEN_AUTONOMOUS_STATE"
  | "CROSS_TENANT_VISIBILITY"
  | "UNAUTHORIZED_OPERATOR"
  | "STALE_DATA_MARKED_CURRENT";

export type VisibilityFailure =
  | "VISIBILITY_SCHEMA_MISSING"
  | "DASHBOARD_CONTRACT_MISSING"
  | "WIDGET_REGISTRY_MISSING"
  | "VISUALIZATION_STANDARDS_MISSING"
  | "IMMUTABLE_IDS_MISSING"
  | "TIMESTAMPS_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "EVIDENCE_REFERENCE_MISSING"
  | "DETERMINISTIC_ORDERING_MISSING"
  | "WIDGET_MUTATION_AUTHORITY_ALLOWED"
  | "HIDDEN_AUTONOMOUS_STATE_VISIBLE"
  | "CROSS_TENANT_DATA_VISIBLE"
  | "UNAUTHORIZED_OPERATOR_VISIBLE"
  | "STALE_DATA_NOT_DEGRADED";

export type VisibilityRecord = Readonly<{
  visibility_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  dashboard_type: VisibilityDashboardType;
  widget_type: VisibilityWidgetType;
  visualization_state: VisualizationState;
  source_system: string;
  display_scope: string;
  data_sources: readonly string[];
  immutable_ids: readonly string[];
  timestamps: readonly string[];
  lineage_references: readonly string[];
  replay_references: readonly string[];
  integrity_hashes: readonly string[];
  confidence_values: readonly number[];
  evidence_references: readonly string[];
  governance_references: readonly string[];
  access_level: VisibilityAccessLevel;
  created_at: string;
  updated_at: string;
  visibility_hash: string;
}>;

export type DashboardContract = Readonly<{
  dashboard_type: VisibilityDashboardType;
  displays: readonly string[];
  required_fields: readonly string[];
  allowed_states: readonly string[];
  allowed_source_systems: readonly string[];
  replay_required: true;
  lineage_required: true;
  integrity_required: true;
  advisory_only: true;
  dashboard_hash: string;
}>;

export type WidgetRegistryEntry = Readonly<{
  widget_id: string;
  widget_name: string;
  widget_type: VisibilityWidgetType;
  dashboard_type: VisibilityDashboardType | "SHARED";
  allowed_data_sources: readonly string[];
  required_fields: readonly string[];
  refresh_policy: "ON_QUERY" | "ON_REPLAY" | "ON_EVIDENCE_UPDATE";
  access_policy: readonly VisibilityAccessLevel[];
  tenant_scope: "TENANT_ONLY";
  replay_required: boolean;
  lineage_required: boolean;
  integrity_required: boolean;
  evidence_required: boolean;
  execution_authority: false;
  registry_hash: string;
}>;

export type VisualizationStandards = Readonly<{
  standards_id: string;
  deterministic_ordering: readonly string[];
  freshness_states: readonly VisibilityFreshnessState[];
  required_display_rules: readonly string[];
  advisory_only: true;
  stale_requires_degraded_display: true;
  hidden_state_rejected: boolean;
  standards_hash: string;
}>;

export type VisibilityAccessContract = Readonly<{
  access_contract_id: string;
  required_checks: readonly string[];
  rejected_conditions: readonly string[];
  tenant_isolation_required: true;
  governance_access_required: true;
  access_hash: string;
}>;

export type VisibilityValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: VisibilityFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type MissionControlVisibilityContractReport = Readonly<{
  phase_version: "8J.1";
  schema_version: "mission-control-visibility-contract/v8J.1";
  contract_id: string;
  tenant_id: string;
  mission_id: string;
  validation_outcome: VisibilityValidationOutcome;
  visibility_schema: readonly VisibilityRecord[];
  dashboard_contracts: readonly DashboardContract[];
  widget_registry: readonly WidgetRegistryEntry[];
  visualization_standards: VisualizationStandards;
  access_contract: VisibilityAccessContract;
  validation_tests: readonly VisibilityValidationTest[];
  failures: readonly VisibilityFailure[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authority_granted: false;
  report_hash: string;
}>;

export type MissionControlVisibilityContractInput = Readonly<{
  scenario?: MissionControlVisibilityScenario;
}>;

export type MissionControlVisibilityValidationResult = Readonly<{
  contract_id: string | null;
  valid: boolean;
  validation_outcome: VisibilityValidationOutcome;
  failures: readonly VisibilityFailure[];
  report_hash_valid: boolean;
  advisory_only: boolean;
  validation_hash: string;
}>;

export type MissionControlVisibilityObservabilitySurface = Readonly<{
  contract_id: string;
  validation_outcome: VisibilityValidationOutcome;
  dashboard_count: number;
  widget_count: number;
  visualization_count: number;
  failed_tests: number;
  failures: readonly VisibilityFailure[];
  advisory_only: boolean;
  execution_authority_granted: boolean;
  report_hash: string;
}>;
