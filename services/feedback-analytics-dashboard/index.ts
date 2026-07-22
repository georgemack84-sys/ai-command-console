import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayOperatorFeedbackGovernanceValidation, validateOperatorFeedbackGovernance } from "@/services/operator-feedback-governance-validation";
import type { FeedbackGovernanceValidationInput } from "@/types/operator-feedback-governance-validation";
import type {
  FeedbackAnalyticsDashboardFoundation,
  FeedbackAnalyticsDashboardInput,
  FeedbackAnalyticsDashboardResult,
  FeedbackAnalyticsFailure,
  FeedbackAnalyticsFilters,
  FeedbackAnalyticsMetric,
  FeedbackAnalyticsScenario,
  FeedbackAnalyticsState,
  FeedbackAnalyticsTrendDirection,
  FeedbackDashboardApiSurface,
  FeedbackDashboardAuditEvent,
  FeedbackDashboardPanel,
  FeedbackDashboardPanelType,
  FeedbackReplayExplorer,
} from "@/types/feedback-analytics-dashboard";

const DASHBOARD_VERSION = "feedback-analytics-dashboard/v1" as const;
const ANALYTICS_VERSION = "feedback-analytics/v1" as const;
const CALCULATION_VERSION = "feedback-dashboard-calculations/v1" as const;
const RENDERED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<FeedbackAnalyticsDashboardInput["scenario"]>;

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

function buildApiSurface(): FeedbackDashboardApiSurface {
  const base: Omit<FeedbackDashboardApiSurface, "integrity_hash"> = {
    api_id: "feedback_analytics_dashboard_api",
    retrieve_dashboard: "POST /feedback-analytics-dashboard/dashboard",
    retrieve_volume: "POST /feedback-analytics-dashboard/volume",
    retrieve_types: "POST /feedback-analytics-dashboard/types",
    retrieve_overrides: "POST /feedback-analytics-dashboard/overrides",
    retrieve_rejections: "POST /feedback-analytics-dashboard/rejections",
    retrieve_confidence: "POST /feedback-analytics-dashboard/confidence",
    retrieve_governance: "POST /feedback-analytics-dashboard/governance",
    retrieve_adaptation_candidates: "POST /feedback-analytics-dashboard/adaptation-candidates",
    retrieve_replay_explorer: "POST /feedback-analytics-dashboard/replay-explorer",
    retrieve_explanation: "POST /feedback-analytics-dashboard/explanation",
    retrieve_audit: "POST /feedback-analytics-dashboard/audit",
    replay_dashboard: "POST /feedback-analytics-dashboard/replay",
    retrieve_contract: "GET /feedback-analytics-dashboard/contract",
    feedback_mutation_supported: false,
    adaptive_proposal_generation_supported: false,
    recommendation_mutation_supported: false,
    simulation_execution_supported: false,
    governance_override_supported: false,
    adaptation_approval_supported: false,
    production_mutation_supported: false,
    observational_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceInputFor(scenario: Scenario): FeedbackGovernanceValidationInput {
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "MISSING_GOVERNANCE_METADATA" };
  if (scenario === "MISSING_REPLAY") return { scenario: "REPLAY_LINEAGE_INCOMPLETE" };
  if (scenario === "TENANT_AMBIGUOUS") return { scenario: "TENANT_OWNERSHIP_AMBIGUOUS" };
  if (scenario === "GOVERNANCE_HOTSPOT") return { scenario: "GOVERNANCE_REVIEW" };
  if (scenario === "ADAPTATION_CANDIDATE" || scenario === "SIMULATION_OPPORTUNITY") return { scenario: "HIGH_RISK_FEEDBACK" };
  return { scenario: "BASELINE" };
}

function defaultFilters(input: FeedbackAnalyticsDashboardInput, tenantId: string, scenario: Scenario): FeedbackAnalyticsFilters {
  const base: Omit<FeedbackAnalyticsFilters, "integrity_hash"> = {
    tenant_id: scenario === "TENANT_AMBIGUOUS" ? "" : input.filters?.tenant_id ?? tenantId,
    mission_id: input.filters?.mission_id,
    operator_id: scenario === "ROLE_DENIED" ? "" : input.filters?.operator_id ?? "operator_001",
    recommendation_category: input.filters?.recommendation_category,
    date_range: input.filters?.date_range ?? "ALL",
    governance_status: input.filters?.governance_status,
    confidence_level: input.filters?.confidence_level,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function trendFor(panel: FeedbackDashboardPanelType, scenario: Scenario): FeedbackAnalyticsTrendDirection {
  if (scenario === "VOLUME_SPIKE" && panel === "FEEDBACK_VOLUME") return "INCREASING";
  if (scenario === "OVERRIDE_TREND" && panel === "OVERRIDE_TRENDS") return "INCREASING";
  if (scenario === "REJECTION_TREND" && panel === "REJECTION_TRENDS") return "INCREASING";
  if (scenario === "CONFIDENCE_DRIFT" && panel === "CONFIDENCE_TRENDS") return "DECREASING";
  if (scenario === "GOVERNANCE_HOTSPOT" && panel === "GOVERNANCE_FEEDBACK") return "INCREASING";
  return "STABLE";
}

function valueFor(panel: FeedbackDashboardPanelType, scenario: Scenario): number {
  const base: Record<FeedbackDashboardPanelType, number> = {
    FEEDBACK_VOLUME: scenario === "VOLUME_SPIKE" ? 42 : 12,
    FEEDBACK_TYPES: 10,
    OVERRIDE_TRENDS: scenario === "OVERRIDE_TREND" ? 9 : 3,
    REJECTION_TRENDS: scenario === "REJECTION_TREND" ? 8 : 2,
    CONFIDENCE_TRENDS: scenario === "CONFIDENCE_DRIFT" ? 58 : 84,
    GOVERNANCE_FEEDBACK: scenario === "GOVERNANCE_HOTSPOT" ? 7 : 1,
    ADAPTATION_CANDIDATES: scenario === "ADAPTATION_CANDIDATE" ? 6 : 2,
    REPLAY_EXPLORER: 1,
  };
  return base[panel];
}

function panelTitle(panel: FeedbackDashboardPanelType): string {
  return panel.toLowerCase().replace(/_/g, " ");
}

function metric(panel: FeedbackDashboardPanelType, scenario: Scenario, evidenceRefs: readonly string[], replayRefs: readonly string[], governanceRefs: readonly string[]): FeedbackAnalyticsMetric {
  const value = valueFor(panel, scenario);
  const base: Omit<FeedbackAnalyticsMetric, "integrity_hash"> = {
    metric_id: `feedback_metric_${panel.toLowerCase()}_${hash(`${panel}:${scenario}`).slice(0, 12)}`,
    metric_name: panelTitle(panel),
    value,
    percentage: Number((value / 100).toFixed(4)),
    trend_direction: trendFor(panel, scenario),
    methodology: `${CALCULATION_VERSION}: deterministic count, distribution, trend, and evidence coverage calculation`,
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceRefs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : replayRefs,
    governance_refs: scenario === "MISSING_GOVERNANCE_METADATA" ? freezeArray([]) : governanceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPanel(panel_type: FeedbackDashboardPanelType, scenario: Scenario, filters: FeedbackAnalyticsFilters, evidenceRefs: readonly string[], replayRefs: readonly string[], governanceRefs: readonly string[]): FeedbackDashboardPanel {
  const metrics = freezeArray([metric(panel_type, scenario, evidenceRefs, replayRefs, governanceRefs)]);
  const base: Omit<FeedbackDashboardPanel, "integrity_hash" | "visualization_hash"> = {
    panel_id: `feedback_panel_${panel_type.toLowerCase()}_${hash(filters).slice(0, 12)}`,
    panel_type,
    title: panelTitle(panel_type),
    metrics,
    applied_filters: filters,
    data_source: "operator_feedback_ledger_and_governance_validation",
    calculation_methodology: `${CALCULATION_VERSION}: aggregate feedback, identify trend, preserve evidence refs`,
    supporting_evidence: metrics.flatMap((item) => item.evidence_refs),
    replay_references: metrics.flatMap((item) => item.replay_refs),
    governance_considerations: metrics.flatMap((item) => item.governance_refs),
    drill_down_refs: freezeArray([`${panel_type.toLowerCase()}_drilldown`, ...metrics.flatMap((item) => item.replay_refs)]),
    explanation: scenario === "HIDDEN_VISUALIZATION" ? "" : `${panelTitle(panel_type)} calculated from immutable feedback evidence with filters ${filters.date_range}`,
  };
  const visualization_hash = hash({ panel_type, metrics: metrics.map((item) => item.integrity_hash), filters: filters.integrity_hash });
  return Object.freeze({ ...base, visualization_hash, integrity_hash: hashWithoutIntegrity({ ...base, visualization_hash }) });
}

function buildReplayExplorer(evidenceRefs: readonly string[], replayRefs: readonly string[], governanceRefs: readonly string[], certificationRefs: readonly string[], scenario: Scenario): FeedbackReplayExplorer {
  const base: Omit<FeedbackReplayExplorer, "integrity_hash"> = {
    explorer_id: `feedback_replay_explorer_${hash(`${replayRefs.join(":")}:${scenario}`).slice(0, 14)}`,
    feedback_history_refs: freezeArray(["feedback_history_001"]),
    decision_refs: freezeArray(["decision_001"]),
    recommendation_refs: freezeArray(["decision_package_001"]),
    evidence_refs: evidenceRefs,
    mission_outcome_refs: freezeArray(["outcome_mission_feedback_001"]),
    simulation_refs: freezeArray(["simulation_decision_001"]),
    governance_review_refs: governanceRefs,
    adaptive_evidence_refs: freezeArray(["adaptive_proposal_evidence_ref"]),
    certification_lineage_refs: certificationRefs,
    replayable: replayRefs.length > 0 && scenario !== "MISSING_REPLAY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(filters: FeedbackAnalyticsFilters, evidenceRefs: readonly string[], governanceRefs: readonly string[], replayId: string): FeedbackDashboardAuditEvent {
  const base: Omit<FeedbackDashboardAuditEvent, "integrity_hash"> = {
    audit_id: `feedback_dashboard_audit_${hash(filters).slice(0, 14)}`,
    dashboard_version: DASHBOARD_VERSION,
    analytics_version: ANALYTICS_VERSION,
    calculation_version: CALCULATION_VERSION,
    query_parameters_hash: filters.integrity_hash,
    replay_identifier: replayId,
    visualization_timestamp: RENDERED_AT,
    evidence_references: evidenceRefs,
    governance_metadata: governanceRefs,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function directFailureFor(scenario: Scenario): FeedbackAnalyticsFailure | undefined {
  const map: Partial<Record<Scenario, FeedbackAnalyticsFailure>> = {
    MISSING_EVIDENCE: "REQUIRED_EVIDENCE_UNAVAILABLE",
    MISSING_REPLAY: "REPLAY_LINEAGE_INCOMPLETE",
    MISSING_CALCULATION_RULES: "CALCULATION_RULES_MISSING",
    INVALID_DASHBOARD_VERSION: "DASHBOARD_VERSION_INVALID",
    MISSING_GOVERNANCE_METADATA: "GOVERNANCE_METADATA_INCOMPLETE",
    TENANT_AMBIGUOUS: "TENANT_OWNERSHIP_AMBIGUOUS",
    ROLE_DENIED: "ROLE_ACCESS_DENIED",
    INVALID_FILTER: "FILTER_INVALID",
    HIDDEN_VISUALIZATION: "HIDDEN_VISUALIZATION_DETECTED",
    NONDETERMINISTIC_CALCULATION: "NONDETERMINISTIC_CALCULATION_DETECTED",
    UNSUPPORTED_ANALYTICS: "UNSUPPORTED_ANALYTICS",
    ORPHANED_METRIC: "ORPHANED_DASHBOARD_METRIC",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    FEEDBACK_MUTATION_ATTEMPT: "FEEDBACK_MUTATION_ATTEMPT",
    ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT: "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT",
    RECOMMENDATION_MUTATION_ATTEMPT: "RECOMMENDATION_MUTATION_ATTEMPT",
    SIMULATION_EXECUTION_ATTEMPT: "SIMULATION_EXECUTION_ATTEMPT",
    GOVERNANCE_OVERRIDE_ATTEMPT: "GOVERNANCE_OVERRIDE_ATTEMPT",
    ADAPTATION_APPROVAL_ATTEMPT: "ADAPTATION_APPROVAL_ATTEMPT",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
  };
  return map[scenario];
}

function filtersValid(filters: FeedbackAnalyticsFilters): boolean {
  return Boolean(filters.tenant_id && filters.operator_id && ["ALL", "LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS"].includes(filters.date_range));
}

function collectFailures(input: FeedbackAnalyticsDashboardInput, panels: readonly FeedbackDashboardPanel[], explorer: FeedbackReplayExplorer): readonly FeedbackAnalyticsFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const governance = input.governance_result ?? validateOperatorFeedbackGovernance(governanceInputFor(scenario));
  const failures: FeedbackAnalyticsFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (governance.failures.includes("GOVERNANCE_METADATA_MISSING")) failures.push("GOVERNANCE_METADATA_INCOMPLETE");
  if (!governance.tenant_isolated) failures.push("TENANT_OWNERSHIP_AMBIGUOUS");
  if (!governance.replayable || !explorer.replayable) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (panels.some((panel) => panel.supporting_evidence.length === 0)) failures.push("REQUIRED_EVIDENCE_UNAVAILABLE");
  if (panels.some((panel) => !panel.explanation)) failures.push("HIDDEN_VISUALIZATION_DETECTED");
  if (!filtersValid(panels[0]?.applied_filters ?? defaultFilters(input, "", scenario))) failures.push("FILTER_INVALID");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly FeedbackAnalyticsFailure[]): FeedbackAnalyticsState {
  if (failures.length === 1 && failures[0] === "REQUIRED_EVIDENCE_UNAVAILABLE") return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function resultReplayHash(result: Omit<FeedbackAnalyticsDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({ governance_hash: result.governance_result.integrity_hash, filters: result.filters, panels: result.panels, replay_explorer: result.replay_explorer, audit_events: result.audit_events, state: result.analytics_state });
}

function resultIntegrityHash(result: Omit<FeedbackAnalyticsDashboardResult, "integrity_hash">): string {
  return hash({
    feedback_analytics_dashboard_version: result.feedback_analytics_dashboard_version,
    api_surface_hash: result.api_surface.integrity_hash,
    filter_hash: result.filters.integrity_hash,
    panel_hashes: result.panels.map((panel) => panel.integrity_hash),
    replay_explorer_hash: result.replay_explorer.integrity_hash,
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function renderFeedbackAnalyticsDashboard(input: FeedbackAnalyticsDashboardInput = {}): FeedbackAnalyticsDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const governance_result = input.governance_result ?? validateOperatorFeedbackGovernance(governanceInputFor(scenario));
  const ledger = governance_result.ledger_result;
  const tenantId = ledger.records[0]?.tenant_id ?? "tenant_alpha";
  const filters = defaultFilters(input, tenantId, scenario);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : ledger.evidence_history.original_evidence_refs;
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : ledger.replay_ledger.replay_lineage;
  const governanceRefs = scenario === "MISSING_GOVERNANCE_METADATA" ? freezeArray([]) : [ledger.records[0]?.governance_metadata_hash ?? ""].filter(Boolean);
  const panels = freezeArray(([
    "FEEDBACK_VOLUME",
    "FEEDBACK_TYPES",
    "OVERRIDE_TRENDS",
    "REJECTION_TRENDS",
    "CONFIDENCE_TRENDS",
    "GOVERNANCE_FEEDBACK",
    "ADAPTATION_CANDIDATES",
    "REPLAY_EXPLORER",
  ] as const).map((panel) => buildPanel(panel, scenario, filters, evidenceRefs, replayRefs, governanceRefs)));
  const replay_explorer = buildReplayExplorer(evidenceRefs, replayRefs, governanceRefs, [ledger.certification_lineage.certification_id], scenario);
  const failures = collectFailures({ ...input, governance_result }, panels, replay_explorer);
  const audit_events = freezeArray([buildAudit(filters, evidenceRefs, governanceRefs, replayRefs[0] ?? "")]);
  const base: Omit<FeedbackAnalyticsDashboardResult, "integrity_hash" | "replay_hash"> = {
    feedback_analytics_dashboard_version: DASHBOARD_VERSION,
    analytics_version: ANALYTICS_VERSION,
    calculation_version: CALCULATION_VERSION,
    api_surface,
    governance_result,
    filters,
    panels,
    replay_explorer,
    audit_events,
    analytics_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayOperatorFeedbackGovernanceValidation(governance_result),
    explainable: panels.every((panel) => Boolean(panel.explanation)),
    tenant_isolated: Boolean(filters.tenant_id) && governance_result.tenant_isolated,
    governance_aware_visibility: governanceRefs.length > 0,
    role_based_access_control: Boolean(filters.operator_id),
    evidence_traceable: evidenceRefs.length > 0,
    observational_only: true,
    modifies_feedback: false,
    generates_adaptive_proposals: false,
    changes_recommendations: false,
    executes_simulations: false,
    overrides_governance: false,
    approves_adaptations: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayFeedbackAnalyticsDashboard(result: FeedbackAnalyticsDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getFeedbackAnalyticsDashboardFoundation(): FeedbackAnalyticsDashboardFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    feedback_analytics_dashboard_version: DASHBOARD_VERSION,
    api_surface,
    result: renderFeedbackAnalyticsDashboard(),
  });
}

export const FeedbackAnalyticsDashboard = Object.freeze({
  render: renderFeedbackAnalyticsDashboard,
  replay: replayFeedbackAnalyticsDashboard,
});
