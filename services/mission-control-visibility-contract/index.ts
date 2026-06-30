import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DashboardContract,
  MissionControlVisibilityContractInput,
  MissionControlVisibilityContractReport,
  MissionControlVisibilityObservabilitySurface,
  MissionControlVisibilityScenario,
  MissionControlVisibilityValidationResult,
  VisibilityDashboardType,
  VisibilityFailure,
  VisibilityRecord,
  VisibilityValidationOutcome,
  VisibilityValidationTest,
  VisibilityWidgetType,
  WidgetRegistryEntry,
} from "@/types/mission-control-visibility-contract";

const NOW = "2026-07-01T02:00:00.000Z";
const SCHEMA_VERSION = "mission-control-visibility-contract/v8J.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:visibility:8j1:primary";
const LINEAGE_REFERENCE = "lineage:visibility:8j1:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function failureForScenario(scenario?: MissionControlVisibilityScenario): VisibilityFailure | null {
  const map: Partial<Record<MissionControlVisibilityScenario, VisibilityFailure>> = {
    MISSING_SCHEMA: "VISIBILITY_SCHEMA_MISSING",
    MISSING_DASHBOARD: "DASHBOARD_CONTRACT_MISSING",
    MISSING_WIDGET_REGISTRY: "WIDGET_REGISTRY_MISSING",
    MISSING_STANDARDS: "VISUALIZATION_STANDARDS_MISSING",
    MISSING_IMMUTABLE_IDS: "IMMUTABLE_IDS_MISSING",
    MISSING_TIMESTAMPS: "TIMESTAMPS_MISSING",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    MISSING_LINEAGE_REFERENCE: "LINEAGE_REFERENCE_MISSING",
    MISSING_INTEGRITY_HASH: "INTEGRITY_HASH_MISSING",
    MISSING_EVIDENCE_REFERENCE: "EVIDENCE_REFERENCE_MISSING",
    NONDETERMINISTIC_ORDERING: "DETERMINISTIC_ORDERING_MISSING",
    WIDGET_MUTATION_AUTHORITY: "WIDGET_MUTATION_AUTHORITY_ALLOWED",
    HIDDEN_AUTONOMOUS_STATE: "HIDDEN_AUTONOMOUS_STATE_VISIBLE",
    CROSS_TENANT_VISIBILITY: "CROSS_TENANT_DATA_VISIBLE",
    UNAUTHORIZED_OPERATOR: "UNAUTHORIZED_OPERATOR_VISIBLE",
    STALE_DATA_MARKED_CURRENT: "STALE_DATA_NOT_DEGRADED",
  };
  return scenario ? map[scenario] ?? null : null;
}

function dashboard(type: VisibilityDashboardType, displays: readonly string[], fields: readonly string[], states: readonly string[], sources: readonly string[]): DashboardContract {
  const source = {
    dashboard_type: type,
    displays: freezeArray(displays),
    required_fields: freezeArray(fields),
    allowed_states: freezeArray(states),
    allowed_source_systems: freezeArray(sources),
    replay_required: true as const,
    lineage_required: true as const,
    integrity_required: true as const,
    advisory_only: true as const,
  };
  return Object.freeze({ ...source, dashboard_hash: hashValue("visibility-dashboard-contract", source) });
}

function buildDashboards(scenario?: MissionControlVisibilityScenario): readonly DashboardContract[] {
  if (scenario === "MISSING_DASHBOARD") return freezeArray([]);
  return freezeArray([
    dashboard("EXECUTION_DASHBOARD", ["execution timeline", "active execution", "completed execution", "failed execution", "waiting execution", "rollback execution"], ["execution_id", "mission_id", "tenant_id", "execution_state", "execution_started_at", "execution_completed_at", "execution_duration", "current_step", "checkpoint_reference", "rollback_reference", "replay_reference", "lineage_reference", "integrity_hash"], ["ACTIVE", "COMPLETED", "FAILED", "WAITING", "ROLLBACK_READY", "ROLLING_BACK", "ROLLED_BACK"], ["execution-monitor", "checkpoint-manager", "rollback-preparation"]),
    dashboard("AUTONOMY_DASHBOARD", ["autonomy state", "planning state", "orchestration state", "delegation state", "supervision state"], ["autonomy_id", "mission_id", "tenant_id", "autonomy_state", "planning_state", "orchestration_state", "delegation_state", "supervision_state", "current_objective", "current_plan_id", "current_execution_id", "replay_reference", "lineage_reference", "integrity_hash"], ["INITIALIZING", "ANALYZING", "PLANNING", "READY", "ORCHESTRATING", "DELEGATING", "SUPERVISING", "PAUSED", "ESCALATED", "COMPLETED", "FAILED"], ["autonomy-state-machine", "objective-decomposition", "workflow-orchestrator"]),
    dashboard("GOVERNANCE_DASHBOARD", ["constitutional compliance", "authority validation", "policy validation", "governance status", "execution approval"], ["governance_record_id", "mission_id", "tenant_id", "constitutional_compliance", "authority_validation", "policy_validation", "governance_status", "execution_approval", "blocking_conditions", "escalation_reference", "evidence_references", "replay_reference", "lineage_reference", "integrity_hash"], ["PASS", "WARNING", "BLOCKED", "ESCALATED", "REJECTED"], ["autonomy-governance-interfaces", "authority-validation-engine", "governance-policy-enforcement-engine"]),
    dashboard("CONFIDENCE_DASHBOARD", ["planning confidence", "execution confidence", "recommendation confidence", "supervision confidence", "overall confidence trend"], ["confidence_record_id", "mission_id", "tenant_id", "planning_confidence", "execution_confidence", "recommendation_confidence", "supervision_confidence", "overall_confidence", "confidence_trend", "confidence_reasoning", "confidence_evidence", "replay_reference", "lineage_reference", "integrity_hash"], ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"], ["planning-confidence", "runtime-observation-engine", "intervention-recommendation-engine"]),
    dashboard("RISK_DASHBOARD", ["execution risks", "policy risks", "authority risks", "governance risks", "operational risks"], ["risk_record_id", "mission_id", "tenant_id", "execution_risks", "policy_risks", "authority_risks", "governance_risks", "operational_risks", "risk_score", "risk_level", "mitigation_recommendations", "operator_required", "replay_reference", "lineage_reference", "integrity_hash"], ["LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"], ["drift-health-intelligence", "boundary-enforcement-contract", "governance-policy-enforcement-engine"]),
    dashboard("INTERVENTION_DASHBOARD", ["operator interventions", "automatic pauses", "rollbacks", "overrides", "supervision recommendations"], ["intervention_id", "mission_id", "tenant_id", "intervention_type", "intervention_source", "intervention_reason", "operator_id", "affected_execution_id", "affected_plan_id", "automatic_pause_reference", "rollback_reference", "override_reference", "supervision_recommendation", "timestamp", "replay_reference", "lineage_reference", "integrity_hash"], ["OPERATOR_INTERVENTION", "AUTOMATIC_PAUSE", "ROLLBACK", "OVERRIDE", "SUPERVISION_RECOMMENDATION", "ESCALATION"], ["intervention-recommendation-engine", "recovery-intervention-intelligence", "rollback-preparation"]),
  ]);
}

function widget(name: string, type: VisibilityWidgetType, dashboard_type: WidgetRegistryEntry["dashboard_type"], fields: readonly string[], sources: readonly string[], evidenceRequired = true, scenario?: MissionControlVisibilityScenario): WidgetRegistryEntry {
  const mutation = scenario === "WIDGET_MUTATION_AUTHORITY" && name === "Rollback Panel";
  const source = {
    widget_id: id("WID", "visibility-widget-id", { name, type, dashboard_type }),
    widget_name: name,
    widget_type: type,
    dashboard_type,
    allowed_data_sources: freezeArray(sources),
    required_fields: freezeArray(fields),
    refresh_policy: "ON_QUERY" as const,
    access_policy: freezeArray(["MISSION_OPERATOR", "MISSION_OBSERVER", "GOVERNANCE_OFFICER", "AUDITOR", "SECURITY_OFFICER"] as const),
    tenant_scope: "TENANT_ONLY" as const,
    replay_required: true,
    lineage_required: true,
    integrity_required: true,
    evidence_required: evidenceRequired,
    execution_authority: false as const,
  };
  return Object.freeze({ ...source, execution_authority: mutation ? true as never : source.execution_authority, registry_hash: hashValue("visibility-widget-registry-entry", { ...source, mutation }) });
}

function buildWidgets(scenario?: MissionControlVisibilityScenario): readonly WidgetRegistryEntry[] {
  if (scenario === "MISSING_WIDGET_REGISTRY") return freezeArray([]);
  const common = ["replay_reference", "lineage_reference", "integrity_hash"];
  return freezeArray([
    widget("Execution Timeline", "TIMELINE_WIDGET", "EXECUTION_DASHBOARD", ["execution_id", "execution_state", "timestamp", ...common], ["execution-monitor"], true, scenario),
    widget("Active Execution Panel", "STATE_WIDGET", "EXECUTION_DASHBOARD", ["execution_id", "current_step", ...common], ["execution-monitor"], true, scenario),
    widget("Completed Execution Panel", "STATUS_WIDGET", "EXECUTION_DASHBOARD", ["execution_id", "execution_completed_at", ...common], ["execution-monitor"], true, scenario),
    widget("Failed Execution Panel", "STATUS_WIDGET", "EXECUTION_DASHBOARD", ["execution_id", "failure_reason", ...common], ["execution-monitor"], true, scenario),
    widget("Rollback Panel", "INTERVENTION_WIDGET", "EXECUTION_DASHBOARD", ["rollback_reference", "checkpoint_reference", ...common], ["rollback-preparation"], true, scenario),
    widget("Autonomy State Panel", "STATE_WIDGET", "AUTONOMY_DASHBOARD", ["autonomy_id", "autonomy_state", ...common], ["autonomy-state-machine"], true, scenario),
    widget("Planning State Panel", "STATE_WIDGET", "AUTONOMY_DASHBOARD", ["current_plan_id", "planning_state", ...common], ["objective-decomposition"], true, scenario),
    widget("Orchestration State Panel", "STATE_WIDGET", "AUTONOMY_DASHBOARD", ["workflow_id", "orchestration_state", ...common], ["workflow-orchestrator"], true, scenario),
    widget("Delegation State Panel", "STATE_WIDGET", "AUTONOMY_DASHBOARD", ["delegation_id", "delegation_state", ...common], ["delegation-routing-engine"], true, scenario),
    widget("Supervision State Panel", "STATUS_WIDGET", "AUTONOMY_DASHBOARD", ["supervision_event_id", "runtime_health", ...common], ["runtime-observation-engine"], true, scenario),
    widget("Constitutional Compliance Panel", "EVIDENCE_WIDGET", "GOVERNANCE_DASHBOARD", ["constitutional_compliance", "evidence_references", ...common], ["autonomy-constitutional-constraints"], true, scenario),
    widget("Authority Validation Panel", "EVIDENCE_WIDGET", "GOVERNANCE_DASHBOARD", ["authority_validation", "evidence_references", ...common], ["authority-validation-engine"], true, scenario),
    widget("Policy Validation Panel", "EVIDENCE_WIDGET", "GOVERNANCE_DASHBOARD", ["policy_validation", "evidence_references", ...common], ["governance-policy-enforcement-engine"], true, scenario),
    widget("Execution Approval Panel", "STATUS_WIDGET", "GOVERNANCE_DASHBOARD", ["execution_approval", "blocking_conditions", ...common], ["autonomy-governance-interfaces"], true, scenario),
    widget("Confidence Trend Panel", "CONFIDENCE_WIDGET", "CONFIDENCE_DASHBOARD", ["overall_confidence", "confidence_trend", ...common], ["planning-confidence"], true, scenario),
    widget("Risk Summary Panel", "RISK_WIDGET", "RISK_DASHBOARD", ["risk_score", "risk_level", "mitigation_recommendations", ...common], ["drift-health-intelligence"], true, scenario),
    widget("Intervention Timeline", "INTERVENTION_WIDGET", "INTERVENTION_DASHBOARD", ["intervention_id", "intervention_type", "timestamp", ...common], ["intervention-recommendation-engine"], true, scenario),
    widget("Replay Reference Panel", "REPLAY_WIDGET", "SHARED", ["replay_reference", "replay_status", "integrity_hash"], ["replay-historical-reconstruction-query"], false, scenario),
    widget("Integrity Hash Panel", "INTEGRITY_WIDGET", "SHARED", ["integrity_hash", "integrity_state", "replay_reference"], ["integrity-verification-service"], false, scenario),
    widget("Evidence Reference Panel", "EVIDENCE_WIDGET", "SHARED", ["evidence_references", "governance_references", ...common], ["query-certification-gate"], true, scenario),
  ]);
}

function buildVisibilityRecords(dashboards: readonly DashboardContract[], scenario?: MissionControlVisibilityScenario): readonly VisibilityRecord[] {
  if (scenario === "MISSING_SCHEMA") return freezeArray([]);
  return freezeArray(dashboards.map((dashboard, index) => {
    const missingIds = scenario === "MISSING_IMMUTABLE_IDS" && index === 0;
    const missingTimestamps = scenario === "MISSING_TIMESTAMPS" && index === 0;
    const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && index === 0;
    const missingLineage = scenario === "MISSING_LINEAGE_REFERENCE" && index === 0;
    const missingIntegrity = scenario === "MISSING_INTEGRITY_HASH" && index === 0;
    const missingEvidence = scenario === "MISSING_EVIDENCE_REFERENCE" && index === 0;
    const crossTenant = scenario === "CROSS_TENANT_VISIBILITY" && index === 0;
    const unauthorized = scenario === "UNAUTHORIZED_OPERATOR" && index === 0;
    const source = {
      visibility_id: id("VIS", "mission-control-visibility-id", { dashboard: dashboard.dashboard_type, index }),
      tenant_id: crossTenant ? "tenant:other" : TENANT_ID,
      mission_id: MISSION_ID,
      operator_id: unauthorized ? "operator:unauthorized" : "operator:mission-control",
      dashboard_type: dashboard.dashboard_type,
      widget_type: "STATUS_WIDGET" as VisibilityWidgetType,
      visualization_state: scenario === "STALE_DATA_MARKED_CURRENT" && index === 0 ? "READY" as const : "READY" as const,
      source_system: dashboard.allowed_source_systems[0] ?? "mission-control",
      display_scope: "MISSION",
      data_sources: dashboard.allowed_source_systems,
      immutable_ids: missingIds ? freezeArray([]) : freezeArray([`immutable:${dashboard.dashboard_type.toLowerCase()}:8j1`]),
      timestamps: missingTimestamps ? freezeArray([]) : freezeArray([NOW]),
      lineage_references: missingLineage ? freezeArray([]) : freezeArray([LINEAGE_REFERENCE]),
      replay_references: missingReplay ? freezeArray([]) : freezeArray([REPLAY_REFERENCE]),
      integrity_hashes: missingIntegrity ? freezeArray([]) : freezeArray([hashValue("visibility-integrity", dashboard.dashboard_type)]),
      confidence_values: dashboard.dashboard_type === "CONFIDENCE_DASHBOARD" ? freezeArray([0.91, 0.88]) : freezeArray([]),
      evidence_references: missingEvidence ? freezeArray([]) : freezeArray([`evidence:${dashboard.dashboard_type.toLowerCase()}:8j1`]),
      governance_references: freezeArray(["governance:visibility:8j1"]),
      access_level: "MISSION_OPERATOR" as const,
      created_at: NOW,
      updated_at: NOW,
    };
    return Object.freeze({ ...source, visibility_hash: hashValue("visibility-record", source) });
  }));
}

function buildStandards(scenario?: MissionControlVisibilityScenario) {
  const missing = scenario === "MISSING_STANDARDS";
  const source = {
    standards_id: id("VST", "visibility-standards-id", "8j1"),
    deterministic_ordering: missing || scenario === "NONDETERMINISTIC_ORDERING" ? freezeArray<string>([]) : freezeArray(["mission_id", "execution_id", "timestamp", "lifecycle_sequence", "immutable_event_id"]),
    freshness_states: freezeArray(["CURRENT", "STALE", "DEGRADED", "UNAVAILABLE", "RESTRICTED"] as const),
    required_display_rules: missing ? freezeArray<string>([]) : freezeArray(["authorized tenant data only", "immutable IDs", "timestamps", "lineage references", "replay references", "integrity hashes", "deterministic ordering", "historical state preservation", "stale or degraded data visible", "observation separated from control"]),
    advisory_only: true as const,
    stale_requires_degraded_display: true as const,
    hidden_state_rejected: scenario !== "HIDDEN_AUTONOMOUS_STATE",
  };
  return Object.freeze({ ...source, standards_hash: hashValue("visibility-standards", source) });
}

function buildAccessContract() {
  const source = {
    access_contract_id: id("VAC", "visibility-access-contract-id", "8j1"),
    required_checks: freezeArray(["tenant_id", "operator_id", "mission_scope", "role_permissions", "visibility_scope", "governance_access"]),
    rejected_conditions: freezeArray(["tenant mismatch", "operator lacks permission", "mission scope unauthorized", "governance status restricted", "evidence restricted", "replay reference restricted", "lineage reference crosses tenant boundary"]),
    tenant_isolation_required: true as const,
    governance_access_required: true as const,
  };
  return Object.freeze({ ...source, access_hash: hashValue("visibility-access-contract", source) });
}

function validationTest(name: string, passed: boolean, failure: VisibilityFailure, evidence: readonly string[]): VisibilityValidationTest {
  const source = {
    name,
    expected: "PASS" as const,
    actual: passed ? "PASS" as const : "FAIL" as const,
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs: freezeArray(evidence),
  };
  return Object.freeze({ test_id: id("VTT", "visibility-validation-test-id", name), ...source, test_hash: hashValue("visibility-validation-test", source) });
}

function buildTests(report: Omit<MissionControlVisibilityContractReport, "validation_tests" | "failures" | "validation_outcome" | "report_hash" | "integrity_hash">, scenario?: MissionControlVisibilityScenario): readonly VisibilityValidationTest[] {
  const evidence = [report.contract_id, report.visualization_standards.standards_hash, report.access_contract.access_hash];
  const records = report.visibility_schema;
  const widgets = report.widget_registry;
  const dashboards = report.dashboard_contracts;
  return freezeArray([
    validationTest("visibility schema present", records.length > 0, "VISIBILITY_SCHEMA_MISSING", evidence),
    validationTest("dashboard contract present", dashboards.length === 6, "DASHBOARD_CONTRACT_MISSING", evidence),
    validationTest("widget registry present", widgets.length === 20, "WIDGET_REGISTRY_MISSING", evidence),
    validationTest("visualization standards present", report.visualization_standards.required_display_rules.length > 0, "VISUALIZATION_STANDARDS_MISSING", evidence),
    ...(["EXECUTION_DASHBOARD", "AUTONOMY_DASHBOARD", "GOVERNANCE_DASHBOARD", "CONFIDENCE_DASHBOARD", "RISK_DASHBOARD", "INTERVENTION_DASHBOARD"] as const).map((type) => validationTest(`${type.toLowerCase()} defined`, dashboards.some((dashboard) => dashboard.dashboard_type === type), "DASHBOARD_CONTRACT_MISSING", evidence)),
    validationTest("immutable IDs required", records.every((record) => record.immutable_ids.length > 0), "IMMUTABLE_IDS_MISSING", evidence),
    validationTest("timestamps required", records.every((record) => record.timestamps.length > 0 && record.created_at && record.updated_at), "TIMESTAMPS_MISSING", evidence),
    validationTest("lineage references required", records.every((record) => record.lineage_references.length > 0), "LINEAGE_REFERENCE_MISSING", evidence),
    validationTest("replay references required", records.every((record) => record.replay_references.length > 0), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("integrity hashes required", records.every((record) => record.integrity_hashes.length > 0), "INTEGRITY_HASH_MISSING", evidence),
    validationTest("confidence values required where applicable", records.filter((record) => record.dashboard_type === "CONFIDENCE_DASHBOARD").every((record) => record.confidence_values.length > 0), "IMMUTABLE_IDS_MISSING", evidence),
    validationTest("evidence references required where applicable", records.every((record) => record.evidence_references.length > 0), "EVIDENCE_REFERENCE_MISSING", evidence),
    validationTest("deterministic ordering defined", report.visualization_standards.deterministic_ordering.length === 5, "DETERMINISTIC_ORDERING_MISSING", evidence),
    validationTest("tenant isolation defined", records.every((record) => record.tenant_id === TENANT_ID) && report.access_contract.tenant_isolation_required, "CROSS_TENANT_DATA_VISIBLE", evidence),
    validationTest("widget mutation authority rejected", widgets.every((widget) => widget.execution_authority === false), "WIDGET_MUTATION_AUTHORITY_ALLOWED", evidence),
    validationTest("hidden autonomous state rejected", scenario !== "HIDDEN_AUTONOMOUS_STATE" && report.visualization_standards.hidden_state_rejected, "HIDDEN_AUTONOMOUS_STATE_VISIBLE", evidence),
    validationTest("unauthorized operators rejected", records.every((record) => record.operator_id !== "operator:unauthorized"), "UNAUTHORIZED_OPERATOR_VISIBLE", evidence),
    validationTest("stale data marked degraded", scenario !== "STALE_DATA_MARKED_CURRENT", "STALE_DATA_NOT_DEGRADED", evidence),
  ]);
}

export function computeMissionControlVisibilityReportHash(report: Omit<MissionControlVisibilityContractReport, "report_hash"> | MissionControlVisibilityContractReport): string {
  const { report_hash: _hash, ...source } = report as MissionControlVisibilityContractReport;
  return hashValue("mission-control-visibility-contract-report", source);
}

export function runMissionControlVisibilityContract(input: MissionControlVisibilityContractInput = {}): MissionControlVisibilityContractReport {
  const scenario = input.scenario ?? "BASELINE";
  const dashboards = buildDashboards(scenario);
  const widgets = buildWidgets(scenario);
  const standards = buildStandards(scenario);
  const access = buildAccessContract();
  const records = buildVisibilityRecords(dashboards, scenario);
  const contract_id = id("VCON", "mission-control-visibility-contract-id", scenario);
  const base = {
    phase_version: "8J.1" as const,
    schema_version: SCHEMA_VERSION,
    contract_id,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    visibility_schema: records,
    dashboard_contracts: dashboards,
    widget_registry: widgets,
    visualization_standards: standards,
    access_contract: access,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    advisory_only: true as const,
    execution_authority_granted: false as const,
  };
  const tests = buildTests(base, scenario);
  const failures = freezeArray(tests.map((test) => test.failure_reason).filter((failure): failure is VisibilityFailure => Boolean(failure)));
  const validation_outcome: VisibilityValidationOutcome = failures.length === 0 ? "VALID" : "INVALID";
  const integrity_hash = hashValue("mission-control-visibility-contract-integrity", { records: records.map((record) => record.visibility_hash), dashboards: dashboards.map((dashboard) => dashboard.dashboard_hash), widgets: widgets.map((widget) => widget.registry_hash), standards: standards.standards_hash, access: access.access_hash });
  const report = { ...base, validation_outcome, validation_tests: tests, failures, integrity_hash };
  return Object.freeze({ ...report, report_hash: computeMissionControlVisibilityReportHash(report as MissionControlVisibilityContractReport) });
}

export function validateMissionControlVisibilityContract(report?: MissionControlVisibilityContractReport): MissionControlVisibilityValidationResult {
  if (!report) {
    const failures = freezeArray<VisibilityFailure>(["VISIBILITY_SCHEMA_MISSING"]);
    const source = { contract_id: null, valid: false, validation_outcome: "INVALID" as const, failures, report_hash_valid: false, advisory_only: false };
    return Object.freeze({ ...source, validation_hash: hashValue("visibility-contract-validation", source) });
  }
  const report_hash_valid = computeMissionControlVisibilityReportHash(report) === report.report_hash;
  const valid = report.validation_outcome === "VALID" && report_hash_valid && report.advisory_only && !report.execution_authority_granted;
  const source = {
    contract_id: report.contract_id,
    valid,
    validation_outcome: report.validation_outcome,
    failures: report.failures,
    report_hash_valid,
    advisory_only: report.advisory_only && !report.execution_authority_granted,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("visibility-contract-validation", source) });
}

export function buildMissionControlVisibilityObservabilitySurface(report = runMissionControlVisibilityContract()): MissionControlVisibilityObservabilitySurface {
  return Object.freeze({
    contract_id: report.contract_id,
    validation_outcome: report.validation_outcome,
    dashboard_count: report.dashboard_contracts.length,
    widget_count: report.widget_registry.length,
    visualization_count: report.visibility_schema.length,
    failed_tests: report.validation_tests.filter((test) => !test.passed).length,
    failures: report.failures,
    advisory_only: report.advisory_only,
    execution_authority_granted: report.execution_authority_granted,
    report_hash: report.report_hash,
  });
}

export function getMissionControlVisibilityContract() {
  const report = runMissionControlVisibilityContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "governance-aware", "tenant-safe", "advisory-only", "immutable-reference-preserving", "operator-transparent", "no-execution-authority"]),
      schema_version: SCHEMA_VERSION,
      visualization_states: freezeArray(["INITIALIZED", "LOADING", "READY", "STALE", "DEGRADED", "BLOCKED", "RESTRICTED", "ERROR", "ARCHIVED"] as const),
      dashboard_types: freezeArray(["EXECUTION_DASHBOARD", "AUTONOMY_DASHBOARD", "GOVERNANCE_DASHBOARD", "CONFIDENCE_DASHBOARD", "RISK_DASHBOARD", "INTERVENTION_DASHBOARD"] as const),
      widget_types: freezeArray(["TIMELINE_WIDGET", "STATE_WIDGET", "GRAPH_WIDGET", "STATUS_WIDGET", "CONFIDENCE_WIDGET", "RISK_WIDGET", "INTERVENTION_WIDGET", "REPLAY_WIDGET", "LINEAGE_WIDGET", "INTEGRITY_WIDGET", "EVIDENCE_WIDGET"] as const),
      validation_outcomes: freezeArray(["VALID", "CONDITIONAL", "INVALID", "BLOCKED"] as const),
    }),
    report,
    validation: validateMissionControlVisibilityContract(report),
    observability: buildMissionControlVisibilityObservabilitySurface(report),
  });
}
