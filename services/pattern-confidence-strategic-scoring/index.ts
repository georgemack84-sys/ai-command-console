import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayPatternEvidenceValidation, validatePatternEvidence } from "@/services/pattern-validation-evidence-engine";
import type { PatternValidationInput, PatternValidationEvidenceResult, PatternValidationRecord } from "@/types/pattern-validation-evidence-engine";
import type {
  PatternScoreRating,
  PatternScoreRecord,
  PatternScoringApiSurface,
  PatternScoringFailure,
  PatternScoringFoundation,
  PatternScoringInput,
  PatternScoringRegistry,
  PatternScoringResult,
  PatternScoringValidation,
  PatternScoringWeights,
} from "@/types/pattern-confidence-strategic-scoring";

const PATTERN_SCORING_VERSION = "pattern-confidence-strategic-scoring/v1" as const;
const SCORING_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<PatternScoringInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): PatternValidationInput["scenario"] {
  const map: Partial<Record<Scenario, PatternValidationInput["scenario"]>> = {
    WEAK_PATTERN: "WEAK_PATTERN",
    MISSING_VALIDATION: "DETECTION_INVALID",
    REJECTED_PATTERN: "UNSUPPORTED_EVIDENCE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_RECURRENCE: "LOW_RECURRENCE",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "REPLAY_DIVERGENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternScoringInput, scenario: Scenario): PatternValidationEvidenceResult {
  if (input.validation_result) return input.validation_result;
  return validatePatternEvidence({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): PatternScoringApiSurface {
  const base: Omit<PatternScoringApiSurface, "integrity_hash"> = {
    api_id: "pattern_confidence_strategic_scoring_api",
    score_pattern: "POST /pattern-confidence-strategic-scoring/score",
    calculate_confidence: "POST /pattern-confidence-strategic-scoring/confidence",
    calculate_strategic: "POST /pattern-confidence-strategic-scoring/strategic",
    calculate_governance: "POST /pattern-confidence-strategic-scoring/governance",
    calculate_composite: "POST /pattern-confidence-strategic-scoring/composite",
    retrieve_registry: "POST /pattern-confidence-strategic-scoring/registry",
    replay_scoring: "POST /pattern-confidence-strategic-scoring/replay",
    retrieve_contract: "GET /pattern-confidence-strategic-scoring/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_behavior_supported: false,
    priority_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scoringWeights(scenario: Scenario = "BASELINE"): PatternScoringWeights {
  const base: Omit<PatternScoringWeights, "integrity_hash"> = {
    confidence_score: scenario === "NONDETERMINISTIC_WEIGHTING" ? 0.3 : 0.2,
    recurrence_strength: 0.15,
    evidence_quality: 0.15,
    governance_importance: 0.12,
    mission_importance: 0.12,
    strategic_importance: 0.1,
    operator_importance: 0.08,
    risk_relevance: 0.08,
    total: 1,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function confidenceScore(record: PatternValidationRecord, scenario: Scenario): number {
  if (record.validation_result === "REJECTED") return 0;
  if (scenario === "MISSING_EVIDENCE") return 0;
  const score = (
    record.evidence_validation_result.score * 0.3 +
    record.recurrence_validation_result.score * 0.25 +
    record.historical_consistency_result.score * 0.2 +
    record.replay_integrity_result.score * 0.15 +
    (record.validation_result === "LOW_CONFIDENCE_PATTERN" ? 0.45 : 1) * 0.1
  );
  return clamp(score);
}

function governanceImportance(record: PatternValidationRecord, scenario: Scenario): number {
  if (scenario === "MISSING_GOVERNANCE") return 0;
  return clamp(record.governance_refs.length ? 0.82 : 0.35);
}

function missionImportance(record: PatternValidationRecord): number {
  return clamp(record.validation_result === "LOW_CONFIDENCE_PATTERN" ? 0.45 : 0.74);
}

function strategicImportance(record: PatternValidationRecord): number {
  return clamp(record.validation_result === "LOW_CONFIDENCE_PATTERN" ? 0.38 : 0.68);
}

function operatorImportance(record: PatternValidationRecord): number {
  return clamp(record.validation_result === "LOW_CONFIDENCE_PATTERN" ? 0.42 : 0.7);
}

function riskRelevance(record: PatternValidationRecord): number {
  return clamp(record.validation_result === "LOW_CONFIDENCE_PATTERN" ? 0.4 : 0.66);
}

function ratingFor(score: number, rejected: boolean): PatternScoreRating {
  if (rejected) return "REJECTED";
  if (score >= 0.85) return "EXCEPTIONAL";
  if (score >= 0.7) return "HIGH";
  if (score >= 0.55) return "MEDIUM";
  if (score >= 0.4) return "LOW";
  return "WEAK";
}

function compositeScore(record: PatternValidationRecord, weights: PatternScoringWeights, scenario: Scenario): number {
  const confidence = confidenceScore(record, scenario);
  const recurrence = scenario === "MISSING_RECURRENCE" ? 0 : record.recurrence_validation_result.score;
  const evidence = scenario === "MISSING_EVIDENCE" ? 0 : record.evidence_validation_result.score;
  const governance = governanceImportance(record, scenario);
  return clamp(
    confidence * weights.confidence_score +
    recurrence * weights.recurrence_strength +
    evidence * weights.evidence_quality +
    governance * weights.governance_importance +
    missionImportance(record) * weights.mission_importance +
    strategicImportance(record) * weights.strategic_importance +
    operatorImportance(record) * weights.operator_importance +
    riskRelevance(record) * weights.risk_relevance,
  );
}

function buildScoreRecords(validationResult: PatternValidationEvidenceResult, weights: PatternScoringWeights, scenario: Scenario): readonly PatternScoreRecord[] {
  if (scenario === "MISSING_VALIDATION") return freezeArray([]);
  return freezeArray(validationResult.validation_records.map((record) => {
    const confidence = confidenceScore(record, scenario);
    const recurrence = scenario === "MISSING_RECURRENCE" ? 0 : record.recurrence_validation_result.score;
    const evidence = scenario === "MISSING_EVIDENCE" ? 0 : record.evidence_validation_result.score;
    const governance = governanceImportance(record, scenario);
    const composite = compositeScore(record, weights, scenario);
    const rejected = record.validation_result === "REJECTED" || scenario === "REJECTED_PATTERN";
    const base: Omit<PatternScoreRecord, "integrity_hash"> = {
      score_id: `pattern_score_${hash(`${record.validation_id}:${composite}`).slice(0, 16)}`,
      pattern_id: record.pattern_id,
      tenant_id: scenario === "CROSS_TENANT" ? `${record.tenant_id}:foreign` : record.tenant_id,
      scoring_timestamp: SCORING_TIMESTAMP,
      scoring_rule_version: scenario === "MISSING_RULE_VERSION" ? "" as "pattern-scoring-rule/v1" : "pattern-scoring-rule/v1",
      confidence_score: confidence,
      recurrence_strength: clamp(recurrence),
      evidence_quality: clamp(evidence),
      governance_importance: governance,
      mission_importance: missionImportance(record),
      strategic_importance: strategicImportance(record),
      operator_importance: operatorImportance(record),
      risk_relevance: riskRelevance(record),
      composite_pattern_score: rejected ? 0 : composite,
      rating: ratingFor(rejected ? 0 : composite, rejected),
      scoring_summary: scenario === "MISSING_EXPLANATION" ? "" : `Pattern ${record.pattern_id} scored with deterministic rule pattern-scoring-rule/v1 and composite ${rejected ? 0 : composite}`,
      explainability_refs: scenario === "MISSING_EXPLANATION" ? freezeArray([]) : freezeArray([record.validation_id, record.validation_summary]),
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : record.replay_refs,
      evidence_refs: record.evidence_refs,
      governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : record.governance_refs,
      advisory_only: true,
      modifies_recommendations: false,
      modifies_priorities: false,
      modifies_governance: false,
      adaptive_behavior: false,
    };
    const scoreRecord = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH") return Object.freeze({ ...scoreRecord, integrity_hash: hash({ tampered: scoreRecord.score_id }) });
    return scoreRecord;
  }));
}

function buildRegistry(validationResult: PatternValidationEvidenceResult, records: readonly PatternScoreRecord[], scenario: Scenario): PatternScoringRegistry {
  const rating_index = records.reduce((index, record) => {
    return { ...index, [record.rating]: freezeArray([...(index[record.rating] ?? []), record.score_id]) };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<PatternScoringRegistry, "integrity_hash"> = {
    registry_id: `pattern_scoring_registry_${hash(validationResult.registry.registry_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${validationResult.registry.tenant_id}:foreign` : validationResult.registry.tenant_id,
    score_refs: records.map((record) => record.score_id),
    pattern_refs: records.map((record) => record.pattern_id),
    rating_index: Object.freeze(rating_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(validationResult: PatternValidationEvidenceResult, weights: PatternScoringWeights, records: readonly PatternScoreRecord[], registry: PatternScoringRegistry, scenario: Scenario): readonly PatternScoringFailure[] {
  const failures: PatternScoringFailure[] = [];
  if (scenario === "MISSING_VALIDATION" || !records.length) failures.push("VALIDATED_PATTERN_MISSING");
  if (scenario === "REJECTED_PATTERN" || validationResult.validation_records.some((record) => record.validation_result === "REJECTED")) failures.push("PATTERN_VALIDATION_REJECTED");
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => !record.evidence_refs.length || record.evidence_quality === 0)) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_RECURRENCE" || records.some((record) => record.recurrence_strength === 0)) failures.push("RECURRENCE_CALCULATION_UNAVAILABLE");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => !record.governance_refs.length)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_REPLAY" || records.some((record) => !record.replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_RULE_VERSION" || records.some((record) => !record.scoring_rule_version)) failures.push("SCORING_RULE_VERSION_UNAVAILABLE");
  if (scenario === "REPLAY_DIVERGENCE" || !replayPatternEvidenceValidation(validationResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== validationResult.registry.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "MISSING_EXPLANATION" || records.some((record) => !record.scoring_summary || !record.explainability_refs.length)) failures.push("EXPLANATION_MISSING");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC_WEIGHTING" || weights.total !== 1 || !weights.deterministic) failures.push("NONDETERMINISTIC_WEIGHTING_DETECTED");
  if (scenario === "AUTONOMOUS_OPTIMIZATION" || records.some((record) => record.adaptive_behavior || record.modifies_priorities)) failures.push("AUTONOMOUS_OPTIMIZATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly PatternScoringFailure[]): PatternScoringValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(weights: PatternScoringWeights, records: readonly PatternScoreRecord[], registry: PatternScoringRegistry, failures: readonly PatternScoringFailure[]): PatternScoringValidation {
  const weightsVerified = hashWithoutIntegrity(weights) === weights.integrity_hash;
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<PatternScoringValidation, "integrity_hash"> = {
    validation_id: "pattern_confidence_strategic_scoring_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && weightsVerified && recordsVerified && registryVerified,
    failures,
    validation_input_accepted: !failures.includes("VALIDATED_PATTERN_MISSING") && !failures.includes("PATTERN_VALIDATION_REJECTED"),
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE"),
    recurrence_available: !failures.includes("RECURRENCE_CALCULATION_UNAVAILABLE"),
    governance_referenced: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_INCOMPLETE") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    scoring_rules_available: !failures.includes("SCORING_RULE_VERSION_UNAVAILABLE"),
    deterministic_weighting: !failures.includes("NONDETERMINISTIC_WEIGHTING_DETECTED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: weightsVerified && recordsVerified && registryVerified,
    advisory_only: records.every((record) => record.advisory_only),
    no_autonomous_optimization: records.every((record) => !record.adaptive_behavior && !record.modifies_priorities),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternScoringResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    weights: result.weights,
    score_records: result.score_records,
    registry: result.registry,
    validation: result.validation,
    validation_replay_hash: result.validation_result.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<PatternScoringResult, "integrity_hash">): string {
  return hash({
    pattern_confidence_strategic_scoring_version: result.pattern_confidence_strategic_scoring_version,
    api_surface_hash: result.api_surface.integrity_hash,
    weights_hash: result.weights.integrity_hash,
    score_hashes: result.score_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    validation_result_hash: result.validation_result.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    adaptive_behavior: result.adaptive_behavior,
    autonomous_optimization: result.autonomous_optimization,
  });
}

export function scorePatternIntelligence(input: PatternScoringInput = {}): PatternScoringResult {
  const scenario = input.scenario ?? "BASELINE";
  const validation_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const weights = scoringWeights(scenario);
  const score_records = buildScoreRecords(validation_result, weights, scenario);
  const registry = buildRegistry(validation_result, score_records, scenario);
  const failures = collectFailures(validation_result, weights, score_records, registry, scenario);
  const validation = buildValidation(weights, score_records, registry, failures);
  const base: Omit<PatternScoringResult, "integrity_hash" | "replay_hash"> = {
    pattern_confidence_strategic_scoring_version: PATTERN_SCORING_VERSION,
    validation_result,
    api_surface,
    weights,
    score_records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_first: true,
    adaptive_behavior: false,
    modifies_recommendations: false,
    modifies_priorities: false,
    modifies_governance: false,
    autonomous_optimization: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternScoring(result: PatternScoringResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternEvidenceValidation(result.validation_result);
}

export function computePatternScoreHash(record: Omit<PatternScoreRecord, "integrity_hash"> | PatternScoreRecord): string {
  return hashWithoutIntegrity(record);
}

export function getPatternScoringFoundation(): PatternScoringFoundation {
  const api_surface = buildApiSurface();
  const weights = scoringWeights();
  return Object.freeze({
    pattern_confidence_strategic_scoring_version: PATTERN_SCORING_VERSION,
    weights,
    api_surface,
    result: scorePatternIntelligence(),
  });
}

export const PatternConfidenceStrategicScoring = Object.freeze({
  score: scorePatternIntelligence,
  replay: replayPatternScoring,
});
