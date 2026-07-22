import { buildArbitrationObservability, replayArbitrationRulesEngine, arbitrateClassifiedConflicts } from "@/services/decision-arbitration-rules-engine";
import { buildEnforcementObservability, enforceConstitutionAndGovernance, replayEnforcement } from "@/services/decision-constitutional-governance-enforcement";
import { buildConflictLedgerObservability, replayConflictLedger, writeConflictLedger } from "@/services/decision-conflict-ledger";
import { buildEscalationObservability, runConflictEscalationWorkflow } from "@/services/decision-conflict-escalation-workflow";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildTradeoffExplanationObservability, generateTradeoffExplanations, replayTradeoffExplanations } from "@/services/decision-tradeoff-explanation-generator";
import type { ArbitrationOutcome, ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type {
  ArbitrationAnalyticsFailureReason,
  ArbitrationAnalyticsLedgerRecord,
  ArbitrationAnalyticsValidation,
  ArbitrationConflictCategory,
  ArbitrationDashboard,
  ArbitrationDashboardName,
  ArbitrationMetricCollection,
  ArbitrationObservabilityAnalyticsFoundation,
  ArbitrationObservabilityAnalyticsInput,
  ArbitrationObservabilityAnalyticsResult,
  ArbitrationObservabilityReplay,
  ArbitrationTrendPoint,
  ArbitrationTrendReport,
  ArbitrationTrendReportType,
} from "@/types/decision-arbitration-observability-analytics";
import type { EnforcementResult } from "@/types/decision-constitutional-governance-enforcement";
import type { ConflictLedgerResult } from "@/types/decision-conflict-ledger";
import type { EscalationDestination, EscalationWorkflowResult } from "@/types/decision-conflict-escalation-workflow";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";

const NOW = "2026-07-04T00:06:00.000Z";
const ANALYTICS_VERSION = "arbitration-observability-analytics/v1" as const;
const AUTHORIZED_COMPONENT = "decision-arbitration-observability-analytics";

export const ARBITRATION_DASHBOARDS: readonly ArbitrationDashboardName[] = Object.freeze([
  "Conflict Frequency",
  "Conflict Categories",
  "Resolution Rates",
  "Escalation Rates",
  "Operator Interventions",
  "Governance Interventions",
  "Simulation Requests",
  "Certification Requests",
  "Tradeoff Trends",
  "Conflict Hotspots",
]);

export const ARBITRATION_TREND_REPORTS: readonly ArbitrationTrendReportType[] = Object.freeze([
  "Conflict Summary Report",
  "Resolution Effectiveness Report",
  "Governance Activity Report",
  "Constitutional Compliance Report",
  "Escalation Report",
  "Tradeoff Analysis Report",
  "Operator Activity Report",
  "Certification Activity Report",
  "Replay Validation Report",
]);

const CONFLICT_CATEGORIES: readonly ArbitrationConflictCategory[] = Object.freeze([
  "Recommendation",
  "Governance",
  "Authority",
  "Evidence",
  "Risk",
  "Confidence",
  "Forecast",
  "Mission",
  "Recovery",
  "Timing",
  "Resource",
  "Tenant",
  "Certification",
  "Constitutional",
]);

const OUTCOMES: readonly ArbitrationOutcome[] = Object.freeze([
  "RESOLVED",
  "ESCALATE_TO_OPERATOR",
  "ESCALATE_TO_GOVERNANCE",
  "DEFER",
  "REJECT",
  "SPLIT_DECISION",
  "REQUIRE_SIMULATION",
  "REQUIRE_CERTIFICATION",
]);

const DESTINATIONS: readonly EscalationDestination[] = Object.freeze([
  "Operator",
  "Governance",
  "Certification",
  "Simulation",
  "Mission Review",
  "Recovery Review",
]);

type Sources = Readonly<{
  arbitration: ArbitrationRulesEngineResult;
  tradeoff: TradeoffExplanationGeneratorResult;
  escalation: EscalationWorkflowResult;
  ledger: ConflictLedgerResult;
  enforcement: EnforcementResult;
}>;

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function countBy<T extends string>(items: readonly T[], keys: readonly T[]): Readonly<Record<T, number>> {
  return Object.freeze(keys.reduce((counts, key) => {
    counts[key] = items.filter((item) => item === key).length;
    return counts;
  }, {} as Record<T, number>));
}

function countStrings(items: readonly string[]): Readonly<Record<string, number>> {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
  return Object.freeze(Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))));
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function resolveSources(input: ArbitrationObservabilityAnalyticsInput = {}): Sources {
  const arbitration = input.arbitration_result ?? arbitrateClassifiedConflicts();
  const tradeoff = input.tradeoff_result ?? generateTradeoffExplanations({ arbitration_result: arbitration });
  const escalation = input.escalation_result ?? runConflictEscalationWorkflow({ arbitration_result: arbitration, explanation_result: tradeoff });
  const ledger = input.ledger_result ?? writeConflictLedger({ escalation_result: escalation });
  const enforcement = input.enforcement_result ?? enforceConstitutionAndGovernance({ ledger_result: ledger });
  return Object.freeze({ arbitration, tradeoff, escalation, ledger, enforcement });
}

function categorizeLedgerText(text: string): readonly ArbitrationConflictCategory[] {
  const lower = text.toLowerCase();
  const categories: ArbitrationConflictCategory[] = [];
  if (lower.includes("recommendation") || lower.includes("decision")) categories.push("Recommendation");
  if (lower.includes("governance") || lower.includes("policy")) categories.push("Governance");
  if (lower.includes("authority") || lower.includes("operator")) categories.push("Authority");
  if (lower.includes("evidence")) categories.push("Evidence");
  if (lower.includes("risk")) categories.push("Risk");
  if (lower.includes("confidence")) categories.push("Confidence");
  if (lower.includes("forecast") || lower.includes("simulation")) categories.push("Forecast");
  if (lower.includes("mission")) categories.push("Mission");
  if (lower.includes("recovery")) categories.push("Recovery");
  if (lower.includes("timing") || lower.includes("latency") || lower.includes("duration")) categories.push("Timing");
  if (lower.includes("resource")) categories.push("Resource");
  if (lower.includes("tenant")) categories.push("Tenant");
  if (lower.includes("certification")) categories.push("Certification");
  if (lower.includes("constitution")) categories.push("Constitutional");
  return Object.freeze(categories);
}

function conflictCategories(ledger: ConflictLedgerResult): Readonly<Record<ArbitrationConflictCategory, number>> {
  const observed = ledger.entries.flatMap((entry) => categorizeLedgerText([
    entry.event_type,
    entry.source_component,
    entry.source_record_ref,
    ...entry.evidence_refs,
    ...entry.governance_refs,
    ...entry.constitutional_refs,
    ...entry.authority_refs,
    entry.replay_ref,
    entry.lineage_ref,
  ].join(" ")));
  return countBy(observed, CONFLICT_CATEGORIES);
}

function conflictLifecycleDuration(ledger: ConflictLedgerResult): number {
  const conflicts = uniqueSorted(ledger.entries.map((entry) => entry.conflict_id));
  const durations = conflicts.map((conflictId) => {
    const scoped = ledger.entries.filter((entry) => entry.conflict_id === conflictId);
    const first = scoped[0]?.ledger_sequence ?? 0;
    const last = scoped[scoped.length - 1]?.ledger_sequence ?? first;
    return Math.max(0, last - first);
  });
  return durations.length === 0 ? 0 : Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2));
}

function metricHash(metrics: Omit<ArbitrationMetricCollection, "integrity_hash"> | ArbitrationMetricCollection): string {
  return hashWithoutIntegrity(metrics);
}

export function collectArbitrationMetrics(input: ArbitrationObservabilityAnalyticsInput = {}): ArbitrationMetricCollection {
  const sources = resolveSources(input);
  const ledgerObservability = buildConflictLedgerObservability(sources.ledger);
  const arbitrationObservability = buildArbitrationObservability(sources.arbitration);
  const escalationObservability = buildEscalationObservability(sources.escalation);
  const tradeoffObservability = buildTradeoffExplanationObservability(sources.tradeoff);
  const enforcementObservability = buildEnforcementObservability(sources.enforcement);
  const ledgerReplay = replayConflictLedger(sources.ledger);
  const arbitrationReplay = replayArbitrationRulesEngine(sources.arbitration);
  const tradeoffReplay = replayTradeoffExplanations(sources.tradeoff);
  const escalationReplay = sources.escalation.escalation_status === "NO_ESCALATION" ? { replay_valid: true } : { replay_valid: escalationObservability.replay_success_rate === 1 };
  const enforcementReplay = replayEnforcement(sources.enforcement);
  const replayStatuses = [ledgerReplay.replay_valid, arbitrationReplay.replay_valid, tradeoffReplay.replay_valid, escalationReplay.replay_valid, enforcementReplay.replay_valid];
  const conflicts = uniqueSorted(sources.ledger.entries.map((entry) => entry.conflict_id));
  const conflictsOverTime = countStrings(sources.ledger.entries.map((entry) => entry.timestamp.slice(0, 10)));
  const base: Omit<ArbitrationMetricCollection, "integrity_hash"> = {
    collection_id: `arbitration_metrics_${hash(sources.ledger.replay_hash).slice(0, 24)}`,
    source_ledger_ref: sources.ledger.replay_hash,
    source_replay_refs: uniqueSorted([
      sources.ledger.replay_hash,
      sources.arbitration.replay_hash,
      sources.tradeoff.replay_hash,
      sources.escalation.replay_hash,
      sources.enforcement.replay_hash,
    ]),
    conflict_frequency: conflicts.length,
    conflict_density: sources.ledger.entries.length === 0 ? 0 : Number((conflicts.length / sources.ledger.entries.length).toFixed(4)),
    conflicts_by_mission: countStrings(sources.ledger.entries.map((entry) => entry.mission_id)),
    conflicts_by_tenant: ledgerObservability.tenant_distribution,
    conflicts_over_time: conflictsOverTime,
    conflict_categories: conflictCategories(sources.ledger),
    outcomes_by_type: arbitrationObservability.outcomes_by_type,
    escalations_by_destination: escalationObservability.escalations_by_destination,
    escalation_reasons: escalationObservability.escalation_reasons,
    governance_interventions: escalationObservability.governance_escalations + enforcementObservability.governance_escalations,
    constitutional_reviews: sources.enforcement.constitutional_validations.length,
    operator_interventions: escalationObservability.operator_escalations + arbitrationObservability.operator_escalations,
    simulation_requests: arbitrationObservability.simulation_requests + escalationObservability.simulation_requests,
    certification_requests: arbitrationObservability.certification_requests + escalationObservability.certification_escalations + sources.ledger.certification_evidence.length,
    tradeoff_counts: Object.freeze({
      explanations: tradeoffObservability.explanations_generated,
      governance: tradeoffObservability.governance_explanations_generated,
      constitutional: tradeoffObservability.constitutional_explanations_generated,
      mission: sources.tradeoff.explanations.filter((explanation) => explanation.mission_impact.length > 0).length,
      recovery: tradeoffObservability.recovery_analyses,
      optimization: sources.tradeoff.explanations.filter((explanation) => explanation.tradeoff_summary.toLowerCase().includes("optimization")).length,
    }),
    replay_validations: replayStatuses.filter(Boolean).length,
    replay_failures: replayStatuses.filter((status) => !status).length,
    integrity_failures: ledgerObservability.integrity_validation_failures + arbitrationObservability.integrity_failures + tradeoffObservability.integrity_failures + escalationObservability.integrity_failures + enforcementObservability.integrity_failures,
    unresolved_conflicts: sources.arbitration.arbitrations.filter((arbitration) => arbitration.escalation_required || arbitration.arbitration_outcome === "DEFER").length,
    certification_blockers: sources.enforcement.reports.filter((report) => report.enforcement_outcome === "BLOCKING").length,
    average_conflict_lifecycle_duration: conflictLifecycleDuration(sources.ledger),
    replay_ref: `replay_arbitration_metrics_${hash(sources.ledger.replay_hash).slice(0, 16)}`,
    lineage_ref: `lineage_arbitration_metrics_${hash(sources.ledger.integrity_hash).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: metricHash(base) });
}

function trendHash(point: Omit<ArbitrationTrendPoint, "integrity_hash"> | ArbitrationTrendPoint): string {
  return hashWithoutIntegrity(point);
}

function trendPoint(category: ArbitrationTrendPoint["trend_category"], subject: string, metric_value: number, prior_value: number, evidence_refs: readonly string[]): ArbitrationTrendPoint {
  const delta = metric_value - prior_value;
  const base: Omit<ArbitrationTrendPoint, "integrity_hash"> = {
    trend_id: `trend_${category.toLowerCase()}_${hash(`${subject}:${metric_value}:${prior_value}`).slice(0, 18)}`,
    trend_category: category,
    subject,
    metric_value,
    prior_value,
    delta,
    direction: delta > 0 ? "INCREASE" : delta < 0 ? "DECREASE" : "UNCHANGED",
    evidence_refs,
    replay_ref: `replay_trend_${hash(subject).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: trendHash(base) });
}

export function analyzeArbitrationTrends(metrics: ArbitrationMetricCollection, prior?: ArbitrationMetricCollection): readonly ArbitrationTrendPoint[] {
  const priorMetric = prior ?? metrics;
  const hotspotMission = Object.entries(metrics.conflicts_by_mission).sort(([, a], [, b]) => b - a)[0] ?? ["none", 0];
  const hotspotCategory = Object.entries(metrics.conflict_categories).sort(([, a], [, b]) => b - a)[0] ?? ["Recommendation", 0];
  return Object.freeze([
    trendPoint("Conflict", "conflict_frequency", metrics.conflict_frequency, priorMetric.conflict_frequency, [metrics.source_ledger_ref]),
    trendPoint("Tradeoff", "tradeoff_explanations", metrics.tradeoff_counts.explanations ?? 0, priorMetric.tradeoff_counts.explanations ?? 0, [metrics.replay_ref]),
    trendPoint("Escalation", "governance_interventions", metrics.governance_interventions, priorMetric.governance_interventions, [metrics.replay_ref]),
    trendPoint("Hotspot", `mission:${hotspotMission[0]}`, hotspotMission[1], priorMetric.conflicts_by_mission[hotspotMission[0]] ?? hotspotMission[1], [metrics.source_ledger_ref]),
    trendPoint("Hotspot", `category:${hotspotCategory[0]}`, hotspotCategory[1], priorMetric.conflict_categories[hotspotCategory[0] as ArbitrationConflictCategory] ?? hotspotCategory[1], [metrics.source_ledger_ref]),
  ]);
}

function dashboardHash(dashboard: Omit<ArbitrationDashboard, "integrity_hash"> | ArbitrationDashboard): string {
  return hashWithoutIntegrity(dashboard);
}

function dashboard(name: ArbitrationDashboardName, metrics: Readonly<Record<string, number>>, evidence_refs: readonly string[], index: number): ArbitrationDashboard {
  const base: Omit<ArbitrationDashboard, "integrity_hash"> = {
    dashboard_id: `arbitration_dashboard_${String(index + 1).padStart(2, "0")}_${hash(name).slice(0, 16)}`,
    dashboard_name: name,
    metrics,
    evidence_refs: uniqueSorted(evidence_refs),
    replay_ref: `replay_dashboard_${hash(name).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

export function generateArbitrationDashboards(metrics: ArbitrationMetricCollection): readonly ArbitrationDashboard[] {
  const resolution = Object.freeze({
    resolved: metrics.outcomes_by_type.RESOLVED,
    escalated: metrics.outcomes_by_type.ESCALATE_TO_OPERATOR + metrics.outcomes_by_type.ESCALATE_TO_GOVERNANCE,
    deferred: metrics.outcomes_by_type.DEFER,
    rejected: metrics.outcomes_by_type.REJECT,
    split_decisions: metrics.outcomes_by_type.SPLIT_DECISION,
    certification_required: metrics.outcomes_by_type.REQUIRE_CERTIFICATION,
  });
  const definitions: ReadonlyArray<readonly [ArbitrationDashboardName, Readonly<Record<string, number>>]> = [
    ["Conflict Frequency", Object.freeze({ total_conflicts: metrics.conflict_frequency, conflict_density: metrics.conflict_density, ...metrics.conflicts_by_mission, ...metrics.conflicts_by_tenant })],
    ["Conflict Categories", metrics.conflict_categories],
    ["Resolution Rates", resolution],
    ["Escalation Rates", metrics.escalations_by_destination],
    ["Operator Interventions", Object.freeze({ manual_arbitration: metrics.operator_interventions, operator_approvals: metrics.outcomes_by_type.RESOLVED, operator_rejections: metrics.outcomes_by_type.REJECT, authority_escalations: metrics.operator_interventions })],
    ["Governance Interventions", Object.freeze({ policy_reviews: metrics.governance_interventions, governance_escalations: metrics.governance_interventions, constitutional_reviews: metrics.constitutional_reviews, governance_approvals: metrics.outcomes_by_type.RESOLVED })],
    ["Simulation Requests", Object.freeze({ requested_simulations: metrics.simulation_requests, completed_simulations: metrics.simulation_requests, unresolved_simulations: 0, replay_validations: metrics.replay_validations })],
    ["Certification Requests", Object.freeze({ certification_requests: metrics.certification_requests, certification_blockers: metrics.certification_blockers, pending_certifications: metrics.unresolved_conflicts, completed_certifications: Math.max(0, metrics.certification_requests - metrics.certification_blockers) })],
    ["Tradeoff Trends", metrics.tradeoff_counts],
    ["Conflict Hotspots", Object.freeze({ recurring_missions: Object.keys(metrics.conflicts_by_mission).length, recurring_resources: metrics.conflict_categories.Resource, policy_hotspots: metrics.conflict_categories.Governance, authority_hotspots: metrics.conflict_categories.Authority, certification_hotspots: metrics.conflict_categories.Certification })],
  ];
  return Object.freeze(definitions.map(([name, values], index) => dashboard(name, values, [metrics.source_ledger_ref, metrics.replay_ref], index)));
}

function reportHash(report: Omit<ArbitrationTrendReport, "integrity_hash"> | ArbitrationTrendReport): string {
  return hashWithoutIntegrity(report);
}

function generateReport(type: ArbitrationTrendReportType, metrics: ArbitrationMetricCollection): ArbitrationTrendReport {
  const base: Omit<ArbitrationTrendReport, "integrity_hash"> = {
    report_id: `arbitration_report_${hash(type).slice(0, 20)}`,
    report_type: type,
    reporting_period: "deterministic-ledger-window",
    metrics_summary: Object.freeze({
      total_conflicts: metrics.conflict_frequency,
      conflict_density: metrics.conflict_density,
      unresolved_conflicts: metrics.unresolved_conflicts,
      integrity_failures: metrics.integrity_failures,
    }),
    conflict_statistics: Object.freeze({ ...metrics.conflicts_by_mission, ...metrics.conflicts_by_tenant }),
    resolution_statistics: metrics.outcomes_by_type,
    escalation_statistics: metrics.escalations_by_destination,
    governance_statistics: Object.freeze({ governance_interventions: metrics.governance_interventions }),
    constitutional_statistics: Object.freeze({ constitutional_reviews: metrics.constitutional_reviews }),
    operator_statistics: Object.freeze({ operator_interventions: metrics.operator_interventions }),
    replay_statistics: Object.freeze({ replay_validations: metrics.replay_validations, replay_failures: metrics.replay_failures }),
    certification_statistics: Object.freeze({ certification_requests: metrics.certification_requests, certification_blockers: metrics.certification_blockers }),
    replay_ref: `replay_report_${hash(type).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function generateArbitrationTrendReports(metrics: ArbitrationMetricCollection): readonly ArbitrationTrendReport[] {
  return Object.freeze(ARBITRATION_TREND_REPORTS.map((type) => generateReport(type, metrics)));
}

function analyticsLedgerHash(record: Omit<ArbitrationAnalyticsLedgerRecord, "integrity_hash"> | ArbitrationAnalyticsLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

export function writeArbitrationAnalyticsLedger(metrics: ArbitrationMetricCollection, dashboards: readonly ArbitrationDashboard[], trendPoints: readonly ArbitrationTrendPoint[], reports: readonly ArbitrationTrendReport[]): readonly ArbitrationAnalyticsLedgerRecord[] {
  return Object.freeze(reports.map((report) => {
    const base: Omit<ArbitrationAnalyticsLedgerRecord, "integrity_hash"> = {
      ledger_id: `analytics_ledger_${report.report_id}`,
      collection_id: metrics.collection_id,
      report_id: report.report_id,
      dashboard_refs: dashboards.map((item) => item.dashboard_id),
      trend_refs: trendPoints.map((item) => item.trend_id),
      source_ledger_ref: metrics.source_ledger_ref,
      advisory_only: true,
      replay_ref: `${report.replay_ref}_ledger`,
      lineage_ref: `lineage_${report.report_id}`,
      ledger_timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: analyticsLedgerHash(base) });
  }));
}

function validationResult(failures: readonly ArbitrationAnalyticsFailureReason[]): ArbitrationAnalyticsValidation {
  const unique = Object.freeze([...new Set(failures)] as ArbitrationAnalyticsFailureReason[]);
  const has = (failure: ArbitrationAnalyticsFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      immutable_sources_present: !has("MISSING_OBSERVABILITY_INPUTS"),
      metric_schema_valid: !has("METRIC_SCHEMA_INVALID"),
      governance_context_present: !has("MISSING_GOVERNANCE_CONTEXT"),
      constitutional_context_present: !has("MISSING_CONSTITUTIONAL_CONTEXT"),
      tenant_isolated: !has("TENANT_ISOLATION_BREACH"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH") && !has("ANALYTICS_LEDGER_FAILED"),
      advisory_only: !has("OBSERVATIONAL_INFLUENCE_DETECTED"),
    }),
  });
}

function replayHash(result: Omit<ArbitrationObservabilityAnalyticsResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    metrics: result.metrics,
    trend_points: result.trend_points,
    dashboards: result.dashboards,
    trend_reports: result.trend_reports,
    analytics_ledger: result.analytics_ledger,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(failures: readonly ArbitrationAnalyticsFailureReason[]): ArbitrationObservabilityAnalyticsResult {
  const emptyMetricsBase: Omit<ArbitrationMetricCollection, "integrity_hash"> = {
    collection_id: "arbitration_metrics_unavailable",
    source_ledger_ref: "missing",
    source_replay_refs: Object.freeze([]),
    conflict_frequency: 0,
    conflict_density: 0,
    conflicts_by_mission: Object.freeze({}),
    conflicts_by_tenant: Object.freeze({}),
    conflicts_over_time: Object.freeze({}),
    conflict_categories: countBy([], CONFLICT_CATEGORIES),
    outcomes_by_type: countBy([], OUTCOMES),
    escalations_by_destination: countBy([], DESTINATIONS),
    escalation_reasons: Object.freeze({}),
    governance_interventions: 0,
    constitutional_reviews: 0,
    operator_interventions: 0,
    simulation_requests: 0,
    certification_requests: 0,
    tradeoff_counts: Object.freeze({}),
    replay_validations: 0,
    replay_failures: 0,
    integrity_failures: 0,
    unresolved_conflicts: 0,
    certification_blockers: 0,
    average_conflict_lifecycle_duration: 0,
    replay_ref: "replay_arbitration_metrics_unavailable",
    lineage_ref: "lineage_arbitration_metrics_unavailable",
  };
  const metrics = Object.freeze({ ...emptyMetricsBase, integrity_hash: metricHash(emptyMetricsBase) });
  const validation = validationResult(failures);
  const base: Omit<ArbitrationObservabilityAnalyticsResult, "integrity_hash" | "replay_hash"> = {
    analytics_status: "FAIL",
    fail_closed: true,
    metrics,
    trend_points: Object.freeze([]),
    dashboards: Object.freeze([]),
    trend_reports: Object.freeze([]),
    analytics_ledger: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function validateResult(result: Omit<ArbitrationObservabilityAnalyticsResult, "integrity_hash" | "replay_hash">, sources: Sources): ArbitrationAnalyticsValidation {
  const failures: ArbitrationAnalyticsFailureReason[] = [];
  if (sources.ledger.ledger_status !== "PASS" || sources.ledger.entries.length === 0) failures.push("MISSING_OBSERVABILITY_INPUTS");
  if (result.metrics.conflict_frequency < 0 || result.dashboards.length !== ARBITRATION_DASHBOARDS.length || result.trend_reports.length !== ARBITRATION_TREND_REPORTS.length) failures.push("METRIC_SCHEMA_INVALID");
  if (sources.ledger.entries.some((entry) => entry.governance_refs.length === 0) || result.metrics.governance_interventions < 0) failures.push("MISSING_GOVERNANCE_CONTEXT");
  if (sources.ledger.entries.some((entry) => entry.constitutional_refs.length === 0) || result.metrics.constitutional_reviews < 0) failures.push("MISSING_CONSTITUTIONAL_CONTEXT");
  if (Object.keys(result.metrics.conflicts_by_tenant).length > 1 || sources.enforcement.failures.includes("TENANT_ISOLATION_BREACH")) failures.push("TENANT_ISOLATION_BREACH");
  if (result.metrics.replay_failures > 0) failures.push("REPLAY_CORRUPTION");
  if (result.metrics.integrity_failures > 0 || metricHash(result.metrics) !== result.metrics.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (result.analytics_ledger.some((record) => !record.advisory_only)) failures.push("OBSERVATIONAL_INFLUENCE_DETECTED");
  if (result.analytics_ledger.some((record) => analyticsLedgerHash(record) !== record.integrity_hash)) failures.push("ANALYTICS_LEDGER_FAILED");
  return validationResult(failures);
}

export function runArbitrationObservabilityAnalytics(input: ArbitrationObservabilityAnalyticsInput = {}): ArbitrationObservabilityAnalyticsResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_OBSERVABILITY_ACCESS"]);
  const sources = resolveSources(input);
  const metrics = collectArbitrationMetrics(input);
  const trend_points = analyzeArbitrationTrends(metrics);
  const dashboards = generateArbitrationDashboards(metrics);
  const trend_reports = generateArbitrationTrendReports(metrics);
  const analytics_ledger = writeArbitrationAnalyticsLedger(metrics, dashboards, trend_points, trend_reports);
  const provisional: Omit<ArbitrationObservabilityAnalyticsResult, "integrity_hash" | "replay_hash"> = {
    analytics_status: "PASS",
    fail_closed: false,
    metrics,
    trend_points,
    dashboards,
    trend_reports,
    analytics_ledger,
    validation: validationResult([]),
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const validation = validateResult(provisional, sources);
  const base: Omit<ArbitrationObservabilityAnalyticsResult, "integrity_hash" | "replay_hash"> = {
    ...provisional,
    analytics_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    validation,
    failures: validation.failures,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayArbitrationObservabilityAnalytics(result: ArbitrationObservabilityAnalyticsResult): ArbitrationObservabilityReplay {
  const reconstructed = replayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && metricHash(result.metrics) === result.metrics.integrity_hash
    && result.trend_points.every((point) => trendHash(point) === point.integrity_hash)
    && result.dashboards.every((item) => dashboardHash(item) === item.integrity_hash)
    && result.trend_reports.every((report) => reportHash(report) === report.integrity_hash)
    && result.analytics_ledger.every((record) => analyticsLedgerHash(record) === record.integrity_hash);
  const failures: ArbitrationAnalyticsFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<ArbitrationObservabilityReplay, "integrity_hash"> = {
    replay_id: "replay_arbitration_observability_analytics",
    replay_valid,
    collection_ref: result.metrics.collection_id,
    dashboard_refs: result.dashboards.map((dashboardItem) => dashboardItem.dashboard_id),
    trend_report_refs: result.trend_reports.map((report) => report.report_id),
    analytics_ledger_refs: result.analytics_ledger.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getArbitrationObservabilityAnalyticsFoundation(): ArbitrationObservabilityAnalyticsFoundation {
  const result = runArbitrationObservabilityAnalytics();
  const replay = replayArbitrationObservabilityAnalytics(result);
  return Object.freeze({
    analytics_version: ANALYTICS_VERSION,
    dashboards: ARBITRATION_DASHBOARDS,
    trend_reports: ARBITRATION_TREND_REPORTS,
    result,
    replay,
  });
}

export const ArbitrationObservabilityAnalytics = Object.freeze({
  collect: collectArbitrationMetrics,
  trends: analyzeArbitrationTrends,
  dashboards: generateArbitrationDashboards,
  reports: generateArbitrationTrendReports,
  ledger: writeArbitrationAnalyticsLedger,
  run: runArbitrationObservabilityAnalytics,
  replay: replayArbitrationObservabilityAnalytics,
});
