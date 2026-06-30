import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateDriftIntelligence, validateDriftIntelligence } from "@/services/drift-detection-trend-intelligence-engine";
import type { DriftIntelligenceRecord, DriftScenario } from "@/types/drift-detection-trend-intelligence-engine";
import type {
  AssuranceRecommendationAlternative,
  AssuranceRecommendationCertification,
  AssuranceRecommendationEngineContract,
  AssuranceRecommendationFailure,
  AssuranceRecommendationInput,
  AssuranceRecommendationLifecycleStage,
  AssuranceRecommendationPublisherSurface,
  AssuranceRecommendationRecord,
  AssuranceRecommendationReplayResult,
  AssuranceRecommendationScenario,
  AssuranceRecommendationScenarioMap,
  AssuranceRecommendationSeverity,
  AssuranceRecommendationState,
  AssuranceRecommendationType,
  AssuranceRecommendationValidationResult,
} from "@/types/assurance-recommendation-engine";

const NOW = "2026-07-02T16:00:00.000Z";
const VERSION = "assurance-recommendation-engine/v8ALT.1E" as const;
const lifecycle: readonly AssuranceRecommendationLifecycleStage[] = Object.freeze(["COLLECT_ASSURANCE_SIGNALS", "VALIDATE_INPUTS", "CLASSIFY_RECOMMENDATION", "EVALUATE_RISK_AND_SEVERITY", "MAP_GOVERNANCE_JUSTIFICATION", "MAP_CONSTITUTIONAL_REFERENCES", "GENERATE_ALTERNATIVES", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "PUBLISH_RECOMMENDATION"]);
const recommendationTypes: readonly AssuranceRecommendationType[] = Object.freeze(["CONTINUE", "MONITOR_CLOSELY", "OPERATOR_REVIEW", "INCREASE_SUPERVISION", "CREATE_CHECKPOINT", "PAUSE", "ROLLBACK", "GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "TERMINATE_RECOMMENDATION"]);
const severityLevels: readonly AssuranceRecommendationSeverity[] = Object.freeze(["INFO", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);
const scenarioMap: AssuranceRecommendationScenarioMap = Object.freeze({
  BASELINE: "BASELINE",
  EARLY_DEGRADATION: "LONG_TERM_CONFIDENCE_DECLINE",
  HUMAN_JUDGMENT_REQUIRED: "BASELINE_INVALID",
  MONITORING_INSUFFICIENT: "SUPERVISION_DEGRADATION",
  PRESERVE_STATE: "RAPID_CONFIDENCE_DEGRADATION",
  UNSAFE_CONTINUATION: "EXECUTION_DEGRADATION",
  KNOWN_GOOD_STATE_PREFERRED: "REPLAY_MISMATCH",
  GOVERNANCE_CONCERN: "POLICY_DRIFT",
  CONSTITUTIONAL_CONCERN: "CONSTITUTIONAL_DRIFT",
  CRITICAL_FAILURE: "CASCADING_FAILURES",
  MISSING_EVIDENCE: "BASELINE_INVALID",
  REPLAY_MISMATCH: "REPLAY_MISMATCH",
  EXECUTION_AUTHORITY_ATTEMPT: "EXECUTION_AUTHORITY_ATTEMPT",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function typeFor(scenario: AssuranceRecommendationScenario, drift: DriftIntelligenceRecord): AssuranceRecommendationType {
  if (scenario === "CRITICAL_FAILURE" || drift.drift_severity === "CRITICAL") return "TERMINATE_RECOMMENDATION";
  if (scenario === "CONSTITUTIONAL_CONCERN" || drift.affected_subsystem === "CONSTITUTIONAL") return "CONSTITUTIONAL_REVIEW";
  if (scenario === "GOVERNANCE_CONCERN" || ["POLICY", "GOVERNANCE"].includes(drift.affected_subsystem)) return "GOVERNANCE_REVIEW";
  if (scenario === "KNOWN_GOOD_STATE_PREFERRED" || drift.drift_explanation.contributing_factors.includes("REPLAY_MISMATCH")) return "ROLLBACK";
  if (scenario === "PRESERVE_STATE") return "CREATE_CHECKPOINT";
  if (scenario === "UNSAFE_CONTINUATION" || ["HIGH", "SEVERE"].includes(drift.drift_severity)) return "PAUSE";
  if (scenario === "MONITORING_INSUFFICIENT" || drift.affected_subsystem === "SUPERVISION") return "INCREASE_SUPERVISION";
  if (scenario === "HUMAN_JUDGMENT_REQUIRED" || scenario === "MISSING_EVIDENCE") return "OPERATOR_REVIEW";
  if (scenario === "EARLY_DEGRADATION" || drift.drift_severity === "MODERATE" || drift.drift_severity === "LOW") return "MONITOR_CLOSELY";
  return "CONTINUE";
}

function severityFor(type: AssuranceRecommendationType, drift: DriftIntelligenceRecord): AssuranceRecommendationSeverity {
  if (type === "TERMINATE_RECOMMENDATION") return "CRITICAL";
  if (type === "ROLLBACK" || drift.drift_severity === "SEVERE") return "SEVERE";
  if (type === "PAUSE" || type === "CONSTITUTIONAL_REVIEW" || type === "GOVERNANCE_REVIEW") return "HIGH";
  if (type === "CREATE_CHECKPOINT" || type === "OPERATOR_REVIEW" || type === "INCREASE_SUPERVISION") return "MODERATE";
  if (type === "MONITOR_CLOSELY") return "LOW";
  return "INFO";
}

function stateFor(type: AssuranceRecommendationType): AssuranceRecommendationState {
  if (type === "GOVERNANCE_REVIEW") return "REQUIRES_GOVERNANCE";
  if (type === "CONSTITUTIONAL_REVIEW") return "REQUIRES_CONSTITUTIONAL_REVIEW";
  if (type === "CONTINUE" || type === "MONITOR_CLOSELY") return "CERTIFIED_ADVISORY";
  return "REQUIRES_OPERATOR";
}

function alternative(recommendationId: string, type: AssuranceRecommendationType, accepted: boolean): AssuranceRecommendationAlternative {
  const source = {
    alternative_id: id("AREALT", "assurance-recommendation-alternative-id", { recommendationId, type, accepted }),
    recommendation_type: type,
    accepted,
    tradeoff: accepted ? "Primary recommendation best matches deterministic risk posture." : `${type} was considered but is less aligned with current assurance signals.`,
    safety_comparison: accepted ? "Selected as safest advisory posture." : "Rejected as less safe or less proportionate.",
  };
  return Object.freeze({ ...source, alternative_hash: hashValue("assurance-recommendation-alternative", source) });
}

function alternatives(recommendationId: string, type: AssuranceRecommendationType): readonly AssuranceRecommendationAlternative[] {
  const fallback: AssuranceRecommendationType[] = type === "CONTINUE" ? ["MONITOR_CLOSELY", "OPERATOR_REVIEW"] : type === "TERMINATE_RECOMMENDATION" ? ["PAUSE", "ROLLBACK"] : ["OPERATOR_REVIEW", "MONITOR_CLOSELY"];
  return freezeArray([alternative(recommendationId, type, true), ...fallback.filter((item) => item !== type).map((item) => alternative(recommendationId, item, false))]);
}

function governance(type: AssuranceRecommendationType, drift: DriftIntelligenceRecord): readonly string[] {
  return freezeArray(["policy enforcement preserved", "authority validation required before action", `drift domain ${drift.affected_subsystem}`, type === "GOVERNANCE_REVIEW" ? "governance pathway required" : "recommendation does not bypass governance"]);
}

function constitutional(type: AssuranceRecommendationType): readonly string[] {
  return freezeArray(["operator supremacy preserved", "governance supremacy preserved", "tenant isolation preserved", "fail-closed behavior preserved", "replay determinism preserved", "no hidden execution", `${type} remains advisory`]);
}

export function computeAssuranceRecommendationHash(record: Omit<AssuranceRecommendationRecord, "record_hash"> | AssuranceRecommendationRecord): string {
  const { record_hash: _hash, ...source } = record as AssuranceRecommendationRecord;
  return hashValue("assurance-recommendation-record", source);
}

export function generateAssuranceRecommendation(input: AssuranceRecommendationInput = {}): AssuranceRecommendationRecord {
  const scenario = input.scenario ?? "BASELINE";
  const drift = input.drift ?? evaluateDriftIntelligence({ scenario: scenarioMap[scenario] as DriftScenario });
  const driftValidation = validateDriftIntelligence(drift);
  const recType = typeFor(scenario, drift);
  const severity = severityFor(recType, drift);
  const recommendationId = id("AREC", "assurance-recommendation-id", { scenario, drift: drift.record_hash });
  const recAlternatives = alternatives(recommendationId, recType);
  const evidence = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...drift.supporting_evidence, drift.integrity_hash, drift.forecast.forecast_hash]);
  const reasoning = freezeArray([`Selected ${recType} from drift severity ${drift.drift_severity}.`, `Affected subsystem: ${drift.affected_subsystem}.`, `Forecast health ${drift.predicted_health}, confidence ${drift.predicted_confidence}.`]);
  const risks = freezeArray([`risk of continuing:${drift.drift_score}`, `risk of pausing:${severity}`, "risk of rollback:operator-confirmation-required", "risk of operator delay:increases-with-drift", "risk of governance ambiguity:review-required-when-policy-signals-present"]);
  const governance_justification = governance(recType, drift);
  const constitutional_references = constitutional(recType);
  const explanationSource = {
    summary: `${recType} recommended with ${severity} urgency.`,
    primary_reason: reasoning[0] ?? "Deterministic assurance recommendation generated.",
    supporting_signals: freezeArray([drift.drift_id, drift.forecast.forecast_hash, drift.drift_explanation.explanation_hash]),
    risk_analysis: risks.join("; "),
    alternative_analysis: recAlternatives.map((item) => `${item.recommendation_type}:${item.accepted ? "selected" : "rejected"}`).join("; "),
    governance_basis: governance_justification.join("; "),
    constitutional_basis: constitutional_references.join("; "),
    operator_visibility_note: "Recommendation is visible, evidence-backed, and advisory only.",
  };
  const explanation = Object.freeze({ ...explanationSource, explanation_hash: hashValue("assurance-recommendation-explanation", explanationSource) });
  const base = {
    recommendation_id: recommendationId,
    tenant_id: drift.tenant_id,
    mission_id: drift.mission_id,
    execution_id: drift.execution_id,
    engine_version: VERSION,
    lifecycle,
    recommendation_type: recType,
    recommendation_severity: severity,
    recommendation_state: stateFor(recType),
    runtime_context: `drift:${drift.drift_id}`,
    assurance_state: driftValidation.valid ? "VALIDATED" : "ATTENTION_REQUIRED",
    confidence_score: drift.predicted_confidence,
    runtime_health_score: drift.predicted_health,
    drift_severity: drift.drift_severity,
    risk_level: severity,
    reasoning,
    evidence,
    confidence: Math.max(0, Math.min(100, 100 - drift.drift_score)),
    risks,
    alternatives: recAlternatives,
    governance_justification,
    constitutional_references,
    explanation,
    operator_required: !["CONTINUE", "MONITOR_CLOSELY"].includes(recType),
    recommended_next_review: severity === "CRITICAL" ? "immediate" : severity === "SEVERE" || severity === "HIGH" ? "within-5-minutes" : "next-runtime-checkpoint",
    advisory_only: true as const,
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    governance_modified: false,
    operator_overridden: false,
    lineage_reference: `lineage:${drift.lineage_reference}:${recommendationId}`,
    replay_reference: `replay:${recommendationId}:v8alt-1e`,
    integrity_hash: hashValue("assurance-recommendation-integrity", { recommendationId, recType, severity, evidence, explanation: explanation.explanation_hash, alternatives: recAlternatives.map((item) => item.alternative_hash) }),
    created_at: NOW,
  };
  return Object.freeze({ ...base, record_hash: computeAssuranceRecommendationHash(base as Omit<AssuranceRecommendationRecord, "record_hash">) });
}

export function replayAssuranceRecommendation(record = generateAssuranceRecommendation()): AssuranceRecommendationReplayResult {
  const deterministic = computeAssuranceRecommendationHash(record) === record.record_hash;
  const source = {
    replay_id: id("ARER", "assurance-recommendation-replay-id", record.recommendation_id),
    recommendation_id: record.recommendation_id,
    deterministic,
    reconstructed_type: record.recommendation_type,
    reconstructed_severity: record.recommendation_severity,
    reconstructed_explanation_hash: record.explanation.explanation_hash,
    reconstructed_integrity_hash: record.integrity_hash,
    replay_failures: deterministic ? freezeArray<AssuranceRecommendationFailure>([]) : freezeArray<AssuranceRecommendationFailure>(["REPLAY_MISMATCH"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("assurance-recommendation-replay", source) });
}

export function validateAssuranceRecommendation(record?: AssuranceRecommendationRecord): AssuranceRecommendationValidationResult {
  if (!record) {
    const failures = freezeArray<AssuranceRecommendationFailure>(["MISSING_RECOMMENDATION_TYPE"]);
    const source = { recommendation_id: null, valid: false, recommendation_complete: false, evidence_complete: false, alternatives_complete: false, governance_valid: false, constitutional_valid: false, replay_valid: false, advisory_only: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("assurance-recommendation-validation", source) });
  }
  const recommendation_complete = Boolean(record.recommendation_type && record.recommendation_severity && record.reasoning.length && record.confidence >= 0 && record.risks.length && record.replay_reference && record.integrity_hash);
  const evidence_complete = record.evidence.length > 0;
  const alternatives_complete = record.alternatives.length > 0 && record.alternatives.some((item) => item.accepted);
  const governance_valid = record.governance_justification.length > 0 && !record.governance_modified;
  const constitutional_valid = record.constitutional_references.length >= 6 && !record.operator_overridden;
  const replay_valid = replayAssuranceRecommendation(record).deterministic;
  const advisory_only = record.advisory_only && !record.execution_authorized && !record.execution_modified && !record.governance_modified && !record.operator_overridden;
  const failures = unique([
    ...(!record.recommendation_type ? ["MISSING_RECOMMENDATION_TYPE" as const] : []),
    ...(!record.recommendation_severity ? ["MISSING_SEVERITY" as const] : []),
    ...(!record.reasoning.length ? ["MISSING_REASONING" as const] : []),
    ...(!evidence_complete ? ["MISSING_EVIDENCE" as const] : []),
    ...(!(record.confidence >= 0) ? ["MISSING_CONFIDENCE" as const] : []),
    ...(!record.risks.length ? ["MISSING_RISKS" as const] : []),
    ...(!alternatives_complete ? ["MISSING_ALTERNATIVES" as const] : []),
    ...(!governance_valid ? ["MISSING_GOVERNANCE_JUSTIFICATION" as const, "GOVERNANCE_BYPASS" as const] : []),
    ...(!constitutional_valid ? ["MISSING_CONSTITUTIONAL_REFERENCES" as const, "CONSTITUTIONAL_BYPASS" as const] : []),
    ...(!replay_valid || computeAssuranceRecommendationHash(record) !== record.record_hash ? ["REPLAY_MISMATCH" as const] : []),
    ...(!advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const valid = recommendation_complete && evidence_complete && alternatives_complete && governance_valid && constitutional_valid && replay_valid && advisory_only && failures.length === 0;
  const source = { recommendation_id: record.recommendation_id, valid, recommendation_complete, evidence_complete, alternatives_complete, governance_valid, constitutional_valid, replay_valid, advisory_only, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("assurance-recommendation-validation", source) });
}

export function certifyAssuranceRecommendation(record = generateAssuranceRecommendation()): AssuranceRecommendationCertification {
  const validation = validateAssuranceRecommendation(record);
  const source = {
    certification_id: id("AREC", "assurance-recommendation-certification-id", record.recommendation_id),
    recommendation_id: record.recommendation_id,
    certified: validation.valid,
    validation,
    ready_for_assurance_state_manager: validation.valid,
  };
  return Object.freeze({ ...source, certification_hash: hashValue("assurance-recommendation-certification", source) });
}

export function publishAssuranceRecommendation(record = generateAssuranceRecommendation()): AssuranceRecommendationPublisherSurface {
  return Object.freeze({
    recommendation_id: record.recommendation_id,
    recommendation_type: record.recommendation_type,
    recommendation_severity: record.recommendation_severity,
    recommendation_state: record.recommendation_state,
    operator_required: record.operator_required,
    risk_level: record.risk_level,
    summary: record.explanation.summary,
    alternatives: record.alternatives,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    advisory_only: true,
  });
}

export function getAssuranceRecommendationEngineContract(): AssuranceRecommendationEngineContract {
  const recommendation = generateAssuranceRecommendation();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic", "explainable", "replayable", "governance-preserving", "operator-authority-preserving", "constitutionally-compliant", "tenant-isolated", "advisory-only"]),
      lifecycle,
      recommendation_types: recommendationTypes,
      severity_levels: severityLevels,
      restrictions: freezeArray(["cannot execute recommendations", "cannot pause execution", "cannot rollback execution", "cannot terminate execution", "cannot create checkpoints directly", "cannot override governance", "cannot override the operator", "cannot modify execution state", "cannot modify policy", "cannot modify constitutional rules", "cannot hide recommendations", "cannot suppress evidence"]),
      advisory_only: true,
    }),
    recommendation,
    validation: validateAssuranceRecommendation(recommendation),
    replay: replayAssuranceRecommendation(recommendation),
    certification: certifyAssuranceRecommendation(recommendation),
  });
}
