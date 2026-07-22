import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildPatternCandidates, replayPatternCandidateBuilder } from "@/services/pattern-candidate-builder";
import type { PatternCandidateInput, PatternCandidateBuilderResult, PatternCandidate } from "@/types/pattern-candidate-builder";
import type { PatternType } from "@/types/pattern-intelligence-contract";
import type {
  DetectedPattern,
  DetectionRule,
  GovernanceRelevance,
  PatternClassification,
  PatternDetectionApiSurface,
  PatternDetectionFailure,
  PatternDetectionFoundation,
  PatternDetectionInput,
  PatternDetectionRegistry,
  PatternDetectionResult,
  PatternDetectionValidation,
  StrategicRelevance,
} from "@/types/pattern-detection-engine";

const PATTERN_DETECTION_VERSION = "pattern-detection-engine/v1" as const;
const DETECTION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<PatternDetectionInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): PatternCandidateInput["scenario"] {
  const map: Partial<Record<Scenario, PatternCandidateInput["scenario"]>> = {
    INVALID_CANDIDATE: "CONTRACT_INVALID",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    LOW_RECURRENCE: "LOW_RECURRENCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
  };
  return map[scenario] ?? "BASELINE";
}

function patternTypeForScenario(scenario: Scenario): PatternType | undefined {
  const map: Partial<Record<Scenario, PatternType>> = {
    RECOMMENDATION_SUCCESS: "RECOMMENDATION_SUCCESS_PATTERN",
    RISK_UNDERESTIMATION: "RISK_UNDERESTIMATION_PATTERN",
    RISK_OVERESTIMATION: "RISK_OVERESTIMATION_PATTERN",
    CONFIDENCE_DRIFT: "CONFIDENCE_DRIFT_PATTERN",
    GOVERNANCE_BLOCKER: "GOVERNANCE_BLOCKER_PATTERN",
    OPERATOR_OVERRIDE: "OPERATOR_OVERRIDE_PATTERN",
    EVIDENCE_GAP: "EVIDENCE_GAP_PATTERN",
    MISSION_BOTTLENECK: "MISSION_BOTTLENECK_PATTERN",
    DEPENDENCY_CONFLICT: "DEPENDENCY_CONFLICT_PATTERN",
    SIMULATION_ERROR: "SIMULATION_ERROR_PATTERN",
    ROLLBACK: "ROLLBACK_PATTERN",
    STRATEGIC_OPPORTUNITY: "STRATEGIC_OPPORTUNITY_PATTERN",
  };
  return map[scenario];
}

function sourceForScenario(input: PatternDetectionInput, scenario: Scenario): PatternCandidateBuilderResult {
  if (input.candidate_result) return input.candidate_result;
  return buildPatternCandidates({ scenario: sourceScenario(scenario), pattern_type: patternTypeForScenario(scenario) });
}

function buildApiSurface(): PatternDetectionApiSurface {
  const base: Omit<PatternDetectionApiSurface, "integrity_hash"> = {
    api_id: "pattern_detection_engine_api",
    detect_patterns: "POST /pattern-detection-engine/detect",
    retrieve_rules: "POST /pattern-detection-engine/rules",
    classify_patterns: "POST /pattern-detection-engine/classify",
    retrieve_registry: "POST /pattern-detection-engine/registry",
    replay_detection: "POST /pattern-detection-engine/replay",
    verify_identity: "POST /pattern-detection-engine/identity",
    retrieve_contract: "GET /pattern-detection-engine/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
    prediction_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function classificationFor(candidate: PatternCandidate, scenario: Scenario): PatternClassification {
  if (scenario === "LOW_CONFIDENCE") return "LOW_CONFIDENCE_PATTERN";
  return candidate.candidate_type;
}

function buildRule(candidate: PatternCandidate, scenario: Scenario): DetectionRule {
  const base: Omit<DetectionRule, "integrity_hash"> = {
    rule_id: `pattern_detection_rule_${hash(candidate.candidate_type).slice(0, 14)}`,
    rule_version: "pattern-detection-rule/v1",
    pattern_type: candidate.candidate_type,
    required_evidence_count: 1,
    recurrence_threshold: 3,
    classification_mapping: classificationFor(candidate, scenario),
    governance_approved: true,
    deterministic: true,
    replayable: true,
    randomness_allowed: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceRelevance(classification: PatternClassification): GovernanceRelevance {
  if (classification === "GOVERNANCE_BLOCKER_PATTERN") return "CRITICAL";
  if (classification === "OPERATOR_OVERRIDE_PATTERN" || classification === "ROLLBACK_PATTERN") return "HIGH";
  if (classification === "EVIDENCE_GAP_PATTERN" || classification === "LOW_CONFIDENCE_PATTERN") return "MEDIUM";
  return "LOW";
}

function strategicRelevance(classification: PatternClassification): StrategicRelevance {
  if (classification === "STRATEGIC_OPPORTUNITY_PATTERN") return "HIGH";
  if (classification === "MISSION_BOTTLENECK_PATTERN" || classification === "DEPENDENCY_CONFLICT_PATTERN") return "MEDIUM";
  return "LOW";
}

function buildDetectedPatterns(candidateResult: PatternCandidateBuilderResult, rules: readonly DetectionRule[], scenario: Scenario): readonly DetectedPattern[] {
  if (scenario === "INVALID_CANDIDATE" || !candidateResult.candidates.length) return freezeArray([]);
  return freezeArray(candidateResult.candidates.map((candidate) => {
    const rule = rules.find((entry) => entry.pattern_type === candidate.candidate_type) ?? buildRule(candidate, scenario);
    const classification = rule.classification_mapping;
    const explanation = scenario === "MISSING_EXPLANATION" ? "" : `${classification.toLowerCase()} detected because candidate ${candidate.candidate_id} met recurrence ${candidate.recurrence_count} with deterministic rule ${rule.rule_id}`;
    const base: Omit<DetectedPattern, "integrity_hash"> = {
      pattern_id: `detected_pattern_${hash(`${candidate.candidate_id}:${classification}:${rule.rule_version}`).slice(0, 16)}`,
      tenant_id: scenario === "CROSS_TENANT" ? `${candidate.tenant_id}:foreign` : candidate.tenant_id,
      mission_scope: candidate.mission_scope,
      pattern_type: candidate.candidate_type,
      pattern_classification: classification,
      pattern_summary: `${classification.toLowerCase()} detected from validated historical candidate`,
      recurrence_count: candidate.recurrence_count,
      recurrence_window: candidate.recurrence_window,
      detection_rule_version: rule.rule_version,
      supporting_candidate_refs: freezeArray([candidate.candidate_id]),
      supporting_decision_refs: candidate.supporting_decision_refs,
      supporting_outcome_refs: candidate.supporting_outcome_refs,
      supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : candidate.supporting_evidence_refs,
      supporting_governance_refs: candidate.supporting_governance_refs,
      governance_relevance: governanceRelevance(classification),
      strategic_relevance: strategicRelevance(classification),
      operator_visibility_required: true,
      explanation,
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : candidate.replay_refs,
      lineage_refs: candidate.lineage_refs,
      detection_timestamp: DETECTION_TIMESTAMP,
      immutable: true,
      advisory_only: true,
      predicts_future_behavior: false,
      adaptive_learning: false,
    };
    const pattern = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH") return Object.freeze({ ...pattern, integrity_hash: hash({ tampered: pattern.pattern_id }) });
    return pattern;
  }));
}

function buildRegistry(candidateResult: PatternCandidateBuilderResult, patterns: readonly DetectedPattern[], scenario: Scenario): PatternDetectionRegistry {
  const classification_index = patterns.reduce((index, pattern) => {
    return { ...index, [pattern.pattern_classification]: freezeArray([...(index[pattern.pattern_classification] ?? []), pattern.pattern_id]) };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<PatternDetectionRegistry, "integrity_hash"> = {
    registry_id: `pattern_detection_registry_${hash(candidateResult.registry.registry_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${candidateResult.registry.tenant_id}:foreign` : candidateResult.registry.tenant_id,
    detected_pattern_refs: patterns.map((pattern) => pattern.pattern_id),
    classification_index: Object.freeze(classification_index),
    replay_refs: freezeArray([...new Set(patterns.flatMap((pattern) => pattern.replay_refs))]),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(candidateResult: PatternCandidateBuilderResult, rules: readonly DetectionRule[], patterns: readonly DetectedPattern[], registry: PatternDetectionRegistry, scenario: Scenario): readonly PatternDetectionFailure[] {
  const failures: PatternDetectionFailure[] = [];
  if (scenario === "INVALID_CANDIDATE" || !candidateResult.validation.valid) failures.push("CANDIDATE_BUILDER_INVALID");
  if (scenario === "MISSING_EVIDENCE" || patterns.some((pattern) => !pattern.supporting_evidence_refs.length)) failures.push("REQUIRED_EVIDENCE_MISSING");
  if (scenario === "LOW_RECURRENCE" || patterns.some((pattern) => pattern.recurrence_count < 3)) failures.push("RECURRENCE_THRESHOLD_UNMET");
  if (scenario === "MISSING_REPLAY" || patterns.some((pattern) => !pattern.replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "REPLAY_DIVERGENCE" || !replayPatternCandidateBuilder(candidateResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "GOVERNANCE_FAILURE") failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_RULE_VIOLATED");
  if (scenario === "UNSUPPORTED_PATTERN") failures.push("UNSUPPORTED_PATTERN_TYPE");
  if (scenario === "HASH_MISMATCH" || patterns.some((pattern) => hashWithoutIntegrity(pattern) !== pattern.integrity_hash) || rules.some((rule) => hashWithoutIntegrity(rule) !== rule.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== candidateResult.registry.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATED");
  if (scenario === "MISSING_EXPLANATION" || patterns.some((pattern) => !pattern.explanation)) failures.push("EXPLANATION_MISSING");
  if (scenario === "RANDOMNESS" || rules.some((rule) => rule.randomness_allowed)) failures.push("RANDOMNESS_DETECTED");
  if (scenario === "HIDDEN_OPTIMIZATION") failures.push("HIDDEN_OPTIMIZATION_DETECTED");
  if (scenario === "AUTONOMOUS_LEARNING" || patterns.some((pattern) => pattern.adaptive_learning)) failures.push("AUTONOMOUS_LEARNING_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly PatternDetectionFailure[]): PatternDetectionValidation["state"] {
  if (failures.includes("REQUIRED_EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "READY_FOR_VALIDATION";
}

function buildValidation(candidateResult: PatternCandidateBuilderResult, rules: readonly DetectionRule[], patterns: readonly DetectedPattern[], registry: PatternDetectionRegistry, failures: readonly PatternDetectionFailure[]): PatternDetectionValidation {
  const rulesVerified = rules.every((rule) => hashWithoutIntegrity(rule) === rule.integrity_hash);
  const patternsVerified = patterns.every((pattern) => hashWithoutIntegrity(pattern) === pattern.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<PatternDetectionValidation, "integrity_hash"> = {
    validation_id: "pattern_detection_engine_validation",
    state: stateForFailures(failures),
    valid: failures.length === 0 && rulesVerified && patternsVerified && registryVerified,
    failures,
    candidates_valid: candidateResult.validation.valid && !failures.includes("CANDIDATE_BUILDER_INVALID"),
    rules_governance_approved: rules.every((rule) => rule.governance_approved),
    evidence_complete: !failures.includes("REQUIRED_EVIDENCE_MISSING"),
    recurrence_valid: !failures.includes("RECURRENCE_THRESHOLD_UNMET"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_INCOMPLETE") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_preserved: !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_RULE_VIOLATED"),
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_VIOLATED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: rulesVerified && patternsVerified && registryVerified,
    advisory_only: patterns.every((pattern) => pattern.advisory_only && !pattern.predicts_future_behavior),
    no_autonomous_learning: patterns.every((pattern) => !pattern.adaptive_learning),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternDetectionResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    rules: result.rules,
    detected_patterns: result.detected_patterns,
    registry: result.registry,
    validation: result.validation,
    candidate_replay_hash: result.candidate_result.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<PatternDetectionResult, "integrity_hash">): string {
  return hash({
    pattern_detection_engine_version: result.pattern_detection_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    rule_hashes: result.rules.map((rule) => rule.integrity_hash),
    detected_pattern_hashes: result.detected_patterns.map((pattern) => pattern.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    candidate_hash: result.candidate_result.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    adaptive_learning: result.adaptive_learning,
    predicts_future_behavior: result.predicts_future_behavior,
  });
}

export function detectPatterns(input: PatternDetectionInput = {}): PatternDetectionResult {
  const scenario = input.scenario ?? "BASELINE";
  const candidate_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const candidates = candidate_result.candidates;
  const rules = freezeArray(candidates.map((candidate) => buildRule(candidate, scenario)));
  const detected_patterns = buildDetectedPatterns(candidate_result, rules, scenario);
  const registry = buildRegistry(candidate_result, detected_patterns, scenario);
  const failures = collectFailures(candidate_result, rules, detected_patterns, registry, scenario);
  const validation = buildValidation(candidate_result, rules, detected_patterns, registry, failures);
  const base: Omit<PatternDetectionResult, "integrity_hash" | "replay_hash"> = {
    pattern_detection_engine_version: PATTERN_DETECTION_VERSION,
    candidate_result,
    api_surface,
    rules,
    detected_patterns,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_first: true,
    adaptive_learning: false,
    predicts_future_behavior: false,
    modifies_recommendations: false,
    modifies_priorities: false,
    modifies_confidence: false,
    modifies_governance_policy: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternDetection(result: PatternDetectionResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternCandidateBuilder(result.candidate_result);
}

export function computeDetectedPatternHash(pattern: Omit<DetectedPattern, "integrity_hash"> | DetectedPattern): string {
  return hashWithoutIntegrity(pattern);
}

export function getPatternDetectionFoundation(): PatternDetectionFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_detection_engine_version: PATTERN_DETECTION_VERSION,
    api_surface,
    result: detectPatterns(),
  });
}

export const PatternDetectionEngine = Object.freeze({
  detect: detectPatterns,
  replay: replayPatternDetection,
});
