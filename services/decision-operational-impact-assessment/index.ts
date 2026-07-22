import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ForecastImpactCategory,
  OperationalImpactAssessment,
  OperationalImpactAssessmentInput,
  OperationalImpactAssessmentResult,
  OperationalImpactExplanation,
  OperationalImpactFailureReason,
  OperationalImpactLedgerRecord,
  OperationalImpactLevel,
  OperationalImpactObservability,
  OperationalImpactReplayRecord,
  ResilienceLevel,
  RuntimeImpactAssessment,
} from "@/types/decision-operational-impact-assessment";

const NOW = "2026-07-03T09:55:00.000Z";
const ENGINE_VERSION = "operational-impact-assessment-engine/v1";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultCandidate(): DecisionCandidate {
  const normalized = normalizeDecisionCandidateInput();
  if (!normalized.candidate) throw new Error("default normalized decision candidate unavailable");
  return normalized.candidate;
}

function refs(input: OperationalImpactAssessmentInput, candidate: DecisionCandidate) {
  return Object.freeze({
    runtime_refs: normalizeStrings(input.runtime_refs ?? ["runtime_context_active"]),
    recovery_refs: normalizeStrings(input.recovery_refs ?? ["recovery_posture_baseline"]),
    forecast_refs: normalizeStrings(input.forecast_refs ?? ["forecast_mission_outcome_baseline"]),
    continuity_refs: normalizeStrings(input.continuity_refs ?? ["mission_continuity_baseline"]),
    resilience_refs: normalizeStrings(input.resilience_refs ?? ["operational_resilience_baseline"]),
    downstream_refs: normalizeStrings(input.downstream_refs ?? candidate.evidence_refs.map((ref) => `downstream_${ref}`)),
    evidence_refs: normalizeStrings(input.evidence_refs ?? candidate.evidence_refs),
    governance_refs: normalizeStrings(input.governance_refs ?? candidate.governance_refs),
    replay_refs: normalizeStrings(input.replay_refs ?? candidate.replay_refs),
  });
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function impactLevel(score: number): OperationalImpactLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "NONE";
}

function forecastCategory(score: number, futureRisk: number): ForecastImpactCategory {
  if (score >= 85 && futureRisk <= 30) return "VERY_POSITIVE";
  if (score >= 65 && futureRisk <= 55) return "POSITIVE";
  if (score >= 45 && futureRisk < 75) return "NEUTRAL";
  if (score >= 25) return "NEGATIVE";
  return "CRITICAL_NEGATIVE";
}

function resilienceLevel(score: number): ResilienceLevel {
  if (score >= 85) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "CRITICAL";
}

function runtimeScore(input: OperationalImpactAssessmentInput, candidate: DecisionCandidate): number {
  const health = input.runtime_health_score ?? 70;
  const latency = input.execution_latency_score ?? (candidate.operator_required ? 75 : 55);
  const degradation = input.runtime_degradation_score ?? 15;
  return clamp(health * 0.45 + latency * 0.25 + (100 - degradation) * 0.3);
}

function recoveryScore(input: OperationalImpactAssessmentInput): number {
  const readiness = input.recovery_readiness_score ?? 65;
  const rollback = input.rollback_availability_score ?? 60;
  const complexity = input.recovery_complexity_score ?? 35;
  return clamp(readiness * 0.45 + rollback * 0.3 + (100 - complexity) * 0.25);
}

function forecastScore(input: OperationalImpactAssessmentInput): number {
  const success = input.forecast_success_score ?? 68;
  const risk = input.future_risk_score ?? 35;
  const confidence = input.future_confidence_score ?? 72;
  return clamp(success * 0.45 + (100 - risk) * 0.25 + confidence * 0.3);
}

function stabilityScore(input: OperationalImpactAssessmentInput): number {
  return clamp(input.execution_stability_score ?? 62);
}

function continuityScore(input: OperationalImpactAssessmentInput): number {
  return clamp(input.continuity_score ?? 70);
}

function resilienceScore(input: OperationalImpactAssessmentInput): number {
  return clamp(input.resilience_score ?? 65);
}

function downstreamScore(input: OperationalImpactAssessmentInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.downstream_consequence_score !== undefined) return clamp(input.downstream_consequence_score);
  const affected = input.affected_components?.length ?? referenceSet.downstream_refs.length;
  return clamp(Math.min(100, affected * 18));
}

function compositeOperationalScore(scores: {
  runtime: number;
  recovery: number;
  forecast: number;
  stability: number;
  continuity: number;
  resilience: number;
  downstream: number;
}): number {
  return clamp(
    scores.runtime * 0.18
    + scores.recovery * 0.16
    + scores.forecast * 0.18
    + scores.stability * 0.14
    + scores.continuity * 0.14
    + scores.resilience * 0.12
    + scores.downstream * 0.08,
  );
}

function priorityAdjustment(score: number, forecast: ForecastImpactCategory): number {
  if (score >= 90 || forecast === "CRITICAL_NEGATIVE") return 20;
  if (score >= 75 || forecast === "VERY_POSITIVE") return 15;
  if (score >= 45 || forecast === "POSITIVE") return 8;
  return 0;
}

function scoreInputsInvalid(input: OperationalImpactAssessmentInput): boolean {
  return [
    input.runtime_health_score,
    input.execution_latency_score,
    input.runtime_degradation_score,
    input.recovery_readiness_score,
    input.rollback_availability_score,
    input.recovery_complexity_score,
    input.forecast_success_score,
    input.future_risk_score,
    input.future_confidence_score,
    input.execution_stability_score,
    input.continuity_score,
    input.resilience_score,
    input.downstream_consequence_score,
  ].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100));
}

function collectFailures(input: OperationalImpactAssessmentInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): OperationalImpactFailureReason[] {
  const failures: OperationalImpactFailureReason[] = [];
  if ((input.hidden_weighting_refs ?? []).length > 0) failures.push("HIDDEN_OPERATIONAL_WEIGHTING_DETECTED");
  if ((input.nondeterministic_forecast_refs ?? []).length > 0) failures.push("FORECAST_NONDETERMINISM_DETECTED");
  if (referenceSet.runtime_refs.length === 0) failures.push("RUNTIME_CONTEXT_INCOMPLETE");
  if (referenceSet.recovery_refs.length === 0) failures.push("RECOVERY_INFORMATION_UNAVAILABLE");
  if (referenceSet.forecast_refs.length === 0) failures.push("FORECAST_REFERENCES_MISSING");
  if (referenceSet.continuity_refs.length === 0) failures.push("CONTINUITY_ANALYSIS_INCOMPLETE");
  if (referenceSet.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (referenceSet.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scoreInputsInvalid(input)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (tenantLeak([
    ...referenceSet.runtime_refs,
    ...referenceSet.recovery_refs,
    ...referenceSet.forecast_refs,
    ...referenceSet.continuity_refs,
    ...referenceSet.resilience_refs,
    ...referenceSet.downstream_refs,
    ...referenceSet.evidence_refs,
    ...referenceSet.governance_refs,
    ...referenceSet.replay_refs,
  ], candidate.tenant_id)) failures.push("CROSS_TENANT_OPERATIONAL_DATA_DETECTED");
  return failures;
}

function buildRuntimeAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, runtime: number, latency: number, stability: number): RuntimeImpactAssessment {
  const base: Omit<RuntimeImpactAssessment, "integrity_hash"> = {
    runtime_assessment_id: `runtime_impact_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    runtime_health_score: runtime,
    execution_latency_score: latency,
    stability_score: stability,
    runtime_impact_score: clamp(runtime * 0.55 + latency * 0.2 + stability * 0.25),
    runtime_classification: impactLevel(runtime),
    explanation_ref: `operational_impact_explanation_${candidate.candidate_id}`,
    runtime_refs: referenceSet.runtime_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildOperationalAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, scores: {
  runtime: number;
  recovery: number;
  forecast: number;
  futureRisk: number;
  stability: number;
  continuity: number;
  resilience: number;
  downstream: number;
  composite: number;
}): OperationalImpactAssessment {
  const base: Omit<OperationalImpactAssessment, "integrity_hash"> = {
    assessment_id: `operational_impact_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    runtime_score: scores.runtime,
    recovery_score: scores.recovery,
    forecast_score: scores.forecast,
    execution_stability_score: scores.stability,
    continuity_score: scores.continuity,
    resilience_score: scores.resilience,
    downstream_consequence_score: scores.downstream,
    composite_operational_score: scores.composite,
    operational_classification: impactLevel(scores.composite),
    forecast_category: forecastCategory(scores.forecast, scores.futureRisk),
    resilience_level: resilienceLevel(scores.resilience),
    explanation_ref: `operational_impact_explanation_${candidate.candidate_id}`,
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(assessment: OperationalImpactAssessment, runtime: RuntimeImpactAssessment, adjustment: number): OperationalImpactExplanation {
  const base: Omit<OperationalImpactExplanation, "integrity_hash"> = {
    explanation_id: assessment.explanation_ref,
    decision_candidate_id: assessment.decision_candidate_id,
    runtime_rationale: `${runtime.runtime_classification} runtime impact with score ${assessment.runtime_score}.`,
    recovery_rationale: `Recovery posture score ${assessment.recovery_score}.`,
    forecast_rationale: `${assessment.forecast_category} forecast impact with score ${assessment.forecast_score}.`,
    stability_rationale: `Execution stability score ${assessment.execution_stability_score}.`,
    continuity_rationale: `Mission continuity score ${assessment.continuity_score}.`,
    resilience_rationale: `${assessment.resilience_level} resilience with score ${assessment.resilience_score}.`,
    downstream_rationale: `Downstream consequence score ${assessment.downstream_consequence_score}.`,
    priority_adjustment_rationale: `Operational priority adjustment ${adjustment}.`,
    replay_refs: assessment.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(assessment: OperationalImpactAssessment, runtime: RuntimeImpactAssessment, affectedComponents: readonly string[], adjustment: number): OperationalImpactLedgerRecord {
  const base: Omit<OperationalImpactLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `operational_impact_ledger_${assessment.decision_candidate_id}`,
    decision_candidate_id: assessment.decision_candidate_id,
    operational_assessment_ref: assessment.assessment_id,
    runtime_assessment_ref: runtime.runtime_assessment_id,
    runtime_score: assessment.runtime_score,
    recovery_score: assessment.recovery_score,
    forecast_score: assessment.forecast_score,
    composite_operational_score: assessment.composite_operational_score,
    priority_adjustment: adjustment,
    affected_components: affectedComponents,
    governance_refs: assessment.governance_refs,
    evidence_refs: assessment.evidence_refs,
    replay_refs: assessment.replay_refs,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { operational: OperationalImpactAssessment; runtime: RuntimeImpactAssessment; explanation: OperationalImpactExplanation; ledger: OperationalImpactLedgerRecord }): string {
  return hash(input);
}

function buildReplay(candidateId: string, replayHash: string, runtime: number, recovery: number, forecast: number, failures: readonly OperationalImpactFailureReason[]): OperationalImpactReplayRecord {
  const base: Omit<OperationalImpactReplayRecord, "integrity_hash"> = {
    replay_id: `operational_impact_replay_${candidateId}`,
    decision_candidate_id: candidateId,
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    runtime_score: runtime,
    recovery_score: recovery,
    forecast_score: forecast,
    replay_valid: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function assessOperationalImpact(input: OperationalImpactAssessmentInput = {}): OperationalImpactAssessmentResult {
  const candidate = input.candidate ?? defaultCandidate();
  const referenceSet = refs(input, candidate);
  const runtime = runtimeScore(input, candidate);
  const recovery = recoveryScore(input);
  const forecast = forecastScore(input);
  const stability = stabilityScore(input);
  const continuity = continuityScore(input);
  const resilience = resilienceScore(input);
  const downstream = downstreamScore(input, referenceSet);
  const futureRisk = clamp(input.future_risk_score ?? 35);
  const composite = compositeOperationalScore({ runtime, recovery, forecast, stability, continuity, resilience, downstream });
  const runtimeAssessment = buildRuntimeAssessment(candidate, referenceSet, runtime, clamp(input.execution_latency_score ?? (candidate.operator_required ? 75 : 55)), stability);
  const operationalAssessment = buildOperationalAssessment(candidate, referenceSet, { runtime, recovery, forecast, futureRisk, stability, continuity, resilience, downstream, composite });
  const adjustment = priorityAdjustment(composite, operationalAssessment.forecast_category);
  const explanation = buildExplanation(operationalAssessment, runtimeAssessment, adjustment);
  const affectedComponents = Object.freeze(normalizeStrings(input.affected_components ?? referenceSet.downstream_refs));
  const ledger = buildLedger(operationalAssessment, runtimeAssessment, affectedComponents, adjustment);
  const failures = collectFailures(input, candidate, referenceSet);
  const replayHash = replayHashValue({ operational: operationalAssessment, runtime: runtimeAssessment, explanation, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "OPERATIONAL_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(candidate.candidate_id, replayHash, runtime, recovery, forecast, Object.freeze(replayFailures));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const priority = createDecisionPriority({
    candidate,
    scores: { runtime_score: runtime, recovery_score: recovery, forecast_score: forecast },
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
  });
  const base: Omit<OperationalImpactAssessmentResult, "integrity_hash"> = {
    assessment_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    operational_assessment: operationalAssessment,
    runtime_assessment: runtimeAssessment,
    explanation,
    ledger_record: ledger,
    replay_record: replay,
    priority_input: priority,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayOperationalImpactAssessment(result: OperationalImpactAssessmentResult): OperationalImpactReplayRecord {
  const replayHash = replayHashValue({
    operational: result.operational_assessment,
    runtime: result.runtime_assessment,
    explanation: result.explanation,
    ledger: result.ledger_record,
  });
  const failures: OperationalImpactFailureReason[] = replayHash === result.replay_hash ? [] : ["OPERATIONAL_REPLAY_MISMATCH"];
  return buildReplay(
    result.operational_assessment.decision_candidate_id,
    replayHash,
    result.operational_assessment.runtime_score,
    result.operational_assessment.recovery_score,
    result.operational_assessment.forecast_score,
    Object.freeze(failures),
  );
}

export function buildOperationalImpactObservability(results: readonly OperationalImpactAssessmentResult[]): OperationalImpactObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.assessment_status === "PASS").length,
    fail_count: results.filter((result) => result.assessment_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    runtime_failures: results.filter((result) => result.failures.includes("RUNTIME_CONTEXT_INCOMPLETE")).length,
    forecast_failures: results.filter((result) => result.failures.includes("FORECAST_REFERENCES_MISSING") || result.failures.includes("FORECAST_NONDETERMINISM_DETECTED")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_OPERATIONAL_DATA_DETECTED")).length,
    average_operational_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.operational_assessment.composite_operational_score, 0) / results.length,
    average_runtime_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.operational_assessment.runtime_score, 0) / results.length,
    average_recovery_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.operational_assessment.recovery_score, 0) / results.length,
    average_forecast_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.operational_assessment.forecast_score, 0) / results.length,
    operational_distribution: Object.freeze(results.reduce<Record<OperationalImpactLevel, number>>((counts, result) => {
      counts[result.operational_assessment.operational_classification] = (counts[result.operational_assessment.operational_classification] ?? 0) + 1;
      return counts;
    }, {} as Record<OperationalImpactLevel, number>)),
    forecast_distribution: Object.freeze(results.reduce<Record<ForecastImpactCategory, number>>((counts, result) => {
      counts[result.operational_assessment.forecast_category] = (counts[result.operational_assessment.forecast_category] ?? 0) + 1;
      return counts;
    }, {} as Record<ForecastImpactCategory, number>)),
  });
}

export function getOperationalImpactAssessmentEngine() {
  const result = assessOperationalImpact();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayOperationalImpactAssessment(result),
    observability: buildOperationalImpactObservability([result]),
  });
}
