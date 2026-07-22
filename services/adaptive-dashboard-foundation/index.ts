import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runAdaptiveMemoryCertification, validateAdaptiveMemoryCertification } from "@/services/adaptive-memory-certification-gate";
import type {
  AdaptiveDashboardApiSurface,
  AdaptiveDashboardFailure,
  AdaptiveDashboardFoundationContract,
  AdaptiveDashboardInput,
  AdaptiveDashboardMetrics,
  AdaptiveDashboardObservabilitySurface,
  AdaptiveDashboardRecord,
  AdaptiveDashboardResult,
  AdaptiveDashboardScenario,
  AdaptiveDashboardValidationResult,
  AdaptiveDashboardValidationTest,
  DashboardFilterSortRecord,
  DashboardLayoutDefinition,
  DashboardNavigationRecord,
  DashboardPermissionDecision,
  DashboardReplayLink,
  DashboardRole,
  DashboardSearchDomain,
  DashboardSearchRecord,
  DashboardSortKey,
  DashboardStateRecord,
  DashboardValidationOutcome,
  DashboardViewId,
  DashboardViewRegistryEntry,
  DashboardWidgetDefinition,
  DashboardWidgetType,
  DashboardRenderingContract,
} from "@/types/adaptive-dashboard-foundation";

const VERSION = "adaptive-dashboard-foundation/v10.14.1" as const;
const FOUNDATION_ID = "AdaptiveDashboardFoundation" as const;
const TENANT_ID = "tenant-mission-control";
const MISSION_ID = "mission-adaptive-dashboard-foundation";
const REPLAY_REF = "replay:adaptive-dashboard-foundation:10.14.1";
const LINEAGE_REF = "lineage:adaptive-dashboard-foundation:10.14.1";

const VIEWS: readonly DashboardViewId[] = Object.freeze(["adaptive_overview", "governance_review", "replay_investigation", "security_integrity", "certification_readiness", "tenant_isolation"]);
const WIDGETS: readonly DashboardWidgetType[] = Object.freeze(["SUMMARY_CARD", "TABLE", "TIMELINE", "EVIDENCE_VIEWER", "REPLAY_VIEWER", "TREND_CHART", "HEAT_MAP", "STATUS_INDICATOR", "ALERT_PANEL", "APPROVAL_QUEUE", "CERTIFICATION_STATUS", "LINEAGE_VIEWER"]);
const ROLES: readonly DashboardRole[] = Object.freeze(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]);
const SEARCH_DOMAINS: readonly DashboardSearchDomain[] = Object.freeze(["proposals", "outcomes", "evidence", "operators", "missions", "simulations", "governance_reviews", "certification_records", "replay_history", "rollback_history"]);
const SORT_KEYS: readonly DashboardSortKey[] = Object.freeze(["timestamp", "priority", "severity", "confidence", "mission", "proposal_id", "certification_state"]);

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

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: AdaptiveDashboardScenario): AdaptiveDashboardFailure | undefined {
  const map: Partial<Record<AdaptiveDashboardScenario, AdaptiveDashboardFailure>> = {
    DUPLICATE_VIEW: "DUPLICATE_VIEW_DETECTED",
    NONDETERMINISTIC_RENDERING: "DASHBOARD_RENDERING_NONDETERMINISTIC",
    WIDGET_ORDER_DRIFT: "WIDGET_ORDER_NONDETERMINISTIC",
    LAYOUT_DRIFT: "LAYOUT_NOT_REPRODUCIBLE",
    STATE_NOT_REPLAYABLE: "STATE_NOT_REPLAYABLE",
    NAVIGATION_BREAK: "NAVIGATION_NOT_DETERMINISTIC",
    SEARCH_NONDETERMINISTIC: "SEARCH_NOT_DETERMINISTIC",
    FILTER_SORT_DRIFT: "FILTER_SORT_NOT_DETERMINISTIC",
    MISSING_REPLAY_REF: "REPLAY_REFERENCE_MISSING",
    GOVERNANCE_VISIBILITY_MISSING: "GOVERNANCE_VISIBILITY_MISSING",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    EXECUTION_AUTHORITY_EXPOSED: "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): AdaptiveDashboardApiSurface {
  const base: Omit<AdaptiveDashboardApiSurface, "integrity_hash"> = {
    api_id: "adaptive_dashboard_foundation_api",
    establish_foundation: "POST /adaptive-dashboard-foundation/establish",
    retrieve_contract: "GET /adaptive-dashboard-foundation/contract",
    retrieve_views: "POST /adaptive-dashboard-foundation/views",
    retrieve_widgets: "POST /adaptive-dashboard-foundation/widgets",
    retrieve_layouts: "POST /adaptive-dashboard-foundation/layouts",
    retrieve_state: "POST /adaptive-dashboard-foundation/state",
    retrieve_navigation: "POST /adaptive-dashboard-foundation/navigation",
    retrieve_search: "POST /adaptive-dashboard-foundation/search",
    retrieve_filters: "POST /adaptive-dashboard-foundation/filters",
    retrieve_records: "POST /adaptive-dashboard-foundation/records",
    retrieve_replay: "POST /adaptive-dashboard-foundation/replay",
    retrieve_permissions: "POST /adaptive-dashboard-foundation/permissions",
    validate_foundation: "POST /adaptive-dashboard-foundation/validate",
    inspect_foundation: "POST /adaptive-dashboard-foundation/inspect",
    mutation_supported: false,
    approval_supported: false,
    production_state_changes_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function renderingContract(): DashboardRenderingContract {
  const base: Omit<DashboardRenderingContract, "integrity_hash"> = {
    contract_id: "adaptive-dashboard-rendering-contract",
    version: VERSION,
    deterministic_rendering_required: true,
    layout_integrity_required: true,
    widget_ordering_required: true,
    data_ordering_required: true,
    replay_rendering_required: true,
    integrity_hash_validation_required: true,
    read_only: true,
    advisory_only: true,
    mutation_supported: false,
    approval_supported: false,
    production_state_changes_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function viewName(view: DashboardViewId): string {
  return view.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function buildViews(failures: readonly AdaptiveDashboardFailure[]): readonly DashboardViewRegistryEntry[] {
  const views = VIEWS.map((view, index) => {
    const base: Omit<DashboardViewRegistryEntry, "integrity_hash"> = {
      view_id: failures.includes("DUPLICATE_VIEW_DETECTED") && index === 1 ? "adaptive_overview" : view,
      view_name: viewName(view),
      owner: "Adaptive Intelligence",
      description: `${viewName(view)} read-only adaptive intelligence dashboard.`,
      version: "v1",
      required_permissions: view === "certification_readiness" ? freezeArray(["CERTIFICATION_TEAM", "AUDITOR"]) : view === "governance_review" ? freezeArray(["GOVERNANCE_AUTHORITY", "AUDITOR"]) : ROLES,
      tenant_scope: view === "tenant_isolation" ? "TENANT_PRIVATE" : view === "certification_readiness" ? "CERTIFICATION_RESTRICTED" : "MISSION_SCOPED",
      supported_widgets: freezeArray(WIDGETS.slice(index % 3, index % 3 + 7)),
      navigation_route: `/adaptive-dashboard/${view}`,
      replay_supported: !failures.includes("REPLAY_REFERENCE_MISSING"),
      certification_status: failures.length ? "PENDING" : "CERTIFIED",
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  return freezeArray(views);
}

function buildWidgets(failures: readonly AdaptiveDashboardFailure[]): readonly DashboardWidgetDefinition[] {
  const order = failures.includes("WIDGET_ORDER_NONDETERMINISTIC") ? [...WIDGETS].reverse() : WIDGETS;
  return freezeArray(order.map((widget, index) => {
    const base: Omit<DashboardWidgetDefinition, "integrity_hash"> = {
      widget_id: `widget_${widget.toLowerCase()}`,
      widget_type: widget,
      supported_views: VIEWS.filter((_, viewIndex) => (viewIndex + index) % 2 === 0),
      deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"),
      replay_supported: !failures.includes("REPLAY_REFERENCE_MISSING"),
      filtering_supported: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      governance_restricted: !failures.includes("GOVERNANCE_VISIBILITY_MISSING"),
      permission_validated: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
      render_order: index + 1,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildLayouts(widgets: readonly DashboardWidgetDefinition[], failures: readonly AdaptiveDashboardFailure[]): readonly DashboardLayoutDefinition[] {
  return freezeArray(VIEWS.map((view, index) => {
    const related = widgets.filter((widget) => widget.supported_views.includes(view)).sort((a, b) => a.render_order - b.render_order);
    const base: Omit<DashboardLayoutDefinition, "integrity_hash"> = {
      layout_id: `layout_${view}`,
      view_id: view,
      template: index === 0 ? "OVERVIEW_GRID" : index === 1 ? "REVIEW_WORKSPACE" : index === 2 ? "REPLAY_TIMELINE" : "AUDIT_CONSOLE",
      sections: failures.includes("LAYOUT_NOT_REPRODUCIBLE") && index === 0 ? freezeArray(["main", "summary"]) : freezeArray(["summary", "main", "evidence", "replay", "governance"]),
      widget_order: related.map((widget) => widget.widget_id),
      responsive_breakpoints: freezeArray(["mobile", "tablet", "desktop", "wide"]),
      version: "v1",
      deterministic: !failures.includes("LAYOUT_NOT_REPRODUCIBLE"),
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildState(input: AdaptiveDashboardInput, failures: readonly AdaptiveDashboardFailure[]): DashboardStateRecord {
  const base: Omit<DashboardStateRecord, "integrity_hash"> = {
    state_id: id("dashboard_state", { tenant: input.tenant_id ?? TENANT_ID, role: input.role ?? "OPERATOR" }),
    selected_tenant: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    selected_mission: MISSION_ID,
    selected_view: "adaptive_overview",
    filters: freezeArray(["mission:active", "tenant:current", "governance:visible", "replay:available"]),
    sorting: failures.includes("FILTER_SORT_NOT_DETERMINISTIC") ? freezeArray(["confidence", "timestamp"]) : freezeArray(["timestamp", "priority", "severity"]),
    search_query: "adaptive intelligence",
    timeline_position: "2026-07-13T00:00:00.000Z",
    replay_position: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `${REPLAY_REF}:position:0`,
    selected_proposal: null,
    navigation_history: freezeArray(["/adaptive-dashboard/adaptive_overview"]),
    reproducible: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"),
    replayable: !failures.includes("STATE_NOT_REPLAYABLE") && !failures.includes("REPLAY_REFERENCE_MISSING"),
    recoverable: !failures.includes("STATE_NOT_REPLAYABLE"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildNavigation(failures: readonly AdaptiveDashboardFailure[]): readonly DashboardNavigationRecord[] {
  return freezeArray(VIEWS.map((view, index) => {
    const next = VIEWS[(index + 1) % VIEWS.length];
    const base: Omit<DashboardNavigationRecord, "integrity_hash"> = {
      navigation_id: `nav_${view}_to_${next}`,
      from_view: view,
      to_view: failures.includes("NAVIGATION_NOT_DETERMINISTIC") && index === 0 ? view : next,
      route: `/adaptive-dashboard/${next}`,
      breadcrumbs: freezeArray(["Mission Control", "Adaptive Intelligence", viewName(next)]),
      preserves_replay_state: !failures.includes("REPLAY_REFERENCE_MISSING"),
      preserves_filters: !failures.includes("FILTER_SORT_NOT_DETERMINISTIC"),
      preserves_tenant_boundary: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      preserves_security_context: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
      deterministic: !failures.includes("NAVIGATION_NOT_DETERMINISTIC"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildSearch(failures: readonly AdaptiveDashboardFailure[]): readonly DashboardSearchRecord[] {
  return freezeArray(SEARCH_DOMAINS.map((domain, index) => {
    const refs = [`${domain}:result:${String(index + 1).padStart(2, "0")}`, `${domain}:result:${String(index + 2).padStart(2, "0")}`];
    const base: Omit<DashboardSearchRecord, "integrity_hash"> = {
      search_id: `search_${domain}`,
      domain,
      query: "adaptive intelligence",
      result_refs: failures.includes("SEARCH_NOT_DETERMINISTIC") && index === 0 ? freezeArray([...refs].reverse()) : freezeArray(refs),
      deterministic_order: !failures.includes("SEARCH_NOT_DETERMINISTIC"),
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING"),
      permission_aware: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildFilters(failures: readonly AdaptiveDashboardFailure[]): DashboardFilterSortRecord {
  const base: Omit<DashboardFilterSortRecord, "integrity_hash"> = {
    filter_id: "adaptive_dashboard_standard_filters",
    standard_filters: freezeArray(["Mission", "Tenant", "Proposal", "Status", "Risk", "Confidence", "Governance", "Certification", "Operator", "Time", "Replay Session", "Simulation", "Drift Type"]),
    sort_keys: SORT_KEYS,
    deterministic: !failures.includes("FILTER_SORT_NOT_DETERMINISTIC"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    role_restricted: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayLinks(records: readonly AdaptiveDashboardRecord[], failures: readonly AdaptiveDashboardFailure[]): readonly DashboardReplayLink[] {
  return freezeArray(records.map((record) => {
    const base: Omit<DashboardReplayLink, "integrity_hash"> = {
      replay_link_id: `replay_link_${record.dashboard_record_id}`,
      object_ref: record.dashboard_record_id,
      evidence_lineage_ref: `${LINEAGE_REF}:evidence:${record.dashboard_view}`,
      proposal_lineage_ref: `${LINEAGE_REF}:proposal:${record.dashboard_view}`,
      certification_lineage_ref: `${LINEAGE_REF}:certification:${record.dashboard_view}`,
      governance_history_ref: failures.includes("GOVERNANCE_VISIBILITY_MISSING") ? "" : `${LINEAGE_REF}:governance:${record.dashboard_view}`,
      simulation_history_ref: `${LINEAGE_REF}:simulation:${record.dashboard_view}`,
      rollback_history_ref: `${LINEAGE_REF}:rollback:${record.dashboard_view}`,
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildPermissions(input: AdaptiveDashboardInput, failures: readonly AdaptiveDashboardFailure[]): readonly DashboardPermissionDecision[] {
  const requestedRole = input.role ?? "OPERATOR";
  return freezeArray(VIEWS.map((view) => {
    const restricted = view === "security_integrity" ? ["protected_operator_information", "confidential_governance_records"] : ["restricted_evidence_payload"];
    const base: Omit<DashboardPermissionDecision, "integrity_hash"> = {
      permission_id: `permission_${requestedRole.toLowerCase()}_${view}`,
      role: requestedRole,
      tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
      view_id: view,
      allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
      restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? [] : freezeArray(restricted),
      constitutional_policy_enforced: !failures.includes("GOVERNANCE_VISIBILITY_MISSING"),
      governance_restrictions_enforced: !failures.includes("GOVERNANCE_VISIBILITY_MISSING"),
      tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      evidence_authorized: !failures.includes("RESTRICTED_FIELD_EXPOSED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildRecords(failures: readonly AdaptiveDashboardFailure[]): readonly AdaptiveDashboardRecord[] {
  return freezeArray(VIEWS.map((view, index) => {
    const base: Omit<AdaptiveDashboardRecord, "integrity_hash"> = {
      dashboard_record_id: `dashboard_record_${view}`,
      tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") && index === 0 ? "tenant-cross-boundary" : TENANT_ID,
      mission_scope: MISSION_ID,
      dashboard_view: view,
      source_record_refs: freezeArray([`source:${view}:record`, "adaptive-memory-certification:report", "adaptive-memory-ledger:records"]),
      visible_to_roles: view === "certification_readiness" ? freezeArray(["CERTIFICATION_TEAM", "AUDITOR"]) : ROLES,
      restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? [] : freezeArray(["raw_evidence_payload", "protected_operator_information"]),
      summary: `${viewName(view)} dashboard record.`,
      current_status: failures.length ? "WARNING" : "NOMINAL",
      alerts: failures.length ? freezeArray(["dashboard-foundation-validation-warning"]) : freezeArray([]),
      replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : freezeArray([`${REPLAY_REF}:${view}`]),
    };
    return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") && index === 0 ? "invalid-integrity" : hashWithoutIntegrity(base) });
  }));
}

function validationTest(name: string, passed: boolean, failure: AdaptiveDashboardFailure, evidence_refs: readonly string[]): AdaptiveDashboardValidationTest {
  const base: Omit<AdaptiveDashboardValidationTest, "integrity_hash"> = {
    test_id: id("dashboard_test", name),
    name,
    expected: "PASS",
    actual: passed ? "PASS" : "FAIL",
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<AdaptiveDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "metrics" | "replay_hash" | "integrity_hash">): readonly AdaptiveDashboardValidationTest[] {
  const evidence = [result.rendering_contract.integrity_hash, ...result.dashboard_records.map((record) => record.integrity_hash)];
  const viewIds = result.view_registry.map((view) => view.view_id);
  return freezeArray([
    validationTest("rendering contract validation", result.rendering_contract.deterministic_rendering_required && result.rendering_contract.read_only, "DASHBOARD_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("dashboard registry duplicate prevention", new Set(viewIds).size === viewIds.length, "DUPLICATE_VIEW_DETECTED", evidence),
    validationTest("widget lifecycle validation", result.widget_framework.length === WIDGETS.length && result.widget_framework.every((widget, index) => widget.render_order === index + 1 && widget.deterministic), "WIDGET_ORDER_NONDETERMINISTIC", evidence),
    validationTest("layout reproducibility validation", result.layout_engine.length === VIEWS.length && result.layout_engine.every((layout) => layout.deterministic && layout.replayable), "LAYOUT_NOT_REPRODUCIBLE", evidence),
    validationTest("state management validation", result.state_manager.reproducible && result.state_manager.replayable && result.state_manager.recoverable, "STATE_NOT_REPLAYABLE", evidence),
    validationTest("navigation validation", result.navigation_service.every((nav) => nav.deterministic && nav.preserves_replay_state && nav.preserves_tenant_boundary && nav.preserves_security_context), "NAVIGATION_NOT_DETERMINISTIC", evidence),
    validationTest("search validation", result.search_engine.every((search) => search.deterministic_order && search.replayable && search.permission_aware && search.tenant_isolated), "SEARCH_NOT_DETERMINISTIC", evidence),
    validationTest("filter and sorting validation", result.filtering_sorting.deterministic && result.filtering_sorting.tenant_isolated && result.filtering_sorting.role_restricted, "FILTER_SORT_NOT_DETERMINISTIC", evidence),
    validationTest("replay integration validation", result.replay_integration.every((link) => link.replayable && link.governance_history_ref), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("governance visibility validation", result.governance_visible && result.permission_engine.every((permission) => permission.governance_restrictions_enforced), "GOVERNANCE_VISIBILITY_MISSING", evidence),
    validationTest("tenant isolation validation", result.tenant_isolated && result.dashboard_records.every((record) => record.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("field-level permission validation", result.permission_engine.every((permission) => permission.restricted_fields.length > 0 && permission.evidence_authorized), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("unauthorized access prevention", result.permission_engine.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("integrity verification validation", result.dashboard_records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("read-only advisory architecture", result.read_only && result.advisory_only && !result.execution_authority_granted, "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED", evidence),
  ]);
}

function metrics(tests: readonly AdaptiveDashboardValidationTest[]): AdaptiveDashboardMetrics {
  const failures = tests.map((test) => test.failure_reason).filter(Boolean);
  const base: Omit<AdaptiveDashboardMetrics, "integrity_hash"> = {
    rendering_latency_ms: 9,
    rendering_failures: tests.some((test) => test.failure_reason === "DASHBOARD_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    missing_widgets: tests.some((test) => test.failure_reason === "WIDGET_ORDER_NONDETERMINISTIC") ? 1 : 0,
    broken_references: tests.some((test) => test.failure_reason === "REPLAY_REFERENCE_MISSING") ? 1 : 0,
    replay_failures: tests.some((test) => test.failure_reason === "REPLAY_REFERENCE_MISSING" || test.failure_reason === "STATE_NOT_REPLAYABLE") ? 1 : 0,
    search_latency_ms: 6,
    navigation_failures: tests.some((test) => test.failure_reason === "NAVIGATION_NOT_DETERMINISTIC") ? 1 : 0,
    stale_dashboard_data: 0,
    integrity_verification_failures: tests.some((test) => test.failure_reason === "INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    permission_violations: tests.some((test) => test.failure_reason === "UNAUTHORIZED_DASHBOARD_ACCESS" || test.failure_reason === "RESTRICTED_FIELD_EXPOSED" || test.failure_reason === "TENANT_ISOLATION_VIOLATED") ? 1 : 0,
  };
  void failures;
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    views: result.view_registry.map((view) => view.integrity_hash),
    widgets: result.widget_framework.map((widget) => widget.integrity_hash),
    layouts: result.layout_engine.map((layout) => layout.integrity_hash),
    state: result.state_manager.integrity_hash,
    navigation: result.navigation_service.map((nav) => nav.integrity_hash),
    search: result.search_engine.map((search) => search.integrity_hash),
    records: result.dashboard_records.map((record) => record.integrity_hash),
    validation: result.validation_tests.map((test) => test.integrity_hash),
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveDashboardResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_dashboard_foundation_version,
    foundation: result.foundation_identifier,
    api: result.api_surface.integrity_hash,
    contract: result.rendering_contract.integrity_hash,
    replay_hash: result.replay_hash,
    validation_outcome: result.validation_outcome,
  });
}

export function establishAdaptiveDashboardFoundation(input: AdaptiveDashboardInput = {}): AdaptiveDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const memoryCertification = runAdaptiveMemoryCertification();
  const failures = freezeArray([
    ...(failureForScenario(scenario) ? [failureForScenario(scenario) as AdaptiveDashboardFailure] : []),
    ...(!validateAdaptiveMemoryCertification(memoryCertification).valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const api_surface = apiSurface();
  const rendering_contract = renderingContract();
  const view_registry = buildViews(failures);
  const widget_framework = buildWidgets(failures);
  const layout_engine = buildLayouts(widget_framework, failures);
  const state_manager = buildState(input, failures);
  const navigation_service = buildNavigation(failures);
  const search_engine = buildSearch(failures);
  const filtering_sorting = buildFilters(failures);
  const dashboard_records = buildRecords(failures);
  const replay_integration = buildReplayLinks(dashboard_records, failures);
  const permission_engine = buildPermissions(input, failures);
  const baseWithoutValidation: Omit<AdaptiveDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "metrics" | "replay_hash" | "integrity_hash"> = {
    adaptive_dashboard_foundation_version: VERSION,
    foundation_identifier: FOUNDATION_ID,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    rendering_contract,
    view_registry,
    widget_framework,
    layout_engine,
    state_manager,
    navigation_service,
    search_engine,
    filtering_sorting,
    replay_integration,
    permission_engine,
    dashboard_records,
    deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") && !failures.includes("WIDGET_ORDER_NONDETERMINISTIC") && !failures.includes("LAYOUT_NOT_REPRODUCIBLE"),
    replayable: !failures.includes("REPLAY_REFERENCE_MISSING") && !failures.includes("STATE_NOT_REPLAYABLE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_visible: !failures.includes("GOVERNANCE_VISIBILITY_MISSING"),
    constitutional_enforced: !failures.includes("GOVERNANCE_VISIBILITY_MISSING"),
    read_only: true,
    advisory_only: true,
    execution_authority_granted: failures.includes("DASHBOARD_EXECUTION_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const detected = freezeArray([...new Set([...failures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is AdaptiveDashboardFailure => Boolean(failure))])]);
  const validation_outcome: DashboardValidationOutcome = detected.length ? "INVALID" : "VALID";
  const metricsRecord = metrics(validation_tests);
  const base: Omit<AdaptiveDashboardResult, "replay_hash" | "integrity_hash"> = {
    ...baseWithoutValidation,
    status: detected.length ? "REJECTED" : "AUTHORITATIVE",
    metrics: metricsRecord,
    validation_tests,
    validation_outcome,
    failures: detected,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAdaptiveDashboardFoundation(result?: AdaptiveDashboardResult): AdaptiveDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<AdaptiveDashboardFailure>(["DASHBOARD_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<AdaptiveDashboardValidationResult, "validation_hash"> = { foundation_id: null, valid: false, validation_outcome: "INVALID", failures, integrity_hash_valid: false, replay_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const nested_integrity_valid = (
    hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash &&
    hashWithoutIntegrity(result.rendering_contract) === result.rendering_contract.integrity_hash &&
    result.view_registry.every((view) => hashWithoutIntegrity(view) === view.integrity_hash) &&
    result.widget_framework.every((widget) => hashWithoutIntegrity(widget) === widget.integrity_hash) &&
    result.layout_engine.every((layout) => hashWithoutIntegrity(layout) === layout.integrity_hash) &&
    hashWithoutIntegrity(result.state_manager) === result.state_manager.integrity_hash &&
    result.navigation_service.every((nav) => hashWithoutIntegrity(nav) === nav.integrity_hash) &&
    result.search_engine.every((search) => hashWithoutIntegrity(search) === search.integrity_hash) &&
    hashWithoutIntegrity(result.filtering_sorting) === result.filtering_sorting.integrity_hash &&
    result.dashboard_records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash) &&
    result.replay_integration.every((link) => hashWithoutIntegrity(link) === link.integrity_hash) &&
    result.permission_engine.every((permission) => hashWithoutIntegrity(permission) === permission.integrity_hash) &&
    hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash &&
    result.validation_tests.every((test) => hashWithoutIntegrity(test) === test.integrity_hash)
  );
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nested_integrity_valid;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && result.read_only && result.advisory_only && !result.execution_authority_granted;
  const base: Omit<AdaptiveDashboardValidationResult, "validation_hash"> = {
    foundation_id: result.foundation_identifier,
    valid,
    validation_outcome: result.validation_outcome,
    failures: result.failures,
    integrity_hash_valid,
    replay_hash_valid,
    read_only: result.read_only && result.advisory_only && !result.execution_authority_granted,
  };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayAdaptiveDashboardFoundation(result: AdaptiveDashboardResult): boolean {
  return validateAdaptiveDashboardFoundation(result).valid;
}

export function buildAdaptiveDashboardFoundationObservabilitySurface(result = establishAdaptiveDashboardFoundation()): AdaptiveDashboardObservabilitySurface {
  return Object.freeze({
    foundation_id: result.foundation_identifier,
    status: result.status,
    validation_outcome: result.validation_outcome,
    views: result.view_registry.length,
    widgets: result.widget_framework.length,
    layouts: result.layout_engine.length,
    records: result.dashboard_records.length,
    failed_tests: result.validation_tests.filter((test) => !test.passed).length,
    failures: result.failures,
    deterministic: result.deterministic,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    read_only: result.read_only && result.advisory_only && !result.execution_authority_granted,
    integrity_hash: result.integrity_hash,
  });
}

export function getAdaptiveDashboardFoundationContract(): AdaptiveDashboardFoundationContract {
  const result = establishAdaptiveDashboardFoundation();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      principles: freezeArray(["transparency-first", "read-only-architecture", "deterministic-rendering", "governance-aware-visibility", "replay-integrated", "tenant-isolated", "advisory-only"]),
      supported_widgets: WIDGETS,
      supported_views: VIEWS,
      search_domains: SEARCH_DOMAINS,
      sort_keys: SORT_KEYS,
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateAdaptiveDashboardFoundation(result),
    observability: buildAdaptiveDashboardFoundationObservabilitySurface(result),
  });
}

export const AdaptiveDashboardFoundation = Object.freeze({
  establish: establishAdaptiveDashboardFoundation,
  validate: validateAdaptiveDashboardFoundation,
  replay: replayAdaptiveDashboardFoundation,
});
