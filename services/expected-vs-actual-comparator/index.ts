import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateRecommendationEffectiveness, replayRecommendationEffectiveness } from "@/services/recommendation-effectiveness-contract";
import type {
  ComparatorApiSurface,
  ComparatorFailure,
  ComparatorFoundation,
  ComparatorInput,
  ComparatorLedgerRecord,
  ComparatorResult,
  ComparatorValidation,
  ComparisonDomain,
  ComparisonValue,
  OutcomeAlignment,
  OutcomeVariance,
  VarianceCategory,
  VarianceSeverity,
} from "@/types/expected-vs-actual-comparator";
import type { RecommendationEffectivenessInput, RecommendationEffectivenessResult } from "@/types/recommendation-effectiveness-contract";

const COMPARATOR_VERSION = "expected-vs-actual-comparator/v1" as const;

export const COMPARISON_DOMAINS: readonly ComparisonDomain[] = Object.freeze([
  "MISSION_IMPACT",
  "RISK",
  "CONFIDENCE",
  "OPERATOR_BEHAVIOR",
  "GOVERNANCE",
  "RECOMMENDATION_EFFECT",
]);

type Scenario = NonNullable<ComparatorInput["scenario"]>;

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

function sourceForScenario(input: ComparatorInput, scenario: Scenario): RecommendationEffectivenessResult {
  if (input.effectiveness) return input.effectiveness;
  const effectivenessScenario: RecommendationEffectivenessInput["scenario"] =
    scenario === "INCOMPLETE_EVIDENCE" ? "MISSING_EVIDENCE" :
    scenario === "MISSING_GOVERNANCE" ? "MISSING_GOVERNANCE" :
    scenario === "MISSING_REPLAY" ? "MISSING_REPLAY" :
    scenario === "INCOMPLETE_LINEAGE" ? "INCOMPLETE_LINEAGE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "GOVERNANCE_FAILURE" ? "AUTHORITY_FAILURE" :
    scenario === "CONSTITUTIONAL_FAILURE" ? "CONSTITUTIONAL_FAILURE" :
    scenario === "LEDGER_MUTATION" ? "LEDGER_MUTATION" :
    "BASELINE";
  return evaluateRecommendationEffectiveness({ scenario: effectivenessScenario });
}

function buildApiSurface(): ComparatorApiSurface {
  const base: Omit<ComparatorApiSurface, "integrity_hash"> = {
    api_id: "expected_vs_actual_comparator_api",
    compare_outcomes: "POST /expected-vs-actual-comparator/compare",
    validate_comparison: "POST /expected-vs-actual-comparator/validate",
    replay_comparison: "POST /expected-vs-actual-comparator/replay",
    calculate_variance: "POST /expected-vs-actual-comparator/variance",
    retrieve_contract: "GET /expected-vs-actual-comparator/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function domainBaseValue(domain: ComparisonDomain): number {
  const values: Record<ComparisonDomain, number> = {
    MISSION_IMPACT: 0.88,
    RISK: 0.22,
    CONFIDENCE: 0.84,
    OPERATOR_BEHAVIOR: 1,
    GOVERNANCE: 1,
    RECOMMENDATION_EFFECT: 0.91,
  };
  return values[domain];
}

function varianceDelta(domain: ComparisonDomain, scenario: Scenario): number {
  if (scenario === "MINOR_VARIANCE") return domain === "MISSION_IMPACT" ? 0.04 : 0.02;
  if (scenario === "MODERATE_VARIANCE") return domain === "RISK" ? 0.18 : 0.11;
  if (scenario === "MAJOR_VARIANCE") return domain === "RECOMMENDATION_EFFECT" ? 0.38 : 0.27;
  if (scenario === "CRITICAL_VARIANCE") return domain === "MISSION_IMPACT" ? 0.72 : 0.51;
  return 0;
}

function categoricalValue(domain: ComparisonDomain, numeric: number): string {
  if (domain === "OPERATOR_BEHAVIOR") return numeric >= 1 ? "ACCEPTED" : "OVERRIDDEN";
  if (domain === "GOVERNANCE") return numeric >= 1 ? "APPROVED" : "ESCALATED";
  if (domain === "RISK") return numeric <= 0.3 ? "LOW_RISK" : numeric <= 0.55 ? "MODERATE_RISK" : "HIGH_RISK";
  return numeric >= 0.8 ? "ON_TRACK" : numeric >= 0.6 ? "PARTIAL" : "DIVERGED";
}

function buildValue(domain: ComparisonDomain, kind: "expected" | "actual", evidenceRefs: readonly string[], scenario: Scenario): ComparisonValue {
  const expectedMissing = scenario === "MISSING_EXPECTED" && kind === "expected";
  const observedMissing = scenario === "MISSING_OBSERVED" && kind === "actual";
  const baseValue = domainBaseValue(domain);
  const numeric = expectedMissing || observedMissing ? 0 : kind === "expected" ? baseValue : Math.max(0, Math.min(1, baseValue - varianceDelta(domain, scenario)));
  const base: Omit<ComparisonValue, "integrity_hash"> = {
    value_id: `${kind}_${domain.toLowerCase()}`,
    domain,
    numeric_value: numeric,
    categorical_value: expectedMissing || observedMissing ? "NOT_OBSERVABLE" : categoricalValue(domain, numeric),
    temporal_value: kind === "expected" ? "2026-01-01T00:00:00.000Z" : "2026-01-01T00:30:00.000Z",
    observable: !expectedMissing && !observedMissing,
    evidence_refs: expectedMissing || observedMissing || scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryForVariance(abs: number, expected: ComparisonValue, actual: ComparisonValue): VarianceCategory {
  if (!expected.observable || !actual.observable) return "NOT_OBSERVABLE";
  if (abs === 0 && expected.categorical_value === actual.categorical_value) return "PERFECT_ALIGNMENT";
  if (abs <= 0.05) return "MINOR_VARIANCE";
  if (abs <= 0.2) return "MODERATE_VARIANCE";
  if (abs <= 0.45) return "MAJOR_VARIANCE";
  return "CRITICAL_VARIANCE";
}

function severityForCategory(category: VarianceCategory): VarianceSeverity {
  if (category === "PERFECT_ALIGNMENT") return "NONE";
  if (category === "MINOR_VARIANCE") return "LOW";
  if (category === "MODERATE_VARIANCE") return "MODERATE";
  if (category === "MAJOR_VARIANCE") return "HIGH";
  return "CRITICAL";
}

function buildVariances(effectiveness: RecommendationEffectivenessResult, expectedValues: readonly ComparisonValue[], actualValues: readonly ComparisonValue[], scenario: Scenario): readonly OutcomeVariance[] {
  const record = effectiveness.effectiveness_record;
  return freezeArray(COMPARISON_DOMAINS.map((domain) => {
    const expected = expectedValues.find((value) => value.domain === domain) as ComparisonValue;
    const actual = actualValues.find((value) => value.domain === domain) as ComparisonValue;
    const absoluteVariance = Number(Math.abs(expected.numeric_value - actual.numeric_value).toFixed(4));
    const relativeVariance = expected.numeric_value === 0 ? 0 : Number((absoluteVariance / expected.numeric_value).toFixed(4));
    const category = categoryForVariance(absoluteVariance, expected, actual);
    const severity = severityForCategory(category);
    const explanation = scenario === "UNEXPLAINED_VARIANCE" && domain === "RISK" ? "" : `${domain.toLowerCase()} expected ${expected.categorical_value} and observed ${actual.categorical_value}; absolute variance ${absoluteVariance} classified as ${category}`;
    const base: Omit<OutcomeVariance, "integrity_hash"> = {
      variance_id: `variance_${hash(`${record.effectiveness_id}:${domain}`).slice(0, 14)}`,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      decision_id: record.decision_id,
      recommendation_id: record.recommendation_id,
      comparison_domain: domain,
      expected,
      actual,
      absolute_variance: absoluteVariance,
      relative_variance: relativeVariance,
      categorical_variance: expected.categorical_value !== actual.categorical_value,
      behavioral_variance: domain === "OPERATOR_BEHAVIOR" && expected.categorical_value !== actual.categorical_value,
      governance_variance: domain === "GOVERNANCE" && expected.categorical_value !== actual.categorical_value,
      temporal_variance_days: 0,
      category,
      severity,
      explanation,
      supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : record.evidence_refs,
      governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : record.governance_validation_refs,
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : record.replay_refs,
      lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : record.lineage_refs,
    };
    const variance = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && domain === "MISSION_IMPACT") return Object.freeze({ ...variance, integrity_hash: hash({ tampered: variance.variance_id }) });
    return variance;
  }));
}

function buildAlignment(effectiveness: RecommendationEffectivenessResult, variances: readonly OutcomeVariance[]): OutcomeAlignment {
  const aligned = variances.filter((variance) => variance.category === "PERFECT_ALIGNMENT" || variance.category === "MINOR_VARIANCE").map((variance) => variance.comparison_domain);
  const partial = variances.filter((variance) => variance.category === "MODERATE_VARIANCE").map((variance) => variance.comparison_domain);
  const divergent = variances.filter((variance) => variance.category === "MAJOR_VARIANCE" || variance.category === "CRITICAL_VARIANCE").map((variance) => variance.comparison_domain);
  const notObservable = variances.filter((variance) => variance.category === "NOT_OBSERVABLE").map((variance) => variance.comparison_domain);
  const score = Number(((aligned.length + partial.length * 0.5) / COMPARISON_DOMAINS.length).toFixed(4));
  const base: Omit<OutcomeAlignment, "integrity_hash"> = {
    alignment_id: `alignment_${hash(effectiveness.effectiveness_record.effectiveness_id).slice(0, 14)}`,
    tenant_id: effectiveness.effectiveness_record.tenant_id,
    aligned_domains: freezeArray(aligned),
    partial_domains: freezeArray(partial),
    divergent_domains: freezeArray(divergent),
    not_observable_domains: freezeArray(notObservable),
    alignment_score: score,
    explanation: `${aligned.length} aligned, ${partial.length} partial, ${divergent.length} divergent, ${notObservable.length} not observable`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(effectiveness: RecommendationEffectivenessResult, variances: readonly OutcomeVariance[], scenario: Scenario): readonly ComparatorFailure[] {
  const failures: ComparatorFailure[] = [];
  if (scenario === "MISSING_EXPECTED" || variances.some((variance) => !variance.expected.observable)) failures.push("EXPECTED_VALUES_MISSING");
  if (scenario === "MISSING_OBSERVED" || variances.some((variance) => !variance.actual.observable)) failures.push("OBSERVED_VALUES_MISSING");
  if (scenario === "INCOMPLETE_EVIDENCE" || variances.some((variance) => !variance.supporting_evidence_refs.length)) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || variances.some((variance) => !variance.governance_refs.length)) failures.push("GOVERNANCE_REFERENCES_ABSENT");
  if (scenario === "MISSING_REPLAY" || variances.some((variance) => !variance.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || variances.some((variance) => !variance.lineage_refs.length)) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || variances.some((variance) => hashWithoutIntegrity(variance) !== variance.integrity_hash)) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || !effectiveness.validation.tenant_isolated) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "OUTCOME_UNAVAILABLE") failures.push("OBSERVED_OUTCOME_UNAVAILABLE");
  if (scenario === "REPLAY_DIVERGENCE" || !effectiveness.validation.replay_reconstruction_identical) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "GOVERNANCE_FAILURE" || !effectiveness.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "LEDGER_MUTATION" || !effectiveness.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "UNEXPLAINED_VARIANCE" || variances.some((variance) => !variance.explanation)) failures.push("UNEXPLAINED_VARIANCE");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly ComparatorFailure[]): ComparatorValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("OBSERVED_VALUES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(effectiveness: RecommendationEffectivenessResult, variances: readonly OutcomeVariance[], scenario: Scenario): ComparatorLedgerRecord {
  const record = effectiveness.effectiveness_record;
  const evidenceRefs = freezeArray([...new Set(variances.flatMap((variance) => variance.supporting_evidence_refs))]);
  const governanceRefs = freezeArray([...new Set(variances.flatMap((variance) => variance.governance_refs))]);
  const replayRefs = freezeArray([...new Set(variances.flatMap((variance) => variance.replay_refs))]);
  const base: Omit<ComparatorLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `expected_actual_ledger_${hash(record.effectiveness_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    comparison_id: `expected_actual_${hash(record.effectiveness_id).slice(0, 14)}`,
    variance_refs: freezeArray(variances.map((variance) => variance.variance_id)),
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    observed_outcome_refs: record.actual_outcome_refs,
    evidence_refs: evidenceRefs,
    governance_refs: governanceRefs,
    replay_refs: replayRefs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(effectiveness: RecommendationEffectivenessResult, variances: readonly OutcomeVariance[], ledger: ComparatorLedgerRecord, failures: readonly ComparatorFailure[]): ComparatorValidation {
  const variancesVerified = variances.every((variance) => hashWithoutIntegrity(variance) === variance.integrity_hash);
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<ComparatorValidation, "integrity_hash"> = {
    validation_id: "expected_vs_actual_comparator_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && variancesVerified && ledgerVerified,
    failures,
    governance_validated: !failures.includes("GOVERNANCE_REFERENCES_ABSENT") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationEffectiveness(effectiveness),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    explanations_complete: !failures.includes("UNEXPLAINED_VARIANCE"),
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && ledger.tenant_id === effectiveness.effectiveness_record.tenant_id,
    integrity_verified: variancesVerified && ledgerVerified,
    replay_reconstruction_identical: !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationEffectiveness(effectiveness),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ComparatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    expected: result.expected_values,
    actual: result.actual_values,
    variances: result.variances,
    alignment: result.alignment,
    validation: result.validation,
    ledger: result.ledger_record,
    effectiveness_hash: result.effectiveness.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<ComparatorResult, "integrity_hash">): string {
  return hash({
    expected_vs_actual_comparator_version: result.expected_vs_actual_comparator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    variance_hashes: result.variances.map((variance) => variance.integrity_hash),
    alignment_hash: result.alignment.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    effectiveness_hash: result.effectiveness.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    compares_prediction_accuracy_only: result.compares_prediction_accuracy_only,
    modifies_outcomes: result.modifies_outcomes,
    modifies_recommendations: result.modifies_recommendations,
  });
}

export function compareExpectedVsActual(input: ComparatorInput = {}): ComparatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const effectiveness = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const evidenceRefs = scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : effectiveness.effectiveness_record.evidence_refs;
  const expected_values = freezeArray(COMPARISON_DOMAINS.map((domain) => buildValue(domain, "expected", evidenceRefs, scenario)));
  const actual_values = freezeArray(COMPARISON_DOMAINS.map((domain) => buildValue(domain, "actual", evidenceRefs, scenario)));
  const variances = buildVariances(effectiveness, expected_values, actual_values, scenario);
  const alignment = buildAlignment(effectiveness, variances);
  const failures = collectFailures(effectiveness, variances, scenario);
  const ledger_record = buildLedger(effectiveness, variances, scenario);
  const validation = buildValidation(effectiveness, variances, ledger_record, failures);
  const base: Omit<ComparatorResult, "integrity_hash" | "replay_hash"> = {
    expected_vs_actual_comparator_version: COMPARATOR_VERSION,
    effectiveness,
    api_surface,
    expected_values,
    actual_values,
    variances,
    alignment,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    compares_prediction_accuracy_only: true,
    modifies_outcomes: false,
    modifies_recommendations: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayExpectedVsActual(result: ComparatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeOutcomeVarianceHash(variance: Omit<OutcomeVariance, "integrity_hash"> | OutcomeVariance): string {
  return hashWithoutIntegrity(variance);
}

export function getExpectedVsActualComparatorFoundation(): ComparatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    expected_vs_actual_comparator_version: COMPARATOR_VERSION,
    comparison_domains: COMPARISON_DOMAINS,
    api_surface,
    result: compareExpectedVsActual(),
  });
}

export const ExpectedVsActualComparator = Object.freeze({
  compare: compareExpectedVsActual,
  replay: replayExpectedVsActual,
});
