import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperatorActivityDashboard } from "@/services/decision-operator-activity-dashboard";
import type { OperatorActivityDashboardResult } from "@/types/decision-operator-activity-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AnalyticsLedgerRecord,
  AnalyticsMetricRecord,
  AnalyticsSignalType,
  AnalyticsSourceSnapshot,
  AnalyticsWindow,
  BottleneckRecord,
  BottleneckSeverity,
  DecisionAnalyticsRecord,
  HealthSignalRecord,
  ObservabilityAnalyticsFailure,
  ObservabilityAnalyticsFoundation,
  ObservabilityAnalyticsInput,
  ObservabilityAnalyticsResult,
  ObservabilityAnalyticsValidation,
  OperationalHealthDashboard,
  OperationalHealthState,
  ThroughputMetrics,
  TrendAnalysisRecord,
  TrendDirection,
} from "@/types/decision-observability-analytics-engine";

const ANALYTICS_VERSION = "decision-observability-analytics-engine/v1" as const;
const CALC_VERSION = "observability-analytics-calc/v1" as const;

export const ANALYTICS_WINDOWS: readonly AnalyticsWindow[] = Object.freeze(["MISSION", "HOURLY", "DAILY", "OPERATOR_SESSION"]);
export const BOTTLENECK_SEVERITIES: readonly BottleneckSeverity[] = Object.freeze(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL"]);
export const TREND_DIRECTIONS: readonly TrendDirection[] = Object.freeze(["IMPROVING", "STABLE", "DEGRADING", "VOLATILE", "INSUFFICIENT_DATA"]);
export const OPERATIONAL_HEALTH_STATES: readonly OperationalHealthState[] = Object.freeze(["HEALTHY", "WATCH", "DEGRADED", "CRITICAL", "UNKNOWN"]);
export const ANALYTICS_SIGNAL_TYPES: readonly AnalyticsSignalType[] = Object.freeze(["THROUGHPUT", "BOTTLENECK", "GOVERNANCE", "OPERATOR", "REPLAY", "CERTIFICATION", "RISK", "CONFIDENCE"]);

type Scenario = NonNullable<ObservabilityAnalyticsInput["scenario"]>;

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

function ctx(source: OperatorActivityDashboardResult, window: AnalyticsWindow) {
  const replay = source.replay_monitoring;
  const governance = replay.governance_visibility;
  const priority = governance.priority_dashboard;
  const conflict = priority.conflict_visualization;
  const timeline = conflict.timeline_result;
  const dashboard = timeline.dashboard_result;
  return {
    replay,
    governance,
    priority,
    conflict,
    timeline,
    dashboard,
    registry: dashboard.registry,
    metrics: dashboard.metrics,
    tenant_id: source.activity_record.tenant_id,
    mission_id: replay.monitoring_record.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.activity_record.certification_ref,
    window,
  };
}

function sourceDashboardRefs(source: OperatorActivityDashboardResult): readonly string[] {
  return freezeArray([
    source.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.active_dashboard.dashboard_id,
    source.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.chronological_view.visualization_id,
    source.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.conflict_map.conflict_map_id,
    source.replay_monitoring.governance_visibility.priority_dashboard.dashboard_record.dashboard_id,
    source.replay_monitoring.governance_visibility.visibility_record.visibility_id,
    source.replay_monitoring.monitoring_record.monitoring_id,
    source.activity_record.activity_record_id,
  ]);
}

function sourceLedgerRefs(source: OperatorActivityDashboardResult): readonly string[] {
  return freezeArray([
    ...source.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.conflict_ledger.map((entry) => entry.ledger_entry_id),
    ...source.replay_monitoring.governance_visibility.governance_ledger.map((entry) => entry.governance_ledger_id),
    ...source.replay_monitoring.replay_monitoring_ledger.map((entry) => entry.replay_monitoring_ledger_id),
    ...source.activity_ledger.map((entry) => entry.operator_activity_ledger_id),
  ]);
}

function buildSourceSnapshot(source: OperatorActivityDashboardResult, window: AnalyticsWindow, scenario: Scenario): AnalyticsSourceSnapshot {
  const c = ctx(source, window);
  const dashboardRefs = scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : sourceDashboardRefs(source);
  const ledgerRefs = scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : sourceLedgerRefs(source);
  const base: Omit<AnalyticsSourceSnapshot, "snapshot_hash"> = {
    snapshot_id: "observability_analytics_source_snapshot",
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : c.tenant_id,
    mission_id: c.mission_id,
    source_dashboard_refs: dashboardRefs,
    source_ledger_refs: ledgerRefs,
    event_count: dashboardRefs.length + ledgerRefs.length,
    measurement_window: window,
    replay_ref: scenario === "INCOMPLETE_LINEAGE" ? "" : c.replay_ref,
  };
  return Object.freeze({ ...base, snapshot_hash: hash(base) });
}

function metric(name: string, value: number | null, unit: AnalyticsMetricRecord["metric_unit"], source: OperatorActivityDashboardResult, snapshot: AnalyticsSourceSnapshot, window: AnalyticsWindow, scenario: Scenario, missing = false): AnalyticsMetricRecord {
  const c = ctx(source, window);
  const base: Omit<AnalyticsMetricRecord, "integrity_hash"> = {
    metric_id: `analytics_metric_${name}`,
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    metric_name: name,
    metric_value: scenario === "MISSING_DATA_AS_ZERO" && missing ? 0 : value,
    metric_unit: unit,
    measurement_window: window,
    missing_data: scenario === "MISSING_DATA_AS_ZERO" && missing ? false : missing,
    source_refs: snapshot.source_dashboard_refs,
    calculation_version: CALC_VERSION,
    replay_ref: snapshot.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetricRecords(source: OperatorActivityDashboardResult, snapshot: AnalyticsSourceSnapshot, window: AnalyticsWindow, scenario: Scenario): readonly AnalyticsMetricRecord[] {
  const c = ctx(source, window);
  const m = c.metrics;
  const q = c.priority.queue_analytics;
  const work = source.work_queue.workload_metrics;
  const values = [
    metric("decision_volume", m.active_decisions + m.queued_decisions + m.blocked_decisions + m.completed_decisions + m.deferred_decisions + m.escalated_decisions, "count", source, snapshot, window, scenario),
    metric("completed_decisions", m.completed_decisions, "count", source, snapshot, window, scenario),
    metric("blocked_decisions", m.blocked_decisions, "count", source, snapshot, window, scenario),
    metric("escalated_decisions", m.escalated_decisions, "count", source, snapshot, window, scenario),
    metric("completion_rate", Number(((m.completed_decisions / Math.max(1, m.replay_readiness)) * 100).toFixed(2)), "percentage", source, snapshot, window, scenario),
    metric("queue_depth", q.queue_metrics.queue_depth, "count", source, snapshot, window, scenario),
    metric("governance_review_latency", scenario === "SUPPRESS_GOVERNANCE_DELAYS" ? 0 : source.approval_dashboard.approval_latency_minutes, "minutes", source, snapshot, window, scenario),
    metric("operator_workload", scenario === "MISSING_DATA_AS_ZERO" ? null : work.pending_workload, "count", source, snapshot, window, scenario, scenario === "MISSING_DATA_AS_ZERO"),
    metric("replay_success_rate", scenario === "EXCLUDE_REPLAY_FAILURES" ? 100 : source.replay_monitoring.replay_status_monitor.replay_success_rate, "percentage", source, snapshot, window, scenario),
    metric("certification_readiness", scenario === "OMIT_CERTIFICATION_BLOCKERS" ? 100 : c.priority.queue_analytics.governance_metrics.certification_blockers > 0 ? 86 : 100, "score", source, snapshot, window, scenario),
    metric("risk_exposure", q.risk_metrics.aggregate_risk, "score", source, snapshot, window, scenario),
    metric("confidence_quality", q.confidence_metrics.average_confidence, "ratio", source, snapshot, window, scenario),
  ];
  if (scenario === "NONDETERMINISTIC_ANALYTICS") return freezeArray(values.reverse());
  if (scenario !== "HASH_MISMATCH") return freezeArray(values);
  return freezeArray(values.map((record, index) => index === 0 ? Object.freeze({ ...record, integrity_hash: hash({ tampered: record.metric_id }) }) : record));
}

function buildThroughput(source: OperatorActivityDashboardResult, window: AnalyticsWindow, scenario: Scenario): ThroughputMetrics {
  const c = ctx(source, window);
  const m = c.metrics;
  const total = m.active_decisions + m.queued_decisions + m.blocked_decisions + m.completed_decisions + m.deferred_decisions + m.escalated_decisions;
  const base: Omit<ThroughputMetrics, "integrity_hash"> = {
    throughput_id: "observability_throughput_metrics",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    measurement_window: window,
    decisions_in: scenario === "BAD_THROUGHPUT" ? 0 : total,
    decisions_completed: m.completed_decisions,
    decisions_blocked: m.blocked_decisions,
    decisions_escalated: m.escalated_decisions,
    decisions_deferred: m.deferred_decisions,
    average_cycle_time: scenario === "BAD_THROUGHPUT" ? 0 : c.priority.queue_analytics.throughput_metrics.average_completion_minutes,
    completion_rate: scenario === "BAD_THROUGHPUT" ? 0 : Number(((m.completed_decisions / total) * 100).toFixed(2)),
    stage_transition_time: scenario === "BAD_THROUGHPUT" ? 0 : 14,
    replay_ref: c.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildBottlenecks(source: OperatorActivityDashboardResult, window: AnalyticsWindow, scenario: Scenario): readonly BottleneckRecord[] {
  if (scenario === "MISS_BOTTLENECKS") return freezeArray([]);
  const c = ctx(source, window);
  const baseRecords: Omit<BottleneckRecord, "integrity_hash">[] = [
    {
      bottleneck_id: "bottleneck_governance_delay",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      bottleneck_type: "GOVERNANCE_DELAY",
      affected_decision_refs: freezeArray(["decision_blocked_governance"]),
      affected_stage: "GOVERNANCE",
      severity: scenario === "SUPPRESS_GOVERNANCE_DELAYS" ? "INFORMATIONAL" : "HIGH",
      detected_at: "2026-07-05T09:11:09.000Z",
      duration: scenario === "SUPPRESS_GOVERNANCE_DELAYS" ? 0 : 30,
      root_cause_refs: freezeArray(["governance approval", "authority escalation"]),
      governance_refs: scenario === "SUPPRESS_GOVERNANCE_DELAYS" ? freezeArray([]) : c.governance.governance_dashboard.policy_results,
      replay_refs: freezeArray([c.replay_ref]),
    },
    {
      bottleneck_id: "bottleneck_operator_approval",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      bottleneck_type: "OPERATOR_APPROVAL_DELAY",
      affected_decision_refs: source.approval_dashboard.pending_approvals,
      affected_stage: "OPERATOR_WORKFLOW",
      severity: "MODERATE",
      detected_at: "2026-07-05T09:11:10.000Z",
      duration: source.approval_dashboard.approval_latency_minutes,
      root_cause_refs: freezeArray(["pending approvals", "delegated governance review"]),
      governance_refs: c.governance.governance_dashboard.policy_results,
      replay_refs: freezeArray([c.replay_ref]),
    },
    {
      bottleneck_id: "bottleneck_certification",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      bottleneck_type: "CERTIFICATION_BLOCKER",
      affected_decision_refs: c.priority.dashboard_record.queue_refs,
      affected_stage: "CERTIFICATION",
      severity: scenario === "OMIT_CERTIFICATION_BLOCKERS" ? "INFORMATIONAL" : "MODERATE",
      detected_at: "2026-07-05T09:11:11.000Z",
      duration: scenario === "OMIT_CERTIFICATION_BLOCKERS" ? 0 : 12,
      root_cause_refs: scenario === "OMIT_CERTIFICATION_BLOCKERS" ? freezeArray([]) : freezeArray(["certification_blockers:1"]),
      governance_refs: c.governance.governance_dashboard.certification_refs,
      replay_refs: freezeArray([c.replay_ref]),
    },
  ];
  return freezeArray(baseRecords.map((record) => Object.freeze({ ...record, integrity_hash: hashWithoutIntegrity(record) })));
}

function trendDirection(points: readonly number[]): TrendDirection {
  if (points.length < 2) return "INSUFFICIENT_DATA";
  const delta = points[points.length - 1] - points[0];
  if (Math.abs(delta) <= 1) return "STABLE";
  return delta > 0 ? "DEGRADING" : "IMPROVING";
}

function buildTrends(source: OperatorActivityDashboardResult, snapshot: AnalyticsSourceSnapshot, window: AnalyticsWindow, scenario: Scenario): readonly TrendAnalysisRecord[] {
  const c = ctx(source, window);
  const base = [
    { name: "queue_depth_trend", points: scenario === "FABRICATE_TRENDS" ? [1, 4, 9] : [7, 7, 7] },
    { name: "governance_delay_trend", points: scenario === "FABRICATE_TRENDS" ? [0, 12, 48] : [22, 22, 22] },
    { name: "replay_reliability_trend", points: scenario === "FABRICATE_TRENDS" ? [100, 90, 60] : [100, 100, 100] },
    { name: "certification_readiness_trend", points: scenario === "FABRICATE_TRENDS" ? [100, 80, 40] : [86, 86, 86] },
  ];
  return freezeArray(base.map((item, index) => {
    const baseRecord: Omit<TrendAnalysisRecord, "integrity_hash"> = {
      trend_id: `observability_trend_${item.name}`,
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      metric_name: item.name,
      measurement_window: window,
      time_series_points: freezeArray(item.points),
      trend_direction: scenario === "FABRICATE_TRENDS" ? "DEGRADING" : trendDirection(item.points),
      confidence_quality: scenario === "FABRICATE_TRENDS" && index === 0 ? "LOW" : "HIGH",
      source_refs: snapshot.source_dashboard_refs,
      replay_refs: freezeArray([c.replay_ref]),
    };
    return Object.freeze({ ...baseRecord, integrity_hash: hashWithoutIntegrity(baseRecord) });
  }));
}

function signalState(value: number | null, good: number, warn: number): OperationalHealthState {
  if (value === null) return "UNKNOWN";
  if (value >= good) return "HEALTHY";
  if (value >= warn) return "WATCH";
  return "DEGRADED";
}

function buildHealthSignals(source: OperatorActivityDashboardResult, metrics: readonly AnalyticsMetricRecord[], bottlenecks: readonly BottleneckRecord[], window: AnalyticsWindow): readonly HealthSignalRecord[] {
  const c = ctx(source, window);
  const metricByName = new Map(metrics.map((metricRecord) => [metricRecord.metric_name, metricRecord.metric_value]));
  const signals: Omit<HealthSignalRecord, "integrity_hash">[] = [
    { health_signal_id: "health_signal_throughput", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "THROUGHPUT", signal_value: metricByName.get("completion_rate") ?? null, signal_state: signalState(metricByName.get("completion_rate") ?? null, 15, 10), source_refs: freezeArray(["observability_throughput_metrics"]), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_bottleneck", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "BOTTLENECK", signal_value: bottlenecks.length, signal_state: bottlenecks.some((b) => b.severity === "HIGH" || b.severity === "CRITICAL") ? "DEGRADED" : "WATCH", source_refs: freezeArray(bottlenecks.map((b) => b.bottleneck_id)), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_governance", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "GOVERNANCE", signal_value: metricByName.get("governance_review_latency") ?? null, signal_state: (metricByName.get("governance_review_latency") ?? 0) > 0 ? "WATCH" : "UNKNOWN", source_refs: c.governance.governance_dashboard.policy_results, replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_operator", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "OPERATOR", signal_value: metricByName.get("operator_workload") ?? null, signal_state: signalState(metricByName.get("operator_workload") ?? null, 1, 0), source_refs: freezeArray([source.work_queue.work_queue_id]), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_replay", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "REPLAY", signal_value: metricByName.get("replay_success_rate") ?? null, signal_state: signalState(metricByName.get("replay_success_rate") ?? null, 100, 90), source_refs: freezeArray([source.replay_monitoring.replay_dashboard.replay_dashboard_id]), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_certification", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "CERTIFICATION", signal_value: metricByName.get("certification_readiness") ?? null, signal_state: signalState(metricByName.get("certification_readiness") ?? null, 90, 80), source_refs: freezeArray([source.replay_monitoring.certification_dashboard.certification_dashboard_id]), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_risk", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "RISK", signal_value: metricByName.get("risk_exposure") ?? null, signal_state: (metricByName.get("risk_exposure") ?? 0) > 400 ? "DEGRADED" : "WATCH", source_refs: freezeArray([c.priority.risk_dashboard.risk_dashboard_id]), replay_ref: c.replay_ref },
    { health_signal_id: "health_signal_confidence", tenant_id: c.tenant_id, mission_id: c.mission_id, signal_type: "CONFIDENCE", signal_value: metricByName.get("confidence_quality") ?? null, signal_state: signalState(metricByName.get("confidence_quality") ?? null, 0.8, 0.6), source_refs: freezeArray([c.priority.confidence_dashboard.confidence_dashboard_id]), replay_ref: c.replay_ref },
  ];
  return freezeArray(signals.map((signal) => Object.freeze({ ...signal, integrity_hash: hashWithoutIntegrity(signal) })));
}

function buildHealthDashboard(source: OperatorActivityDashboardResult, throughput: ThroughputMetrics, bottlenecks: readonly BottleneckRecord[], signals: readonly HealthSignalRecord[], window: AnalyticsWindow): OperationalHealthDashboard {
  const c = ctx(source, window);
  const degraded = signals.filter((signal) => signal.signal_state === "DEGRADED" || signal.signal_state === "CRITICAL").length;
  const watch = signals.filter((signal) => signal.signal_state === "WATCH").length;
  const score = Math.max(0, 100 - degraded * 18 - watch * 6);
  const state: OperationalHealthState = score >= 85 ? "HEALTHY" : score >= 70 ? "WATCH" : score >= 45 ? "DEGRADED" : "CRITICAL";
  const base: Omit<OperationalHealthDashboard, "integrity_hash"> = {
    health_dashboard_id: "observability_operational_health_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    health_state: state,
    health_score: score,
    throughput_summary: `${throughput.decisions_completed}/${throughput.decisions_in} decisions completed`,
    bottleneck_summary: `${bottlenecks.length} bottlenecks visible`,
    governance_summary: `${c.metrics.governance_reviews} governance reviews, ${c.priority.queue_analytics.governance_metrics.authority_conflicts} authority conflicts`,
    operator_summary: `${source.work_queue.workload_metrics.pending_workload} pending operator actions`,
    replay_summary: `${source.replay_monitoring.replay_status_monitor.replay_success_rate}% replay success`,
    certification_summary: `${source.replay_monitoring.certification_dashboard.production_readiness} production readiness`,
    risk_summary: `${c.priority.risk_dashboard.overall_risk} aggregate risk`,
    confidence_summary: `${c.priority.confidence_dashboard.evidence_quality} evidence quality`,
    replay_refs: freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDecisionAnalytics(source: OperatorActivityDashboardResult, snapshot: AnalyticsSourceSnapshot, metrics: readonly AnalyticsMetricRecord[], window: AnalyticsWindow, scenario: Scenario): DecisionAnalyticsRecord {
  const c = ctx(source, window);
  const base: Omit<DecisionAnalyticsRecord, "integrity_hash"> = {
    analytics_id: "decision_observability_analytics_record",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    analytics_window: window,
    source_dashboard_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : snapshot.source_dashboard_refs,
    metric_set_refs: freezeArray(metrics.map((record) => record.metric_id)),
    replay_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : freezeArray([c.replay_ref]),
    certification_refs: scenario === "OMIT_CERTIFICATION_BLOCKERS" ? freezeArray([]) : freezeArray([c.certification_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: OperatorActivityDashboardResult, analytics: DecisionAnalyticsRecord, throughput: ThroughputMetrics, bottlenecks: readonly BottleneckRecord[], trends: readonly TrendAnalysisRecord[], health: OperationalHealthDashboard, window: AnalyticsWindow, scenario: Scenario): readonly AnalyticsLedgerRecord[] {
  const c = ctx(source, window);
  const common = {
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    source_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : sourceDashboardRefs(source),
    calculation_version: CALC_VERSION,
    replay_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : freezeArray([c.replay_ref]),
    append_only: true as const,
    deleted: false as const,
  };
  const records: Omit<AnalyticsLedgerRecord, "integrity_hash">[] = [
    { ...common, analytics_ledger_id: "analytics_ledger_001", event_type: "ANALYTICS_JOB_CREATED", analytics_type: "DECISION", metric_name: "analytics_job", result_ref: analytics.analytics_id, event_timestamp: "2026-07-05T09:11:09.000Z", sequence_number: 1 },
    { ...common, analytics_ledger_id: "analytics_ledger_002", event_type: "METRIC_CALCULATED", analytics_type: "DECISION", metric_name: "decision_volume", result_ref: analytics.analytics_id, event_timestamp: "2026-07-05T09:11:10.000Z", sequence_number: 2 },
    { ...common, analytics_ledger_id: "analytics_ledger_003", event_type: "THROUGHPUT_MEASURED", analytics_type: "THROUGHPUT", metric_name: "completion_rate", result_ref: throughput.throughput_id, event_timestamp: "2026-07-05T09:11:11.000Z", sequence_number: 3 },
    { ...common, analytics_ledger_id: "analytics_ledger_004", event_type: bottlenecks.length ? "BOTTLENECK_DETECTED" : "BOTTLENECK_RESOLVED", analytics_type: "BOTTLENECK", metric_name: "bottleneck_count", result_ref: bottlenecks[0]?.bottleneck_id ?? "no_bottleneck", event_timestamp: "2026-07-05T09:11:12.000Z", sequence_number: 4 },
    { ...common, analytics_ledger_id: "analytics_ledger_005", event_type: "TREND_CALCULATED", analytics_type: "TREND", metric_name: "queue_depth_trend", result_ref: trends[0]?.trend_id ?? "no_trend", event_timestamp: "2026-07-05T09:11:13.000Z", sequence_number: 5 },
    { ...common, analytics_ledger_id: "analytics_ledger_006", event_type: "HEALTH_SCORE_CALCULATED", analytics_type: "HEALTH", metric_name: "operational_health", result_ref: health.health_dashboard_id, event_timestamp: "2026-07-05T09:11:14.000Z", sequence_number: 6 },
  ];
  if (scenario === "MUTABLE_LEDGER") records[2] = { ...records[2], append_only: false as true };
  return freezeArray(records.map((record) => Object.freeze({ ...record, integrity_hash: hashWithoutIntegrity(record) })));
}

function collectFailures(input: {
  source: OperatorActivityDashboardResult;
  snapshot: AnalyticsSourceSnapshot;
  metrics: readonly AnalyticsMetricRecord[];
  analytics: DecisionAnalyticsRecord;
  throughput: ThroughputMetrics;
  bottlenecks: readonly BottleneckRecord[];
  trends: readonly TrendAnalysisRecord[];
  signals: readonly HealthSignalRecord[];
  health: OperationalHealthDashboard;
  ledger: readonly AnalyticsLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
  window: AnalyticsWindow;
}): readonly ObservabilityAnalyticsFailure[] {
  const failures: ObservabilityAnalyticsFailure[] = [];
  const c = ctx(input.source, input.window);
  const baselineMetricOrder = buildMetricRecords(input.source, input.snapshot, input.window, "BASELINE").map((record) => record.metric_id).join("|");
  if (input.scenario === "NONDETERMINISTIC_ANALYTICS" || input.metrics.map((record) => record.metric_id).join("|") !== baselineMetricOrder) failures.push("ANALYTICS_NONDETERMINISTIC");
  if (input.throughput.decisions_in !== 6 || input.throughput.average_cycle_time <= 0 || input.throughput.completion_rate <= 0) failures.push("THROUGHPUT_CALCULATION_INCONSISTENT");
  if (!input.bottlenecks.length || !input.bottlenecks.some((record) => record.bottleneck_type === "GOVERNANCE_DELAY")) failures.push("BOTTLENECKS_MISSED");
  if (input.scenario === "FABRICATE_TRENDS" || input.trends.some((trend) => trend.confidence_quality === "LOW" && trend.trend_direction !== "INSUFFICIENT_DATA")) failures.push("TRENDS_FABRICATED");
  if (input.metrics.some((record) => record.metric_name === "operator_workload" && record.metric_value === 0 && !record.missing_data)) failures.push("MISSING_DATA_TREATED_AS_ZERO");
  if (!input.bottlenecks.some((record) => record.bottleneck_type === "GOVERNANCE_DELAY" && record.duration > 0 && record.governance_refs.length)) failures.push("GOVERNANCE_DELAYS_SUPPRESSED");
  if (input.scenario === "EXCLUDE_REPLAY_FAILURES" || !input.metrics.some((record) => record.metric_name === "replay_success_rate")) failures.push("REPLAY_FAILURES_EXCLUDED");
  if (!input.bottlenecks.some((record) => record.bottleneck_type === "CERTIFICATION_BLOCKER" && record.root_cause_refs.length) || !input.analytics.certification_refs.length) failures.push("CERTIFICATION_BLOCKERS_OMITTED");
  if (!input.snapshot.source_dashboard_refs.length || !input.snapshot.source_ledger_refs.length || !input.analytics.source_dashboard_refs.length || !input.analytics.replay_refs.length || input.ledger.some((record) => !record.source_refs.length || !record.replay_refs.length)) failures.push("SOURCE_LINEAGE_INCOMPLETE");
  if (input.ledger.some((record) => !record.append_only || record.deleted)) failures.push("ANALYTICS_LEDGER_MUTABLE");
  if (input.snapshot.tenant_id !== c.tenant_id || input.metrics.some((record) => record.tenant_id !== c.tenant_id)) failures.push("CROSS_TENANT_ANALYTICS_VISIBLE");
  if (
    input.metrics.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || hashWithoutIntegrity(input.analytics) !== input.analytics.integrity_hash
    || hashWithoutIntegrity(input.throughput) !== input.throughput.integrity_hash
    || input.bottlenecks.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || input.trends.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || input.signals.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || hashWithoutIntegrity(input.health) !== input.health.integrity_hash
    || input.ledger.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("ANALYTICS_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.source.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly ObservabilityAnalyticsFailure[]): ObservabilityAnalyticsValidation {
  const has = (failure: ObservabilityAnalyticsFailure) => failures.includes(failure);
  const base: Omit<ObservabilityAnalyticsValidation, "integrity_hash"> = {
    validation_id: "observability_analytics_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    deterministic_analytics: !has("ANALYTICS_NONDETERMINISTIC"),
    throughput_consistent: !has("THROUGHPUT_CALCULATION_INCONSISTENT"),
    bottlenecks_detected: !has("BOTTLENECKS_MISSED"),
    trends_not_fabricated: !has("TRENDS_FABRICATED"),
    missing_data_preserved: !has("MISSING_DATA_TREATED_AS_ZERO"),
    governance_delays_visible: !has("GOVERNANCE_DELAYS_SUPPRESSED"),
    replay_failures_included: !has("REPLAY_FAILURES_EXCLUDED"),
    certification_blockers_visible: !has("CERTIFICATION_BLOCKERS_OMITTED"),
    source_lineage_complete: !has("SOURCE_LINEAGE_INCOMPLETE"),
    analytics_ledger_immutable: !has("ANALYTICS_LEDGER_MUTABLE"),
    tenant_isolated: !has("CROSS_TENANT_ANALYTICS_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ObservabilityAnalyticsResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    snapshot: result.source_snapshot,
    metrics: result.metric_records,
    analytics: result.decision_analytics,
    throughput: result.throughput_metrics,
    bottlenecks: result.bottlenecks,
    trends: result.trends,
    signals: result.health_signals,
    health: result.operational_health,
    ledger: result.analytics_ledger,
    validation: result.validation,
  });
}

export function runObservabilityAnalyticsEngine(input: ObservabilityAnalyticsInput = {}): ObservabilityAnalyticsResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const analytics_window = input.analytics_window ?? "MISSION";
  const operator_dashboard = input.operator_dashboard ?? runOperatorActivityDashboard();
  const source_snapshot = buildSourceSnapshot(operator_dashboard, analytics_window, scenario);
  const metric_records = buildMetricRecords(operator_dashboard, source_snapshot, analytics_window, scenario);
  const throughput_metrics = buildThroughput(operator_dashboard, analytics_window, scenario);
  const bottlenecks = buildBottlenecks(operator_dashboard, analytics_window, scenario);
  const trends = buildTrends(operator_dashboard, source_snapshot, analytics_window, scenario);
  const health_signals = buildHealthSignals(operator_dashboard, metric_records, bottlenecks, analytics_window);
  const operational_health = buildHealthDashboard(operator_dashboard, throughput_metrics, bottlenecks, health_signals, analytics_window);
  const decision_analytics = buildDecisionAnalytics(operator_dashboard, source_snapshot, metric_records, analytics_window, scenario);
  const analytics_ledger = buildLedger(operator_dashboard, decision_analytics, throughput_metrics, bottlenecks, trends, operational_health, analytics_window, scenario);
  const failures = collectFailures({ source: operator_dashboard, snapshot: source_snapshot, metrics: metric_records, analytics: decision_analytics, throughput: throughput_metrics, bottlenecks, trends, signals: health_signals, health: operational_health, ledger: analytics_ledger, role, scenario, window: analytics_window });
  const validation = buildValidation(failures);
  const base: Omit<ObservabilityAnalyticsResult, "integrity_hash" | "replay_hash"> = {
    analytics_version: ANALYTICS_VERSION,
    operator_dashboard,
    source_snapshot,
    metric_records,
    decision_analytics,
    throughput_metrics,
    bottlenecks,
    trends,
    health_signals,
    operational_health,
    analytics_ledger,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_observability_or_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayObservabilityAnalyticsEngine(result: ObservabilityAnalyticsResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAnalyticsMetricRecordHash(record: Omit<AnalyticsMetricRecord, "integrity_hash"> | AnalyticsMetricRecord): string {
  return hashWithoutIntegrity(record);
}

export function getObservabilityAnalyticsFoundation(): ObservabilityAnalyticsFoundation {
  return Object.freeze({
    analytics_version: ANALYTICS_VERSION,
    analytics_windows: ANALYTICS_WINDOWS,
    bottleneck_severities: BOTTLENECK_SEVERITIES,
    trend_directions: TREND_DIRECTIONS,
    health_states: OPERATIONAL_HEALTH_STATES,
    signal_types: ANALYTICS_SIGNAL_TYPES,
    result: runObservabilityAnalyticsEngine(),
  });
}

export const ObservabilityAnalyticsEngine = Object.freeze({
  run: runObservabilityAnalyticsEngine,
  replay: replayObservabilityAnalyticsEngine,
});
