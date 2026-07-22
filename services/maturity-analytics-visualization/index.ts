import { buildMaturityLedgerEvidenceRepository } from "@/services/maturity-ledger-evidence-repository";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DashboardKind,
  MaturityAnalyticsBundle,
  MaturityAnalyticsFailure,
  MaturityAnalyticsInput,
  MaturityAnalyticsObservabilitySurface,
  MaturityAnalyticsScenario,
  MaturityAnalyticsSummary,
  MaturityAnalyticsValidationResult,
  MaturityAnalyticsVisualizationRepository,
  MaturityDashboardArtifact,
  MaturityVisualizationReport,
  ReportKind,
  VisualizationRegistryEntry,
} from "@/types/maturity-analytics-visualization";
import type { MaturityLedgerEvidenceRepository } from "@/types/maturity-ledger-evidence-repository";

const VERSION = "maturity-analytics-visualization/v8ALT.11.9" as const;
const dashboardKinds = ["CURRENT_LEVEL", "HISTORICAL_TIMELINE", "DOMAIN_HEATMAP", "TREND_CHARTS", "READINESS", "GAP", "CERTIFICATION", "EXECUTIVE"] as const;
const reportKinds = ["EXECUTIVE", "TECHNICAL", "GOVERNANCE", "CONSTITUTIONAL", "CERTIFICATION"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: MaturityAnalyticsScenario): MaturityAnalyticsFailure | null {
  const map: Partial<Record<MaturityAnalyticsScenario, MaturityAnalyticsFailure>> = {
    DASHBOARD_REPLAY_MISMATCH: "DASHBOARD_REPLAY_MISMATCHED",
    VISUALIZATION_EVIDENCE_MISMATCH: "VISUALIZATION_EVIDENCE_MISMATCHED",
    INCONSISTENT_HISTORICAL_TIMELINE: "HISTORICAL_TIMELINE_INCONSISTENT",
    INCORRECT_DOMAIN_HEATMAP_VALUES: "DOMAIN_HEATMAP_VALUES_INCORRECT",
    READINESS_FINDINGS_OMITTED: "READINESS_DASHBOARD_FINDINGS_OMITTED",
    CERTIFICATION_STATUS_OMITTED: "CERTIFICATION_DASHBOARD_STATUS_OMITTED",
    MISSING_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_MISSING",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    INCOMPLETE_REPLAY_REFERENCES: "REPLAY_REFERENCES_INCOMPLETE",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_ANALYTICS: "HIDDEN_ANALYTICS_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function registry(scenario: MaturityAnalyticsScenario): readonly VisualizationRegistryEntry[] {
  return freezeArray(dashboardKinds.map((kind, index) => {
    const base = { visualization_id: id("MAV-V", "visualization-registry", kind), dashboard_kind: kind, visualization_version: "maturity-visualization/v1" as const, analytics_version: "maturity-analytics/v1" as const, template: scenario === "HIDDEN_ANALYTICS" && index === 0 ? "hidden analytics template" : `${kind.toLowerCase()} deterministic template`, approved: true, deterministic: scenario !== "DASHBOARD_REPLAY_MISMATCH" };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("maturity-visualization-registry", base) });
  }));
}

function analytics(ledger: MaturityLedgerEvidenceRepository, scenario: MaturityAnalyticsScenario): MaturityAnalyticsSummary {
  const assessment = ledger.assessment_ledger[0]!;
  const heatmap = freezeArray(ledger.domain_scores.map((score) => {
    const value = scenario === "INCORRECT_DOMAIN_HEATMAP_VALUES" && score.domain === "VISIBILITY" ? -1 : score.score;
    const base = { domain: score.domain, score: value, trend: "IMPROVING" as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && score.domain === "VISIBILITY" ? "" : hashValue("maturity-domain-heatmap", base) });
  }));
  const base = { analytics_id: id("MAV-A", "maturity-analytics", scenario), maturity_level: assessment.maturity_level, maturity_score: assessment.overall_score, readiness_score: assessment.readiness_score, confidence_score: assessment.confidence_score, domain_count: heatmap.length, domain_heatmap: heatmap, trend_metrics: freezeArray(scenario === "HIDDEN_ANALYTICS" ? ["hidden analytics"] : ["maturity growth", "readiness growth", "certification progression", "governance consistency", "constitutional consistency", "replay maturity", "resilience evolution", "confidence evolution"]), replay_verified: scenario !== "DASHBOARD_REPLAY_MISMATCH" };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-analytics-summary", base) });
}

function dashboardData(kind: DashboardKind, ledger: MaturityLedgerEvidenceRepository, summary: MaturityAnalyticsSummary, scenario: MaturityAnalyticsScenario): MaturityDashboardArtifact {
  const assessment = ledger.assessment_ledger[0]!;
  const readiness = ledger.recommendation_repository.readiness;
  const evidenceRefs = scenario === "VISUALIZATION_EVIDENCE_MISMATCH" && kind === "DOMAIN_HEATMAP" ? [] : ledger.evidence_repository.map((entry) => entry.evidence_id);
  const base = {
    dashboard_id: id("MAV-D", "maturity-dashboard", kind),
    dashboard_kind: kind,
    title: `${kind.toLowerCase().replaceAll("_", " ")} dashboard`,
    kpis: freezeArray(kind === "CURRENT_LEVEL" || kind === "EXECUTIVE" ? [`level:${assessment.maturity_level}`, `score:${assessment.overall_score}`, `readiness:${assessment.readiness_score}`, `confidence:${assessment.confidence_score}`] : [`items:${kind}`]),
    data_points: freezeArray(kind === "READINESS" && scenario === "READINESS_FINDINGS_OMITTED" ? [] : kind === "CERTIFICATION" && scenario === "CERTIFICATION_STATUS_OMITTED" ? [] : kind === "DOMAIN_HEATMAP" ? summary.domain_heatmap.map((entry) => `${entry.domain}:${entry.score}`) : kind === "HISTORICAL_TIMELINE" && scenario === "INCONSISTENT_HISTORICAL_TIMELINE" ? ["99:timeline-mismatch"] : readiness.gaps.map((gap) => `${gap.category}:${gap.domain}`)),
    evidence_references: freezeArray(evidenceRefs),
    governance_references: freezeArray(scenario === "MISSING_GOVERNANCE_EVIDENCE" ? [] : ledger.indexes.governance_index),
    constitutional_references: freezeArray(scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? [] : ledger.indexes.constitutional_index),
    replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && kind === "TREND_CHARTS" ? "" : assessment.replay_reference,
    lineage_reference: assessment.lineage_reference,
    advisory_only: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && kind === "EXECUTIVE" ? "" : hashValue("maturity-dashboard-artifact", base) });
}

function dashboards(ledger: MaturityLedgerEvidenceRepository, summary: MaturityAnalyticsSummary, scenario: MaturityAnalyticsScenario): readonly MaturityDashboardArtifact[] {
  return freezeArray(dashboardKinds.map((kind) => dashboardData(kind, ledger, summary, scenario)));
}

function report(kind: ReportKind, ledger: MaturityLedgerEvidenceRepository, scenario: MaturityAnalyticsScenario): MaturityVisualizationReport {
  const assessment = ledger.assessment_ledger[0]!;
  const base = { report_id: id("MAV-R", "maturity-report", kind), report_kind: kind, title: `${kind.toLowerCase()} maturity report`, summary: freezeArray([`maturity:${assessment.maturity_level}`, `score:${assessment.overall_score}`, "evidence-backed deterministic report"]), evidence_references: freezeArray(ledger.evidence_repository.map((entry) => entry.evidence_id)), replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && kind === "TECHNICAL" ? "" : assessment.replay_reference, lineage_reference: assessment.lineage_reference, governance_reference: scenario === "MISSING_GOVERNANCE_EVIDENCE" ? "" : ledger.indexes.governance_index[0] ?? "", constitutional_reference: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : ledger.indexes.constitutional_index[0] ?? "", advisory_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && kind === "EXECUTIVE" ? "" : hashValue("maturity-visualization-report", base) });
}

function reports(ledger: MaturityLedgerEvidenceRepository, scenario: MaturityAnalyticsScenario): readonly MaturityVisualizationReport[] {
  return freezeArray(reportKinds.map((kind) => report(kind, ledger, scenario)));
}

function collectFailures(repository: Omit<MaturityAnalyticsVisualizationRepository, "integrity_hash"> | MaturityAnalyticsVisualizationRepository): readonly MaturityAnalyticsFailure[] {
  return unique([
    ...repository.failures,
    ...(!repository.analytics.replay_verified || repository.registry.some((entry) => !entry.deterministic) ? ["DASHBOARD_REPLAY_MISMATCHED" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.evidence_references.length === 0) ? ["VISUALIZATION_EVIDENCE_MISMATCHED" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.dashboard_kind === "HISTORICAL_TIMELINE" && dashboard.data_points.some((point) => point.startsWith("99:"))) ? ["HISTORICAL_TIMELINE_INCONSISTENT" as const] : []),
    ...(repository.analytics.domain_heatmap.some((entry) => entry.score < 0 || entry.score > 100) ? ["DOMAIN_HEATMAP_VALUES_INCORRECT" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.dashboard_kind === "READINESS" && dashboard.data_points.length === 0) ? ["READINESS_DASHBOARD_FINDINGS_OMITTED" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.dashboard_kind === "CERTIFICATION" && dashboard.data_points.length === 0) ? ["CERTIFICATION_DASHBOARD_STATUS_OMITTED" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.governance_references.length === 0) || repository.reports.some((item) => !item.governance_reference) ? ["GOVERNANCE_EVIDENCE_MISSING" as const] : []),
    ...(repository.dashboards.some((dashboard) => dashboard.constitutional_references.length === 0) || repository.reports.some((item) => !item.constitutional_reference) ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.dashboards.some((dashboard) => !dashboard.replay_reference) || repository.reports.some((item) => !item.replay_reference) ? ["REPLAY_REFERENCES_INCOMPLETE" as const] : []),
    ...(!repository.analytics.integrity_hash || repository.registry.some((entry) => !entry.integrity_hash) || repository.dashboards.some((dashboard) => !dashboard.integrity_hash) || repository.reports.some((item) => !item.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.analytics.trend_metrics.some((metric) => metric.includes("hidden")) || repository.registry.some((entry) => entry.template.includes("hidden")) ? ["HIDDEN_ANALYTICS_DETECTED" as const] : []),
    ...(repository.ledger_repository.assessment_ledger.some((record) => record.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.maturity_change_authorized || repository.certification_approval_authorized || repository.runtime_change_authorized || repository.governance_change_authorized || repository.remediation_action_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function buildMaturityAnalyticsVisualization(input: MaturityAnalyticsInput = {}): MaturityAnalyticsVisualizationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const ledger_repository = input.ledger_repository ?? buildMaturityLedgerEvidenceRepository(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const registryEntries = registry(scenario);
  const analyticsSummary = analytics(ledger_repository, scenario);
  const dashboardArtifacts = dashboards(ledger_repository, analyticsSummary, scenario);
  const reportArtifacts = reports(ledger_repository, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("MAV", "maturity-analytics-visualization", scenario), final_state: "MATURITY_ANALYTICS_VISUALIZATION_COMPLETE" as const, ledger_repository, registry: registryEntries, dashboards: dashboardArtifacts, analytics: analyticsSummary, reports: reportArtifacts, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, maturity_change_authorized: false as const, certification_approval_authorized: false as const, runtime_change_authorized: false as const, governance_change_authorized: false as const, remediation_action_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "MATURITY_ANALYTICS_VISUALIZATION_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("maturity-analytics-visualization-repository", repository) });
}

export function listMaturityDashboards(input: MaturityAnalyticsInput = {}) { return buildMaturityAnalyticsVisualization(input).dashboards; }
export function getMaturityAnalytics(input: MaturityAnalyticsInput = {}) { return buildMaturityAnalyticsVisualization(input).analytics; }
export function listMaturityVisualizationReports(input: MaturityAnalyticsInput = {}) { return buildMaturityAnalyticsVisualization(input).reports; }
export function listMaturityVisualizationRegistry(input: MaturityAnalyticsInput = {}) { return buildMaturityAnalyticsVisualization(input).registry; }

export function validateMaturityAnalyticsVisualization(repository = buildMaturityAnalyticsVisualization()): MaturityAnalyticsValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: MaturityAnalyticsFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "MATURITY_ANALYTICS_VISUALIZATION_COMPLETE", dashboard_replay_verified: !has("DASHBOARD_REPLAY_MISMATCHED"), visualization_evidence_consistent: !has("VISUALIZATION_EVIDENCE_MISMATCHED"), historical_timeline_consistent: !has("HISTORICAL_TIMELINE_INCONSISTENT"), domain_heatmap_correct: !has("DOMAIN_HEATMAP_VALUES_INCORRECT"), readiness_findings_present: !has("READINESS_DASHBOARD_FINDINGS_OMITTED"), certification_status_present: !has("CERTIFICATION_DASHBOARD_STATUS_OMITTED"), governance_evidence_present: !has("GOVERNANCE_EVIDENCE_MISSING"), constitutional_evidence_present: !has("CONSTITUTIONAL_EVIDENCE_MISSING"), replay_references_complete: !has("REPLAY_REFERENCES_INCOMPLETE"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), no_hidden_analytics: !has("HIDDEN_ANALYTICS_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("maturity-analytics-visualization-validation", result) });
}

export function buildMaturityAnalyticsObservabilitySurface(repository = buildMaturityAnalyticsVisualization()): MaturityAnalyticsObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, dashboard_count: repository.dashboards.length, registry_count: repository.registry.length, report_count: repository.reports.length, domain_count: repository.analytics.domain_count, failure_count: repository.failures.length, advisory_only: true, runtime_change_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getMaturityAnalyticsVisualizationBundle(): MaturityAnalyticsBundle {
  const repository = buildMaturityAnalyticsVisualization();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "MATURITY_ANALYTICS_VISUALIZATION_READY", principles: freezeArray(["ledger-derived", "deterministic-dashboard-data", "precomputed-analytics", "replayable-reports", "canonical-ten-domain-model", "tenant-isolated", "evidence-backed", "advisory-only"]) }), repository, validation: validateMaturityAnalyticsVisualization(repository), observability: buildMaturityAnalyticsObservabilitySurface(repository) });
}
