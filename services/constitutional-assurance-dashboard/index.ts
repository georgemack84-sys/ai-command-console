import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { monitorRuntimeConstitutionalCompliance } from "@/services/runtime-constitutional-monitoring";
import { detectConstitutionalViolations } from "@/services/constitutional-violation-detection";
import { assessConstitutionalResilience } from "@/services/constitutional-resilience-assessment";
import { generateConstitutionalRecommendations } from "@/services/constitutional-recommendation-engine";
import { validateConstitutionalReplay } from "@/services/constitutional-replay-validation";
import { validateConstitutionalLearning } from "@/services/constitutional-learning-validation";
import type {
  ConstitutionalAssuranceDashboardBundle,
  ConstitutionalAssuranceDashboardInput,
  ConstitutionalAssuranceDashboardObservabilitySurface,
  ConstitutionalAssuranceDashboardRepository,
  ConstitutionalAssuranceDashboardValidationResult,
  ConstitutionalDashboardFailure,
  ConstitutionalDashboardLedgerRecord,
  ConstitutionalDashboardMetricExplanation,
  ConstitutionalDashboardPanel,
  ConstitutionalDashboardPanelType,
  ConstitutionalDashboardRole,
  ConstitutionalDashboardRoleView,
  ConstitutionalDashboardScenario,
  ConstitutionalDashboardSnapshotRecord,
  ConstitutionalDashboardState,
  ConstitutionalDashboardStatus,
} from "@/types/constitutional-assurance-dashboard";

const VERSION = "constitutional-assurance-dashboard/v8ALT.10.9" as const;
const panelTypes = Object.freeze(["CONSTITUTIONAL_SCORE", "AUTHORITY_STATUS", "GOVERNANCE_STATUS", "OPERATOR_AUTHORITY", "LEARNING_COMPLIANCE", "OPTIMIZATION_COMPLIANCE", "RUNTIME_HEALTH", "VIOLATION_TIMELINE", "CONFIDENCE_HISTORY", "REPLAY_INTEGRITY", "SYSTEM_RESILIENCE", "RECOMMENDATION_PANEL"] as const);
const roles = Object.freeze(["EXECUTIVE", "OPERATOR", "GOVERNANCE", "AUDIT", "CERTIFICATION", "HISTORICAL"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ConstitutionalDashboardScenario): ConstitutionalDashboardFailure | null {
  const map: Partial<Record<ConstitutionalDashboardScenario, ConstitutionalDashboardFailure>> = {
    CONSTITUTIONAL_DATA_CORRUPTION: "CONSTITUTIONAL_DATA_CORRUPTION_DETECTED",
    REPLAY_INCONSISTENCY: "DASHBOARD_REPLAY_INCONSISTENCY_DETECTED",
    INTEGRITY_VERIFICATION_FAILURE: "DASHBOARD_INTEGRITY_VERIFICATION_FAILED",
    RENDERING_NONDETERMINISM: "DASHBOARD_RENDERING_NONDETERMINISM_DETECTED",
    MISSING_CONSTITUTIONAL_EVIDENCE: "DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING",
    INCOMPLETE_LINEAGE: "DASHBOARD_LINEAGE_INCOMPLETE",
    UNAUTHORIZED_DASHBOARD_MODIFICATION: "UNAUTHORIZED_DASHBOARD_MODIFICATION_DETECTED",
    ROLE_AUTHORIZATION_FAILURE: "DASHBOARD_ROLE_AUTHORIZATION_FAILED",
    TENANT_ISOLATION_BREACH: "DASHBOARD_TENANT_ISOLATION_BREACH",
    STALE_CONSTITUTIONAL_STATE: "STALE_CONSTITUTIONAL_STATE_DETECTED",
    INCONSISTENT_CONFIDENCE_CALCULATIONS: "INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED",
    UNVERIFIABLE_DASHBOARD_METRICS: "UNVERIFIABLE_DASHBOARD_METRICS_DETECTED",
  };
  return map[scenario] ?? null;
}

function dashboardState(failure: ConstitutionalDashboardFailure | null): ConstitutionalDashboardState {
  if (!failure) return "HEALTHY";
  if (failure === "DASHBOARD_ROLE_AUTHORIZATION_FAILED") return "RESTRICTED";
  if (["CONSTITUTIONAL_DATA_CORRUPTION_DETECTED", "DASHBOARD_INTEGRITY_VERIFICATION_FAILED", "UNAUTHORIZED_DASHBOARD_MODIFICATION_DETECTED", "DASHBOARD_TENANT_ISOLATION_BREACH"].includes(failure)) return "FAIL_CLOSED";
  return "DEGRADED";
}

function statusFor(failure: ConstitutionalDashboardFailure | null): ConstitutionalDashboardStatus {
  if (!failure) return "Healthy";
  if (["CONSTITUTIONAL_DATA_CORRUPTION_DETECTED", "DASHBOARD_INTEGRITY_VERIFICATION_FAILED", "DASHBOARD_TENANT_ISOLATION_BREACH"].includes(failure)) return "Critical";
  if (failure === "DASHBOARD_ROLE_AUTHORIZATION_FAILED") return "Warning";
  return "Degraded";
}

function panel(type: ConstitutionalDashboardPanelType, index: number, failure: ConstitutionalDashboardFailure | null, score: number): ConstitutionalDashboardPanel {
  const missingEvidence = failure === "DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING" || failure === "UNVERIFIABLE_DASHBOARD_METRICS_DETECTED";
  const base = { panel_id: id("CAD-P", "constitutional-dashboard-panel", { type, index }), panel_type: type, title: type.toLowerCase().replaceAll("_", " "), status: statusFor(failure), primary_value: type === "CONSTITUTIONAL_SCORE" ? String(score) : statusFor(failure), indicators: freezeArray([`indicator:${type.toLowerCase()}`, failure ? `failure:${failure}` : "verified"]), evidence_reference: missingEvidence ? "" : `evidence:dashboard:${type.toLowerCase()}`, replay_reference: failure === "DASHBOARD_REPLAY_INCONSISTENCY_DETECTED" ? "replay:dashboard:mismatch" : `replay:dashboard:${type.toLowerCase()}`, lineage_reference: failure === "DASHBOARD_LINEAGE_INCOMPLETE" ? "" : `lineage:dashboard:${type.toLowerCase()}`, confidence: failure === "INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED" ? 0 : failure ? 0.61 : 0.99 };
  return Object.freeze({ ...base, integrity_hash: failure === "DASHBOARD_INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("constitutional-dashboard-panel", base) });
}

function view(role: ConstitutionalDashboardRole, failure: ConstitutionalDashboardFailure | null): ConstitutionalDashboardRoleView {
  const access: Record<ConstitutionalDashboardRole, ConstitutionalDashboardRoleView["access_level"]> = { EXECUTIVE: "STRATEGIC_SUMMARY", OPERATOR: "MISSION_VISIBILITY", GOVERNANCE: "GOVERNANCE_OVERSIGHT", AUDIT: "FORENSIC_EVIDENCE", CERTIFICATION: "CERTIFICATION_EVIDENCE", HISTORICAL: "HISTORICAL_ANALYSIS" };
  const visible: Record<ConstitutionalDashboardRole, readonly ConstitutionalDashboardPanelType[]> = {
    EXECUTIVE: ["CONSTITUTIONAL_SCORE", "GOVERNANCE_STATUS", "SYSTEM_RESILIENCE", "RECOMMENDATION_PANEL"],
    OPERATOR: ["RUNTIME_HEALTH", "AUTHORITY_STATUS", "OPERATOR_AUTHORITY", "REPLAY_INTEGRITY", "RECOMMENDATION_PANEL"],
    GOVERNANCE: ["GOVERNANCE_STATUS", "VIOLATION_TIMELINE", "AUTHORITY_STATUS", "RECOMMENDATION_PANEL"],
    AUDIT: panelTypes,
    CERTIFICATION: ["CONSTITUTIONAL_SCORE", "REPLAY_INTEGRITY", "SYSTEM_RESILIENCE", "VIOLATION_TIMELINE"],
    HISTORICAL: ["CONFIDENCE_HISTORY", "VIOLATION_TIMELINE", "REPLAY_INTEGRITY", "SYSTEM_RESILIENCE"],
  };
  const base = { view_id: id("CAD-V", "constitutional-dashboard-view", role), role, access_level: access[role], visible_panels: freezeArray(visible[role]), restricted: failure === "DASHBOARD_ROLE_AUTHORIZATION_FAILED", tenant_id: failure === "DASHBOARD_TENANT_ISOLATION_BREACH" ? "tenant:foreign" : "tenant:alpha", replay_reference: `replay:dashboard-view:${role.toLowerCase()}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-dashboard-view", base) });
}

function snapshot(panels: readonly ConstitutionalDashboardPanel[], failure: ConstitutionalDashboardFailure | null, recommendationCount: number): ConstitutionalDashboardSnapshotRecord {
  const state = dashboardState(failure);
  const scorePanel = panels.find((item) => item.panel_type === "CONSTITUTIONAL_SCORE");
  const base = { dashboard_snapshot_id: id("CAD-S", "constitutional-dashboard-snapshot", { state, failure }), mission_id: "mission:constitutional-assurance-dashboard", execution_id: "execution:constitutional-dashboard:0", tenant_id: failure === "DASHBOARD_TENANT_ISOLATION_BREACH" ? "tenant:foreign" : "tenant:alpha", constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const, snapshot_timestamp: "1970-01-01T00:00:00.000Z" as const, constitutional_score: Number(scorePanel?.primary_value ?? 1), authority_status: statusFor(failure), governance_status: statusFor(failure), runtime_health: statusFor(failure), learning_compliance: statusFor(failure), optimization_compliance: statusFor(failure), replay_integrity: failure === "DASHBOARD_REPLAY_INCONSISTENCY_DETECTED" ? "Degraded" : statusFor(failure), system_resilience: statusFor(failure), active_recommendations: recommendationCount, dashboard_state: state, lineage_reference: failure === "DASHBOARD_LINEAGE_INCOMPLETE" ? "" : "lineage:constitutional-assurance-dashboard", read_only: true as const, mission_execution_modification_authorized: false as const, constitutional_policy_modification_authorized: false as const, governance_decision_authorized: false as const, authority_assignment_authorized: false as const, autonomous_behavior_modification_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: failure === "DASHBOARD_INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("constitutional-dashboard-snapshot", base) });
}

function explanation(item: ConstitutionalDashboardPanel): ConstitutionalDashboardMetricExplanation {
  const complete = Boolean(item.evidence_reference && item.replay_reference && item.lineage_reference && item.integrity_hash);
  const base = { explanation_id: id("CAD-E", "constitutional-dashboard-explanation", item.panel_id), panel_id: item.panel_id, constitutional_source: `source:${item.panel_type.toLowerCase()}`, governing_rule: "constitutional-rule:read-only-dashboard", calculation_methodology: "deterministic aggregation from constitutional assurance repositories", supporting_evidence: item.evidence_reference, confidence_value: item.confidence, historical_comparison: "matches deterministic baseline", replay_reference: item.replay_reference, integrity_verification: item.integrity_hash ? "VERIFIED" as const : "FAILED" as const, lineage_reference: item.lineage_reference, last_validation_timestamp: "1970-01-01T00:00:00.000Z" as const, complete };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-dashboard-explanation", base) });
}

function ledger(snapshot: ConstitutionalDashboardSnapshotRecord, role: ConstitutionalDashboardRole): ConstitutionalDashboardLedgerRecord {
  const base = { dashboard_record_id: id("CAD-L", "constitutional-dashboard-ledger", { snapshot: snapshot.dashboard_snapshot_id, role }), snapshot_id: snapshot.dashboard_snapshot_id, mission_id: snapshot.mission_id, execution_id: snapshot.execution_id, tenant_id: snapshot.tenant_id, timestamp: snapshot.snapshot_timestamp, view_type: role, dashboard_state: snapshot.dashboard_state, constitutional_reference: snapshot.constitution_version, replay_reference: `replay:dashboard-ledger:${role.toLowerCase()}`, evidence_reference: "evidence:constitutional-assurance-dashboard", lineage_reference: snapshot.lineage_reference, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-dashboard-ledger", base) });
}

function collectFailures(repository: Omit<ConstitutionalAssuranceDashboardRepository, "integrity_hash"> | ConstitutionalAssuranceDashboardRepository): readonly ConstitutionalDashboardFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.snapshot.tenant_id !== "tenant:alpha" || repository.views.some((item) => item.tenant_id !== "tenant:alpha") ? ["DASHBOARD_TENANT_ISOLATION_BREACH" as const] : []),
    ...(repository.snapshot.dashboard_state === "FAIL_CLOSED" && repository.failures.length === 0 ? ["CONSTITUTIONAL_DATA_CORRUPTION_DETECTED" as const] : []),
    ...(!repository.snapshot.lineage_reference || repository.panels.some((item) => !item.lineage_reference) ? ["DASHBOARD_LINEAGE_INCOMPLETE" as const] : []),
    ...(repository.panels.some((item) => !item.evidence_reference) ? ["DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.panels.some((item) => item.replay_reference.includes("mismatch")) ? ["DASHBOARD_REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(repository.panels.some((item) => !item.integrity_hash) || !repository.snapshot.integrity_hash ? ["DASHBOARD_INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.panels.some((item) => item.confidence === 0) ? ["INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED" as const] : []),
    ...(repository.views.some((item) => item.restricted) ? ["DASHBOARD_ROLE_AUTHORIZATION_FAILED" as const] : []),
    ...(repository.explanations.some((item) => !item.complete) ? ["UNVERIFIABLE_DASHBOARD_METRICS_DETECTED" as const] : []),
  ]);
}

export function buildConstitutionalAssuranceDashboard(input: ConstitutionalAssuranceDashboardInput = {}): ConstitutionalAssuranceDashboardRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance();
  const violationRepository = input.violationRepository ?? detectConstitutionalViolations({ runtimeRepository });
  const resilienceRepository = input.resilienceRepository ?? assessConstitutionalResilience({ runtimeRepository, violationRepository });
  const recommendationRepository = input.recommendationRepository ?? generateConstitutionalRecommendations({ runtimeRepository, violationRepository, resilienceRepository });
  const replayRepository = input.replayRepository ?? validateConstitutionalReplay({ runtimeRepository, violationRepository, resilienceRepository, recommendationRepository });
  const learningRepository = input.learningRepository ?? validateConstitutionalLearning({ replayRepository });
  const failure = scenarioFailure(scenario);
  const score = resilienceRepository.assessment.overall_constitutional_score;
  const panels = freezeArray(panelTypes.map((type, index) => panel(type, index, failure, score)));
  const views = freezeArray(roles.map((role) => view(role, failure)));
  const snap = snapshot(panels, failure, recommendationRepository.recommendations.length);
  const source = { repository_id: id("CAD", "constitutional-assurance-dashboard", { scenario, runtime: runtimeRepository.repository_id, violation: violationRepository.repository_id, resilience: resilienceRepository.repository_id, recommendation: recommendationRepository.repository_id, replay: replayRepository.repository_id, learning: learningRepository.repository_id }), runtime_monitoring_repository_id: runtimeRepository.repository_id, violation_detection_repository_id: violationRepository.repository_id, resilience_assessment_repository_id: resilienceRepository.repository_id, recommendation_repository_id: recommendationRepository.repository_id, replay_validation_repository_id: replayRepository.repository_id, learning_validation_repository_id: learningRepository.repository_id, final_state: "CONSTITUTIONAL_ASSURANCE_DASHBOARD_COMPLETE" as const, snapshot: snap, panels, views, explanations: freezeArray(panels.map(explanation)), ledger: freezeArray(roles.map((role) => ledger(snap, role))), failures: freezeArray(failure ? [failure] : []), read_only: true as const, mission_execution_modification_authorized: false as const, constitutional_policy_modification_authorized: false as const, governance_decision_authorized: false as const, authority_assignment_authorized: false as const, autonomous_behavior_modification_authorized: false as const };
  const failures = unique([...collectFailures(source), ...(scenario === "RENDERING_NONDETERMINISM" ? ["DASHBOARD_RENDERING_NONDETERMINISM_DETECTED" as const] : []), ...(scenario === "STALE_CONSTITUTIONAL_STATE" ? ["STALE_CONSTITUTIONAL_STATE_DETECTED" as const] : []), ...(scenario === "UNAUTHORIZED_DASHBOARD_MODIFICATION" ? ["UNAUTHORIZED_DASHBOARD_MODIFICATION_DETECTED" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_ASSURANCE_DASHBOARD_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-assurance-dashboard-repository", repository) });
}

export function listConstitutionalDashboardPanels(input: ConstitutionalAssuranceDashboardInput = {}) { return buildConstitutionalAssuranceDashboard(input).panels; }
export function listConstitutionalDashboardViews(input: ConstitutionalAssuranceDashboardInput = {}) { return buildConstitutionalAssuranceDashboard(input).views; }
export function listConstitutionalDashboardExplanations(input: ConstitutionalAssuranceDashboardInput = {}) { return buildConstitutionalAssuranceDashboard(input).explanations; }
export function listConstitutionalDashboardLedger(input: ConstitutionalAssuranceDashboardInput = {}) { return buildConstitutionalAssuranceDashboard(input).ledger; }

export function validateConstitutionalAssuranceDashboard(repository = buildConstitutionalAssuranceDashboard()): ConstitutionalAssuranceDashboardValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["DASHBOARD_INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ConstitutionalDashboardFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_ASSURANCE_DASHBOARD_COMPLETE" && repository.read_only && !repository.mission_execution_modification_authorized;
  const result = { repository_id: repository.repository_id, valid, deterministic_rendering: !has("DASHBOARD_RENDERING_NONDETERMINISM_DETECTED"), replay_identical: !has("DASHBOARD_REPLAY_INCONSISTENCY_DETECTED"), evidence_complete: !has("DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING"), explainability_complete: repository.explanations.every((item) => item.complete), lineage_complete: !has("DASHBOARD_LINEAGE_INCOMPLETE"), integrity_verified: !has("DASHBOARD_INTEGRITY_VERIFICATION_FAILED") && !has("CONSTITUTIONAL_DATA_CORRUPTION_DETECTED"), role_authorized: !has("DASHBOARD_ROLE_AUTHORIZATION_FAILED"), tenant_isolated: !has("DASHBOARD_TENANT_ISOLATION_BREACH"), current_state: !has("STALE_CONSTITUTIONAL_STATE_DETECTED"), confidence_consistent: !has("INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED"), metrics_verifiable: !has("UNVERIFIABLE_DASHBOARD_METRICS_DETECTED"), read_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_ASSURANCE_DASHBOARD_COMPLETE", no_execution_influence: !repository.mission_execution_modification_authorized && !repository.governance_decision_authorized && !repository.authority_assignment_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-dashboard-validation", result) });
}

export function buildConstitutionalAssuranceDashboardObservabilitySurface(repository = buildConstitutionalAssuranceDashboard()): ConstitutionalAssuranceDashboardObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, dashboard_state: repository.snapshot.dashboard_state, panel_count: repository.panels.length, view_count: repository.views.length, explanation_count: repository.explanations.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, read_only: true, mission_execution_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalAssuranceDashboardEngine(): ConstitutionalAssuranceDashboardBundle {
  const repository = buildConstitutionalAssuranceDashboard();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_ASSURANCE_DASHBOARD_READY", panel_types: panelTypes, roles, principles: freezeArray(["read-only", "deterministic-rendering", "role-based-visibility", "tenant-isolated", "immutable-dashboard-history", "replay-identical-visualization", "complete-explainability", "no-execution-influence"]) }), repository, validation: validateConstitutionalAssuranceDashboard(repository), observability: buildConstitutionalAssuranceDashboardObservabilitySurface(repository) });
}
