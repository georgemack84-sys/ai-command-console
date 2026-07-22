import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConflictDependencyVisualization } from "@/services/decision-conflict-dependency-visualization";
import type { ConflictDependencyVisualizationResult } from "@/types/decision-conflict-dependency-visualization";
import type { DecisionStateRecord } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ConfidenceCategory,
  ConfidenceDashboard,
  PriorityDashboardRecord,
  PriorityQueueItem,
  PriorityQueueRecord,
  PriorityQueueType,
  PriorityRiskDashboardFailure,
  PriorityRiskDashboardFoundation,
  PriorityRiskDashboardInput,
  PriorityRiskDashboardResult,
  PriorityRiskDashboardValidation,
  QueueAnalytics,
  RiskCategory,
  RiskDashboardRecord,
  UrgencyLevel,
  UrgencyVisualization,
} from "@/types/decision-priority-risk-dashboard";

const DASHBOARD_VERSION = "decision-priority-risk-dashboard/v1" as const;

export const PRIORITY_QUEUE_TYPES: readonly PriorityQueueType[] = Object.freeze(["MISSION_CRITICAL", "CRITICAL", "HIGH_PRIORITY", "MEDIUM_PRIORITY", "LOW_PRIORITY", "DEFERRED", "BLOCKED", "ESCALATED"]);
export const RISK_CATEGORIES: readonly RiskCategory[] = Object.freeze(["CRITICAL", "HIGH", "ELEVATED", "MODERATE", "LOW", "INFORMATIONAL"]);
export const CONFIDENCE_CATEGORIES: readonly ConfidenceCategory[] = Object.freeze(["VERY_HIGH", "HIGH", "MODERATE", "LOW", "VERY_LOW", "UNKNOWN"]);
export const URGENCY_LEVELS: readonly UrgencyLevel[] = Object.freeze(["IMMEDIATE", "CRITICAL", "HIGH", "NORMAL", "LOW", "DEFERRED"]);

type Scenario = NonNullable<PriorityRiskDashboardInput["scenario"]>;

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

function ctx(source: ConflictDependencyVisualizationResult) {
  const timeline = source.timeline_result;
  const dashboard = timeline.dashboard_result;
  const certification = dashboard.observability_result.certification_result;
  return {
    dashboard,
    certification,
    registry: dashboard.registry,
    tenant_id: certification.certification_record.tenant_id,
    mission_id: certification.certification_record.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: certification.certification_record.certification_id,
  };
}

function riskScore(record: DecisionStateRecord): number {
  if (record.risk_level === "CRITICAL") return 95;
  if (record.risk_level === "HIGH") return 82;
  if (record.risk_level === "MODERATE") return 55;
  return 25;
}

function missionPriority(record: DecisionStateRecord): number {
  if (record.priority === "CRITICAL") return 100;
  if (record.priority === "HIGH") return 82;
  if (record.priority === "MEDIUM") return 58;
  if (record.priority === "LOW") return 30;
  return 10;
}

function governanceWeight(record: DecisionStateRecord): number {
  if (record.governance_state === "RESTRICTED") return 95;
  if (record.governance_state === "REVIEW_REQUIRED") return 84;
  if (record.governance_state === "BLOCKED") return 100;
  return 45;
}

function constitutionalWeight(record: DecisionStateRecord): number {
  if (record.constitutional_state === "VIOLATION") return 100;
  if (record.constitutional_state === "REVIEW_REQUIRED") return 85;
  return 40;
}

function urgencyScore(record: DecisionStateRecord): number {
  if (record.lifecycle_state === "ESCALATED") return 98;
  if (record.lifecycle_state === "BLOCKED") return 88;
  if (record.priority === "CRITICAL") return 92;
  if (record.lifecycle_state === "DEFERRED") return 42;
  return 55;
}

function queueType(record: DecisionStateRecord): PriorityQueueType {
  if (record.lifecycle_state === "BLOCKED") return "BLOCKED";
  if (record.lifecycle_state === "ESCALATED") return "ESCALATED";
  if (record.lifecycle_state === "DEFERRED") return "DEFERRED";
  if (record.priority === "CRITICAL" && record.risk_level === "CRITICAL") return "MISSION_CRITICAL";
  if (record.priority === "CRITICAL") return "CRITICAL";
  if (record.priority === "HIGH") return "HIGH_PRIORITY";
  if (record.priority === "MEDIUM") return "MEDIUM_PRIORITY";
  return "LOW_PRIORITY";
}

function priorityScore(record: DecisionStateRecord): number {
  const dependencyReadiness = record.lifecycle_state === "BLOCKED" || record.lifecycle_state === "DEFERRED" ? 70 : 95;
  return Number((missionPriority(record) * 0.22 + governanceWeight(record) * 0.16 + constitutionalWeight(record) * 0.14 + riskScore(record) * 0.16 + record.confidence_score * 100 * 0.12 + urgencyScore(record) * 0.12 + dependencyReadiness * 0.08).toFixed(2));
}

function queueItem(source: ConflictDependencyVisualizationResult, record: DecisionStateRecord, scenario: Scenario): PriorityQueueItem {
  const c = ctx(source);
  const tenant = scenario === "CROSS_TENANT" && record.decision_id === "decision_active_priority" ? "tenant_other" : record.tenant_id;
  const replay = scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref;
  const confidence = scenario === "BAD_CONFIDENCE" && record.decision_id === "decision_active_priority" ? 0.11 : record.confidence_score;
  const urgency = scenario === "BAD_URGENCY" && record.decision_id === "decision_escalated_authority" ? 10 : urgencyScore(record);
  const base: Omit<PriorityQueueItem, "integrity_hash"> = {
    queue_item_id: `priority_queue_item_${record.decision_id}`,
    decision_id: record.decision_id,
    priority_score: scenario === "ORDER_MISMATCH" && record.decision_id === "decision_active_priority" ? 1 : priorityScore(record),
    mission_priority: missionPriority(record),
    governance_weight: scenario === "HIDE_GOVERNANCE_ADJUSTMENTS" ? 0 : governanceWeight(record),
    constitutional_weight: constitutionalWeight(record),
    risk_score: scenario === "BAD_RISK" && record.decision_id === "decision_escalated_authority" ? 5 : riskScore(record),
    confidence_score: confidence,
    urgency_score: urgency,
    lifecycle_state: record.lifecycle_state,
    priority_band: record.priority,
    queue_type: queueType(record),
    queue_position: 0,
    tenant_id: tenant,
    mission_id: c.mission_id,
    replay_ref: replay,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && record.decision_id === "decision_active_priority") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.queue_item_id }) });
  return built;
}

function sortItems(items: readonly PriorityQueueItem[], scenario: Scenario): readonly PriorityQueueItem[] {
  if (scenario === "NONDETERMINISTIC_ORDER") return freezeArray([...items].reverse());
  return freezeArray([...items].sort((a, b) => b.mission_priority - a.mission_priority || b.governance_weight - a.governance_weight || b.constitutional_weight - a.constitutional_weight || b.risk_score - a.risk_score || b.confidence_score - a.confidence_score || b.urgency_score - a.urgency_score || a.lifecycle_state.localeCompare(b.lifecycle_state) || a.decision_id.localeCompare(b.decision_id)).map((item, index) => Object.freeze({ ...item, queue_position: index + 1, integrity_hash: hashWithoutIntegrity({ ...item, queue_position: index + 1 }) })));
}

function buildQueueItems(source: ConflictDependencyVisualizationResult, scenario: Scenario): readonly PriorityQueueItem[] {
  const sorted = sortItems(ctx(source).registry.map((record) => queueItem(source, record, scenario)), scenario);
  if (scenario !== "HASH_MISMATCH") return sorted;
  return freezeArray(sorted.map((item, index) => index === 0 ? Object.freeze({ ...item, integrity_hash: hash({ tampered: item.queue_item_id }) }) : item));
}

function buildQueueRecord(source: ConflictDependencyVisualizationResult, items: readonly PriorityQueueItem[], type: PriorityQueueType, scenario: Scenario): PriorityQueueRecord {
  const c = ctx(source);
  const missionCritical = items.filter((item) => item.risk_score >= 90 || item.urgency_score >= 95 || item.lifecycle_state === "ESCALATED");
  const scoped = scenario === "OMIT_MISSION_CRITICAL" && type === "MISSION_CRITICAL"
    ? []
    : type === "MISSION_CRITICAL"
      ? missionCritical
      : items.filter((item) => item.queue_type === type);
  const base: Omit<PriorityQueueRecord, "integrity_hash"> = {
    queue_record_id: `priority_queue_${type.toLowerCase()}`,
    queue_type: type,
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_refs: freezeArray(scoped.map((item) => item.decision_id)),
    queue_positions: freezeArray(scoped.map((item) => item.queue_position)),
    priority_scores: freezeArray(scoped.map((item) => item.priority_score)),
    governance_weight: scoped.length ? Math.max(...scoped.map((item) => item.governance_weight)) : 0,
    risk_score: scoped.length ? Math.max(...scoped.map((item) => item.risk_score)) : 0,
    confidence_score: scoped.length ? Number((scoped.reduce((sum, item) => sum + item.confidence_score, 0) / scoped.length).toFixed(2)) : 0,
    urgency_score: scoped.length ? Math.max(...scoped.map((item) => item.urgency_score)) : 0,
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function reproducedPriorityScore(item: PriorityQueueItem): number {
  const dependencyReadiness = item.lifecycle_state === "BLOCKED" || item.lifecycle_state === "DEFERRED" ? 70 : 95;
  return Number((item.mission_priority * 0.22 + item.governance_weight * 0.16 + item.constitutional_weight * 0.14 + item.risk_score * 0.16 + item.confidence_score * 100 * 0.12 + item.urgency_score * 0.12 + dependencyReadiness * 0.08).toFixed(2));
}

function buildRiskDashboard(source: ConflictDependencyVisualizationResult, items: readonly PriorityQueueItem[], scenario: Scenario): RiskDashboardRecord {
  const c = ctx(source);
  const distribution = {
    CRITICAL: items.filter((item) => item.risk_score >= 90).length,
    HIGH: items.filter((item) => item.risk_score >= 75 && item.risk_score < 90).length,
    ELEVATED: items.filter((item) => item.risk_score >= 60 && item.risk_score < 75).length,
    MODERATE: items.filter((item) => item.risk_score >= 45 && item.risk_score < 60).length,
    LOW: items.filter((item) => item.risk_score >= 20 && item.risk_score < 45).length,
    INFORMATIONAL: items.filter((item) => item.risk_score < 20).length,
  } satisfies Record<RiskCategory, number>;
  const base: Omit<RiskDashboardRecord, "integrity_hash"> = {
    risk_dashboard_id: "priority_risk_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_refs: freezeArray(items.map((item) => item.decision_id)),
    overall_risk: scenario === "BAD_RISK" ? "LOW" : "CRITICAL",
    risk_distribution: Object.freeze(distribution),
    governance_risk: scenario === "HIDE_GOVERNANCE_ADJUSTMENTS" ? "LOW" : "CRITICAL",
    constitutional_risk: "LOW",
    operational_risk: "HIGH",
    replay_risk: "LOW",
    certification_risk: scenario === "HIDE_CERTIFICATION_BLOCKERS" ? "LOW" : "MODERATE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceCategory(score: number): ConfidenceCategory {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.65) return "MODERATE";
  if (score >= 0.45) return "LOW";
  return "VERY_LOW";
}

function buildConfidenceDashboard(source: ConflictDependencyVisualizationResult, items: readonly PriorityQueueItem[], scenario: Scenario): ConfidenceDashboard {
  const c = ctx(source);
  const distribution = Object.fromEntries(CONFIDENCE_CATEGORIES.map((cat) => [cat, 0])) as Record<ConfidenceCategory, number>;
  items.forEach((item) => { distribution[confidenceCategory(item.confidence_score)] += 1; });
  const base: Omit<ConfidenceDashboard, "integrity_hash"> = {
    confidence_dashboard_id: "priority_confidence_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    confidence_distribution: Object.freeze(distribution),
    evidence_quality: scenario === "BAD_CONFIDENCE" ? "MISSING" : "COMPLETE",
    uncertainty_distribution: Object.freeze({ VERY_HIGH: 0, HIGH: 1, MODERATE: 2, LOW: 1, VERY_LOW: 0, UNKNOWN: 0 }),
    confidence_lineage: scenario === "BAD_CONFIDENCE" ? freezeArray([]) : freezeArray(source.conflicts.flatMap((conflict) => conflict.evidence_refs)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function urgencyLevel(score: number): UrgencyLevel {
  if (score >= 95) return "IMMEDIATE";
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "NORMAL";
  if (score >= 30) return "LOW";
  return "DEFERRED";
}

function buildUrgency(source: ConflictDependencyVisualizationResult, items: readonly PriorityQueueItem[], scenario: Scenario): UrgencyVisualization {
  const c = ctx(source);
  const levels = Object.fromEntries(URGENCY_LEVELS.map((level) => [level, [] as string[]])) as Record<UrgencyLevel, string[]>;
  items.forEach((item) => levels[urgencyLevel(item.urgency_score)].push(item.decision_id));
  const base: Omit<UrgencyVisualization, "integrity_hash"> = {
    urgency_dashboard_id: "priority_urgency_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    urgency_levels: Object.freeze(Object.fromEntries(URGENCY_LEVELS.map((level) => [level, freezeArray(levels[level])])) as Record<UrgencyLevel, readonly string[]>),
    deadline_refs: scenario === "BAD_URGENCY" ? freezeArray([]) : freezeArray(["deadline_operator_review", "deadline_governance_escalation", "deadline_certification_review"]),
    escalation_timers: scenario === "BAD_URGENCY" ? freezeArray([]) : freezeArray(["timer_authority_escalation_15m", "timer_governance_review_30m"]),
    aging_indicators: freezeArray(items.map((item) => `aging_${item.decision_id}_${item.queue_position}`)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAnalytics(source: ConflictDependencyVisualizationResult, items: readonly PriorityQueueItem[], scenario: Scenario): QueueAnalytics {
  const c = ctx(source);
  const highRisk = items.filter((item) => item.risk_score >= 75).length;
  const lowConfidence = items.filter((item) => item.confidence_score < 0.65).length;
  const base: Omit<QueueAnalytics, "integrity_hash"> = {
    analytics_id: "priority_queue_analytics",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    throughput_metrics: Object.freeze({ completed: c.dashboard.metrics.completed_decisions, decisions_per_hour: 3, average_completion_minutes: scenario === "BAD_ANALYTICS" ? 0 : 42 }),
    queue_metrics: Object.freeze({ queue_depth: scenario === "BAD_ANALYTICS" ? 0 : items.length, backlog: c.dashboard.metrics.operator_workload, bottlenecks: freezeArray(["governance approval", "authority escalation"]), congestion: "MODERATE" }),
    risk_metrics: Object.freeze({ aggregate_risk: items.reduce((sum, item) => sum + item.risk_score, 0), high_risk_concentration: highRisk, risk_trend: "STABLE", unresolved_risk: source.metrics.critical_conflicts }),
    confidence_metrics: Object.freeze({ average_confidence: Number((items.reduce((sum, item) => sum + item.confidence_score, 0) / items.length).toFixed(2)), low_confidence_percentage: Number(((lowConfidence / items.length) * 100).toFixed(2)), confidence_degradation: scenario === "BAD_CONFIDENCE" ? 1 : 0, evidence_quality_trend: scenario === "BAD_CONFIDENCE" ? "DEGRADED" : "STABLE" }),
    governance_metrics: Object.freeze({ governance_escalations: source.metrics.governance_overlays, constitutional_reviews: 1, authority_conflicts: source.conflicts.filter((conflict) => conflict.conflict_type === "AUTHORITY_CONFLICT").length, certification_blockers: scenario === "HIDE_CERTIFICATION_BLOCKERS" ? 0 : 1 }),
    replay_metrics: Object.freeze({ replay_refs: items.filter((item) => item.replay_ref).length, replay_ready_percentage: scenario === "MISSING_REPLAY_REFS" ? 0 : 100, replay_failures: 0 }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboardRecord(source: ConflictDependencyVisualizationResult, queues: readonly PriorityQueueRecord[], risk: RiskDashboardRecord, confidence: ConfidenceDashboard, urgency: UrgencyVisualization, analytics: QueueAnalytics, scenario: Scenario): PriorityDashboardRecord {
  const c = ctx(source);
  const base: Omit<PriorityDashboardRecord, "integrity_hash"> = {
    dashboard_id: "priority_queue_risk_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    queue_refs: freezeArray(queues.map((queue) => queue.queue_record_id)),
    risk_dashboard_ref: risk.risk_dashboard_id,
    confidence_dashboard_ref: confidence.confidence_dashboard_id,
    urgency_dashboard_ref: urgency.urgency_dashboard_id,
    analytics_ref: analytics.analytics_id,
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    certification_ref: scenario === "HIDE_CERTIFICATION_BLOCKERS" ? "" : c.certification_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: ConflictDependencyVisualizationResult;
  items: readonly PriorityQueueItem[];
  queues: readonly PriorityQueueRecord[];
  missionCritical: PriorityQueueRecord;
  risk: RiskDashboardRecord;
  confidence: ConfidenceDashboard;
  urgency: UrgencyVisualization;
  analytics: QueueAnalytics;
  dashboard: PriorityDashboardRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly PriorityRiskDashboardFailure[] {
  const failures: PriorityRiskDashboardFailure[] = [];
  const c = ctx(input.source);
  const expected = sortItems(input.items, "BASELINE").map((item) => item.decision_id).join("|");
  if (input.items.map((item) => item.decision_id).join("|") !== expected || input.items.some((item, index) => item.queue_position !== index + 1) || input.items.some((item) => item.priority_score !== reproducedPriorityScore(item))) failures.push("PRIORITY_ORDER_MISMATCH");
  if (!input.missionCritical.decision_refs.length) failures.push("MISSION_CRITICAL_DECISIONS_OMITTED");
  if (input.risk.overall_risk !== "CRITICAL" || input.risk.risk_distribution.CRITICAL < 1) failures.push("RISK_EXPOSURE_INACCURATE");
  if (!input.confidence.confidence_lineage.length || input.confidence.evidence_quality !== "COMPLETE") failures.push("CONFIDENCE_SOURCE_MISMATCH");
  if (!input.urgency.deadline_refs.length || !input.urgency.escalation_timers.length) failures.push("URGENCY_INDICATORS_INCORRECT");
  if (input.analytics.queue_metrics.queue_depth !== input.items.length || input.analytics.throughput_metrics.average_completion_minutes <= 0) failures.push("QUEUE_ANALYTICS_INCONSISTENT");
  if (input.items.some((item) => item.governance_weight === 0) || input.risk.governance_risk === "LOW") failures.push("GOVERNANCE_PRIORITY_ADJUSTMENTS_HIDDEN");
  if (!input.dashboard.replay_ref || input.items.some((item) => !item.replay_ref) || !input.confidence.replay_refs.length || !input.urgency.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.dashboard.certification_ref || input.analytics.governance_metrics.certification_blockers === 0) failures.push("CERTIFICATION_BLOCKERS_HIDDEN");
  if (input.scenario === "NONDETERMINISTIC_ORDER") failures.push("DASHBOARD_ORDER_NONDETERMINISTIC");
  if (input.items.some((item) => item.tenant_id !== c.tenant_id)) failures.push("CROSS_TENANT_QUEUE_VISIBLE");
  if (
    input.items.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || input.queues.some((queue) => hashWithoutIntegrity(queue) !== queue.integrity_hash)
    || hashWithoutIntegrity(input.risk) !== input.risk.integrity_hash
    || hashWithoutIntegrity(input.confidence) !== input.confidence.integrity_hash
    || hashWithoutIntegrity(input.urgency) !== input.urgency.integrity_hash
    || hashWithoutIntegrity(input.analytics) !== input.analytics.integrity_hash
    || hashWithoutIntegrity(input.dashboard) !== input.dashboard.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("DASHBOARD_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.source.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly PriorityRiskDashboardFailure[]): PriorityRiskDashboardValidation {
  const has = (failure: PriorityRiskDashboardFailure) => failures.includes(failure);
  const base: Omit<PriorityRiskDashboardValidation, "integrity_hash"> = {
    validation_id: "priority_risk_dashboard_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    priority_order_valid: !has("PRIORITY_ORDER_MISMATCH") && !has("DASHBOARD_ORDER_NONDETERMINISTIC"),
    mission_critical_visible: !has("MISSION_CRITICAL_DECISIONS_OMITTED"),
    risk_exposure_valid: !has("RISK_EXPOSURE_INACCURATE"),
    confidence_lineage_valid: !has("CONFIDENCE_SOURCE_MISMATCH"),
    urgency_indicators_valid: !has("URGENCY_INDICATORS_INCORRECT"),
    analytics_consistent: !has("QUEUE_ANALYTICS_INCONSISTENT"),
    governance_adjustments_visible: !has("GOVERNANCE_PRIORITY_ADJUSTMENTS_HIDDEN"),
    replay_refs_present: !has("REPLAY_REFERENCES_MISSING") && !has("DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"),
    certification_blockers_visible: !has("CERTIFICATION_BLOCKERS_HIDDEN"),
    deterministic_ordering: !has("DASHBOARD_ORDER_NONDETERMINISTIC"),
    tenant_isolated: !has("CROSS_TENANT_QUEUE_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PriorityRiskDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    items: result.queue_items,
    queues: result.priority_queues,
    risk: result.risk_dashboard,
    confidence: result.confidence_dashboard,
    urgency: result.urgency_visualization,
    analytics: result.queue_analytics,
    dashboard: result.dashboard_record,
    validation: result.validation,
  });
}

export function runPriorityRiskDashboard(input: PriorityRiskDashboardInput = {}): PriorityRiskDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const conflict_visualization = input.conflict_visualization ?? runConflictDependencyVisualization();
  const queue_items = buildQueueItems(conflict_visualization, scenario);
  const priority_queues = freezeArray(PRIORITY_QUEUE_TYPES.map((type) => buildQueueRecord(conflict_visualization, queue_items, type, scenario)));
  const mission_critical_queue = priority_queues.find((queue) => queue.queue_type === "MISSION_CRITICAL")!;
  const risk_dashboard = buildRiskDashboard(conflict_visualization, queue_items, scenario);
  const confidence_dashboard = buildConfidenceDashboard(conflict_visualization, queue_items, scenario);
  const urgency_visualization = buildUrgency(conflict_visualization, queue_items, scenario);
  const queue_analytics = buildAnalytics(conflict_visualization, queue_items, scenario);
  const dashboard_record = buildDashboardRecord(conflict_visualization, priority_queues, risk_dashboard, confidence_dashboard, urgency_visualization, queue_analytics, scenario);
  const failures = collectFailures({ source: conflict_visualization, items: queue_items, queues: priority_queues, missionCritical: mission_critical_queue, risk: risk_dashboard, confidence: confidence_dashboard, urgency: urgency_visualization, analytics: queue_analytics, dashboard: dashboard_record, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<PriorityRiskDashboardResult, "integrity_hash" | "replay_hash"> = {
    dashboard_version: DASHBOARD_VERSION,
    conflict_visualization,
    queue_items,
    priority_queues,
    mission_critical_queue,
    risk_dashboard,
    confidence_dashboard,
    urgency_visualization,
    queue_analytics,
    dashboard_record,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_priority_or_risk: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayPriorityRiskDashboard(result: PriorityRiskDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computePriorityQueueItemHash(item: Omit<PriorityQueueItem, "integrity_hash"> | PriorityQueueItem): string {
  return hashWithoutIntegrity(item);
}

export function getPriorityRiskDashboardFoundation(): PriorityRiskDashboardFoundation {
  return Object.freeze({
    dashboard_version: DASHBOARD_VERSION,
    queue_types: PRIORITY_QUEUE_TYPES,
    risk_categories: RISK_CATEGORIES,
    confidence_categories: CONFIDENCE_CATEGORIES,
    urgency_levels: URGENCY_LEVELS,
    result: runPriorityRiskDashboard(),
  });
}

export const PriorityRiskDashboard = Object.freeze({
  run: runPriorityRiskDashboard,
  replay: replayPriorityRiskDashboard,
});
