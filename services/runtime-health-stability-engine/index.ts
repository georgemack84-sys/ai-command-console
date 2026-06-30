import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateRuntimeConfidence, validateRuntimeConfidence } from "@/services/runtime-confidence-evaluation-engine";
import type { AdaptiveRuntimeHealthLevel, AdaptiveTrend } from "@/types/adaptive-runtime-assurance-contract";
import type { RuntimeConfidenceRecord } from "@/types/runtime-confidence-evaluation-engine";
import type {
  RuntimeHealthCertification,
  RuntimeHealthComponent,
  RuntimeHealthFailure,
  RuntimeHealthInput,
  RuntimeHealthLifecycleStage,
  RuntimeHealthPublisherSurface,
  RuntimeHealthRecord,
  RuntimeHealthReplayResult,
  RuntimeHealthScenario,
  RuntimeHealthStabilityEngineContract,
  RuntimeHealthTimelineEntry,
  RuntimeHealthValidationResult,
  RuntimeOscillationSeverity,
  RuntimeStabilityIndicator,
  RuntimeSubsystemHealth,
} from "@/types/runtime-health-stability-engine";

const NOW = "2026-07-02T14:00:00.000Z";
const VERSION = "runtime-health-stability-engine/v8ALT.1C" as const;

const lifecycle: readonly RuntimeHealthLifecycleStage[] = Object.freeze(["COLLECT_RUNTIME_DATA", "VALIDATE_TELEMETRY", "EVALUATE_SUBSYSTEM_HEALTH", "CALCULATE_STABILITY", "ANALYZE_TRENDS", "DETECT_ANOMALIES", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "STORE_HEALTH_RECORD", "PUBLISH_RESULTS"]);
const components: readonly RuntimeHealthComponent[] = Object.freeze(["EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY"]);
const healthLevels: readonly AdaptiveRuntimeHealthLevel[] = Object.freeze(["OPTIMAL", "HEALTHY", "STABLE", "WATCH", "DEGRADED", "HIGH_RISK", "CRITICAL"]);
const weights: Readonly<Record<RuntimeHealthComponent, number>> = Object.freeze({
  EXECUTION: 0.25,
  PLANNING: 0.2,
  ORCHESTRATION: 0.15,
  DELEGATION: 0.1,
  SUPERVISION: 0.1,
  GOVERNANCE: 0.1,
  INTEGRITY: 0.1,
});

const indicatorMetrics: Readonly<Record<RuntimeHealthComponent, readonly string[]>> = Object.freeze({
  EXECUTION: Object.freeze(["progress consistency", "retry frequency", "rollback frequency", "latency variance"]),
  PLANNING: Object.freeze(["planning consistency", "dependency stability", "contingency readiness", "revision volatility"]),
  ORCHESTRATION: Object.freeze(["workflow synchronization", "dependency ordering", "checkpoint health", "orchestration determinism"]),
  DELEGATION: Object.freeze(["routing success", "delegation latency", "assignment consistency", "workload balance"]),
  SUPERVISION: Object.freeze(["observation completeness", "anomaly coverage", "intervention effectiveness", "responsiveness"]),
  GOVERNANCE: Object.freeze(["policy enforcement", "authority validation", "escalation quality", "audit completeness"]),
  INTEGRITY: Object.freeze(["hash verification", "replay consistency", "lineage continuity", "immutable references"]),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailures(scenario: RuntimeHealthScenario): readonly RuntimeHealthFailure[] {
  const map: Partial<Record<RuntimeHealthScenario, RuntimeHealthFailure>> = {
    INCOMPLETE_TELEMETRY: "INCOMPLETE_TELEMETRY",
    INVALID_TELEMETRY: "INVALID_TELEMETRY",
    EXECUTION_INSTABILITY: "EXECUTION_INSTABILITY",
    PLANNING_INSTABILITY: "PLANNING_INSTABILITY",
    ORCHESTRATION_INSTABILITY: "ORCHESTRATION_INSTABILITY",
    DELEGATION_INSTABILITY: "DELEGATION_INSTABILITY",
    SUPERVISION_INSTABILITY: "SUPERVISION_INSTABILITY",
    CONFIDENCE_OSCILLATION: "CONFIDENCE_OSCILLATION",
    REPEATED_DEGRADATION: "REPEATED_DEGRADATION",
    REPEATED_RECOVERY: "REPEATED_RECOVERY",
    CHECKPOINT_FAILURES: "CHECKPOINT_FAILURES",
    EXCESSIVE_RETRIES: "EXCESSIVE_RETRIES",
    EXCESSIVE_ROLLBACKS: "EXCESSIVE_ROLLBACKS",
    STALLED_EXECUTION: "STALLED_EXECUTION",
    DEPENDENCY_FAILURES: "DEPENDENCY_FAILURES",
    SYNCHRONIZATION_FAILURES: "SYNCHRONIZATION_FAILURES",
    RECURRING_WORKFLOW_FAILURES: "RECURRING_WORKFLOW_FAILURES",
    REPEATED_PLANNING_FAILURES: "REPEATED_PLANNING_FAILURES",
    REPEATED_GOVERNANCE_VIOLATIONS: "REPEATED_GOVERNANCE_VIOLATIONS",
    REPEATED_INTEGRITY_FAILURES: "REPEATED_INTEGRITY_FAILURES",
    UNHEALTHY_TREND: "UNHEALTHY_TREND",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    EXECUTION_AUTHORITY_ATTEMPT: "UNAUTHORIZED_EXECUTION_CAPABILITY",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function confidenceForScenario(scenario: RuntimeHealthScenario): RuntimeConfidenceRecord {
  if (scenario === "CONFIDENCE_OSCILLATION") return evaluateRuntimeConfidence({ scenario: "CONFIDENCE_OSCILLATION" });
  if (scenario === "REPLAY_MISMATCH") return evaluateRuntimeConfidence({ scenario: "REPLAY_DIVERGENCE" });
  if (scenario === "TENANT_ISOLATION_FAILURE") return evaluateRuntimeConfidence({ scenario: "TENANT_ISOLATION_FAILURE" });
  if (scenario === "EXECUTION_AUTHORITY_ATTEMPT") return evaluateRuntimeConfidence({ scenario: "EXECUTION_AUTHORITY_ATTEMPT" });
  if (scenario === "INCOMPLETE_TELEMETRY") return evaluateRuntimeConfidence({ scenario: "MISSING_TELEMETRY" });
  if (scenario === "INVALID_TELEMETRY") return evaluateRuntimeConfidence({ scenario: "CORRUPTED_OBSERVATION" });
  return evaluateRuntimeConfidence();
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(4))));
}

function healthLevel(score: number): AdaptiveRuntimeHealthLevel {
  if (score >= 95) return "OPTIMAL";
  if (score >= 88) return "HEALTHY";
  if (score >= 78) return "STABLE";
  if (score >= 65) return "WATCH";
  if (score >= 45) return "DEGRADED";
  if (score >= 25) return "HIGH_RISK";
  return "CRITICAL";
}

function componentPenalty(component: RuntimeHealthComponent, failures: readonly RuntimeHealthFailure[]): number {
  let penalty = 0;
  if (failures.includes("INCOMPLETE_TELEMETRY")) penalty += 30;
  if (failures.includes("INVALID_TELEMETRY")) penalty += 45;
  if (failures.includes("EXECUTION_INSTABILITY")) penalty += component === "EXECUTION" ? 45 : 10;
  if (failures.includes("PLANNING_INSTABILITY")) penalty += component === "PLANNING" ? 45 : 10;
  if (failures.includes("ORCHESTRATION_INSTABILITY")) penalty += component === "ORCHESTRATION" ? 45 : 10;
  if (failures.includes("DELEGATION_INSTABILITY")) penalty += component === "DELEGATION" ? 45 : 10;
  if (failures.includes("SUPERVISION_INSTABILITY")) penalty += component === "SUPERVISION" ? 45 : 10;
  if (failures.includes("CONFIDENCE_OSCILLATION")) penalty += 35;
  if (failures.includes("REPEATED_DEGRADATION")) penalty += 40;
  if (failures.includes("REPEATED_RECOVERY")) penalty += 25;
  if (failures.includes("CHECKPOINT_FAILURES")) penalty += component === "ORCHESTRATION" || component === "INTEGRITY" ? 45 : 15;
  if (failures.includes("EXCESSIVE_RETRIES") || failures.includes("EXCESSIVE_ROLLBACKS") || failures.includes("STALLED_EXECUTION")) penalty += component === "EXECUTION" ? 55 : 15;
  if (failures.includes("DEPENDENCY_FAILURES") || failures.includes("SYNCHRONIZATION_FAILURES")) penalty += component === "ORCHESTRATION" ? 50 : 20;
  if (failures.includes("RECURRING_WORKFLOW_FAILURES")) penalty += component === "ORCHESTRATION" ? 55 : 20;
  if (failures.includes("REPEATED_PLANNING_FAILURES")) penalty += component === "PLANNING" ? 55 : 15;
  if (failures.includes("REPEATED_GOVERNANCE_VIOLATIONS")) penalty += component === "GOVERNANCE" ? 65 : 15;
  if (failures.includes("REPEATED_INTEGRITY_FAILURES")) penalty += component === "INTEGRITY" ? 65 : 15;
  if (failures.includes("UNHEALTHY_TREND")) penalty += 35;
  if (failures.includes("REPLAY_MISMATCH")) penalty += component === "INTEGRITY" ? 55 : 20;
  if (failures.includes("TENANT_ISOLATION_FAILURE")) penalty += component === "GOVERNANCE" || component === "INTEGRITY" ? 75 : 20;
  if (failures.includes("UNAUTHORIZED_EXECUTION_CAPABILITY")) penalty += 100;
  return penalty;
}

function trendFor(failures: readonly RuntimeHealthFailure[]): AdaptiveTrend {
  if (failures.some((failure) => ["REPEATED_DEGRADATION", "UNHEALTHY_TREND", "CONFIDENCE_OSCILLATION"].includes(failure))) return "DECLINING";
  if (failures.includes("REPEATED_RECOVERY")) return "IMPROVING";
  return failures.length === 0 ? "STABLE" : "UNKNOWN";
}

function indicator(component: RuntimeHealthComponent, metric: string, base: number, healthId: string): RuntimeStabilityIndicator {
  const normalized = normalizeScore(base);
  const source = {
    indicator_id: id("RHSI", "runtime-health-stability-indicator-id", { component, metric, healthId }),
    component,
    metric,
    raw_value: base,
    normalized_value: normalized,
    stability_score: normalizeScore((normalized + 100) / 2),
    evidence_reference: `evidence:${healthId}:${component.toLowerCase()}:${metric.replace(/\s+/g, "-")}`,
  };
  return Object.freeze({ ...source, indicator_hash: hashValue("runtime-health-stability-indicator", source) });
}

function buildIndicators(healthId: string, failures: readonly RuntimeHealthFailure[]): readonly RuntimeStabilityIndicator[] {
  return freezeArray(components.flatMap((component) => {
    const base = normalizeScore(97 - componentPenalty(component, failures));
    return indicatorMetrics[component].map((metric, index) => indicator(component, metric, normalizeScore(base - index), healthId));
  }));
}

function componentScore(component: RuntimeHealthComponent, indicators: readonly RuntimeStabilityIndicator[]): number {
  const values = indicators.filter((item) => item.component === component);
  return normalizeScore(values.reduce((sum, item) => sum + item.normalized_value, 0) / values.length);
}

function subsystemHealth(component: RuntimeHealthComponent, score: number, healthId: string): RuntimeSubsystemHealth {
  const source = {
    component,
    weight: weights[component],
    health_score: score,
    stability_score: normalizeScore(score * weights[component]),
    health_level: healthLevel(score),
    explanation_reference: `explanation:${healthId}:${component.toLowerCase()}`,
  };
  return Object.freeze({ ...source, subsystem_hash: hashValue("runtime-subsystem-health", source) });
}

function oscillationSeverity(failures: readonly RuntimeHealthFailure[]): RuntimeOscillationSeverity {
  if (failures.includes("CONFIDENCE_OSCILLATION") || failures.includes("REPEATED_DEGRADATION")) return "HIGH";
  if (failures.includes("REPEATED_RECOVERY") || failures.includes("CHECKPOINT_FAILURES")) return "MEDIUM";
  return failures.some((failure) => failure.includes("INSTABILITY")) ? "LOW" : "NONE";
}

function oscillationReport(healthId: string, failures: readonly RuntimeHealthFailure[], subsystems: readonly RuntimeSubsystemHealth[]) {
  const severity = oscillationSeverity(failures);
  const affected = severity === "NONE" ? freezeArray<RuntimeHealthComponent>([]) : freezeArray(subsystems.filter((item) => item.health_score < 88).map((item) => item.component));
  const source = {
    oscillation_id: id("RHO", "runtime-health-oscillation-id", healthId),
    severity,
    affected_subsystems: affected,
    frequency: severity === "NONE" ? 0 : severity === "HIGH" ? 5 : severity === "MEDIUM" ? 3 : 1,
    duration_ms: severity === "NONE" ? 0 : severity === "HIGH" ? 900000 : severity === "MEDIUM" ? 300000 : 60000,
    supporting_evidence: freezeArray(affected.map((component) => `evidence:${healthId}:oscillation:${component.toLowerCase()}`)),
  };
  return Object.freeze({ ...source, oscillation_hash: hashValue("runtime-health-oscillation", source) });
}

function buildExplanation(healthId: string, indicators: readonly RuntimeStabilityIndicator[], subsystems: readonly RuntimeSubsystemHealth[], failures: readonly RuntimeHealthFailure[], confidence: RuntimeConfidenceRecord) {
  const trend = trendFor(failures);
  const source = {
    explanation_id: id("RHE", "runtime-health-explanation-id", healthId),
    contributing_metrics: freezeArray(indicators.map((item) => item.indicator_hash)),
    subsystem_analysis: subsystems,
    detected_anomalies: failures,
    stability_rationale: "Governance-controlled v8ALT.1C weights evaluate stability, resilience, synchronization, and integrity deterministically.",
    trend_interpretation: trend === "DECLINING" ? "runtime health is degrading and requires intensified monitoring" : trend === "IMPROVING" ? "runtime health shows recovery while remaining under observation" : "runtime health is deterministic and stable",
    governance_influence: freezeArray([`governance-confidence:${confidence.governance_confidence}`]),
    constitutional_influence: freezeArray([`advisory-only:${confidence.advisory_only}`, `tenant:${confidence.tenant_id}`]),
    supporting_evidence: freezeArray([...confidence.evidence, ...indicators.map((item) => item.evidence_reference)]),
    recommended_monitoring_priorities: failures.length ? freezeArray(failures.map((failure) => `Monitor ${failure}`)) : freezeArray(["Maintain baseline runtime health monitoring."]),
  };
  return Object.freeze({ ...source, explanation_hash: hashValue("runtime-health-explanation", source) });
}

function buildTimeline(healthId: string, subsystems: readonly RuntimeSubsystemHealth[], indicators: readonly RuntimeStabilityIndicator[], failures: readonly RuntimeHealthFailure[], trend: AdaptiveTrend, replay_reference: string, lineage_reference: string): readonly RuntimeHealthTimelineEntry[] {
  const source = {
    timeline_id: id("RHT", "runtime-health-timeline-id", healthId),
    health_id: healthId,
    evaluation_timestamp: NOW,
    subsystem_health: subsystems,
    stability_indicators: indicators,
    trend_history: trend,
    degradation_events: failures.filter((failure) => !["REPEATED_RECOVERY"].includes(failure)),
    recovery_events: freezeArray(failures.includes("REPEATED_RECOVERY") ? ["recovery-cycle-detected"] : []),
    replay_reference,
    lineage_reference,
    integrity_hash: hashValue("runtime-health-timeline-integrity", { healthId, subsystems, indicators, failures, trend }),
    append_only: true as const,
  };
  return freezeArray([Object.freeze({ ...source, timeline_hash: hashValue("runtime-health-timeline", source) })]);
}

export function computeRuntimeHealthRecordHash(record: Omit<RuntimeHealthRecord, "record_hash"> | RuntimeHealthRecord): string {
  const { record_hash: _hash, ...source } = record as RuntimeHealthRecord;
  return hashValue("runtime-health-record", source);
}

export function evaluateRuntimeHealth(input: RuntimeHealthInput = {}): RuntimeHealthRecord {
  const scenario = input.scenario ?? "BASELINE";
  const confidence = input.confidence ?? confidenceForScenario(scenario);
  const confidenceValidation = validateRuntimeConfidence(confidence);
  const healthId = id("RHEV", "runtime-health-id", { scenario, confidence: confidence.record_hash });
  const failures = unique([
    ...scenarioFailures(scenario),
    ...(!confidenceValidation.inputs_valid ? ["INCOMPLETE_TELEMETRY" as const] : []),
    ...(!confidenceValidation.scores_normalized ? ["INVALID_TELEMETRY" as const] : []),
    ...(!confidenceValidation.replay_valid ? ["REPLAY_MISMATCH" as const] : []),
    ...(!confidenceValidation.tenant_isolated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!confidenceValidation.advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
    ...confidenceValidation.failures.filter((failure) => failure === "CONFIDENCE_OSCILLATION").map(() => "CONFIDENCE_OSCILLATION" as const),
  ]);
  const indicators = buildIndicators(healthId, failures);
  const subsystems = freezeArray(components.map((component) => subsystemHealth(component, componentScore(component, indicators), healthId)));
  const totalHealth = normalizeScore(subsystems.reduce((sum, item) => sum + item.stability_score, 0));
  const stability = normalizeScore(indicators.reduce((sum, item) => sum + item.stability_score, 0) / indicators.length);
  const trend = trendFor(failures);
  const replay_reference = `replay:${healthId}:v8alt-1c`;
  const lineage_reference = `lineage:${confidence.lineage_reference}:${healthId}`;
  const explanation = buildExplanation(healthId, indicators, subsystems, failures, confidence);
  const timeline = buildTimeline(healthId, subsystems, indicators, failures, trend, replay_reference, lineage_reference);
  const evidence = scenario === "INCOMPLETE_TELEMETRY" ? freezeArray([]) : freezeArray([...confidence.evidence, ...indicators.map((item) => item.indicator_hash)]);
  const base = {
    health_id: healthId,
    tenant_id: confidence.tenant_id,
    mission_id: confidence.mission_id,
    execution_id: confidence.execution_id,
    engine_version: VERSION,
    evaluation_timestamp: NOW,
    lifecycle,
    overall_runtime_health: totalHealth,
    execution_health: subsystems.find((item) => item.component === "EXECUTION")?.health_score ?? 0,
    planning_health: subsystems.find((item) => item.component === "PLANNING")?.health_score ?? 0,
    orchestration_health: subsystems.find((item) => item.component === "ORCHESTRATION")?.health_score ?? 0,
    delegation_health: subsystems.find((item) => item.component === "DELEGATION")?.health_score ?? 0,
    supervision_health: subsystems.find((item) => item.component === "SUPERVISION")?.health_score ?? 0,
    governance_health: subsystems.find((item) => item.component === "GOVERNANCE")?.health_score ?? 0,
    integrity_health: subsystems.find((item) => item.component === "INTEGRITY")?.health_score ?? 0,
    stability_score: stability,
    health_level: healthLevel(totalHealth),
    stability_indicators: indicators,
    subsystem_health: subsystems,
    oscillation_report: oscillationReport(healthId, failures, subsystems),
    detected_instability: freezeArray(failures.filter((failure) => failure.includes("INSTABILITY"))),
    detected_oscillation: failures.some((failure) => ["CONFIDENCE_OSCILLATION", "REPEATED_DEGRADATION", "REPEATED_RECOVERY", "CHECKPOINT_FAILURES"].includes(failure)),
    detected_failures: failures,
    health_trend: trend,
    trend_velocity: trend === "DECLINING" ? -0.4 : trend === "IMPROVING" ? 0.25 : failures.length ? -0.1 : 0,
    health_explanation: explanation,
    timeline,
    evidence,
    lineage_reference,
    replay_reference,
    integrity_hash: hashValue("runtime-health-integrity", { healthId, totalHealth, stability, subsystems: subsystems.map((item) => item.subsystem_hash), explanation: explanation.explanation_hash, timeline: timeline.map((item) => item.timeline_hash), evidence }),
    advisory_only: true as const,
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    governance_modified: false,
  };
  return Object.freeze({ ...base, record_hash: computeRuntimeHealthRecordHash(base as Omit<RuntimeHealthRecord, "record_hash">) });
}

export function replayRuntimeHealth(record = evaluateRuntimeHealth()): RuntimeHealthReplayResult {
  const deterministic = computeRuntimeHealthRecordHash(record) === record.record_hash;
  const source = {
    replay_id: id("RHR", "runtime-health-replay-id", record.health_id),
    health_id: record.health_id,
    deterministic,
    reconstructed_runtime_health: record.health_level,
    reconstructed_stability_score: record.stability_score,
    reconstructed_explanation_hash: record.health_explanation.explanation_hash,
    reconstructed_timeline_hash: record.timeline[0]?.timeline_hash ?? "",
    replay_failures: deterministic ? freezeArray<RuntimeHealthFailure>([]) : freezeArray<RuntimeHealthFailure>(["REPLAY_MISMATCH"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-health-replay", source) });
}

export function validateRuntimeHealth(record?: RuntimeHealthRecord): RuntimeHealthValidationResult {
  if (!record) {
    const failures = freezeArray<RuntimeHealthFailure>(["INCOMPLETE_TELEMETRY"]);
    const source = { health_id: null, validation_state: "FAIL" as const, valid: false, telemetry_valid: false, health_scores_normalized: false, stability_valid: false, evidence_complete: false, governance_valid: false, constitutional_valid: false, replay_valid: false, timeline_append_only: false, tenant_isolated: false, advisory_only: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("runtime-health-validation", source) });
  }
  const scores = [record.overall_runtime_health, record.execution_health, record.planning_health, record.orchestration_health, record.delegation_health, record.supervision_health, record.governance_health, record.integrity_health, record.stability_score];
  const telemetry_valid = Boolean(record.health_id && record.tenant_id && record.mission_id && record.execution_id && record.lifecycle.length === lifecycle.length);
  const health_scores_normalized = scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 100);
  const stability_valid = record.stability_indicators.length === components.length * 4 && record.subsystem_health.length === components.length;
  const evidence_complete = record.evidence.length > 0 && record.health_explanation.supporting_evidence.length > 0;
  const governance_valid = record.governance_health >= 60;
  const constitutional_valid = record.tenant_id.startsWith("tenant:");
  const replay_valid = replayRuntimeHealth(record).deterministic;
  const timeline_append_only = record.timeline.length > 0 && record.timeline.every((item) => item.append_only && item.integrity_hash && item.replay_reference && item.lineage_reference);
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const advisory_only = record.advisory_only && !record.execution_authorized && !record.execution_modified && !record.governance_modified;
  const failures = unique([
    ...record.detected_failures,
    ...(!telemetry_valid ? ["INCOMPLETE_TELEMETRY" as const] : []),
    ...(!health_scores_normalized ? ["INVALID_TELEMETRY" as const] : []),
    ...(!stability_valid ? ["INVALID_TELEMETRY" as const] : []),
    ...(!evidence_complete ? ["INCOMPLETE_TELEMETRY" as const] : []),
    ...(!governance_valid ? ["REPEATED_GOVERNANCE_VIOLATIONS" as const] : []),
    ...(!constitutional_valid || !tenant_isolated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!replay_valid || computeRuntimeHealthRecordHash(record) !== record.record_hash ? ["REPLAY_MISMATCH" as const] : []),
    ...(!timeline_append_only ? ["REPEATED_INTEGRITY_FAILURES" as const] : []),
    ...(!advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { health_id: record.health_id, validation_state: valid ? "PASS" as const : "FAIL" as const, valid, telemetry_valid, health_scores_normalized, stability_valid, evidence_complete, governance_valid, constitutional_valid, replay_valid, timeline_append_only, tenant_isolated, advisory_only, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("runtime-health-validation", source) });
}

export function certifyRuntimeHealth(record = evaluateRuntimeHealth()): RuntimeHealthCertification {
  const validation = validateRuntimeHealth(record);
  const source = {
    certification_id: id("RHC", "runtime-health-certification-id", record.health_id),
    health_id: record.health_id,
    certified: validation.valid && !["HIGH_RISK", "CRITICAL"].includes(record.health_level),
    validation,
    ready_for_drift_detection_engine: validation.valid && record.overall_runtime_health >= 90,
  };
  return Object.freeze({ ...source, certification_hash: hashValue("runtime-health-certification", source) });
}

export function publishRuntimeHealth(record = evaluateRuntimeHealth()): RuntimeHealthPublisherSurface {
  return Object.freeze({
    health_id: record.health_id,
    overall_runtime_health: record.overall_runtime_health,
    health_level: record.health_level,
    stability_score: record.stability_score,
    health_trend: record.health_trend,
    trend_velocity: record.trend_velocity,
    detected_instability: record.detected_instability,
    detected_oscillation: record.detected_oscillation,
    oscillation_severity: record.oscillation_report.severity,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    advisory_only: true,
  });
}

export function getRuntimeHealthStabilityEngineContract(): RuntimeHealthStabilityEngineContract {
  const health = evaluateRuntimeHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic", "explainable", "replayable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "integrity-protected", "certification-ready", "advisory-only"]),
      lifecycle,
      components,
      weights,
      health_levels: healthLevels,
      advisory_only: true,
    }),
    health,
    validation: validateRuntimeHealth(health),
    replay: replayRuntimeHealth(health),
    certification: certifyRuntimeHealth(health),
  });
}
