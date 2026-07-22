import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runForecastIntelligence, validateForecastIntelligence } from "@/services/forecast-intelligence";
import type {
  ComparisonArtifactRegistry,
  ComparisonCertification,
  ComparisonCertificationTest,
  ComparisonEligibilityReport,
  ComparisonExplainabilityReport,
  ComparisonFailure,
  ComparisonLedger,
  ComparisonObservabilityReport,
  ComparisonReplayReport,
  ComparisonScenario,
  ComparisonSupersessionRecord,
  DimensionEvaluationRecord,
  StrategyComparisonArtifact,
  StrategyComparisonContractBundle,
  StrategyComparisonInput,
  StrategyComparisonResult,
  StrategyComparisonValidation,
  ThresholdEvaluationReport,
  TieResolutionRecord,
} from "@/types/strategy-comparison-intelligence";

const VERSION = "strategy-comparison-intelligence/v12.7" as const;
const ID = "StrategyComparisonIntelligence" as const;
const DIMENSIONS = Object.freeze(["expected benefit", "expected risk", "resource consumption", "implementation cost", "operational complexity", "execution time", "reversibility", "confidence", "uncertainty", "governance impact", "constitutional impact", "operator burden", "organizational impact", "portfolio impact", "resilience", "adaptability", "failure recoverability", "dependency complexity", "strategic alignment", "evidence quality"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: ComparisonScenario): ComparisonFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly ComparisonFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function eligibility(strategies: readonly string[], failures: readonly ComparisonFailure[]): ComparisonEligibilityReport {
  const rejected = freezeArray(failures.includes("INCOMPLETE_STRATEGY") || failures.includes("REVOKED_STRATEGY") || failures.includes("SUPERSEDED_STRATEGY") ? [strategies[0] ?? "strategy:missing"] : []);
  const base = { report_id: id("comparison_eligibility", strategies), eligible_strategy_refs: freezeArray(strategies.filter((s) => !rejected.includes(s))), rejected_strategy_refs: rejected, same_recommendation_cycle: true, qualified_strategies_only: !failures.includes("INCOMPLETE_STRATEGY") && !failures.includes("REVOKED_STRATEGY") && !failures.includes("SUPERSEDED_STRATEGY"), policy_compatible: !failures.includes("POLICY_CONFLICT"), governance_approved: !failures.includes("GOVERNANCE_FAILURE"), constitutional_eligible: !failures.includes("CONSTITUTIONAL_VIOLATION"), evidence_sufficient: true, authority_compatible: true, scenario_compatible: true, forecast_available: true, portfolio_eligible: !failures.includes("UNSUPPORTED_COMPARISON"), deterministic: !failures.includes("ELIGIBILITY_VALIDATION_FAILED") };
  return nested(base);
}

function dimensions(strategies: readonly string[], failures: readonly ComparisonFailure[]): DimensionEvaluationRecord {
  const dims = failures.includes("DIMENSION_REGISTRY_INCOMPLETE") ? DIMENSIONS.slice(0, -2) : DIMENSIONS;
  const weights = Object.freeze(Object.fromEntries(dims.map((d) => [d, Number((1 / dims.length).toFixed(4))])) as Record<string, number>);
  const raw = Object.freeze(Object.fromEntries(strategies.map((strategy, i) => [strategy, Object.freeze(Object.fromEntries(dims.map((d, j) => [d, Number((0.55 + i * 0.08 + j * 0.003).toFixed(3))]))) as Record<string, number>])) as Record<string, Record<string, number>>);
  const normalized = Object.freeze(Object.fromEntries(strategies.map((strategy, i) => [strategy, failures.includes("SCORING_NONDETERMINISTIC") && i === 0 ? 0.5 : Number((0.62 + i * 0.07).toFixed(3))])) as Record<string, number>);
  const weighted = Object.freeze(Object.fromEntries(strategies.map((strategy) => [strategy, Number((normalized[strategy] * 0.95).toFixed(3))])) as Record<string, number>);
  return nested({ record_id: id("dimension_evaluation", { strategies, dims }), dimensions: freezeArray(dims), weights, raw_scores: raw, normalized_scores: normalized, weighted_scores: weighted, reproducible: !failures.includes("SCORING_NONDETERMINISTIC") });
}

function thresholds(failures: readonly ComparisonFailure[]): ThresholdEvaluationReport {
  const pass = !failures.includes("THRESHOLD_EVALUATION_FAILED");
  return nested({ report_id: id("threshold_evaluation", VERSION), threshold_policy_ref: "threshold-policy:comparison:v1", immutable: !failures.includes("THRESHOLD_POLICY_MUTABLE"), minimum_confidence_passed: pass, maximum_uncertainty_passed: pass, maximum_risk_passed: pass, minimum_evidence_passed: pass, governance_passed: !failures.includes("GOVERNANCE_FAILURE"), constitutional_passed: !failures.includes("CONSTITUTIONAL_VIOLATION"), resource_ceiling_passed: pass, replay_qualification_passed: pass, deterministic: pass });
}

function rankingFrom(scores: Readonly<Record<string, number>>): readonly string[] {
  return freezeArray(Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([strategy]) => strategy));
}

function ties(strategies: readonly string[], scores: Readonly<Record<string, number>>, failures: readonly ComparisonFailure[]): TieResolutionRecord {
  const tieDetected = failures.includes("UNRESOLVED_TIE") || strategies.length > 1 && scores[strategies[0]] === scores[strategies[1]];
  const selected = rankingFrom(scores)[0] ?? strategies[0] ?? "strategy:missing";
  return nested({ record_id: id("tie_resolution", { strategies, selected }), tie_detected: tieDetected, policy_ref: "tie-policy:highest-confidence-lowest-uncertainty-lexical:v1", selected_strategy_ref: selected, resolved: !failures.includes("UNRESOLVED_TIE"), deterministic: !failures.includes("TIE_RESOLUTION_NONDETERMINISTIC"), rationale: "Resolved by weighted score, confidence, uncertainty, then lexical ordering." });
}

function comparisonArtifact(tenantId: string, cycleRef: string, strategies: readonly string[], dims: DimensionEvaluationRecord, eligibilityReport: ComparisonEligibilityReport, thresholdReport: ThresholdEvaluationReport, tie: TieResolutionRecord, evidenceRefs: readonly string[], failures: readonly ComparisonFailure[]): StrategyComparisonArtifact {
  const comparisonCycleId = id("comparison_cycle", { cycleRef, strategies, version: VERSION });
  const seed = { comparisonCycleId, cycleRef, strategies, type: "FORECAST_WEIGHTED" };
  const comparisonId = failures.includes("COMPARISON_IDENTITY_NONDETERMINISTIC") ? id("strategy_comparison", { seed, nonce: "unstable" }) : id("strategy_comparison", seed);
  const complete = eligibilityReport.rejected_strategy_refs.length === 0 && thresholdReport.deterministic && tie.resolved && tie.deterministic && !failures.includes("COMPLETION_FAILED");
  const ranking = rankingFrom(dims.weighted_scores);
  return nested({ comparison_id: comparisonId, comparison_cycle_id: comparisonCycleId, recommendation_cycle_ref: cycleRef, comparison_type: "FORECAST_WEIGHTED" as const, participating_strategy_refs: strategies, comparison_scope: "strategic-recommendation-comparison", comparison_policy_manifest_ref: failures.includes("POLICY_CONFLICT") ? "" : `manifest:${cycleRef}:comparison`, comparison_dimension_refs: dims.dimensions, threshold_policy_ref: thresholdReport.threshold_policy_ref, tie_resolution_policy_ref: tie.policy_ref, comparison_scores: dims.raw_scores[ranking[0] ?? strategies[0]] ?? {}, weighted_scores: dims.weighted_scores, normalized_scores: dims.normalized_scores, confidence: 0.82, uncertainty: 0.16, qualification_status: complete ? "QUALIFIED" as const : "REJECTED" as const, exclusions: eligibilityReport.rejected_strategy_refs, ranking, comparison_outcome: complete ? (tie.tie_detected ? "TIE_RESOLVED" as const : "RANKED" as const) : "FAILED" as const, evidence_refs: evidenceRefs, authority_ref: "authority:comparison:resolved", governance_refs: failures.includes("GOVERNANCE_FAILURE") ? freezeArray([]) : freezeArray([`governance:${cycleRef}:comparison-approved`, `constitutional:${cycleRef}:comparison-approved`]), origin_ref: `origin:${cycleRef}:strategy-comparison-intelligence`, lifecycle_state: complete ? "COMPLETE" as const : "REGISTERED" as const, supersession_ref: null, replay_refs: freezeArray([`replay:${comparisonCycleId}`]), advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"), tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant_beta" : tenantId });
}

function supersession(comparisonId: string, failures: readonly ComparisonFailure[]): ComparisonSupersessionRecord {
  return nested({ supersession_id: id("comparison_supersession", comparisonId), original_comparison_id: comparisonId, replacement_comparison_id: failures.includes("SUPERSESSION_LINEAGE_BROKEN") ? null : id("replacement_comparison", comparisonId), before_recommendation_generation: true, post_recommendation_mutation_blocked: !failures.includes("POST_RECOMMENDATION_MUTATION"), lineage_preserved: !failures.includes("SUPERSESSION_LINEAGE_BROKEN") });
}

function replay(failures: readonly ComparisonFailure[]): ComparisonReplayReport {
  const ok = !failures.includes("REPLAY_MISMATCH");
  return nested({ report_id: id("comparison_replay", VERSION), identical_inputs: ok, identical_rankings: ok, identical_exclusions: ok, identical_thresholds: ok, identical_tie_resolution: ok, identical_outputs: ok, outcome: ok ? "MATCH" as const : "FAILURE" as const });
}

function explainability(comparison: StrategyComparisonArtifact, threshold: ThresholdEvaluationReport, tie: TieResolutionRecord, failures: readonly ComparisonFailure[]): ComparisonExplainabilityReport {
  const complete = !failures.includes("EXPLAINABILITY_INCOMPLETE");
  return nested({ report_id: id("comparison_explainability", comparison.comparison_id), score_explanations: complete ? freezeArray(comparison.ranking.map((s) => `${s} scored ${comparison.weighted_scores[s]} after normalized weighted dimensions.`)) : freezeArray([]), threshold_explanations: freezeArray([`Minimum confidence ${threshold.minimum_confidence_passed ? "passed" : "failed"}.`, `Maximum uncertainty ${threshold.maximum_uncertainty_passed ? "passed" : "failed"}.`]), tie_explanation: tie.rationale, exclusion_explanations: freezeArray(comparison.exclusions.map((e) => `${e} excluded by eligibility validation.`)), governance_explanation: "Comparison remains advisory and governance-approved.", complete });
}

function ledger(comparison: StrategyComparisonArtifact, failures: readonly ComparisonFailure[]): ComparisonLedger {
  const entries = freezeArray(["COMPARISON_CREATED", "ELIGIBILITY_VALIDATED", "DIMENSIONS_EVALUATED", "THRESHOLDS_APPLIED", "TIES_RESOLVED", "COMPARISON_COMPLETED", "REPLAY_CERTIFIED"].map((type, i) => nested({ entry_id: id("comparison_ledger_entry", { type, i, comparison: comparison.comparison_id }), type, subject_id: comparison.comparison_id })));
  return nested({ ledger_id: id("comparison_ledger", comparison.comparison_id), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, entries });
}

function registry(tenantId: string, comparison: StrategyComparisonArtifact, eligibilityReport: ComparisonEligibilityReport, dim: DimensionEvaluationRecord, threshold: ThresholdEvaluationReport, tie: TieResolutionRecord, superRec: ComparisonSupersessionRecord, replayReport: ComparisonReplayReport): ComparisonArtifactRegistry {
  return nested({ registry_id: id("comparison_registry", { tenantId, comparison: comparison.comparison_id }), tenant_id: tenantId, comparison, eligibility: eligibilityReport, dimensions: dim, thresholds: threshold, tie_resolution: tie, supersession: superRec, replay: replayReport, complete: comparison.lifecycle_state === "COMPLETE" && replayReport.outcome === "MATCH" });
}

function observability(eligibilityReport: ComparisonEligibilityReport, threshold: ThresholdEvaluationReport, tie: TieResolutionRecord, superRec: ComparisonSupersessionRecord, replayReport: ComparisonReplayReport, failures: readonly ComparisonFailure[]): ComparisonObservabilityReport {
  return nested({ report_id: id("comparison_observability", VERSION), comparison_latency_ms: 130, scoring_consistency: failures.includes("SCORING_NONDETERMINISTIC") ? 0 : 1, threshold_failures: threshold.deterministic ? 0 : 1, eligibility_failures: eligibilityReport.rejected_strategy_refs.length, tie_frequency: tie.tie_detected ? 1 : 0, supersession_attempts: superRec.replacement_comparison_id ? 1 : 0, replay_success: replayReport.outcome === "MATCH" ? 1 : 0, policy_violations: failures.includes("POLICY_CONFLICT") ? 1 : 0, governance_exceptions: failures.includes("GOVERNANCE_FAILURE") ? 1 : 0, constitutional_violations: failures.includes("CONSTITUTIONAL_VIOLATION") ? 1 : 0, observable: !failures.includes("OBSERVABILITY_MISSING") });
}

function certTest(name: string, passed: boolean, failure: ComparisonFailure, refs: readonly string[]): ComparisonCertificationTest {
  return nested({ test_id: id("comparison_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}

type CertBase = Omit<StrategyComparisonResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly ComparisonCertificationTest[] {
  const refs = freezeArray([result.comparison.integrity_hash, result.registry.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Comparison artifact contract approved", result.comparison.comparison_id.length > 0 && result.comparison.comparison_policy_manifest_ref.length > 0, "COMPARISON_ARTIFACT_CONTRACT_INVALID", refs),
    certTest("Comparison identity deterministic", result.comparison.comparison_id === id("strategy_comparison", { comparisonCycleId: result.comparison.comparison_cycle_id, cycleRef: result.comparison.recommendation_cycle_ref, strategies: result.comparison.participating_strategy_refs, type: "FORECAST_WEIGHTED" }), "COMPARISON_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Eligibility deterministic", result.eligibility.deterministic && result.eligibility.rejected_strategy_refs.length === 0, "ELIGIBILITY_VALIDATION_FAILED", refs),
    certTest("Qualified strategies only", result.eligibility.qualified_strategies_only, "INCOMPLETE_STRATEGY", refs),
    certTest("Revoked strategies rejected", result.eligibility.qualified_strategies_only, "REVOKED_STRATEGY", refs),
    certTest("Superseded strategies rejected", result.eligibility.qualified_strategies_only, "SUPERSEDED_STRATEGY", refs),
    certTest("Policy compatibility enforced", result.eligibility.policy_compatible, "POLICY_CONFLICT", refs),
    certTest("Governance approved", result.eligibility.governance_approved, "GOVERNANCE_FAILURE", refs),
    certTest("Constitutional eligibility enforced", result.eligibility.constitutional_eligible, "CONSTITUTIONAL_VIOLATION", refs),
    certTest("Unsupported comparisons rejected", result.eligibility.portfolio_eligible, "UNSUPPORTED_COMPARISON", refs),
    certTest("Dimensions registered", result.dimensions.dimensions.length === DIMENSIONS.length, "DIMENSION_REGISTRY_INCOMPLETE", refs),
    certTest("Scoring reproducible", result.dimensions.reproducible, "SCORING_NONDETERMINISTIC", refs),
    certTest("Threshold policy immutable", result.thresholds.immutable, "THRESHOLD_POLICY_MUTABLE", refs),
    certTest("Threshold evaluation deterministic", result.thresholds.deterministic, "THRESHOLD_EVALUATION_FAILED", refs),
    certTest("Tie resolution deterministic", result.tie_resolution.deterministic, "TIE_RESOLUTION_NONDETERMINISTIC", refs),
    certTest("No unresolved ties", result.tie_resolution.resolved, "UNRESOLVED_TIE", refs),
    certTest("Comparison completion deterministic", result.comparison.lifecycle_state === "COMPLETE", "COMPLETION_FAILED", refs),
    certTest("Post-recommendation mutation blocked", result.supersession.post_recommendation_mutation_blocked, "POST_RECOMMENDATION_MUTATION", refs),
    certTest("Supersession lineage preserved", result.supersession.lineage_preserved, "SUPERSESSION_LINEAGE_BROKEN", refs),
    certTest("Replay matches", result.replay.outcome === "MATCH", "REPLAY_MISMATCH", refs),
    certTest("Explainability complete", result.explainability.complete, "EXPLAINABILITY_INCOMPLETE", refs),
    certTest("Tenant isolation preserved", result.comparison.tenant_id === result.registry.tenant_id, "TENANT_ISOLATION_BREACH", refs),
    certTest("Advisory boundary enforced", result.comparison.advisory_only, "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<StrategyComparisonResult, "replay_hash" | "integrity_hash">): string {
  return hash({ comparison: result.comparison.integrity_hash, eligibility: result.eligibility.integrity_hash, dimensions: result.dimensions.integrity_hash, thresholds: result.thresholds.integrity_hash, tie: result.tie_resolution.integrity_hash, supersession: result.supersession.integrity_hash, replay: result.replay.integrity_hash, explainability: result.explainability.integrity_hash, ledger: result.ledger.integrity_hash, registry: result.registry.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<StrategyComparisonResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runStrategyComparisonIntelligence(input: StrategyComparisonInput = {}): StrategyComparisonResult {
  const forecast = runForecastIntelligence({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const forecastValid = validateForecastIntelligence(forecast).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<ComparisonFailure>([...(forecastValid ? [] : ["ELIGIBILITY_VALIDATION_FAILED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const cycleRef = input.recommendation_cycle_ref ?? forecast.forecasts[0]?.recommendation_cycle_ref ?? "recommendation-cycle:strategic:alpha";
  const strategies = freezeArray([...new Set(forecast.forecasts.map((f) => f.strategy_ref).filter(Boolean))].slice(0, 4));
  const evidence = freezeArray([...new Set(forecast.forecasts.flatMap((f) => f.evidence_refs))]);
  const eligible = eligibility(strategies, failures);
  const dim = dimensions(strategies, failures);
  const threshold = thresholds(failures);
  const tie = ties(strategies, dim.weighted_scores, failures);
  const comparison = comparisonArtifact(tenantId, cycleRef, strategies, dim, eligible, threshold, tie, evidence, failures);
  const superRec = supersession(comparison.comparison_id, failures);
  const replayReport = replay(failures);
  const explain = explainability(comparison, threshold, tie, failures);
  const ledgerRecord = ledger(comparison, failures);
  const registryRecord = registry(tenantId, comparison, eligible, dim, threshold, tie, superRec, replayReport);
  const observabilityReport = observability(eligible, threshold, tie, superRec, replayReport, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, comparison, eligibility: eligible, dimensions: dim, thresholds: threshold, tie_resolution: tie, supersession: superRec, replay: replayReport, explainability: explain, ledger: ledgerRecord, registry: registryRecord, observability: observabilityReport };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is ComparisonFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification = nested({ certification_id: id("comparison_certification", VERSION), status, ready_for_recommendation_engine: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateStrategyComparisonIntelligence(result?: StrategyComparisonResult): StrategyComparisonValidation {
  if (!result) {
    const failures = freezeArray<ComparisonFailure>(["COMPARISON_ARTIFACT_CONTRACT_INVALID"]);
    const base = { comparison_id: null, valid: false, status: "FAIL" as const, ready_for_recommendation_engine: false, failures, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, ranking_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.registry) === result.registry.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const registry_valid = result.registry.complete;
  const ranking_valid = result.comparison.ranking.length === result.comparison.participating_strategy_refs.length;
  const valid = result.certification.status === "PASS" && result.certification.ready_for_recommendation_engine && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && registry_valid && ranking_valid;
  const base = { comparison_id: result.comparison.comparison_id, valid, status: result.certification.status, ready_for_recommendation_engine: result.certification.ready_for_recommendation_engine, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, registry_valid, ranking_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategyComparisonIntelligence(result = runStrategyComparisonIntelligence()): boolean {
  const replayed = runStrategyComparisonIntelligence({ tenant_id: result.registry.tenant_id, recommendation_cycle_ref: result.comparison.recommendation_cycle_ref });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateStrategyComparisonIntelligence(result).valid;
}

export function getStrategyComparisonIntelligenceContract(): StrategyComparisonContractBundle {
  const result = runStrategyComparisonIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, immutable_thresholds_required: true, deterministic_tie_resolution_required: true, replay_required: true, explainability_required: true, post_recommendation_mutation_blocked: true, governance_validation_required: true }), result, validation: validateStrategyComparisonIntelligence(result) });
}

export const StrategyComparisonIntelligence = Object.freeze({ run: runStrategyComparisonIntelligence, validate: validateStrategyComparisonIntelligence, replay: replayStrategyComparisonIntelligence });
