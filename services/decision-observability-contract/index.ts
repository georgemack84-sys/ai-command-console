import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runReplayAuditCertificationGate } from "@/services/decision-replay-audit-certification-gate";
import type {
  DecisionDashboardSchema,
  DecisionDashboardState,
  DecisionDashboardType,
  DecisionDashboardWidget,
  DecisionObservabilityContractRecord,
  DecisionObservabilityFailure,
  DecisionObservabilityFoundation,
  DecisionObservabilityInput,
  DecisionObservabilityLifecycleState,
  DecisionObservabilityResult,
  DecisionObservabilityValidation,
  DecisionObservabilityValidationTest,
  DecisionVisualizationContract,
  DecisionVisualizationType,
  DecisionWidgetCategory,
  VisibilityAuthorization,
  VisibilityPermission,
  VisibilityRole,
} from "@/types/decision-observability-contract";
import type { ReplayAuditCertificationResult } from "@/types/decision-replay-audit-certification-gate";

const OBSERVABILITY_VERSION = "decision-observability-contract/v1" as const;
const DASHBOARD_VERSION = "decision-dashboard-schema/v1" as const;
const WIDGET_VERSION = "decision-dashboard-widget/v1" as const;
const NOW = "2026-07-05T02:30:00.000Z";

export const DECISION_OBSERVABILITY_LIFECYCLE_STATES: readonly DecisionObservabilityLifecycleState[] = Object.freeze(["REGISTERED", "INITIALIZED", "POPULATED", "VALIDATED", "VISIBLE", "ACTIVE", "UPDATED", "ARCHIVED"]);
export const DECISION_DASHBOARD_TYPES: readonly DecisionDashboardType[] = Object.freeze(["DECISION_OVERVIEW", "GOVERNANCE_STATUS", "REPLAY_AUDIT", "OPERATOR_ACTIONS", "ANALYTICS_CERTIFICATION"]);
export const DECISION_VISUALIZATION_TYPES: readonly DecisionVisualizationType[] = Object.freeze(["TIMELINE", "DEPENDENCY_GRAPH", "STATUS_PANEL", "QUEUE", "HEAT_MAP", "METRIC_SERIES", "EVIDENCE_TABLE"]);
export const DECISION_WIDGET_CATEGORIES: readonly DecisionWidgetCategory[] = Object.freeze(["DECISION", "PRIORITY", "RISK", "GOVERNANCE", "REPLAY", "CERTIFICATION", "OPERATOR", "ANALYTICS"]);
export const VISIBILITY_ROLES: readonly VisibilityRole[] = Object.freeze(["OPERATOR", "GOVERNANCE", "AUDITOR", "ADMINISTRATOR", "SYSTEM"]);

type Scenario = NonNullable<DecisionObservabilityInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function unique(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))]);
}

function context(certification: ReplayAuditCertificationResult) {
  const analytics = certification.analytics_result;
  const ledger = analytics.ledger_result;
  const integrity = ledger.integrity_result;
  const audit = integrity.audit_result;
  const replay = audit.replay_difference_result.replay_result;
  const trace = replay.trace_builder_result;
  const contract = trace.snapshot_capture.replay_contract;
  return { analytics, ledger, integrity, audit, replay, trace, contract };
}

function buildContract(certification: ReplayAuditCertificationResult, scenario: Scenario): DecisionObservabilityContractRecord | null {
  if (scenario === "MISSING_CONTRACT") return null;
  const c = context(certification);
  const lifecycleState = scenario === "UNKNOWN_LIFECYCLE" ? "UNKNOWN" as DecisionObservabilityLifecycleState : "ACTIVE";
  const replayRefs = scenario === "MISSING_REPLAY_REFS" ? [] : certification.evidence_package.replay_refs;
  const base: Omit<DecisionObservabilityContractRecord, "integrity_hash"> = {
    observability_id: `decision_observability_${c.contract.orchestration_id}`,
    orchestration_id: c.contract.orchestration_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : c.contract.tenant_id,
    mission_id: c.contract.mission_id,
    dashboard_state: "ACTIVE",
    lifecycle_state: lifecycleState,
    visualization_refs: freezeArray(["visualization_timeline", "visualization_dependency_graph", "visualization_governance_status", "visualization_replay_health", "visualization_certification_evidence"]),
    widget_refs: freezeArray(["widget_active_decisions", "widget_priority_queue", "widget_risk_heat_map", "widget_governance_status", "widget_replay_status", "widget_certification_status", "widget_pending_actions", "widget_throughput"]),
    timeline_refs: freezeArray([c.replay.report.replay_report_id, c.trace.trace_record.execution_timeline.timeline_id]),
    dependency_refs: freezeArray(c.trace.trace_record.dependency_trace.map((dependency) => dependency.dependency_trace_id)),
    conflict_refs: freezeArray([c.audit.replay_difference_result.diff_result.replay_diff_id]),
    governance_refs: scenario === "HIDE_GOVERNANCE" ? freezeArray([]) : certification.evidence_package.governance_refs,
    replay_refs: replayRefs,
    certification_refs: scenario === "MISSING_CERTIFICATION_STATUS" ? freezeArray([]) : freezeArray([certification.certification_record.certification_id, certification.certification_report.report_id]),
    operator_action_refs: certification.evidence_package.operator_refs,
    created_at: NOW,
    updated_at: NOW,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.observability_id }) });
  return record;
}

function dashboard(
  type: DecisionDashboardType,
  name: string,
  widgets: readonly string[],
  layout: readonly string[],
  roles: readonly VisibilityRole[],
  certification: ReplayAuditCertificationResult,
  scenario: Scenario,
): DecisionDashboardSchema {
  const replayRef = scenario === "DASHBOARD_REPLAY_MISMATCH" && type === "REPLAY_AUDIT" ? "replay_mismatch" : certification.replay_hash;
  const certificationStatus = scenario === "MISSING_CERTIFICATION_STATUS" && type === "ANALYTICS_CERTIFICATION"
    ? "" as ReplayAuditCertificationResult["certification_status"]
    : certification.certification_status;
  const base: Omit<DecisionDashboardSchema, "integrity_hash"> = {
    dashboard_id: `dashboard_${type.toLowerCase()}`,
    dashboard_name: name,
    dashboard_type: type,
    dashboard_version: DASHBOARD_VERSION,
    tenant_scope: "TENANT_ONLY",
    visibility_scope: freezeArray(roles),
    widget_refs: freezeArray(widgets),
    filters: freezeArray(["tenant_id", "mission_id", "orchestration_id", "lifecycle_state", "certification_status"]),
    layout: freezeArray(layout),
    refresh_policy: "ON_REPLAY",
    replay_ref: replayRef,
    certification_status: certificationStatus,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboards(certification: ReplayAuditCertificationResult, scenario: Scenario): readonly DecisionDashboardSchema[] {
  if (scenario === "MISSING_DASHBOARD_SCHEMA") return freezeArray([]);
  return freezeArray([
    dashboard("DECISION_OVERVIEW", "Decision Overview", ["widget_active_decisions", "widget_pending_decisions", "widget_blocked_decisions", "widget_completed_decisions"], ["timeline", "decision_queue", "state_summary"], ["OPERATOR", "GOVERNANCE", "AUDITOR"], certification, scenario),
    dashboard("GOVERNANCE_STATUS", "Governance Status", ["widget_governance_status", "widget_constitutional_status", "widget_authority_validation"], ["governance_status", "constitutional_status", "authority_panel"], ["GOVERNANCE", "AUDITOR", "OPERATOR"], certification, scenario),
    dashboard("REPLAY_AUDIT", "Replay Audit", ["widget_replay_status", "widget_replay_health", "widget_replay_integrity"], ["replay_timeline", "audit_evidence", "integrity_status"], ["AUDITOR", "GOVERNANCE", "OPERATOR"], certification, scenario),
    dashboard("OPERATOR_ACTIONS", "Operator Actions", ["widget_pending_actions", "widget_approval_queue", "widget_override_history", "widget_escalation_queue"], ["action_queue", "approval_queue", "operator_history"], ["OPERATOR", "AUDITOR"], certification, scenario),
    dashboard("ANALYTICS_CERTIFICATION", "Analytics & Certification", ["widget_throughput", "widget_bottlenecks", "widget_queue_health", "widget_decision_aging", "widget_certification_status", "widget_validation_progress", "widget_production_readiness"], ["analytics_series", "certification_status", "readiness_panel"], ["GOVERNANCE", "AUDITOR", "ADMINISTRATOR"], certification, scenario),
  ]);
}

function widget(id: string, name: string, category: DecisionWidgetCategory, visualization: DecisionVisualizationType, dataSource: string, permissions: readonly VisibilityPermission[], replayRef: string, scenario: Scenario): DecisionDashboardWidget {
  const executionAuthority = scenario === "EXECUTION_AUTHORITY" && id === "widget_pending_actions";
  const base: Omit<DecisionDashboardWidget, "integrity_hash" | "execution_authority"> & { execution_authority: false } = {
    widget_id: id,
    widget_name: name,
    widget_category: category,
    widget_version: WIDGET_VERSION,
    visualization_type: visualization,
    data_source: dataSource,
    permissions: freezeArray(permissions),
    refresh_policy: "ON_REPLAY",
    replay_ref: replayRef,
    execution_authority: false,
  };
  return Object.freeze({ ...base, execution_authority: executionAuthority ? true as false : false, integrity_hash: hashWithoutIntegrity({ ...base, execution_authority: executionAuthority }) });
}

function buildWidgets(certification: ReplayAuditCertificationResult, scenario: Scenario): readonly DecisionDashboardWidget[] {
  if (scenario === "MISSING_WIDGET_REGISTRY") return freezeArray([]);
  const replay = scenario === "MISSING_REPLAY_REFS" ? "" : certification.replay_hash;
  return freezeArray([
    widget("widget_active_decisions", "Active Decisions", "DECISION", "STATUS_PANEL", "decision-ledger", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_pending_decisions", "Pending Decisions", "DECISION", "QUEUE", "decision-ledger", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_blocked_decisions", "Blocked Decisions", "DECISION", "STATUS_PANEL", "decision-ledger", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_completed_decisions", "Completed Decisions", "DECISION", "STATUS_PANEL", "decision-ledger", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_priority_queue", "Priority Queue", "PRIORITY", "QUEUE", "priority-ledger", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_risk_heat_map", "Risk Heat Map", "RISK", "HEAT_MAP", "risk-context", ["VIEW_DECISIONS"], replay, scenario),
    widget("widget_governance_status", "Governance Status", "GOVERNANCE", "STATUS_PANEL", "governance-evidence", ["VIEW_GOVERNANCE"], replay, scenario),
    widget("widget_constitutional_status", "Constitutional Status", "GOVERNANCE", "STATUS_PANEL", "constitutional-evidence", ["VIEW_GOVERNANCE"], replay, scenario),
    widget("widget_authority_validation", "Authority Validation", "GOVERNANCE", "EVIDENCE_TABLE", "authority-evidence", ["VIEW_GOVERNANCE"], replay, scenario),
    widget("widget_replay_status", "Replay Status", "REPLAY", "STATUS_PANEL", "replay-audit-certification", ["VIEW_REPLAY"], replay, scenario),
    widget("widget_replay_health", "Replay Health", "REPLAY", "METRIC_SERIES", "replay-analytics", ["VIEW_REPLAY"], replay, scenario),
    widget("widget_replay_integrity", "Replay Integrity", "REPLAY", "EVIDENCE_TABLE", "integrity-verification", ["VIEW_REPLAY"], replay, scenario),
    widget("widget_certification_status", "Certification Status", "CERTIFICATION", "STATUS_PANEL", "replay-audit-certification", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_validation_progress", "Validation Progress", "CERTIFICATION", "METRIC_SERIES", "certification-validation", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_production_readiness", "Production Readiness", "CERTIFICATION", "STATUS_PANEL", "certification-report", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_pending_actions", "Pending Actions", "OPERATOR", "QUEUE", "operator-workflow", ["VIEW_OPERATOR_ACTIONS"], replay, scenario),
    widget("widget_approval_queue", "Approval Queue", "OPERATOR", "QUEUE", "operator-workflow", ["VIEW_OPERATOR_ACTIONS"], replay, scenario),
    widget("widget_override_history", "Override History", "OPERATOR", "TIMELINE", "operator-workflow", ["VIEW_OPERATOR_ACTIONS"], replay, scenario),
    widget("widget_escalation_queue", "Escalation Queue", "OPERATOR", "QUEUE", "operator-workflow", ["VIEW_OPERATOR_ACTIONS"], replay, scenario),
    widget("widget_throughput", "Throughput", "ANALYTICS", "METRIC_SERIES", "replay-analytics", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_bottlenecks", "Bottlenecks", "ANALYTICS", "METRIC_SERIES", "replay-analytics", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_queue_health", "Queue Health", "ANALYTICS", "METRIC_SERIES", "replay-analytics", ["VIEW_CERTIFICATION"], replay, scenario),
    widget("widget_decision_aging", "Decision Aging", "ANALYTICS", "METRIC_SERIES", "replay-analytics", ["VIEW_CERTIFICATION"], replay, scenario),
  ]);
}

function visualization(id: string, type: DecisionVisualizationType, source: string, dataSource: string, replayRef: string, scenario: Scenario): DecisionVisualizationContract {
  const deterministic = scenario !== "NONDETERMINISTIC_RENDERING";
  const base: Omit<DecisionVisualizationContract, "integrity_hash"> = {
    visualization_id: id,
    visualization_type: type,
    source_contract: source,
    data_source: dataSource,
    rendering_rules: deterministic ? freezeArray(["sort_by_sequence", "stable_grouping", "stable_time_window", "show_failures"]) : freezeArray(["client_random_order"]),
    filter_rules: freezeArray(["tenant_id", "mission_id", "orchestration_id", "authorization_scope"]),
    authorization_rules: freezeArray(["role_required", "tenant_match_required", "governance_visible", "certification_visible"]),
    replay_reference: replayRef,
    deterministic_rendering: deterministic,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildVisualizations(certification: ReplayAuditCertificationResult, scenario: Scenario): readonly DecisionVisualizationContract[] {
  if (scenario === "MISSING_VISUALIZATION") return freezeArray([]);
  const replay = scenario === "MISSING_REPLAY_REFS" ? "" : certification.replay_hash;
  return freezeArray([
    visualization("visualization_timeline", "TIMELINE", "decision_observability_contract", "trace_events", replay, scenario),
    visualization("visualization_dependency_graph", "DEPENDENCY_GRAPH", "decision_observability_contract", "dependency_refs", replay, scenario),
    visualization("visualization_governance_status", "STATUS_PANEL", "decision_observability_contract", "governance_refs", replay, scenario),
    visualization("visualization_replay_health", "METRIC_SERIES", "decision_observability_contract", "replay_analytics", replay, scenario),
    visualization("visualization_certification_evidence", "EVIDENCE_TABLE", "decision_observability_contract", "certification_evidence", replay, scenario),
  ]);
}

function authorization(role: VisibilityRole, permissions: readonly VisibilityPermission[], dashboards: readonly DecisionDashboardSchema[], widgets: readonly DecisionDashboardWidget[], scenario: Scenario): VisibilityAuthorization {
  const bypass = scenario === "AUTHORIZATION_BYPASS" && role === "OPERATOR";
  const base: Omit<VisibilityAuthorization, "integrity_hash" | "may_modify_governance" | "may_override_authority"> & { may_modify_governance: false; may_override_authority: false } = {
    authorization_id: `visibility_authorization_${role.toLowerCase()}`,
    role,
    permissions: freezeArray(permissions),
    dashboard_refs: freezeArray(dashboards.filter((dashboard) => dashboard.visibility_scope.includes(role)).map((dashboard) => dashboard.dashboard_id)),
    widget_refs: freezeArray(widgets.filter((item) => item.permissions.some((permission) => permissions.includes(permission))).map((item) => item.widget_id)),
    tenant_scope: "TENANT_ONLY",
    governance_scope: role === "OPERATOR" ? "VISIBLE" : "VISIBLE",
    replay_scope: permissions.includes("VIEW_REPLAY") ? "VISIBLE" : "RESTRICTED",
    certification_scope: permissions.includes("VIEW_CERTIFICATION") ? "VISIBLE" : "RESTRICTED",
    may_modify_governance: false,
    may_override_authority: false,
  };
  return Object.freeze({ ...base, may_override_authority: bypass ? true as false : false, integrity_hash: hashWithoutIntegrity({ ...base, may_override_authority: bypass }) });
}

function buildAuthorizations(dashboards: readonly DecisionDashboardSchema[], widgets: readonly DecisionDashboardWidget[], scenario: Scenario): readonly VisibilityAuthorization[] {
  return freezeArray([
    authorization("OPERATOR", ["VIEW_DECISIONS", "VIEW_OPERATOR_ACTIONS", "VIEW_REPLAY"], dashboards, widgets, scenario),
    authorization("GOVERNANCE", ["VIEW_DECISIONS", "VIEW_GOVERNANCE", "VIEW_REPLAY", "VIEW_CERTIFICATION"], dashboards, widgets, scenario),
    authorization("AUDITOR", ["VIEW_DECISIONS", "VIEW_GOVERNANCE", "VIEW_REPLAY", "VIEW_CERTIFICATION", "VIEW_OPERATOR_ACTIONS"], dashboards, widgets, scenario),
    authorization("ADMINISTRATOR", ["MANAGE_DASHBOARD_CONFIG", "VIEW_CERTIFICATION"], dashboards, widgets, scenario),
    authorization("SYSTEM", ["POPULATE_DASHBOARD", "VIEW_REPLAY", "VIEW_CERTIFICATION"], dashboards, widgets, scenario),
  ]);
}

function test(name: string, passed: boolean, failure: DecisionObservabilityFailure, evidence: readonly string[]): DecisionObservabilityValidationTest {
  const base: Omit<DecisionObservabilityValidationTest, "integrity_hash"> = {
    test_id: `decision_observability_test_${name.toLowerCase().replaceAll(" ", "_")}`,
    name,
    expected: "PASS",
    actual: passed ? "PASS" : "FAIL",
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs: freezeArray(evidence),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTests(input: {
  certification: ReplayAuditCertificationResult;
  contract: DecisionObservabilityContractRecord | null;
  dashboards: readonly DecisionDashboardSchema[];
  visualizations: readonly DecisionVisualizationContract[];
  widgets: readonly DecisionDashboardWidget[];
  authorizations: readonly VisibilityAuthorization[];
  scenario: Scenario;
}): readonly DecisionObservabilityValidationTest[] {
  const evidence = [input.certification.certification_record.certification_id, input.certification.replay_hash];
  const contract = input.contract;
  return freezeArray([
    test("observability contract complete", Boolean(contract), "OBSERVABILITY_CONTRACT_INCOMPLETE", evidence),
    test("dashboard schemas complete", input.dashboards.length === DECISION_DASHBOARD_TYPES.length && input.dashboards.every((dashboard) => dashboard.widget_refs.length > 0), "DASHBOARD_SCHEMA_MISSING", evidence),
    test("visualization contracts complete", input.visualizations.length === 5, "VISUALIZATION_CONTRACT_MISSING", evidence),
    test("widget registry consistent", input.widgets.length === 23 && input.widgets.every((widget) => widget.widget_version === WIDGET_VERSION), "WIDGET_REGISTRY_INCONSISTENT", evidence),
    test("lifecycle state known", Boolean(contract && DECISION_OBSERVABILITY_LIFECYCLE_STATES.includes(contract.lifecycle_state)), "UNKNOWN_LIFECYCLE_STATE", evidence),
    test("authorization rules enforced", input.authorizations.every((auth) => !auth.may_override_authority && !auth.may_modify_governance), "AUTHORIZATION_RULE_BYPASSED", evidence),
    test("governance visible", Boolean(contract && contract.governance_refs.length > 0 && input.widgets.some((widget) => widget.widget_id === "widget_governance_status")), "GOVERNANCE_VISIBILITY_HIDDEN", evidence),
    test("constitutional visible", input.scenario !== "HIDE_CONSTITUTIONAL" && input.widgets.some((widget) => widget.widget_id === "widget_constitutional_status"), "CONSTITUTIONAL_STATUS_HIDDEN", evidence),
    test("replay references present", Boolean(contract && contract.replay_refs.length > 0 && input.dashboards.every((dashboard) => dashboard.replay_ref) && input.widgets.every((widget) => widget.replay_ref) && input.visualizations.every((visualization) => visualization.replay_reference)), "REPLAY_REFERENCES_MISSING", evidence),
    test("certification status visible", Boolean(contract && contract.certification_refs.length > 0 && input.dashboards.every((dashboard) => dashboard.certification_status)), "CERTIFICATION_STATUS_ABSENT", evidence),
    test("tenant isolation maintained", Boolean(contract && contract.tenant_id === input.certification.certification_record.tenant_id && input.dashboards.every((dashboard) => dashboard.tenant_scope === "TENANT_ONLY")), "CROSS_TENANT_INFORMATION_VISIBLE", evidence),
    test("integrity hashes reproducible", Boolean(contract && hashWithoutIntegrity(contract) === contract.integrity_hash && input.dashboards.every((dashboard) => hashWithoutIntegrity(dashboard) === dashboard.integrity_hash) && input.widgets.every((widget) => hashWithoutIntegrity(widget) === widget.integrity_hash) && input.visualizations.every((visualization) => hashWithoutIntegrity(visualization) === visualization.integrity_hash) && input.authorizations.every((auth) => hashWithoutIntegrity(auth) === auth.integrity_hash)), "INTEGRITY_HASH_MISMATCH", evidence),
    test("visualizations reproducible", input.visualizations.every((visualization) => visualization.deterministic_rendering && visualization.rendering_rules.includes("sort_by_sequence")), "VISUALIZATION_NOT_REPRODUCIBLE", evidence),
    test("dashboard replay matches certification", input.dashboards.every((dashboard) => dashboard.replay_ref === input.certification.replay_hash), "DASHBOARD_REPLAY_MISMATCH", evidence),
    test("orchestration state not hidden", input.scenario !== "HIDDEN_ORCHESTRATION" && Boolean(contract && contract.timeline_refs.length > 0 && contract.dependency_refs.length > 0 && contract.conflict_refs.length > 0), "HIDDEN_ORCHESTRATION_STATE", evidence),
    test("dashboards advisory only", input.widgets.every((widget) => widget.execution_authority === false), "EXECUTION_AUTHORITY_GRANTED", evidence),
  ]);
}

function buildValidation(observabilityId: string, tests: readonly DecisionObservabilityValidationTest[]): DecisionObservabilityValidation {
  const failures = freezeArray(tests.map((item) => item.failure_reason).filter((failure): failure is DecisionObservabilityFailure => Boolean(failure)));
  const has = (failure: DecisionObservabilityFailure) => failures.includes(failure);
  const base: Omit<DecisionObservabilityValidation, "integrity_hash"> = {
    validation_id: `decision_observability_validation_${observabilityId}`,
    observability_id: observabilityId,
    validation_outcome: failures.length ? "BLOCKED" : "VALID",
    schema_complete: !has("OBSERVABILITY_CONTRACT_INCOMPLETE"),
    dashboards_complete: !has("DASHBOARD_SCHEMA_MISSING"),
    visualizations_deterministic: !has("VISUALIZATION_CONTRACT_MISSING") && !has("VISUALIZATION_NOT_REPRODUCIBLE"),
    widgets_registered: !has("WIDGET_REGISTRY_INCONSISTENT"),
    authorization_valid: !has("AUTHORIZATION_RULE_BYPASSED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    governance_visible: !has("GOVERNANCE_VISIBILITY_HIDDEN"),
    constitutional_visible: !has("CONSTITUTIONAL_STATUS_HIDDEN"),
    replay_consistent: !has("REPLAY_REFERENCES_MISSING") && !has("DASHBOARD_REPLAY_MISMATCH"),
    certification_visible: !has("CERTIFICATION_STATUS_ABSENT"),
    tenant_isolated: !has("CROSS_TENANT_INFORMATION_VISIBLE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayHash(result: Omit<DecisionObservabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract: result.contract,
    dashboards: result.dashboards,
    visualizations: result.visualizations,
    widgets: result.widget_registry,
    authorizations: result.authorizations,
    validation: result.validation,
  });
}

export function runDecisionObservabilityContract(input: DecisionObservabilityInput = {}): DecisionObservabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const certification_result = input.certification_result ?? runReplayAuditCertificationGate();
  const contract = buildContract(certification_result, scenario);
  const dashboards = buildDashboards(certification_result, scenario);
  const widgets = buildWidgets(certification_result, scenario);
  const visualizations = buildVisualizations(certification_result, scenario);
  const authorizations = buildAuthorizations(dashboards, widgets, scenario);
  const validation_tests = buildTests({ certification: certification_result, contract, dashboards, visualizations, widgets, authorizations, scenario });
  const validation = buildValidation(contract?.observability_id ?? "missing_observability_contract", validation_tests);
  const base: Omit<DecisionObservabilityResult, "integrity_hash" | "replay_hash"> = {
    observability_version: OBSERVABILITY_VERSION,
    certification_result,
    contract,
    dashboards,
    visualizations,
    widget_registry: widgets,
    authorizations,
    validation_tests,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function validateDecisionObservabilityContract(result?: DecisionObservabilityResult): DecisionObservabilityValidation {
  if (!result) return buildValidation("missing_observability_contract", freezeArray([test("observability contract complete", false, "OBSERVABILITY_CONTRACT_INCOMPLETE", [])]));
  const integrityValid = hashWithoutIntegrity(result) === result.integrity_hash;
  if (integrityValid) return result.validation;
  const failed = test("integrity hashes reproducible", false, "INTEGRITY_HASH_MISMATCH", [result.replay_hash]);
  return buildValidation(result.contract?.observability_id ?? "missing_observability_contract", freezeArray([...result.validation_tests, failed]));
}

export function computeDecisionObservabilityContractHash(record: Omit<DecisionObservabilityContractRecord, "integrity_hash"> | DecisionObservabilityContractRecord): string {
  return hashWithoutIntegrity(record);
}

export function getDecisionObservabilityFoundation(): DecisionObservabilityFoundation {
  return Object.freeze({
    observability_version: OBSERVABILITY_VERSION,
    lifecycle_states: DECISION_OBSERVABILITY_LIFECYCLE_STATES,
    dashboard_types: DECISION_DASHBOARD_TYPES,
    visualization_types: DECISION_VISUALIZATION_TYPES,
    widget_categories: DECISION_WIDGET_CATEGORIES,
    roles: VISIBILITY_ROLES,
    result: runDecisionObservabilityContract(),
  });
}

export const DecisionObservabilityContract = Object.freeze({
  run: runDecisionObservabilityContract,
  validate: validateDecisionObservabilityContract,
});
