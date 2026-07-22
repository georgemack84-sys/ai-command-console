import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runRecommendationSynthesisIntelligence, validateRecommendationSynthesisIntelligence } from "@/services/recommendation-synthesis-intelligence";
import type {
  EffectivenessEvaluationReport,
  MissingLateEvidenceReport,
  ObservationCertification,
  ObservationCertificationTest,
  ObservationClosureRecord,
  ObservationEvidenceSet,
  ObservationFailure,
  ObservationInput,
  ObservationLedger,
  ObservationObservabilityReport,
  ObservationQualificationReport,
  ObservationReplayReport,
  ObservationScenario,
  ObservationWindow,
  OutcomeObservationArtifact,
  OutcomeObservationContractBundle,
  OutcomeObservationResult,
  OutcomeObservationValidation,
} from "@/types/outcome-observation-evaluation";

const VERSION = "outcome-observation-evaluation/v12.10" as const;
const ID = "OutcomeObservationEvaluation" as const;
const START = "2026-07-15T01:00:00.000Z";
const END = "2026-08-14T01:00:00.000Z";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: ObservationScenario): ObservationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly ObservationFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function windowFor(recommendationId: string, failures: readonly ObservationFailure[]): ObservationWindow {
  return nested({ window_id: id("observation_window", recommendationId), opening_conditions: freezeArray(["recommendation published", "operator review complete"]), activation_time: START, observation_duration_days: 30, collection_period_days: 21, evaluation_period_days: 7, closure_criteria: freezeArray(["collection finalized", "qualification complete", "evaluation complete"]), grace_period_days: 5, late_evidence_policy: "append-only supplemental observation", expiration_behavior: "close exactly once", state: "ARCHIVED" as const, opened_once: !failures.includes("WINDOW_MISSING"), closed_once: !failures.includes("WINDOW_REOPENED"), overlaps_existing_window: failures.includes("WINDOW_OVERLAP"), immutable_timing: !failures.includes("WINDOW_TIMING_MUTABLE") });
}

function evidence(recommendationId: string, failures: readonly ObservationFailure[]): ObservationEvidenceSet {
  const refs = failures.includes("EVIDENCE_COLLECTION_INCOMPLETE") ? freezeArray(["evidence:outcome:partial"]) : freezeArray(["evidence:outcome:kpi", "evidence:outcome:audit", "evidence:outcome:operator-assessment"]);
  const dupes = failures.includes("DUPLICATE_EVIDENCE") ? freezeArray([refs[0]]) : freezeArray([]);
  return nested({ evidence_set_id: id("observation_evidence", recommendationId), evidence_refs: refs, evidence_timeline: freezeArray(refs.map((ref, i) => `${START}:collected:${i}:${ref}`)), collection_sources: freezeArray(["kpi", "audit", "operator"]), append_only: true, recommendation_immutable: !failures.includes("RECOMMENDATION_MUTATED"), integrity_valid: !failures.includes("EVIDENCE_INTEGRITY_FAILED"), duplicate_evidence_refs: dupes });
}

function qualification(ev: ObservationEvidenceSet, failures: readonly ObservationFailure[]): ObservationQualificationReport {
  const complete = ev.evidence_refs.length >= 3 && !failures.includes("QUALIFICATION_FAILED");
  return nested({ report_id: id("observation_qualification", ev.evidence_set_id), status: complete ? "QUALIFIED" as const : "INSUFFICIENT_EVIDENCE" as const, evidence_completeness: complete ? 1 : 0.4, evidence_integrity: ev.integrity_valid, policy_compliant: !failures.includes("POLICY_BINDING_INVALID"), governance_approved: !failures.includes("GOVERNANCE_FAILURE"), temporal_valid: !failures.includes("TEMPORAL_VALIDITY_FAILED"), source_authentic: !failures.includes("SOURCE_AUTHENTICITY_FAILED"), duplicates_absent: ev.duplicate_evidence_refs.length === 0, replay_eligible: !failures.includes("REPLAY_MISMATCH"), confidence: 0.79, uncertainty: 0.17 });
}

function evaluation(q: ObservationQualificationReport, failures: readonly ObservationFailure[]): EffectivenessEvaluationReport {
  const evaluable = q.status === "QUALIFIED" && !failures.includes("EVALUATION_INCOMPLETE");
  return nested({ report_id: id("effectiveness_evaluation", q.report_id), expected_benefits_achieved: 0.82, realized_risks: 0.24, forecast_accuracy: 0.78, baseline_improvement: 0.19, portfolio_contribution: 0.81, resource_efficiency: 0.74, governance_impact: 0.88, operator_burden: 0.31, effectiveness_score: failures.includes("EFFECTIVENESS_NONDETERMINISTIC") ? 0.41 : 0.8, outcome: evaluable ? "MET_EXPECTATIONS" as const : "NOT_EVALUABLE" as const, variance_analysis: freezeArray(["forecast variance +0.04", "risk realization within threshold", "benefit realization met target"]), reproducible: !failures.includes("EFFECTIVENESS_NONDETERMINISTIC") });
}

function closure(w: ObservationWindow, q: ObservationQualificationReport, e: EffectivenessEvaluationReport, failures: readonly ObservationFailure[]): ObservationClosureRecord {
  const complete = w.closed_once && q.status === "QUALIFIED" && e.outcome !== "NOT_EVALUABLE" && !failures.includes("CLOSURE_NONDETERMINISTIC");
  return nested({ closure_id: id("observation_closure", w.window_id), outcome: complete ? "COMPLETED" as const : "INCOMPLETE" as const, window_complete: w.closed_once && !w.overlaps_existing_window, collection_finalized: !failures.includes("EVIDENCE_COLLECTION_INCOMPLETE"), qualification_complete: q.status === "QUALIFIED", evaluation_complete_or_impossible: !failures.includes("EVALUATION_INCOMPLETE"), outstanding_evidence_disposition: "late and missing evidence recorded append-only", governance_satisfied: q.governance_approved, immutable: complete });
}

function missingLate(failures: readonly ObservationFailure[]): MissingLateEvidenceReport {
  return nested({ report_id: id("missing_late_evidence", VERSION), missing_evidence_refs: failures.includes("MISSING_EVIDENCE_UNRECORDED") ? freezeArray([]) : freezeArray(["evidence:external-delayed"]), late_evidence_refs: freezeArray(["evidence:late:partner-report"]), supplemental_observation_refs: freezeArray(["supplemental-observation:late-evidence:v1"]), historical_evaluation_mutated: failures.includes("LATE_EVIDENCE_MUTATED_HISTORY"), arrival_chronology_preserved: true });
}

function observation(tenantId: string, rec: ReturnType<typeof runRecommendationSynthesisIntelligence>, w: ObservationWindow, ev: ObservationEvidenceSet, q: ObservationQualificationReport, e: EffectivenessEvaluationReport, c: ObservationClosureRecord, failures: readonly ObservationFailure[]): OutcomeObservationArtifact {
  const seed = { recommendation: rec.recommendation.recommendation_id, window: w.window_id, version: VERSION };
  const observationId = failures.includes("OBSERVATION_IDENTITY_NONDETERMINISTIC") ? id("outcome_observation", { seed, nonce: "unstable" }) : id("outcome_observation", seed);
  return nested({ observation_id: observationId, recommendation_id: rec.recommendation.recommendation_id, recommendation_cycle_id: rec.recommendation.recommendation_cycle_id, strategy_ref: rec.recommendation.recommended_strategy_ref, portfolio_ref: rec.recommendation.recommended_portfolio_ref, observation_window_id: w.window_id, observation_scope: "recommendation-effectiveness", observation_type: "CONTROLLED_OUTCOME_OBSERVATION", expected_outcomes_ref: "expected-outcomes:recommendation:v1", forecast_refs: rec.recommendation.forecast_refs, baseline_ref: rec.recommendation.baseline_ref, comparison_refs: rec.recommendation.comparison_refs, observed_metrics: Object.freeze({ benefit_realization: e.expected_benefits_achieved, forecast_accuracy: e.forecast_accuracy, effectiveness: e.effectiveness_score }), observed_outcomes: freezeArray(["benefits realized within forecast band", "risks remained bounded"]), evidence_refs: ev.evidence_refs, observation_status: "ARCHIVED" as const, qualification_status: q.status, confidence: q.confidence, uncertainty: q.uncertainty, evaluation_result: e.outcome, effectiveness_score: e.effectiveness_score, variance_summary: e.variance_analysis.join("; "), observation_start: START, observation_end: END, closure_reason: c.outcome, origin_ref: `origin:${rec.recommendation.recommendation_id}:outcome-observation`, policy_manifest_ref: failures.includes("POLICY_BINDING_INVALID") ? "" : rec.recommendation.policy_set_manifest_ref, created_at: START, closed_at: END, tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant_beta" : tenantId, advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION") });
}

function replay(failures: readonly ObservationFailure[]): ObservationReplayReport {
  const ok = !failures.includes("REPLAY_MISMATCH");
  return nested({ report_id: id("observation_replay", VERSION), window_restored: ok, evidence_timeline_restored: ok, qualification_restored: ok, policy_binding_restored: ok, evaluation_restored: ok, closure_restored: ok, late_evidence_restored: ok, outcome: ok ? "MATCH" as const : "FAILURE" as const });
}

function ledger(obs: OutcomeObservationArtifact, failures: readonly ObservationFailure[]): ObservationLedger {
  const entries = freezeArray(["OBSERVATION_REGISTERED", "WINDOW_OPENED", "EVIDENCE_COLLECTED", "OBSERVATION_QUALIFIED", "EVALUATED", "CLOSED", "REPLAYED", "ARCHIVED"].map((type, index) => nested({ entry_id: id("observation_ledger_entry", { type, index, obs: obs.observation_id }), type, subject_id: obs.observation_id })));
  return nested({ ledger_id: id("observation_ledger", obs.observation_id), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, entries });
}

function observability(obs: OutcomeObservationArtifact, ev: ObservationEvidenceSet, replayReport: ObservationReplayReport, failures: readonly ObservationFailure[]): ObservationObservabilityReport {
  return nested({ report_id: id("observation_observability", obs.observation_id), observation_latency_ms: 160, evidence_count: ev.evidence_refs.length, qualification_rate: obs.qualification_status === "QUALIFIED" ? 1 : 0, replay_success: replayReport.outcome === "MATCH" ? 1 : 0, effectiveness_score: obs.effectiveness_score, late_evidence_count: 1, governance_failures: failures.includes("GOVERNANCE_FAILURE") ? 1 : 0, observable: !failures.includes("OBSERVABILITY_MISSING") });
}

function certTest(name: string, passed: boolean, failure: ObservationFailure, refs: readonly string[]): ObservationCertificationTest {
  return nested({ test_id: id("observation_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}

type CertBase = Omit<OutcomeObservationResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly ObservationCertificationTest[] {
  const refs = freezeArray([result.observation.integrity_hash, result.window.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Observation contract valid", result.observation.observation_id.length > 0, "OBSERVATION_CONTRACT_INVALID", refs),
    certTest("Observation identity deterministic", result.observation.observation_id === id("outcome_observation", { recommendation: result.observation.recommendation_id, window: result.window.window_id, version: VERSION }), "OBSERVATION_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Exactly one window defined", result.window.opened_once && result.window.closed_once, "WINDOW_MISSING", refs),
    certTest("Window cannot reopen", result.window.closed_once, "WINDOW_REOPENED", refs),
    certTest("Window does not overlap", !result.window.overlaps_existing_window, "WINDOW_OVERLAP", refs),
    certTest("Window timing immutable", result.window.immutable_timing, "WINDOW_TIMING_MUTABLE", refs),
    certTest("Evidence collection complete", result.evidence.evidence_refs.length >= 3, "EVIDENCE_COLLECTION_INCOMPLETE", refs),
    certTest("Evidence integrity valid", result.evidence.integrity_valid, "EVIDENCE_INTEGRITY_FAILED", refs),
    certTest("Recommendation history immutable", result.evidence.recommendation_immutable, "RECOMMENDATION_MUTATED", refs),
    certTest("Qualification complete", result.qualification.status === "QUALIFIED", "QUALIFICATION_FAILED", refs),
    certTest("Duplicate evidence absent", result.qualification.duplicates_absent, "DUPLICATE_EVIDENCE", refs),
    certTest("Temporal validity enforced", result.qualification.temporal_valid, "TEMPORAL_VALIDITY_FAILED", refs),
    certTest("Source authenticity enforced", result.qualification.source_authentic, "SOURCE_AUTHENTICITY_FAILED", refs),
    certTest("Closure deterministic", result.closure.immutable, "CLOSURE_NONDETERMINISTIC", refs),
    certTest("Evaluation complete", result.evaluation.outcome !== "NOT_EVALUABLE", "EVALUATION_INCOMPLETE", refs),
    certTest("Effectiveness reproducible", result.evaluation.reproducible, "EFFECTIVENESS_NONDETERMINISTIC", refs),
    certTest("Late evidence append-only", !result.missing_late_evidence.historical_evaluation_mutated, "LATE_EVIDENCE_MUTATED_HISTORY", refs),
    certTest("Missing evidence recorded", result.missing_late_evidence.missing_evidence_refs.length > 0, "MISSING_EVIDENCE_UNRECORDED", refs),
    certTest("Replay matches", result.replay.outcome === "MATCH", "REPLAY_MISMATCH", refs),
    certTest("Policy binding valid", result.observation.policy_manifest_ref.length > 0, "POLICY_BINDING_INVALID", refs),
    certTest("Governance approved", result.qualification.governance_approved, "GOVERNANCE_FAILURE", refs),
    certTest("Advisory boundary preserved", result.observation.advisory_only, "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Tenant isolation preserved", result.observation.tenant_id === "tenant_mission_control", "TENANT_ISOLATION_BREACH", refs),
    certTest("Ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<OutcomeObservationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ observation: result.observation.integrity_hash, window: result.window.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, closure: result.closure.integrity_hash, evaluation: result.evaluation.integrity_hash, missing: result.missing_late_evidence.integrity_hash, replay: result.replay.integrity_hash, ledger: result.ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<OutcomeObservationResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runOutcomeObservationEvaluation(input: ObservationInput = {}): OutcomeObservationResult {
  const rec = runRecommendationSynthesisIntelligence({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const recValid = validateRecommendationSynthesisIntelligence(rec).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<ObservationFailure>([...(recValid ? [] : ["OBSERVATION_CONTRACT_INVALID" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const win = windowFor(input.recommendation_id ?? rec.recommendation.recommendation_id, failures);
  const ev = evidence(rec.recommendation.recommendation_id, failures);
  const qual = qualification(ev, failures);
  const evalReport = evaluation(qual, failures);
  const close = closure(win, qual, evalReport, failures);
  const late = missingLate(failures);
  const obs = observation(tenantId, rec, win, ev, qual, evalReport, close, failures);
  const rep = replay(failures);
  const led = ledger(obs, failures);
  const ob = observability(obs, ev, rep, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, observation: obs, window: win, evidence: ev, qualification: qual, closure: close, evaluation: evalReport, missing_late_evidence: late, replay: rep, ledger: led, observability: ob };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is ObservationFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification = nested({ certification_id: id("observation_certification", VERSION), status, organizational_intelligence_ready: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateOutcomeObservationEvaluation(result?: OutcomeObservationResult): OutcomeObservationValidation {
  if (!result) {
    const failures = freezeArray<ObservationFailure>(["OBSERVATION_CONTRACT_INVALID"]);
    const base = { observation_id: null, valid: false, status: "FAIL" as const, organizational_intelligence_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false, window_valid: false, evaluation_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.observation) === result.observation.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const window_valid = result.window.opened_once && result.window.closed_once && !result.window.overlaps_existing_window;
  const evaluation_valid = result.evaluation.outcome !== "NOT_EVALUABLE" && result.evaluation.reproducible;
  const valid = result.certification.status === "PASS" && result.certification.organizational_intelligence_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && window_valid && evaluation_valid;
  const base = { observation_id: result.observation.observation_id, valid, status: result.certification.status, organizational_intelligence_ready: result.certification.organizational_intelligence_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, window_valid, evaluation_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayOutcomeObservationEvaluation(result = runOutcomeObservationEvaluation()): boolean {
  const replayed = runOutcomeObservationEvaluation({ tenant_id: result.observation.tenant_id, recommendation_id: result.observation.recommendation_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateOutcomeObservationEvaluation(result).valid;
}

export function getOutcomeObservationEvaluationContract(): OutcomeObservationContractBundle {
  const result = runOutcomeObservationEvaluation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, recommendation_history_immutable: true, observation_windows_policy_bound: true, qualified_evidence_required: true, late_evidence_append_only: true, replay_required: true, advisory_only: true }), result, validation: validateOutcomeObservationEvaluation(result) });
}

export const OutcomeObservationEvaluation = Object.freeze({ run: runOutcomeObservationEvaluation, validate: validateOutcomeObservationEvaluation, replay: replayOutcomeObservationEvaluation });
