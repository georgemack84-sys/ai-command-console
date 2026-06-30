import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAssuranceRecommendation, validateAssuranceRecommendation } from "@/services/assurance-recommendation-engine";
import type { AssuranceRecommendationRecord, AssuranceRecommendationScenario } from "@/types/assurance-recommendation-engine";
import type {
  AssuranceRuntimeState,
  AssuranceStateCertification,
  AssuranceStateFailure,
  AssuranceStateInput,
  AssuranceStateLifecycleStage,
  AssuranceStateManagerContract,
  AssuranceStatePublisherSurface,
  AssuranceStateRecord,
  AssuranceStateReplayResult,
  AssuranceStateScenario,
  AssuranceStateScenarioMap,
  AssuranceStateValidationResult,
  AssuranceStateValidationStatus,
  AssuranceThresholdResult,
  AssuranceTransitionThreshold,
} from "@/types/assurance-state-manager";

const NOW = "2026-07-02T17:00:00.000Z";
const VERSION = "assurance-state-manager/v8ALT.1F" as const;
const lifecycle: readonly AssuranceStateLifecycleStage[] = Object.freeze(["COLLECT_RUNTIME_STATE", "VALIDATE_THRESHOLDS", "VERIFY_GOVERNANCE", "VERIFY_CONSTITUTION", "VERIFY_INTEGRITY", "DETERMINE_TRANSITION", "VALIDATE_REPLAY", "RECORD_STATE_HISTORY", "PUBLISH_ASSURANCE_STATE"]);
const states: readonly AssuranceRuntimeState[] = Object.freeze(["ASSURED", "STABLE", "WATCH", "DEGRADED", "CRITICAL"]);
const transitionMatrix: Readonly<Record<AssuranceRuntimeState, readonly AssuranceRuntimeState[]>> = Object.freeze({
  ASSURED: Object.freeze(["STABLE"] as const),
  STABLE: Object.freeze(["ASSURED", "WATCH"] as const),
  WATCH: Object.freeze(["STABLE", "DEGRADED"] as const),
  DEGRADED: Object.freeze(["WATCH", "CRITICAL"] as const),
  CRITICAL: Object.freeze(["DEGRADED"] as const),
});
const scenarioMap: AssuranceStateScenarioMap = Object.freeze({
  BASELINE: "BASELINE",
  STABLE_VARIATION: "EARLY_DEGRADATION",
  WATCH_DEGRADATION: "MONITORING_INSUFFICIENT",
  DEGRADED_RISK: "UNSAFE_CONTINUATION",
  CRITICAL_FAILURE: "CRITICAL_FAILURE",
  RECOVERY_TO_STABLE: "EARLY_DEGRADATION",
  RECOVERY_TO_WATCH: "PRESERVE_STATE",
  INVALID_TRANSITION: "BASELINE",
  SKIPPED_STATE: "CRITICAL_FAILURE",
  OSCILLATING_STATE: "EARLY_DEGRADATION",
  REPEATED_DEGRADATION: "UNSAFE_CONTINUATION",
  FAILED_RECOVERY: "KNOWN_GOOD_STATE_PREFERRED",
  INCONSISTENT_THRESHOLDS: "BASELINE",
  GOVERNANCE_FAILURE: "GOVERNANCE_CONCERN",
  CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_CONCERN",
  INTEGRITY_FAILURE: "KNOWN_GOOD_STATE_PREFERRED",
  REPLAY_MISMATCH: "REPLAY_MISMATCH",
  EXECUTION_AUTHORITY_ATTEMPT: "EXECUTION_AUTHORITY_ATTEMPT",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

export function buildAssuranceStateThresholds(): readonly AssuranceTransitionThreshold[] {
  const rows: readonly [AssuranceRuntimeState, number, number, number, readonly string[]][] = [
    ["ASSURED", 95, 95, 0, ["INFO"]],
    ["STABLE", 60, 60, 45, ["INFO", "LOW", "MODERATE"]],
    ["WATCH", 45, 45, 65, ["LOW", "MODERATE", "HIGH"]],
    ["DEGRADED", 45, 45, 75, ["MODERATE", "HIGH", "SEVERE"]],
    ["CRITICAL", 0, 0, 100, ["HIGH", "SEVERE", "CRITICAL"]],
  ];
  return freezeArray(rows.map(([state, min_confidence, min_health, max_drift_score, allowed_recommendation_severities]) => {
    const source = { threshold_id: id("AST", "assurance-state-threshold-id", state), state, min_confidence, min_health, max_drift_score, allowed_recommendation_severities: freezeArray(allowed_recommendation_severities), immutable: true as const };
    return Object.freeze({ ...source, threshold_hash: hashValue("assurance-state-threshold", source) });
  }));
}

function targetStateFor(recommendation: AssuranceRecommendationRecord): AssuranceRuntimeState {
  if (recommendation.recommendation_type === "TERMINATE_RECOMMENDATION" || recommendation.recommendation_severity === "CRITICAL") return "CRITICAL";
  if (["PAUSE", "ROLLBACK", "GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW"].includes(recommendation.recommendation_type)) return "DEGRADED";
  if (["CREATE_CHECKPOINT", "OPERATOR_REVIEW", "INCREASE_SUPERVISION"].includes(recommendation.recommendation_type)) return "WATCH";
  if (recommendation.recommendation_type === "MONITOR_CLOSELY") return "STABLE";
  return "ASSURED";
}

function defaultPreviousState(scenario: AssuranceStateScenario, target: AssuranceRuntimeState): AssuranceRuntimeState {
  if (scenario === "RECOVERY_TO_STABLE") return "WATCH";
  if (scenario === "RECOVERY_TO_WATCH") return "DEGRADED";
  if (scenario === "CRITICAL_FAILURE" || scenario === "SKIPPED_STATE") return "DEGRADED";
  if (scenario === "DEGRADED_RISK" || scenario === "GOVERNANCE_FAILURE" || scenario === "CONSTITUTIONAL_FAILURE" || scenario === "INTEGRITY_FAILURE") return "WATCH";
  if (scenario === "WATCH_DEGRADATION" || scenario === "FAILED_RECOVERY" || scenario === "REPEATED_DEGRADATION") return "STABLE";
  if (scenario === "STABLE_VARIATION" || scenario === "OSCILLATING_STATE") return "ASSURED";
  return target === "ASSURED" ? "STABLE" : "ASSURED";
}

function thresholdResult(threshold: AssuranceTransitionThreshold, recommendation: AssuranceRecommendationRecord, scenario: AssuranceStateScenario): AssuranceThresholdResult {
  const driftScore = recommendation.drift_severity === "NONE" ? 0 : recommendation.drift_severity === "LOW" ? 20 : recommendation.drift_severity === "MODERATE" ? 40 : recommendation.drift_severity === "HIGH" ? 60 : recommendation.drift_severity === "SEVERE" ? 80 : 100;
  const source = {
    threshold_result_id: id("ASTR", "assurance-state-threshold-result-id", { state: threshold.state, recommendation: recommendation.recommendation_id }),
    state: threshold.state,
    confidence_satisfied: scenario === "INCONSISTENT_THRESHOLDS" ? false : recommendation.confidence_score >= threshold.min_confidence,
    health_satisfied: recommendation.runtime_health_score >= threshold.min_health,
    drift_satisfied: driftScore <= threshold.max_drift_score,
    recommendation_satisfied: threshold.allowed_recommendation_severities.includes(recommendation.recommendation_severity),
    threshold_hash: threshold.threshold_hash,
  };
  return Object.freeze({ ...source, passed: source.confidence_satisfied && source.health_satisfied && source.drift_satisfied && source.recommendation_satisfied, result_hash: hashValue("assurance-state-threshold-result", source) });
}

export function validateAssuranceStateTransition(from_state: AssuranceRuntimeState, to_state: AssuranceRuntimeState, emergency = false) {
  const allowed = from_state === to_state || transitionMatrix[from_state].includes(to_state) || emergency;
  const source = { transition_id: id("ASX", "assurance-state-transition-id", { from_state, to_state, emergency }), from_state, to_state, allowed, emergency_transition: emergency, failure: allowed ? null : "INVALID_TRANSITION" as const };
  return Object.freeze({ ...source, validation_hash: hashValue("assurance-state-transition-validation", source) });
}

function validationStatus(ok: boolean): AssuranceStateValidationStatus { return ok ? "PASS" : "FAIL"; }

export function computeAssuranceStateHash(record: Omit<AssuranceStateRecord, "record_hash"> | AssuranceStateRecord): string {
  const { record_hash: _hash, ...source } = record as AssuranceStateRecord;
  return hashValue("assurance-state-record", source);
}

export function evaluateAssuranceState(input: AssuranceStateInput = {}): AssuranceStateRecord {
  const scenario = input.scenario ?? "BASELINE";
  const recommendation = input.recommendation ?? generateAssuranceRecommendation({ scenario: scenarioMap[scenario] as AssuranceRecommendationScenario });
  const recommendationValidation = validateAssuranceRecommendation(recommendation);
  const target = scenario === "INVALID_TRANSITION" ? "CRITICAL" : targetStateFor(recommendation);
  const previous = input.previous_state ?? defaultPreviousState(scenario, target);
  const emergency = scenario === "SKIPPED_STATE";
  const thresholds = buildAssuranceStateThresholds();
  const threshold_results = freezeArray(thresholds.map((threshold) => thresholdResult(threshold, recommendation, scenario)));
  const targetThreshold = threshold_results.find((item) => item.state === target);
  const governance_validation = validationStatus(scenario !== "GOVERNANCE_FAILURE" && recommendationValidation.governance_valid);
  const constitutional_validation = validationStatus(scenario !== "CONSTITUTIONAL_FAILURE" && recommendationValidation.constitutional_valid);
  const integrity_validation = validationStatus(scenario !== "INTEGRITY_FAILURE" && scenario !== "REPLAY_MISMATCH" && recommendationValidation.replay_valid);
  const transition_validation = validateAssuranceStateTransition(previous, target, emergency);
  const stateId = id("ASM", "assurance-state-id", { scenario, recommendation: recommendation.record_hash, previous, target });
  const failures = unique([
    ...(!transition_validation.allowed ? ["INVALID_TRANSITION" as const] : []),
    ...(scenario === "OSCILLATING_STATE" ? ["OSCILLATING_STATE_CHANGE" as const] : []),
    ...(scenario === "SKIPPED_STATE" ? ["SKIPPED_LIFECYCLE_STAGE" as const] : []),
    ...(scenario === "REPEATED_DEGRADATION" ? ["REPEATED_DEGRADATION" as const] : []),
    ...(scenario === "FAILED_RECOVERY" ? ["FAILED_RECOVERY_ATTEMPT" as const] : []),
    ...(!targetThreshold?.passed ? ["INCONSISTENT_THRESHOLDS" as const] : []),
    ...(governance_validation === "FAIL" ? ["GOVERNANCE_VALIDATION_FAILURE" as const] : []),
    ...(constitutional_validation === "FAIL" ? ["CONSTITUTIONAL_VALIDATION_FAILURE" as const] : []),
    ...(integrity_validation === "FAIL" ? ["INTEGRITY_VERIFICATION_FAILURE" as const] : []),
    ...(!recommendationValidation.evidence_complete ? ["INCOMPLETE_EVIDENCE" as const] : []),
    ...(!recommendationValidation.advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const transition_reason = failures.length ? `State ${previous} to ${target} requires validation attention: ${failures.join(",")}.` : `State transition ${previous} to ${target} satisfied certified thresholds.`;
  const replay_reference = `replay:${stateId}:v8alt-1f`;
  const lineage_reference = `lineage:${recommendation.lineage_reference}:${stateId}`;
  const historySource = {
    history_id: id("ASH", "assurance-state-history-id", stateId),
    assurance_state_id: stateId,
    old_state: previous,
    new_state: target,
    transition_reason,
    triggering_events: freezeArray([recommendation.recommendation_type, recommendation.recommendation_severity, recommendation.runtime_context, ...failures]),
    threshold_snapshot: threshold_results,
    governance_snapshot: governance_validation,
    constitutional_snapshot: constitutional_validation,
    integrity_snapshot: integrity_validation,
    timestamp: NOW,
    replay_reference,
    lineage_reference,
    append_only: true as const,
  };
  const state_history = freezeArray([Object.freeze({ ...historySource, history_hash: hashValue("assurance-state-history", historySource) })]);
  const base = {
    assurance_state_id: stateId,
    tenant_id: recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    execution_id: recommendation.execution_id,
    manager_version: VERSION,
    lifecycle: scenario === "SKIPPED_STATE" ? freezeArray(lifecycle.filter((stage) => stage !== "VERIFY_CONSTITUTION")) : lifecycle,
    current_state: target,
    previous_state: previous,
    transition_reason,
    transition_timestamp: NOW,
    confidence_score: recommendation.confidence_score,
    runtime_health_score: recommendation.runtime_health_score,
    drift_severity: recommendation.drift_severity,
    risk_level: recommendation.risk_level,
    threshold_results,
    transition_validation,
    governance_validation,
    constitutional_validation,
    integrity_validation,
    recommended_action: recommendation.recommendation_type,
    escalation_required: ["DEGRADED", "CRITICAL"].includes(target) || recommendation.operator_required,
    recovery_eligible: (previous === "WATCH" && target === "STABLE") || (previous === "DEGRADED" && target === "WATCH") || (previous === "CRITICAL" && target === "DEGRADED"),
    operator_notification_required: recommendation.operator_required || target !== "ASSURED",
    state_history,
    lineage_reference,
    replay_reference,
    integrity_hash: hashValue("assurance-state-integrity", { stateId, previous, target, thresholds: threshold_results.map((item) => item.result_hash), history: state_history.map((item) => item.history_hash), recommendation: recommendation.record_hash }),
    advisory_only: true as const,
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    governance_modified: false,
    operator_overridden: false,
  };
  return Object.freeze({ ...base, record_hash: computeAssuranceStateHash(base as Omit<AssuranceStateRecord, "record_hash">) });
}

export function replayAssuranceState(record = evaluateAssuranceState()): AssuranceStateReplayResult {
  const deterministic = computeAssuranceStateHash(record) === record.record_hash;
  const source = {
    replay_id: id("ASR", "assurance-state-replay-id", record.assurance_state_id),
    assurance_state_id: record.assurance_state_id,
    deterministic,
    reconstructed_current_state: record.current_state,
    reconstructed_previous_state: record.previous_state,
    reconstructed_transition_hash: record.transition_validation.validation_hash,
    reconstructed_history_hash: record.state_history[0]?.history_hash ?? "",
    replay_failures: deterministic ? freezeArray<AssuranceStateFailure>([]) : freezeArray<AssuranceStateFailure>(["REPLAY_MISMATCH"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("assurance-state-replay", source) });
}

export function validateAssuranceState(record?: AssuranceStateRecord): AssuranceStateValidationResult {
  if (!record) {
    const failures = freezeArray<AssuranceStateFailure>(["INVALID_TRANSITION"]);
    const source = { assurance_state_id: null, valid: false, threshold_valid: false, transition_valid: false, governance_valid: false, constitutional_valid: false, integrity_valid: false, replay_valid: false, history_append_only: false, tenant_isolated: false, advisory_only: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("assurance-state-validation", source) });
  }
  const threshold_valid = record.threshold_results.some((item) => item.state === record.current_state && item.passed);
  const transition_valid = record.transition_validation.allowed;
  const governance_valid = record.governance_validation === "PASS";
  const constitutional_valid = record.constitutional_validation === "PASS" && record.lifecycle.length === lifecycle.length;
  const integrity_valid = record.integrity_validation === "PASS" && Boolean(record.integrity_hash);
  const replay_valid = replayAssuranceState(record).deterministic;
  const history_append_only = record.state_history.length > 0 && record.state_history.every((item) => item.append_only && item.replay_reference && item.lineage_reference);
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const advisory_only = record.advisory_only && !record.execution_authorized && !record.execution_modified && !record.governance_modified && !record.operator_overridden;
  const triggeringFailures = record.state_history.flatMap((item) => item.triggering_events).filter((item): item is AssuranceStateFailure => ["INVALID_TRANSITION", "OSCILLATING_STATE_CHANGE", "SKIPPED_LIFECYCLE_STAGE", "REPEATED_DEGRADATION", "FAILED_RECOVERY_ATTEMPT", "INCONSISTENT_THRESHOLDS", "GOVERNANCE_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILURE", "INTEGRITY_VERIFICATION_FAILURE", "REPLAY_MISMATCH", "INCOMPLETE_EVIDENCE", "UNAUTHORIZED_EXECUTION_CAPABILITY"].includes(item));
  const failures = unique([
    ...triggeringFailures,
    ...(!threshold_valid ? ["INCONSISTENT_THRESHOLDS" as const] : []),
    ...(!transition_valid ? ["INVALID_TRANSITION" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_VALIDATION_FAILURE" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VALIDATION_FAILURE" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILURE" as const] : []),
    ...(!replay_valid || computeAssuranceStateHash(record) !== record.record_hash ? ["REPLAY_MISMATCH" as const] : []),
    ...(!history_append_only ? ["INTEGRITY_VERIFICATION_FAILURE" as const] : []),
    ...(!tenant_isolated ? ["CONSTITUTIONAL_VALIDATION_FAILURE" as const] : []),
    ...(!advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const valid = threshold_valid && transition_valid && governance_valid && constitutional_valid && integrity_valid && replay_valid && history_append_only && tenant_isolated && advisory_only && failures.length === 0;
  const source = { assurance_state_id: record.assurance_state_id, valid, threshold_valid, transition_valid, governance_valid, constitutional_valid, integrity_valid, replay_valid, history_append_only, tenant_isolated, advisory_only, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("assurance-state-validation", source) });
}

export function certifyAssuranceState(record = evaluateAssuranceState()): AssuranceStateCertification {
  const validation = validateAssuranceState(record);
  const source = {
    certification_id: id("ASC", "assurance-state-certification-id", record.assurance_state_id),
    assurance_state_id: record.assurance_state_id,
    certified: validation.valid,
    validation,
    ready_for_runtime_assurance_ledger: validation.valid,
  };
  return Object.freeze({ ...source, certification_hash: hashValue("assurance-state-certification", source) });
}

export function publishAssuranceState(record = evaluateAssuranceState()): AssuranceStatePublisherSurface {
  return Object.freeze({
    assurance_state_id: record.assurance_state_id,
    current_state: record.current_state,
    previous_state: record.previous_state,
    transition_reason: record.transition_reason,
    escalation_required: record.escalation_required,
    recovery_eligible: record.recovery_eligible,
    recommended_action: record.recommended_action,
    operator_notification_required: record.operator_notification_required,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    advisory_only: true,
  });
}

export function getAssuranceStateManagerContract(): AssuranceStateManagerContract {
  const state = evaluateAssuranceState();
  return Object.freeze({
    doctrine: Object.freeze({
      manager_version: VERSION,
      principles: freezeArray(["deterministic", "explainable", "replayable", "governance-validated", "constitutionally-compliant", "integrity-verified", "tenant-isolated", "certification-ready", "assurance-state-only"]),
      lifecycle,
      states,
      transition_matrix: transitionMatrix,
      advisory_only_for_execution: true,
    }),
    thresholds: buildAssuranceStateThresholds(),
    state,
    validation: validateAssuranceState(state),
    replay: replayAssuranceState(state),
    certification: certifyAssuranceState(state),
  });
}
