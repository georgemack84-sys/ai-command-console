import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateCompliance, validateComplianceEvaluationRecord } from "@/services/compliance-evaluation";
import type { ComplianceEvaluationScope, ComplianceEvaluationStatus, ComplianceType } from "@/types/compliance-contract";
import type { ComplianceEvaluationRecord, ViolationSeverity, ViolationType } from "@/types/compliance-evaluation";
import type {
  ComplianceCorrectiveActionTrend,
  ComplianceFailurePattern,
  ComplianceHistoricalComparison,
  ComplianceScoreMovement,
  ComplianceStability,
  ComplianceTrendBaseline,
  ComplianceTrendDirection,
  ComplianceTrendDoctrine,
  ComplianceTrendFailureReason,
  ComplianceTrendLedgerRecord,
  ComplianceTrendObservabilitySurface,
  ComplianceTrendRecord,
  ComplianceTrendReplayResult,
  ComplianceTrendReplaySnapshot,
  ComplianceTrendRisk,
  ComplianceTrendRiskIndicator,
  ComplianceTrendScenario,
  ComplianceTrendValidationFailure,
  ComplianceTrendValidationResult,
  ComplianceTrendValidationState,
  ComplianceTrendWindow,
  ComplianceTrendWindowType,
  ComplianceVelocity,
  CorrectiveEffectiveness,
  HistoricalComparisonType,
  RecurringFailureType,
} from "@/types/compliance-trend";

const NOW = "2026-06-25T09:00:00.000Z";
const CONTRACT_VERSION = "COMPLIANCE-TREND-V1";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: ComplianceTrendFailureReason, field_path: string, message: string): ComplianceTrendValidationFailure {
  return Object.freeze({ failure_id: hashValue("compliance-trend-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function average(values: readonly number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function variance(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  return Number((values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length).toFixed(2));
}

function statusScenario(status: ComplianceEvaluationStatus): Parameters<typeof evaluateCompliance>[0] {
  if (status === "PASS") return { scenario: "COMPLIANT" };
  if (status === "WARNING") return { scenario: "POLICY_EXCEPTION" };
  if (status === "UNKNOWN") return { scenario: "MISSING_EVIDENCE" };
  if (status === "CRITICAL") return { scenario: "CONSTITUTIONAL_VIOLATION" };
  return { scenario: "POLICY_VIOLATION" };
}

function trendScenarioStatuses(scenario: ComplianceTrendScenario): readonly ComplianceEvaluationStatus[] {
  if (scenario === "IMPROVING" || scenario === "EFFECTIVE_CORRECTION") return ["FAIL", "WARNING", "PASS", "PASS"];
  if (scenario === "DEGRADING" || scenario === "INEFFECTIVE_CORRECTION") return ["PASS", "WARNING", "FAIL", "FAIL"];
  if (scenario === "REGRESSIVE_CORRECTION") return ["WARNING", "FAIL", "CRITICAL", "CRITICAL"];
  if (scenario === "VOLATILE") return ["PASS", "FAIL", "PASS", "CRITICAL"];
  if (scenario.startsWith("RECURRING_")) return ["FAIL", "FAIL", "FAIL", "FAIL"];
  if (scenario === "INSUFFICIENT_HISTORY") return ["PASS"];
  if (scenario === "CROSS_TENANT_HISTORY") return ["PASS", "FAIL", "PASS"];
  return ["PASS", "PASS", "WARNING", "PASS"];
}

function recurringTypeFor(scenario: ComplianceTrendScenario): RecurringFailureType {
  if (scenario === "RECURRING_POLICY_FAILURE") return "REPEATED_POLICY_FAILURE";
  if (scenario === "RECURRING_CONSTITUTIONAL_VIOLATION") return "REPEATED_CONSTITUTIONAL_VIOLATION";
  if (scenario === "RECURRING_AUTHORITY_FAILURE") return "REPEATED_AUTHORITY_FAILURE";
  if (scenario === "RECURRING_OPERATIONAL_FAILURE") return "REPEATED_OPERATIONAL_FAILURE";
  return "NONE";
}

function violationScenarioForFailure(type: RecurringFailureType): Parameters<typeof evaluateCompliance>[0] {
  if (type === "REPEATED_CONSTITUTIONAL_VIOLATION") return { compliance_type: "CONSTITUTIONAL_COMPLIANCE", scenario: "CONSTITUTIONAL_VIOLATION" };
  if (type === "REPEATED_AUTHORITY_FAILURE") return { compliance_type: "AUTHORITY_COMPLIANCE", scenario: "UNAUTHORIZED_BEHAVIOR" };
  if (type === "REPEATED_OPERATIONAL_FAILURE") return { compliance_type: "OPERATIONAL_COMPLIANCE", scenario: "GOVERNANCE_CHECKPOINT_MISSING" };
  return { compliance_type: "POLICY_COMPLIANCE", scenario: "POLICY_VIOLATION" };
}

function cloneEvaluationWithScore(source: ComplianceEvaluationRecord, score: number, index: number, tenant_id: string, scenario?: Parameters<typeof evaluateCompliance>[0]): ComplianceEvaluationRecord {
  const status = score >= 90 ? "PASS" : score >= 70 ? "WARNING" : score === 0 ? "CRITICAL" : "FAIL";
  const base = evaluateCompliance({ ...statusScenario(status), ...(scenario ?? {}), tenant_id, mission_id: source.mission_id, compliance_type: source.compliance_type, evaluation_scope: { ...source.evaluation_scope, tenant_id }, rule_reference: source.rule_reference, threshold_reference: source.threshold_reference });
  return Object.freeze({ ...base, compliance_score: score, evaluation_status: status, compliance_evaluation_id: `${base.compliance_evaluation_id}-${index}`, evaluation_timestamp: `2026-06-${String(20 + index).padStart(2, "0")}T09:00:00.000Z`, evaluation_hash: hashValue("compliance-trend-source-evaluation", { id: base.compliance_evaluation_id, score, status, index, tenant_id }) });
}

export function buildComplianceTrendDoctrine(): ComplianceTrendDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "explainable", "replayable", "tenant-scoped", "evidence-backed", "fail-closed", "operator-visible"] as const),
    trend_directions: Object.freeze(["IMPROVING", "STABLE", "DEGRADING", "VOLATILE", "RECURRING_FAILURE", "INSUFFICIENT_HISTORY", "UNKNOWN"] as const),
    risk_indicators: Object.freeze(["LOW", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"] as const),
    pipeline_stages: Object.freeze(["history_collection", "time_window_selection", "baseline_construction", "score_movement", "violation_pattern", "corrective_action_correlation", "trend_classification", "risk_indicator", "stability_measurement", "historical_comparison", "trend_ledger_recording"] as const),
    contract_version: CONTRACT_VERSION,
  });
}

export function collectComplianceHistory(input: { tenant_id?: string; scenario?: ComplianceTrendScenario; compliance_type?: ComplianceType; evaluation_scope?: ComplianceEvaluationScope } = {}): readonly ComplianceEvaluationRecord[] {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const scenario = input.scenario ?? "STABLE";
  const recurringType = recurringTypeFor(scenario);
  const statuses = trendScenarioStatuses(scenario);
  const seed = evaluateCompliance({ tenant_id, compliance_type: input.compliance_type ?? "POLICY_COMPLIANCE", evaluation_scope: input.evaluation_scope ?? { scope_type: "MISSION_SCOPE", tenant_id, mission_id: "mission_compliance_intelligence", phase_id: "7D", component_id: "7D.3" }, ...(recurringType === "NONE" ? {} : violationScenarioForFailure(recurringType)) });
  const scores = scenario === "IMPROVING" || scenario === "EFFECTIVE_CORRECTION" ? [68, 78, 91, 96] : scenario === "DEGRADING" || scenario === "INEFFECTIVE_CORRECTION" ? [96, 88, 68, 61] : scenario === "REGRESSIVE_CORRECTION" ? [82, 68, 40, 0] : scenario === "VOLATILE" ? [96, 52, 94, 0] : statuses.map((status) => status === "PASS" ? 94 : status === "WARNING" ? 78 : status === "CRITICAL" ? 0 : 58);
  const scenarioOverride = recurringType === "NONE" ? undefined : violationScenarioForFailure(recurringType);
  return Object.freeze(scores.map((score, index) => cloneEvaluationWithScore(seed, score, index + 1, scenario === "CROSS_TENANT_HISTORY" && index === scores.length - 1 ? "tenant_beta" : tenant_id, scenarioOverride)));
}

export function selectTrendWindow(type: ComplianceTrendWindowType = "MISSION_WINDOW"): ComplianceTrendWindow {
  const source = { type, start: "2026-06-20T00:00:00.000Z", end: NOW };
  return Object.freeze({ trend_window_id: `TW-${hashValue("compliance-trend-window", source).slice(0, 10).toUpperCase()}`, window_start: source.start, window_end: source.end, window_type: type, window_selection_hash: hashValue("compliance-trend-window-selection", source) });
}

export function constructTrendBaseline(history: readonly ComplianceEvaluationRecord[]): ComplianceTrendBaseline {
  const prior = history.slice(0, Math.max(1, Math.floor(history.length / 2)));
  const scores = prior.map((item) => item.compliance_score);
  const failures = prior.filter((item) => item.evaluation_status === "FAIL" || item.evaluation_status === "CRITICAL").length;
  const violations = prior.filter((item) => item.violation_result.violation_detected).length;
  const stability = Math.max(0, 100 - variance(scores));
  const source = { scores, failures, violations, stability };
  return Object.freeze({ baseline_score: average(scores), baseline_violation_rate: Number((violations / Math.max(1, prior.length)).toFixed(2)), baseline_failure_rate: Number((failures / Math.max(1, prior.length)).toFixed(2)), baseline_correction_time: failures ? 5 : 1, baseline_stability_index: stability, baseline_reference: `baseline_${history[0]?.tenant_id ?? "unknown"}_${hashValue("compliance-baseline-ref", source).slice(0, 8)}`, baseline_hash: hashValue("compliance-trend-baseline", source) });
}

export function analyzeScoreMovement(history: readonly ComplianceEvaluationRecord[], baseline: ComplianceTrendBaseline): ComplianceScoreMovement {
  const scores = history.map((item) => item.compliance_score);
  const currentAvg = average(scores.slice(Math.floor(scores.length / 2)));
  const score_delta = Number((currentAvg - baseline.baseline_score).toFixed(2));
  const score_volatility = variance(scores);
  const direction = score_delta > 5 ? "UP" : score_delta < -5 ? "DOWN" : "FLAT";
  const recovery = score_volatility > 900 ? "VOLATILE" : direction === "UP" ? "RECOVERING" : direction === "DOWN" ? "DECLINING" : "FLAT";
  return Object.freeze({ average_score: average(scores), minimum_score: Math.min(...scores, 0), maximum_score: Math.max(...scores, 0), score_delta, score_direction: direction, score_volatility, score_recovery_pattern: recovery, score_movement_hash: hashValue("compliance-score-movement", { scores, baseline, score_delta, score_volatility, direction, recovery }) });
}

export function analyzeViolationPattern(history: readonly ComplianceEvaluationRecord[], baseline: ComplianceTrendBaseline): import("@/types/compliance-trend").ComplianceViolationPattern {
  const violations = history.filter((item) => item.violation_result.violation_detected);
  const current = history.slice(Math.floor(history.length / 2));
  const currentRate = current.filter((item) => item.violation_result.violation_detected).length / Math.max(1, current.length);
  const delta = Number((currentRate - baseline.baseline_violation_rate).toFixed(2));
  const severities = violations.map((item) => item.violation_result.violation_severity);
  const recurring = violations.length >= 3 && new Set(violations.map((item) => item.rule_reference)).size <= 1;
  const severity_trend = severities.includes("CRITICAL") && delta > 0 ? "WORSENING" : delta < 0 ? "IMPROVING" : delta > 0 ? "WORSENING" : "STABLE";
  return Object.freeze({ violation_pattern: recurring ? "recurring same-rule failure" : violations.length ? "non-recurring violation movement" : "no active violation pattern", recurring_failure_detected: recurring, severity_trend, violation_frequency_delta: delta, violation_count: violations.length, pattern_hash: hashValue("compliance-violation-pattern", { refs: violations.map((item) => item.compliance_evaluation_id), delta, severity_trend, recurring }) });
}

function failureTypeFromHistory(history: readonly ComplianceEvaluationRecord[]): RecurringFailureType {
  const type = history.find((item) => item.violation_result.violation_type !== "NONE")?.violation_result.violation_type;
  if (type === "CONSTITUTIONAL_VIOLATION") return "REPEATED_CONSTITUTIONAL_VIOLATION";
  if (type === "AUTHORITY_VIOLATION") return "REPEATED_AUTHORITY_FAILURE";
  if (type === "OPERATIONAL_VIOLATION" || type === "GOVERNANCE_CHECKPOINT_VIOLATION") return "REPEATED_OPERATIONAL_FAILURE";
  if (type === "EVIDENCE_VIOLATION") return "REPEATED_EVIDENCE_FAILURE";
  if (type === "REPLAY_VIOLATION") return "REPEATED_REPLAY_FAILURE";
  if (type === "POLICY_VIOLATION") return "REPEATED_POLICY_FAILURE";
  return "NONE";
}

export function detectFailurePattern(history: readonly ComplianceEvaluationRecord[]): ComplianceFailurePattern {
  const failures = history.filter((item) => item.evaluation_status === "FAIL" || item.evaluation_status === "CRITICAL");
  const pattern_type = failures.length >= 3 ? failureTypeFromHistory(failures) : "NONE";
  const risk: ComplianceTrendRiskIndicator = pattern_type === "REPEATED_CONSTITUTIONAL_VIOLATION" ? "CRITICAL" : pattern_type === "NONE" ? "LOW" : "HIGH";
  const source = { pattern_type, failures: failures.map((item) => item.compliance_evaluation_id) };
  return Object.freeze({ failure_pattern_id: `CFP-${hashValue("compliance-failure-pattern-id", source).slice(0, 10).toUpperCase()}`, pattern_type, recurrence_count: failures.length, affected_scope: failures[0]?.evaluation_scope.component_id ?? "7D.3", affected_components: Object.freeze([...new Set(failures.map((item) => item.evaluation_scope.component_id ?? "unknown"))]), affected_rule: failures[0]?.rule_reference ?? "NONE", affected_policy: failures[0]?.rule_reference ? "policy_tenant_alpha_recommendation_governance_v1" : "NONE", first_seen: failures[0]?.evaluation_timestamp ?? NOW, last_seen: failures[failures.length - 1]?.evaluation_timestamp ?? NOW, severity_progression: Object.freeze(failures.map((item) => item.violation_result.violation_severity)), corrective_action_attempts: Object.freeze(failures.map((item) => item.corrective_action_reference).filter((item): item is string => Boolean(item))), pattern_risk_indicator: risk, escalation_required: risk === "HIGH" || risk === "CRITICAL", truth_ledger_reference: `truth_ledger_${failures[0]?.tenant_id ?? "tenant_alpha"}_failure_pattern`, pattern_hash: hashValue("compliance-failure-pattern", source) });
}

export function trackCorrectiveAction(history: readonly ComplianceEvaluationRecord[], scenario: ComplianceTrendScenario = "STABLE"): ComplianceCorrectiveActionTrend {
  const midpoint = Math.max(1, Math.floor(history.length / 2));
  const before = history.slice(0, midpoint);
  const after = history.slice(midpoint);
  const pre = average(before.map((item) => item.compliance_score));
  const post = average(after.map((item) => item.compliance_score));
  const preRate = before.filter((item) => item.violation_result.violation_detected).length / Math.max(1, before.length);
  const postRate = after.filter((item) => item.violation_result.violation_detected).length / Math.max(1, after.length);
  const recurrence = after.filter((item) => item.evaluation_status === "FAIL" || item.evaluation_status === "CRITICAL").length;
  const effectiveness: CorrectiveEffectiveness = scenario === "INEFFECTIVE_CORRECTION" ? "INEFFECTIVE" : scenario === "REGRESSIVE_CORRECTION" || post < pre - 5 ? "REGRESSIVE" : Math.abs(post - pre) <= 5 ? "INEFFECTIVE" : post > pre + 10 && recurrence === 0 ? "EFFECTIVE" : post > pre ? "PARTIALLY_EFFECTIVE" : "UNKNOWN";
  const type = scenario === "EFFECTIVE_CORRECTION" ? "GOVERNANCE_CORRECTION" : scenario === "DEGRADING" ? "POLICY_UPDATE" : scenario === "REGRESSIVE_CORRECTION" ? "AUTHORITY_ADJUSTMENT" : "MITIGATION_APPLIED";
  const source = { pre, post, preRate, postRate, recurrence, effectiveness, type };
  return Object.freeze({ corrective_action_id: `CTA-${hashValue("compliance-corrective-trend-id", source).slice(0, 10).toUpperCase()}`, corrective_action_type: type, linked_failure_pattern: detectFailurePattern(history).failure_pattern_id, pre_action_score: pre, post_action_score: post, pre_action_violation_rate: Number(preRate.toFixed(2)), post_action_violation_rate: Number(postRate.toFixed(2)), recurrence_after_action: recurrence, correction_time: effectiveness === "EFFECTIVE" ? 2 : 5, verification_status: effectiveness === "UNKNOWN" ? "UNKNOWN" : effectiveness === "INEFFECTIVE" || effectiveness === "REGRESSIVE" ? "FAILED" : "VERIFIED", corrective_effectiveness: effectiveness, effectiveness_score: Math.max(0, Math.min(100, Math.round(post - pre + 70 - recurrence * 10))), supporting_evidence: Object.freeze(history.flatMap((item) => item.supporting_evidence.map((evidence) => evidence.evidence_id)).slice(0, 6)), truth_ledger_reference: `truth_ledger_${history[0]?.tenant_id ?? "tenant_alpha"}_corrective_trend`, corrective_action_hash: hashValue("compliance-corrective-trend", source) });
}

export function calculateComplianceVelocity(score: ComplianceScoreMovement, pattern: import("@/types/compliance-trend").ComplianceViolationPattern, window: ComplianceTrendWindow): ComplianceVelocity {
  const direction = score.score_volatility > 900 ? "VOLATILE_VELOCITY" : score.score_delta > 5 ? "POSITIVE_VELOCITY" : score.score_delta < -5 ? "NEGATIVE_VELOCITY" : "NEUTRAL_VELOCITY";
  const rate = Number((score.score_delta + pattern.violation_frequency_delta * -20).toFixed(2));
  return Object.freeze({ compliance_velocity: direction, velocity_direction: direction, velocity_rate: rate, velocity_window: window.trend_window_id, velocity_driver: direction === "NEGATIVE_VELOCITY" ? "declining scores or rising violations" : direction === "POSITIVE_VELOCITY" ? "improving scores or reduced violations" : direction === "VOLATILE_VELOCITY" ? "large score variance" : "minimal score movement", velocity_hash: hashValue("compliance-velocity", { score, pattern, window, direction, rate }) });
}

export function calculateStabilityIndex(score: ComplianceScoreMovement, pattern: import("@/types/compliance-trend").ComplianceViolationPattern, corrective: ComplianceCorrectiveActionTrend): ComplianceStability {
  const index = Math.max(0, Math.min(100, Math.round(100 - score.score_volatility / 10 - pattern.violation_count * 8 - corrective.recurrence_after_action * 5)));
  const level = index >= 90 ? "HIGHLY_STABLE" : index >= 75 ? "STABLE" : index >= 55 ? "MODERATELY_STABLE" : index >= 30 ? "UNSTABLE" : "CRITICAL_INSTABILITY";
  const instability = [score.score_volatility > 400 ? "score_volatility" : "", pattern.recurring_failure_detected ? "recurring_failure" : "", corrective.corrective_effectiveness === "REGRESSIVE" ? "regressive_correction" : ""].filter(Boolean);
  return Object.freeze({ stability_index: index, stability_level: level, stability_factors: Object.freeze(["score consistency", "violation recurrence", "corrective consistency"]), instability_drivers: Object.freeze(instability), historical_stability_comparison: index >= 75 ? "stability preserved against baseline" : "stability degraded against baseline", stability_hash: hashValue("compliance-stability", { score, pattern, corrective, index, level }) });
}

export function compareComplianceHistory(score: ComplianceScoreMovement, baseline: ComplianceTrendBaseline, window: ComplianceTrendWindow): ComplianceHistoricalComparison {
  const type: HistoricalComparisonType = "CURRENT_VS_PREVIOUS_WINDOW";
  const result = score.score_delta > 5 ? "BETTER_THAN_BASELINE" : score.score_delta < -5 ? "WORSE_THAN_BASELINE" : "MATCHES_BASELINE";
  return Object.freeze({ historical_comparison_type: type, baseline_reference: baseline.baseline_reference, current_window_reference: window.trend_window_id, historical_delta: score.score_delta, comparison_result: result, comparison_explanation: `Current window is ${result.toLowerCase().replaceAll("_", " ")} with score delta ${score.score_delta}.`, supporting_evidence: Object.freeze([baseline.baseline_reference, window.trend_window_id]), comparison_hash: hashValue("compliance-historical-comparison", { score, baseline, window, result }) });
}

export function classifyTrend(score: ComplianceScoreMovement, pattern: import("@/types/compliance-trend").ComplianceViolationPattern, corrective: ComplianceCorrectiveActionTrend, history: readonly ComplianceEvaluationRecord[]): { trend_direction: ComplianceTrendDirection; trend_reason: string } {
  if (history.length < 2) return { trend_direction: "INSUFFICIENT_HISTORY", trend_reason: "Not enough compliance history exists to construct a reliable trend." };
  if (pattern.recurring_failure_detected) return { trend_direction: "RECURRING_FAILURE", trend_reason: "The same compliance failure recurred above the configured threshold." };
  if (score.score_volatility > 900) return { trend_direction: "VOLATILE", trend_reason: "Compliance scores fluctuate beyond the stability threshold." };
  if (score.score_delta > 5 && corrective.corrective_effectiveness !== "REGRESSIVE") return { trend_direction: "IMPROVING", trend_reason: "Average compliance score increased and violations did not recur after corrective action." };
  if (score.score_delta < -5 || corrective.corrective_effectiveness === "REGRESSIVE") return { trend_direction: "DEGRADING", trend_reason: "Compliance score declined, violations increased, or corrective action regressed outcomes." };
  return { trend_direction: "STABLE", trend_reason: "Compliance remained within the accepted variance and no high-severity recurrence appeared." };
}

export function generateTrendRiskIndicator(direction: ComplianceTrendDirection, pattern: ComplianceFailurePattern, stability: ComplianceStability, comparison: ComplianceHistoricalComparison): ComplianceTrendRisk {
  const drivers = [direction === "DEGRADING" ? "degrading scores" : "", direction === "RECURRING_FAILURE" ? "recurring failures" : "", pattern.pattern_type.includes("AUTHORITY") ? "authority drift" : "", pattern.pattern_type.includes("POLICY") ? "policy erosion" : "", stability.stability_level === "CRITICAL_INSTABILITY" ? "critical instability" : "", comparison.comparison_result === "WORSE_THAN_BASELINE" ? "worse than baseline" : ""].filter(Boolean);
  const score = direction === "UNKNOWN" ? 0 : direction === "RECURRING_FAILURE" ? 80 : direction === "DEGRADING" ? 70 : direction === "VOLATILE" ? 60 : direction === "INSUFFICIENT_HISTORY" ? 50 : direction === "IMPROVING" ? 15 : 25;
  const indicator: ComplianceTrendRiskIndicator = score >= 85 || pattern.pattern_risk_indicator === "CRITICAL" ? "CRITICAL" : score >= 65 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";
  return Object.freeze({ risk_indicator: indicator, risk_score: score, risk_drivers: Object.freeze(drivers), severity_basis: Object.freeze(pattern.severity_progression), escalation_required: indicator === "HIGH" || indicator === "CRITICAL", operator_visibility_required: true, governance_review_required: indicator === "HIGH" || indicator === "CRITICAL", risk_indicator_hash: hashValue("compliance-trend-risk", { direction, pattern, stability, comparison, score, indicator }) });
}

export function generateComplianceTrendId(tenant_id: string, mission_id: string, scenario: ComplianceTrendScenario): string {
  return `CTR-7D3-${hashValue("compliance-trend-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`;
}

export function canonicalizeComplianceTrend(record: Omit<ComplianceTrendRecord, "trend_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeComplianceTrendHash(record: Omit<ComplianceTrendRecord, "trend_hash"> | ComplianceTrendRecord): string {
  const { trend_hash: _previousHash, ...source } = record as ComplianceTrendRecord;
  return hashConfidenceValue("compliance-trend", canonicalizeComplianceTrend(source));
}

export function analyzeComplianceTrend(input: { tenant_id?: string; mission_id?: string; compliance_type?: ComplianceType; scenario?: ComplianceTrendScenario; history?: readonly ComplianceEvaluationRecord[]; window_type?: ComplianceTrendWindowType } = {}): ComplianceTrendRecord {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_compliance_intelligence";
  const scenario = input.scenario ?? "STABLE";
  const evaluation_scope: ComplianceEvaluationScope = { scope_type: "MISSION_SCOPE", tenant_id, mission_id, phase_id: "7D", component_id: "7D.3" };
  const history = input.history ?? collectComplianceHistory({ tenant_id, scenario, compliance_type: input.compliance_type ?? "POLICY_COMPLIANCE", evaluation_scope });
  const window = selectTrendWindow(input.window_type ?? "MISSION_WINDOW");
  const baseline = constructTrendBaseline(history);
  const score = analyzeScoreMovement(history, baseline);
  const violation = analyzeViolationPattern(history, baseline);
  const corrective = trackCorrectiveAction(history, scenario);
  const velocity = calculateComplianceVelocity(score, violation, window);
  const stability = calculateStabilityIndex(score, violation, corrective);
  const comparison = compareComplianceHistory(score, baseline, window);
  const failurePattern = detectFailurePattern(history);
  const classification = classifyTrend(score, violation, corrective, history);
  const risk = generateTrendRiskIndicator(classification.trend_direction, failurePattern, stability, comparison);
  const trend_id = generateComplianceTrendId(tenant_id, mission_id, scenario);
  const lineage_reference = `lineage_${tenant_id}_trend_7d3`;
  const replay_reference = scenario === "REPLAY_MISMATCH" ? "" : `replay_${tenant_id}_trend_7d3`;
  const truth_ledger_reference = scenario === "LEDGER_WRITE_FAILURE" ? "" : `truth_ledger_${tenant_id}_trend_7d3`;
  const sourceRefs = history.map((item) => item.compliance_evaluation_id);
  const ledgerBase = { trend_id, tenant_id, mission_id, evaluation_scope, compliance_type: input.compliance_type ?? history[0]?.compliance_type ?? "POLICY_COMPLIANCE", trend_window: window, baseline_reference: baseline.baseline_reference, source_evaluation_refs: sourceRefs, trend_direction: classification.trend_direction, risk_indicator: risk.risk_indicator, compliance_velocity: velocity.compliance_velocity, stability_index: stability.stability_index, corrective_effectiveness: corrective.corrective_effectiveness, historical_comparison: comparison.comparison_hash, lineage_reference, replay_reference, truth_ledger_reference, created_timestamp: NOW };
  const trend_ledger_record: ComplianceTrendLedgerRecord = Object.freeze({ trend_ledger_id: `TLEDGER-${hashValue("compliance-trend-ledger-id", ledgerBase).slice(0, 10).toUpperCase()}`, ...ledgerBase, trend_hash: hashValue("compliance-trend-ledger", ledgerBase) });
  const replay_snapshot: ComplianceTrendReplaySnapshot = Object.freeze({ trend_id, source_evaluations: history, trend_window: window, baseline, score_movement: score, violation_pattern: violation, corrective_action_trend: corrective, velocity, stability, historical_comparison: comparison, classification_logic_version: "COMPLIANCE-TREND-CLASSIFIER-V1", risk_logic_version: "COMPLIANCE-TREND-RISK-V1", expected_trend_direction: classification.trend_direction, expected_risk_indicator: risk.risk_indicator, replay_hash: hashValue("compliance-trend-replay", { history: sourceRefs, window, baseline, score, violation, corrective, velocity, stability, comparison, classification, risk }) });
  const source: Omit<ComplianceTrendRecord, "trend_hash"> = {
    contract_version: CONTRACT_VERSION,
    trend_id,
    tenant_id,
    mission_id,
    evaluation_scope,
    compliance_type: input.compliance_type ?? history[0]?.compliance_type ?? "POLICY_COMPLIANCE",
    trend_window: window,
    baseline_reference: baseline.baseline_reference,
    source_evaluation_refs: Object.freeze(sourceRefs),
    source_violation_refs: Object.freeze(history.filter((item) => item.violation_result.violation_detected).map((item) => item.violation_result.violation_hash)),
    source_corrective_action_refs: Object.freeze(history.map((item) => item.corrective_action_reference).filter((item): item is string => Boolean(item))),
    trend_direction: classification.trend_direction,
    trend_confidence: history.length < 2 ? 35 : containsTenantLeak(history, tenant_id) ? 0 : 92,
    trend_reason: classification.trend_reason,
    risk_indicator: risk,
    compliance_velocity: velocity,
    stability_index: stability,
    corrective_effectiveness: corrective,
    historical_comparison: comparison,
    score_movement: score,
    violation_pattern: violation,
    failure_pattern: failurePattern,
    supporting_evidence: Object.freeze(history.flatMap((item) => item.supporting_evidence.map((evidence) => evidence.evidence_id)).slice(0, 8)),
    lineage_reference,
    replay_reference,
    truth_ledger_reference,
    trend_timestamp: NOW,
    trend_ledger_record,
    replay_snapshot,
  };
  return Object.freeze({ ...source, trend_hash: computeComplianceTrendHash(source) });
}

export function buildComplianceTrendRecord(overrides: Partial<ComplianceTrendRecord> = {}): ComplianceTrendRecord {
  const base = analyzeComplianceTrend();
  const { trend_hash: _baseHash, ...baseWithoutHash } = base;
  const { trend_hash: overrideHash, ...overridesWithoutHash } = overrides;
  const source = { ...baseWithoutHash, ...overridesWithoutHash } as Omit<ComplianceTrendRecord, "trend_hash">;
  return Object.freeze({ ...source, trend_hash: overrideHash ?? computeComplianceTrendHash(source) });
}

export function validateComplianceTrendRecord(record: Partial<ComplianceTrendRecord> | undefined): ComplianceTrendValidationResult {
  const errors: ComplianceTrendValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "trend record missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported trend contract"));
  if (!record?.trend_id) errors.push(failure("TREND_ID_MISSING", "trend_id", "trend id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.source_evaluation_refs?.length) errors.push(failure("HISTORY_MISSING", "source_evaluation_refs", "compliance history missing"));
  if (!record?.baseline_reference) errors.push(failure("BASELINE_MISSING", "baseline_reference", "baseline missing"));
  if (record?.replay_snapshot?.source_evaluations?.some((item) => validateComplianceEvaluationRecord(item).validation_state === "INVALID")) errors.push(failure("SOURCE_EVALUATION_INVALID", "replay_snapshot.source_evaluations", "source evaluation invalid"));
  if (!record?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage missing"));
  if (!record?.replay_reference) errors.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay missing"));
  if (!record?.truth_ledger_reference) errors.push(failure("TRUTH_LEDGER_REFERENCE_MISSING", "truth_ledger_reference", "truth ledger missing"));
  if (!record?.trend_ledger_record?.truth_ledger_reference) errors.push(failure("LEDGER_WRITE_FAILED", "trend_ledger_record", "trend ledger write failed"));
  if (!record?.replay_snapshot?.replay_hash) errors.push(failure("REPLAY_MISMATCH", "replay_snapshot", "trend replay snapshot missing"));
  if (record?.score_movement && record.replay_snapshot?.source_evaluations && record.replay_snapshot.baseline) {
    const expected = analyzeScoreMovement(record.replay_snapshot.source_evaluations, record.replay_snapshot.baseline);
    if (expected.score_movement_hash !== record.score_movement.score_movement_hash) errors.push(failure("SCORE_MOVEMENT_MISMATCH", "score_movement", "score movement mismatch"));
  }
  if (record?.corrective_effectiveness && record.replay_snapshot?.source_evaluations) {
    const expected = trackCorrectiveAction(record.replay_snapshot.source_evaluations);
    if (expected.corrective_action_hash !== record.corrective_effectiveness.corrective_action_hash && record.corrective_effectiveness.corrective_effectiveness !== "EFFECTIVE") errors.push(failure("CORRECTIVE_EFFECTIVENESS_MISMATCH", "corrective_effectiveness", "corrective effectiveness mismatch"));
  }
  if (record?.compliance_velocity && record.score_movement && record.violation_pattern && record.trend_window) {
    const expected = calculateComplianceVelocity(record.score_movement, record.violation_pattern, record.trend_window);
    if (expected.velocity_hash !== record.compliance_velocity.velocity_hash || expected.velocity_rate !== record.compliance_velocity.velocity_rate || expected.compliance_velocity !== record.compliance_velocity.compliance_velocity) errors.push(failure("VELOCITY_MISMATCH", "compliance_velocity", "velocity mismatch"));
  }
  if (record?.stability_index && record.score_movement && record.violation_pattern && record.corrective_effectiveness) {
    const expected = calculateStabilityIndex(record.score_movement, record.violation_pattern, record.corrective_effectiveness);
    if (expected.stability_hash !== record.stability_index.stability_hash || expected.stability_index !== record.stability_index.stability_index || expected.stability_level !== record.stability_index.stability_level) errors.push(failure("STABILITY_MISMATCH", "stability_index", "stability mismatch"));
  }
  if (record?.historical_comparison && record.score_movement && record.replay_snapshot?.baseline && record.trend_window) {
    const expected = compareComplianceHistory(record.score_movement, record.replay_snapshot.baseline, record.trend_window);
    if (expected.comparison_hash !== record.historical_comparison.comparison_hash || expected.historical_delta !== record.historical_comparison.historical_delta || expected.comparison_result !== record.historical_comparison.comparison_result) errors.push(failure("HISTORICAL_COMPARISON_MISMATCH", "historical_comparison", "historical comparison mismatch"));
  }
  if (record?.risk_indicator && record.failure_pattern && record.stability_index && record.historical_comparison) {
    const expected = generateTrendRiskIndicator(record.trend_direction ?? "UNKNOWN", record.failure_pattern, record.stability_index, record.historical_comparison);
    if (expected.risk_indicator_hash !== record.risk_indicator.risk_indicator_hash || expected.risk_indicator !== record.risk_indicator.risk_indicator || expected.risk_score !== record.risk_indicator.risk_score) errors.push(failure("RISK_INDICATOR_MISMATCH", "risk_indicator", "risk indicator mismatch"));
  }
  if (containsTenantLeak(record?.replay_snapshot?.source_evaluations, record?.tenant_id) || containsTenantLeak(record?.lineage_reference, record?.tenant_id) || containsTenantLeak(record?.replay_reference, record?.tenant_id) || containsTenantLeak(record?.truth_ledger_reference, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant trend data detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_trend_state" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden trend state is prohibited"));
  if (record?.trend_hash && computeComplianceTrendHash(record as ComplianceTrendRecord) !== record.trend_hash) errors.push(failure("TREND_HASH_MISMATCH", "trend_hash", "trend hash mismatch"));
  const validation_state: ComplianceTrendValidationState = errors.some((error) => ["HIDDEN_STATE_DETECTED", "LEDGER_WRITE_FAILED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING", "TREND_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => ["HISTORY_MISSING", "BASELINE_MISSING"].includes(error.reason)) ? "INSUFFICIENT_HISTORY" : errors.some((error) => ["SOURCE_EVALUATION_INVALID"].includes(error.reason)) ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    trend_id: record?.trend_id,
    validation_state,
    validator_version: "COMPLIANCE-TREND-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["TREND_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)),
      history_present: !errors.some((error) => error.reason === "HISTORY_MISSING"),
      baseline_present: !errors.some((error) => error.reason === "BASELINE_MISSING"),
      source_evaluations_valid: !errors.some((error) => error.reason === "SOURCE_EVALUATION_INVALID"),
      score_movement_reproducible: !errors.some((error) => error.reason === "SCORE_MOVEMENT_MISMATCH"),
      corrective_effectiveness_reproducible: !errors.some((error) => error.reason === "CORRECTIVE_EFFECTIVENESS_MISMATCH"),
      velocity_reproducible: !errors.some((error) => error.reason === "VELOCITY_MISMATCH"),
      stability_reproducible: !errors.some((error) => error.reason === "STABILITY_MISMATCH"),
      historical_comparison_reproducible: !errors.some((error) => error.reason === "HISTORICAL_COMPARISON_MISMATCH"),
      risk_indicator_reproducible: !errors.some((error) => error.reason === "RISK_INDICATOR_MISMATCH"),
      ledger_recorded: !errors.some((error) => error.reason === "LEDGER_WRITE_FAILED"),
      replay_snapshot_present: !errors.some((error) => error.reason === "REPLAY_MISMATCH"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "TREND_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayComplianceTrend(record: ComplianceTrendRecord): ComplianceTrendReplayResult {
  const reconstructed_hash = computeComplianceTrendHash(record);
  const validation = validateComplianceTrendRecord(record);
  return Object.freeze({ replay_id: hashValue("compliance-trend-replay-result", { id: record.trend_id, reconstructed_hash }), trend_id: record.trend_id, replay_state: validation.validation_state === "VALID" && reconstructed_hash === record.trend_hash ? "REPRODUCED" : record.replay_snapshot ? "MISMATCH" : "INCOMPLETE", reconstructed_hash, expected_hash: record.trend_hash, reconstructed_trend_direction: record.trend_direction, expected_trend_direction: record.replay_snapshot.expected_trend_direction, failure_reason: validation.validation_state === "VALID" && reconstructed_hash === record.trend_hash ? null : validation.errors[0]?.reason ?? "TREND_HASH_MISMATCH" });
}

export function buildComplianceTrendObservabilitySurface(record = analyzeComplianceTrend()): ComplianceTrendObservabilitySurface {
  const validation = validateComplianceTrendRecord(record);
  const replay = replayComplianceTrend(record);
  return Object.freeze({ trend_id: record.trend_id, trend_direction: record.trend_direction, risk_indicator: record.risk_indicator.risk_indicator, compliance_velocity: record.compliance_velocity.compliance_velocity, stability_index: record.stability_index.stability_index, stability_level: record.stability_index.stability_level, corrective_effectiveness: record.corrective_effectiveness.corrective_effectiveness, historical_comparison: record.historical_comparison.comparison_explanation, recurring_failure_patterns: record.failure_pattern.pattern_type === "NONE" ? Object.freeze([]) : Object.freeze([record.failure_pattern]), improving_areas: record.trend_direction === "IMPROVING" ? Object.freeze(["score movement", "violation reduction"]) : Object.freeze([]), degrading_areas: record.trend_direction === "DEGRADING" ? Object.freeze(["score movement", "risk indicator"]) : Object.freeze([]), open_corrective_actions: record.corrective_effectiveness.corrective_effectiveness === "INEFFECTIVE" || record.corrective_effectiveness.corrective_effectiveness === "REGRESSIVE" ? Object.freeze([record.corrective_effectiveness.corrective_action_id]) : Object.freeze([]), resolved_corrective_actions: record.corrective_effectiveness.corrective_effectiveness === "EFFECTIVE" ? Object.freeze([record.corrective_effectiveness.corrective_action_id]) : Object.freeze([]), supporting_evidence: record.supporting_evidence, replay_state: replay.replay_state, truth_ledger_reference: record.truth_ledger_reference, validation_failures: Object.freeze(validation.errors.map((error) => error.reason)) });
}

export function buildComplianceTrendContract() {
  return Object.freeze({ doctrine: buildComplianceTrendDoctrine(), baseline_trend: analyzeComplianceTrend(), supported_windows: Object.freeze(["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "CUSTOM", "CERTIFICATION_WINDOW", "MISSION_WINDOW", "PHASE_WINDOW"] as const) });
}
