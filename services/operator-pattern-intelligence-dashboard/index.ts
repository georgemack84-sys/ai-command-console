import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayPatternExplainability, verifyPatternReplayExplainability } from "@/services/pattern-replay-explainability";
import type { PatternReplayInput, PatternReplayResult } from "@/types/pattern-replay-explainability";
import type {
  PatternDashboardApiSurface,
  PatternDashboardElement,
  PatternDashboardExplorer,
  PatternDashboardFailure,
  PatternDashboardFilters,
  PatternDashboardFoundation,
  PatternDashboardInput,
  PatternDashboardResult,
  PatternDashboardValidation,
  PatternDashboardView,
} from "@/types/operator-pattern-intelligence-dashboard";

const DASHBOARD_VERSION = "operator-pattern-intelligence-dashboard/v1" as const;

type Scenario = NonNullable<PatternDashboardInput["scenario"]>;
type ElementType = PatternDashboardElement["element_type"];

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

function replayScenario(scenario: Scenario): PatternReplayInput["scenario"] {
  const map: Partial<Record<Scenario, PatternReplayInput["scenario"]>> = {
    MISSING_REPLAY_INPUT: "MISSING_LEDGER_INPUT",
    UNCERTIFIED_REPLAY_INPUT: "UNCERTIFIED_LEDGER_INPUT",
    MISSING_REPLAY: "MISSING_REPLAY",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_GOVERNANCE: "GOVERNANCE_MISMATCH",
    INVALID_PATTERN_INTELLIGENCE: "UNCERTIFIED_LEDGER_INPUT",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternDashboardInput, scenario: Scenario): PatternReplayResult {
  if (input.replay_result) return input.replay_result;
  return replayPatternExplainability({ scenario: replayScenario(scenario) });
}

function buildApiSurface(): PatternDashboardApiSurface {
  const base: Omit<PatternDashboardApiSurface, "integrity_hash"> = {
    api_id: "operator_pattern_intelligence_dashboard_api",
    retrieve_dashboard: "POST /operator-pattern-intelligence-dashboard/dashboard",
    retrieve_patterns: "POST /operator-pattern-intelligence-dashboard/patterns",
    retrieve_trends: "POST /operator-pattern-intelligence-dashboard/trends",
    retrieve_recommendations: "POST /operator-pattern-intelligence-dashboard/recommendations",
    retrieve_risk: "POST /operator-pattern-intelligence-dashboard/risk",
    retrieve_confidence: "POST /operator-pattern-intelligence-dashboard/confidence",
    retrieve_governance: "POST /operator-pattern-intelligence-dashboard/governance",
    retrieve_mission: "POST /operator-pattern-intelligence-dashboard/mission",
    retrieve_evidence: "POST /operator-pattern-intelligence-dashboard/evidence",
    retrieve_replay: "POST /operator-pattern-intelligence-dashboard/replay",
    retrieve_contract: "GET /operator-pattern-intelligence-dashboard/contract",
    update_supported: false,
    delete_supported: false,
    autonomous_action_supported: false,
    recommendation_mutation_supported: false,
    governance_mutation_supported: false,
    priority_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function defaultFilters(replayResult: PatternReplayResult, input: PatternDashboardInput, scenario: Scenario): PatternDashboardFilters {
  const tenant = replayResult.registry.tenant_id;
  const base: Omit<PatternDashboardFilters, "integrity_hash"> = {
    tenant_id: scenario === "CROSS_TENANT" ? `${tenant}:foreign` : input.filters?.tenant_id ?? tenant,
    mission_scope: input.filters?.mission_scope ?? replayResult.replay_records[0]?.mission_scope ?? "mission-control-pattern-intelligence",
    pattern_type: input.filters?.pattern_type,
    governance_level: input.filters?.governance_level,
    operator_id: scenario === "ROLE_DENIED" ? "" : input.filters?.operator_id ?? "operator-pattern-intelligence-reviewer",
    timeframe: input.filters?.timeframe ?? "ALL",
    confidence_min: input.filters?.confidence_min,
    confidence_max: input.filters?.confidence_max,
    recurrence_min: input.filters?.recurrence_min,
    recurrence_max: input.filters?.recurrence_max,
    strategic_importance_min: input.filters?.strategic_importance_min,
    replay_status: input.filters?.replay_status,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scoreFor(type: ElementType, scenario: Scenario): number {
  const base: Record<ElementType, number> = {
    PATTERN_SUMMARY: 0.82,
    TREND: 0.74,
    RECOMMENDATION: scenario === "RECOMMENDATION_FAILURE" ? 0.42 : 0.78,
    RISK: scenario === "RISK_UNDERESTIMATION" || scenario === "RISK_OVERESTIMATION" ? 0.88 : 0.66,
    CONFIDENCE: scenario === "CONFIDENCE_DRIFT" ? 0.51 : 0.76,
    GOVERNANCE: scenario === "GOVERNANCE_BLOCKER" ? 0.91 : 0.81,
    MISSION: scenario === "MISSION_BOTTLENECK" ? 0.86 : 0.7,
    EVIDENCE: 1,
    REPLAY: scenario === "MISSING_REPLAY" ? 0 : 1,
  };
  return base[type];
}

function trendFor(type: ElementType, scenario: Scenario): PatternDashboardElement["trend_direction"] {
  if (["RECOMMENDATION_FAILURE", "RISK_UNDERESTIMATION", "CONFIDENCE_DRIFT", "GOVERNANCE_BLOCKER", "MISSION_BOTTLENECK"].includes(scenario)) return "DEGRADING";
  if (scenario === "RECOMMENDATION_SUCCESS") return "IMPROVING";
  return type === "EVIDENCE" || type === "REPLAY" ? "STABLE" : "STABLE";
}

function titleFor(type: ElementType, scenario: Scenario): string {
  const special: Partial<Record<Scenario, string>> = {
    RECOMMENDATION_FAILURE: "Recurring recommendation failure",
    RECOMMENDATION_SUCCESS: "Recurring recommendation success",
    RISK_UNDERESTIMATION: "Risk underestimation trend",
    RISK_OVERESTIMATION: "Risk overestimation trend",
    CONFIDENCE_DRIFT: "Confidence calibration drift",
    GOVERNANCE_BLOCKER: "Governance blocker trend",
    MISSION_BOTTLENECK: "Mission bottleneck trend",
  };
  return special[scenario] ?? `${type.toLowerCase().replace(/_/g, " ")} view`;
}

function buildElement(replayResult: PatternReplayResult, type: ElementType, scenario: Scenario): PatternDashboardElement {
  const replayRecord = replayResult.replay_records[0];
  const explanation = replayResult.explainability_artifacts[0];
  const evidenceMap = replayResult.evidence_navigation_maps[0];
  const tenantId = scenario === "CROSS_TENANT" ? `${replayResult.registry.tenant_id}:foreign` : replayRecord?.tenant_id ?? replayResult.registry.tenant_id;
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceMap?.truth_ledger_refs ?? freezeArray([]);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : replayResult.registry.replay_refs;
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : explanation?.governance_refs ?? freezeArray([]);
  const explanationRefs = scenario === "MISSING_EXPLANATION" ? freezeArray([]) : replayResult.registry.explainability_refs;
  const hidden = scenario === "HIDDEN_VISUALIZATION";
  const summary = hidden ? "" : `${titleFor(type, scenario)} derived from replay-certified Pattern Intelligence with evidence and replay access.`;
  const base: Omit<PatternDashboardElement, "integrity_hash"> = {
    element_id: `pattern_dashboard_${type.toLowerCase()}_${hash(`${type}:${replayRecord?.replay_id ?? "missing"}`).slice(0, 12)}`,
    pattern_id: replayRecord?.pattern_id ?? "pattern-unavailable",
    tenant_id: tenantId,
    element_type: type,
    title: titleFor(type, scenario),
    summary,
    score: scoreFor(type, scenario),
    trend_direction: trendFor(type, scenario),
    evidence_refs: evidenceRefs,
    replay_refs: replayRefs,
    governance_refs: governanceRefs,
    explanation_refs: explanationRefs,
    explanation: hidden || scenario === "MISSING_EXPLANATION" ? "" : explanation?.why_detected ?? summary,
    replay_available: replayRefs.length > 0,
  };
  const element = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && type === "PATTERN_SUMMARY") return Object.freeze({ ...element, integrity_hash: hash({ tampered: element.element_id }) });
  return element;
}

function buildPatternElements(replayResult: PatternReplayResult, scenario: Scenario): readonly PatternDashboardElement[] {
  if (scenario === "MISSING_REPLAY_INPUT") return freezeArray([]);
  return freezeArray(([
    "PATTERN_SUMMARY",
    "TREND",
    "RECOMMENDATION",
    "RISK",
    "CONFIDENCE",
    "GOVERNANCE",
    "MISSION",
    "EVIDENCE",
    "REPLAY",
  ] as const).map((type) => buildElement(replayResult, type, scenario)));
}

function explorer(id: string, tenantId: string, view: PatternDashboardExplorer["view"], elements: readonly PatternDashboardElement[]): PatternDashboardExplorer {
  const base: Omit<PatternDashboardExplorer, "integrity_hash"> = {
    explorer_id: id,
    tenant_id: tenantId,
    view,
    elements,
    explanation_complete: elements.every((element) => element.explanation && element.explanation_refs.length),
    evidence_complete: elements.every((element) => element.evidence_refs.length),
    replay_available: elements.every((element) => element.replay_available),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboardView(elements: readonly PatternDashboardElement[], filters: PatternDashboardFilters, scenario: Scenario): PatternDashboardView {
  const base: Omit<PatternDashboardView, "integrity_hash"> = {
    dashboard_view_id: `operator_pattern_dashboard_${hash(filters).slice(0, 16)}`,
    tenant_id: filters.tenant_id,
    operator_id: filters.operator_id,
    visible_pattern_refs: elements.filter((element) => element.element_type === "PATTERN_SUMMARY").map((element) => element.pattern_id),
    visible_trend_refs: elements.filter((element) => element.element_type === "TREND").map((element) => element.element_id),
    visible_governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(elements.flatMap((element) => element.governance_refs)),
    visible_replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(elements.flatMap((element) => element.replay_refs)),
    visible_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(elements.flatMap((element) => element.evidence_refs)),
    applied_filters: filters,
    dashboard_version: DASHBOARD_VERSION,
    replay_available: elements.every((element) => element.replay_available),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function filterValid(filters: PatternDashboardFilters): boolean {
  const confidenceValid = filters.confidence_min === undefined || filters.confidence_max === undefined || filters.confidence_min <= filters.confidence_max;
  const recurrenceValid = filters.recurrence_min === undefined || filters.recurrence_max === undefined || filters.recurrence_min <= filters.recurrence_max;
  return Boolean(filters.tenant_id && filters.operator_id && confidenceValid && recurrenceValid);
}

function collectFailures(replayResult: PatternReplayResult, view: PatternDashboardView, elements: readonly PatternDashboardElement[], explorers: readonly PatternDashboardExplorer[], scenario: Scenario): readonly PatternDashboardFailure[] {
  const failures: PatternDashboardFailure[] = [];
  const integrityVerified = [
    view,
    view.applied_filters,
    ...elements,
    ...explorers,
  ].every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  if (scenario === "MISSING_REPLAY_INPUT" || !elements.length) failures.push("REPLAY_INPUT_MISSING");
  if (scenario === "UNCERTIFIED_REPLAY_INPUT" || !replayResult.validation.certified) failures.push("REPLAY_INPUT_UNCERTIFIED");
  if (scenario === "MISSING_REPLAY" || !view.replay_available || elements.some((element) => !element.replay_refs.length)) failures.push("REPLAY_UNAVAILABLE");
  if (scenario === "MISSING_EVIDENCE" || elements.some((element) => !element.evidence_refs.length)) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || elements.some((element) => !element.governance_refs.length)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "INVALID_PATTERN_INTELLIGENCE" || !replayResult.replay_records.length) failures.push("PATTERN_INTELLIGENCE_INVALID");
  if (scenario === "HASH_MISMATCH" || !integrityVerified) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "CROSS_TENANT" || view.tenant_id !== replayResult.registry.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE" || !verifyPatternReplayExplainability(replayResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || elements.some((element) => !element.explanation || !element.explanation_refs.length)) failures.push("EXPLANATION_MISSING");
  if (scenario === "INVALID_FILTER" || !filterValid(view.applied_filters)) failures.push("FILTER_INVALID");
  if (scenario === "ROLE_DENIED" || !view.operator_id) failures.push("ROLE_ACCESS_DENIED");
  if (scenario === "HIDDEN_VISUALIZATION" || elements.some((element) => !element.summary)) failures.push("HIDDEN_VISUALIZATION_DETECTED");
  if (scenario === "NONDETERMINISTIC_RENDERING") failures.push("NONDETERMINISTIC_RENDERING_DETECTED");
  if (scenario === "AUTONOMOUS_ACTION") failures.push("AUTONOMOUS_ACTION_DETECTED");
  if (scenario === "RECOMMENDATION_MUTATION") failures.push("RECOMMENDATION_MUTATION_DETECTED");
  if (scenario === "GOVERNANCE_MUTATION") failures.push("GOVERNANCE_MUTATION_DETECTED");
  if (scenario === "PRIORITY_MUTATION") failures.push("PRIORITY_MUTATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly PatternDashboardFailure[]): PatternDashboardValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(view: PatternDashboardView, elements: readonly PatternDashboardElement[], explorers: readonly PatternDashboardExplorer[], failures: readonly PatternDashboardFailure[]): PatternDashboardValidation {
  const integrityVerified = [
    view,
    view.applied_filters,
    ...elements,
    ...explorers,
  ].every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const base: Omit<PatternDashboardValidation, "integrity_hash"> = {
    validation_id: "operator_pattern_intelligence_dashboard_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    replay_input_accepted: !failures.includes("REPLAY_INPUT_MISSING") && !failures.includes("REPLAY_INPUT_UNCERTIFIED"),
    replay_available: !failures.includes("REPLAY_UNAVAILABLE"),
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE"),
    governance_referenced: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    pattern_intelligence_valid: !failures.includes("PATTERN_INTELLIGENCE_INVALID"),
    integrity_verified: integrityVerified && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_VIOLATED"),
    replay_divergence_absent: !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    filters_valid: !failures.includes("FILTER_INVALID"),
    role_access_granted: !failures.includes("ROLE_ACCESS_DENIED"),
    no_hidden_visualizations: !failures.includes("HIDDEN_VISUALIZATION_DETECTED"),
    deterministic_rendering: !failures.includes("NONDETERMINISTIC_RENDERING_DETECTED"),
    advisory_only: true,
    no_autonomous_actions: !failures.includes("AUTONOMOUS_ACTION_DETECTED"),
    no_recommendation_mutation: !failures.includes("RECOMMENDATION_MUTATION_DETECTED"),
    no_governance_mutation: !failures.includes("GOVERNANCE_MUTATION_DETECTED"),
    no_priority_mutation: !failures.includes("PRIORITY_MUTATION_DETECTED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    replay_hash: result.replay_result.replay_hash,
    dashboard_view: result.dashboard_view,
    pattern_elements: result.pattern_elements,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<PatternDashboardResult, "integrity_hash">): string {
  return hash({
    operator_pattern_intelligence_dashboard_version: result.operator_pattern_intelligence_dashboard_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_result.integrity_hash,
    dashboard_hash: result.dashboard_view.integrity_hash,
    element_hashes: result.pattern_elements.map((element) => element.integrity_hash),
    validation_hash: result.validation.integrity_hash,
    deterministic: result.deterministic,
    advisory_only: result.advisory_only,
    workflow_execution: result.workflow_execution,
  });
}

export function renderOperatorPatternDashboard(input: PatternDashboardInput = {}): PatternDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const replay_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const appliedFilters = defaultFilters(replay_result, input, scenario === "INVALID_FILTER" ? "BASELINE" : scenario);
  const filters = scenario === "INVALID_FILTER"
    ? Object.freeze({ ...appliedFilters, confidence_min: 0.9, confidence_max: 0.1, integrity_hash: hashWithoutIntegrity({ ...appliedFilters, confidence_min: 0.9, confidence_max: 0.1 }) })
    : appliedFilters;
  const pattern_elements = buildPatternElements(replay_result, scenario);
  const dashboard_view = buildDashboardView(pattern_elements, filters, scenario);
  const tenantId = dashboard_view.tenant_id;
  const trend_explorer = explorer("operator_pattern_trend_explorer", tenantId, "TREND", pattern_elements.filter((element) => element.element_type === "TREND"));
  const recommendation_viewer = explorer("operator_pattern_recommendation_viewer", tenantId, "RECOMMENDATION", pattern_elements.filter((element) => element.element_type === "RECOMMENDATION"));
  const risk_dashboard = explorer("operator_pattern_risk_dashboard", tenantId, "RISK", pattern_elements.filter((element) => element.element_type === "RISK"));
  const confidence_dashboard = explorer("operator_pattern_confidence_dashboard", tenantId, "CONFIDENCE", pattern_elements.filter((element) => element.element_type === "CONFIDENCE"));
  const governance_view = explorer("operator_pattern_governance_view", tenantId, "GOVERNANCE", pattern_elements.filter((element) => element.element_type === "GOVERNANCE"));
  const mission_dashboard = explorer("operator_pattern_mission_dashboard", tenantId, "MISSION", pattern_elements.filter((element) => element.element_type === "MISSION"));
  const evidence_explorer = explorer("operator_pattern_evidence_explorer", tenantId, "EVIDENCE", pattern_elements.filter((element) => element.element_type === "EVIDENCE"));
  const replay_explorer = explorer("operator_pattern_replay_explorer", tenantId, "REPLAY", pattern_elements.filter((element) => element.element_type === "REPLAY"));
  const explorers = [trend_explorer, recommendation_viewer, risk_dashboard, confidence_dashboard, governance_view, mission_dashboard, evidence_explorer, replay_explorer] as const;
  const failures = collectFailures(replay_result, dashboard_view, pattern_elements, explorers, scenario);
  const validation = buildValidation(dashboard_view, pattern_elements, explorers, failures);
  const base: Omit<PatternDashboardResult, "integrity_hash" | "replay_hash"> = {
    operator_pattern_intelligence_dashboard_version: DASHBOARD_VERSION,
    replay_result,
    api_surface,
    dashboard_view,
    pattern_elements,
    trend_explorer,
    recommendation_viewer,
    risk_dashboard,
    confidence_dashboard,
    governance_view,
    mission_dashboard,
    evidence_explorer,
    replay_explorer,
    validation,
    deterministic: true,
    evidence_backed: true,
    replay_everywhere: true,
    explainability_everywhere: true,
    operator_first: true,
    tenant_isolated: true,
    advisory_only: true,
    autonomous_actions: false,
    modifies_recommendations: false,
    modifies_governance: false,
    modifies_priorities: false,
    workflow_execution: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOperatorPatternDashboard(result: PatternDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && verifyPatternReplayExplainability(result.replay_result);
}

export function computePatternDashboardElementHash(record: Omit<PatternDashboardElement, "integrity_hash"> | PatternDashboardElement): string {
  return hashWithoutIntegrity(record);
}

export function getOperatorPatternDashboardFoundation(): PatternDashboardFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    operator_pattern_intelligence_dashboard_version: DASHBOARD_VERSION,
    api_surface,
    result: renderOperatorPatternDashboard(),
  });
}

export const OperatorPatternIntelligenceDashboard = Object.freeze({
  render: renderOperatorPatternDashboard,
  replay: replayOperatorPatternDashboard,
});
