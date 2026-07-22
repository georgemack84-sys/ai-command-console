import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { detectPatterns, replayPatternDetection } from "@/services/pattern-detection-engine";
import type { DetectedPattern, PatternDetectionInput, PatternDetectionResult } from "@/types/pattern-detection-engine";
import type {
  PatternRejectionReason,
  PatternValidationApiSurface,
  PatternValidationEvidenceFoundation,
  PatternValidationEvidenceResult,
  PatternValidationEvidenceValidation,
  PatternValidationFailure,
  PatternValidationInput,
  PatternValidationRecord,
  PatternValidationRegistry,
  PatternValidationResultCode,
  PatternValidationState,
  ValidationMetric,
} from "@/types/pattern-validation-evidence-engine";

const PATTERN_VALIDATION_VERSION = "pattern-validation-evidence-engine/v1" as const;
const VALIDATION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<PatternValidationInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): PatternDetectionInput["scenario"] {
  const map: Partial<Record<Scenario, PatternDetectionInput["scenario"]>> = {
    DETECTION_INVALID: "INVALID_CANDIDATE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    LOW_RECURRENCE: "LOW_RECURRENCE",
    MISSING_GOVERNANCE: "GOVERNANCE_FAILURE",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternValidationInput, scenario: Scenario): PatternDetectionResult {
  if (input.detection_result) return input.detection_result;
  return detectPatterns({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): PatternValidationApiSurface {
  const base: Omit<PatternValidationApiSurface, "integrity_hash"> = {
    api_id: "pattern_validation_evidence_engine_api",
    validate_pattern: "POST /pattern-validation-evidence-engine/validate",
    validate_evidence: "POST /pattern-validation-evidence-engine/evidence",
    validate_support: "POST /pattern-validation-evidence-engine/support",
    validate_recurrence: "POST /pattern-validation-evidence-engine/recurrence",
    retrieve_registry: "POST /pattern-validation-evidence-engine/registry",
    replay_validation: "POST /pattern-validation-evidence-engine/replay",
    retrieve_contract: "GET /pattern-validation-evidence-engine/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_behavior_supported: false,
    strategic_scoring_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metric(metric_id: string, score: number, threshold: number, explanation: string): ValidationMetric {
  const base: Omit<ValidationMetric, "integrity_hash"> = {
    metric_id,
    score,
    threshold,
    passed: score >= threshold,
    explanation,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidenceScore(pattern: DetectedPattern, scenario: Scenario): number {
  if (scenario === "MISSING_EVIDENCE" || scenario === "UNSUPPORTED_EVIDENCE") return 0;
  if (scenario === "CORRUPTED_EVIDENCE") return 0.2;
  if (scenario === "WEAK_PATTERN" || scenario === "WEAK_SUPPORT") return 0.67;
  return Math.min(1, pattern.supporting_evidence_refs.length / 3);
}

function supportScore(pattern: DetectedPattern, scenario: Scenario): number {
  if (scenario === "WEAK_SUPPORT") return 0.52;
  if (scenario === "WEAK_PATTERN") return 0.66;
  return Math.min(1, (pattern.supporting_decision_refs.length + pattern.supporting_outcome_refs.length + pattern.supporting_evidence_refs.length) / 5);
}

function recurrenceScore(pattern: DetectedPattern, scenario: Scenario): number {
  if (scenario === "LOW_RECURRENCE") return 0.4;
  if (scenario === "WEAK_PATTERN") return 0.67;
  return Math.min(1, pattern.recurrence_count / 4);
}

function validationState(result: PatternValidationResultCode): PatternValidationState {
  if (result === "ACCEPTED") return "VALIDATED";
  if (result === "LOW_CONFIDENCE_PATTERN") return "LOW_CONFIDENCE_PATTERN";
  return "REJECTED";
}

function rejectionReason(failures: readonly PatternValidationFailure[]): PatternRejectionReason | "NONE" {
  if (failures.includes("INSUFFICIENT_EVIDENCE") || failures.includes("CORRUPTED_EVIDENCE")) return "INSUFFICIENT_EVIDENCE";
  if (failures.includes("UNSUPPORTED_EVIDENCE")) return "UNSUPPORTED_EVIDENCE";
  if (failures.includes("SUPPORT_THRESHOLD_UNMET")) return "INSUFFICIENT_EVIDENCE";
  if (failures.includes("RECURRENCE_THRESHOLD_UNMET")) return "INSUFFICIENT_RECURRENCE";
  if (failures.includes("HISTORICAL_INCONSISTENCY")) return "INCONSISTENT_HISTORY";
  if (failures.includes("REPLAY_DIVERGENCE")) return "REPLAY_DIVERGENCE";
  if (failures.includes("GOVERNANCE_LINEAGE_MISSING") || failures.includes("GOVERNANCE_VALIDATION_FAILED")) return "GOVERNANCE_FAILURE";
  if (failures.includes("CONSTITUTIONAL_VIOLATION")) return "CONSTITUTIONAL_VIOLATION";
  if (failures.includes("TENANT_ISOLATION_VIOLATED")) return "TENANT_ISOLATION_VIOLATION";
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "INTEGRITY_VERIFICATION_FAILURE";
  if (failures.includes("MISSING_LINEAGE")) return "MISSING_LINEAGE";
  if (failures.includes("EXPLANATION_MISSING")) return "UNEXPLAINED_VALIDATION";
  return "NONE";
}

function recordFailures(pattern: DetectedPattern, detection: PatternDetectionResult, scenario: Scenario): readonly PatternValidationFailure[] {
  const failures: PatternValidationFailure[] = [];
  if (scenario === "DETECTION_INVALID" || !detection.validation.valid) failures.push("DETECTION_INVALID");
  if (scenario === "MISSING_EVIDENCE" || !pattern.supporting_evidence_refs.length) failures.push("INSUFFICIENT_EVIDENCE");
  if (scenario === "CORRUPTED_EVIDENCE") failures.push("CORRUPTED_EVIDENCE");
  if (scenario === "UNSUPPORTED_EVIDENCE") failures.push("UNSUPPORTED_EVIDENCE");
  if (scenario === "WEAK_SUPPORT" || supportScore(pattern, scenario) < 0.6) failures.push("SUPPORT_THRESHOLD_UNMET");
  if (scenario === "LOW_RECURRENCE" || recurrenceScore(pattern, scenario) < 0.6) failures.push("RECURRENCE_THRESHOLD_UNMET");
  if (scenario === "HISTORICAL_INCONSISTENCY") failures.push("HISTORICAL_INCONSISTENCY");
  if (scenario === "MISSING_GOVERNANCE" || !pattern.supporting_governance_refs.length) failures.push("GOVERNANCE_LINEAGE_MISSING");
  if (scenario === "GOVERNANCE_FAILURE") failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VIOLATION");
  if (scenario === "REPLAY_DIVERGENCE" || !replayPatternDetection(detection)) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "CROSS_TENANT" || pattern.tenant_id !== detection.registry.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(pattern) !== pattern.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "MISSING_LINEAGE" || !pattern.lineage_refs.length) failures.push("MISSING_LINEAGE");
  if (scenario === "MISSING_EXPLANATION" || !pattern.explanation) failures.push("EXPLANATION_MISSING");
  if (scenario === "AUTONOMOUS_BEHAVIOR") failures.push("AUTONOMOUS_BEHAVIOR_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function validationResult(failures: readonly PatternValidationFailure[], scenario: Scenario): PatternValidationResultCode {
  if (scenario === "WEAK_PATTERN") return "LOW_CONFIDENCE_PATTERN";
  return failures.length ? "REJECTED" : "ACCEPTED";
}

function buildValidationRecords(detection: PatternDetectionResult, scenario: Scenario): readonly PatternValidationRecord[] {
  return freezeArray(detection.detected_patterns.map((pattern) => {
    const failures = recordFailures(pattern, detection, scenario);
    const result = validationResult(failures, scenario);
    const reason = rejectionReason(failures);
    const base: Omit<PatternValidationRecord, "integrity_hash"> = {
      validation_id: `pattern_validation_${hash(`${pattern.pattern_id}:${result}`).slice(0, 16)}`,
      pattern_id: pattern.pattern_id,
      tenant_id: pattern.tenant_id,
      validation_timestamp: VALIDATION_TIMESTAMP,
      evidence_validation_result: metric("evidence_completeness", evidenceScore(pattern, scenario), 0.6, "Evidence completeness evaluated deterministically."),
      support_validation_result: metric("support_strength", supportScore(pattern, scenario), 0.6, "Support strength evaluated from independent references."),
      recurrence_validation_result: metric("recurrence_strength", recurrenceScore(pattern, scenario), 0.6, "Recurrence threshold evaluated from detected recurrence count."),
      historical_consistency_result: metric("historical_consistency", scenario === "HISTORICAL_INCONSISTENCY" ? 0.1 : 1, 0.6, "Historical reconstruction must remain identical."),
      governance_traceability_result: metric("governance_traceability", failures.includes("GOVERNANCE_LINEAGE_MISSING") || failures.includes("GOVERNANCE_VALIDATION_FAILED") ? 0 : 1, 0.6, "Governance lineage and approvals verified."),
      replay_integrity_result: metric("replay_integrity", failures.includes("REPLAY_DIVERGENCE") ? 0 : 1, 0.6, "Replay reconstruction verified."),
      validation_state: validationState(result),
      validation_result: result,
      validation_summary: scenario === "MISSING_EXPLANATION" ? "" : `${pattern.pattern_classification} validation result: ${result}`,
      validation_rule_version: "pattern-validation-rule/v1",
      weak_pattern_detected: result === "LOW_CONFIDENCE_PATTERN",
      rejection_reason: reason,
      replay_refs: pattern.replay_refs,
      evidence_refs: pattern.supporting_evidence_refs,
      governance_refs: pattern.supporting_governance_refs,
      lineage_refs: scenario === "MISSING_LINEAGE" ? freezeArray([]) : pattern.lineage_refs,
      advisory_only: true,
      modifies_recommendations: false,
      modifies_governance: false,
      adaptive_behavior: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.validation_id }) });
    return record;
  }));
}

function buildRegistry(detection: PatternDetectionResult, records: readonly PatternValidationRecord[], scenario: Scenario): PatternValidationRegistry {
  const base: Omit<PatternValidationRegistry, "integrity_hash"> = {
    registry_id: `pattern_validation_registry_${hash(detection.registry.registry_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${detection.registry.tenant_id}:foreign` : detection.registry.tenant_id,
    validation_refs: records.map((record) => record.validation_id),
    accepted_pattern_refs: records.filter((record) => record.validation_result === "ACCEPTED").map((record) => record.pattern_id),
    low_confidence_pattern_refs: records.filter((record) => record.validation_result === "LOW_CONFIDENCE_PATTERN").map((record) => record.pattern_id),
    rejected_pattern_refs: records.filter((record) => record.validation_result === "REJECTED").map((record) => record.pattern_id),
    rejection_reasons: freezeArray([...new Set(records.map((record) => record.rejection_reason).filter((reason): reason is PatternRejectionReason => reason !== "NONE"))]),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(detection: PatternDetectionResult, records: readonly PatternValidationRecord[], registry: PatternValidationRegistry, scenario: Scenario): readonly PatternValidationFailure[] {
  const failures = records.flatMap((record) => {
    const pattern = detection.detected_patterns.find((entry) => entry.pattern_id === record.pattern_id);
    return pattern ? recordFailures(pattern, detection, scenario) : ["DETECTION_INVALID" as const];
  });
  if (scenario === "DETECTION_INVALID" || !detection.validation.valid) failures.push("DETECTION_INVALID");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return freezeArray([...new Set(failures)]);
}

function stateFor(records: readonly PatternValidationRecord[], failures: readonly PatternValidationFailure[]): PatternValidationState {
  if (failures.includes("INSUFFICIENT_EVIDENCE")) return "REJECTED";
  if (records.some((record) => record.validation_result === "LOW_CONFIDENCE_PATTERN")) return "LOW_CONFIDENCE_PATTERN";
  return failures.length ? "REJECTED" : "VALIDATED";
}

function buildValidation(records: readonly PatternValidationRecord[], registry: PatternValidationRegistry, failures: readonly PatternValidationFailure[]): PatternValidationEvidenceValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<PatternValidationEvidenceValidation, "integrity_hash"> = {
    validation_id: "pattern_validation_evidence_engine_validation",
    state: stateFor(records, failures),
    valid: failures.length === 0 && recordsVerified && registryVerified,
    failures,
    evidence_complete: !failures.includes("INSUFFICIENT_EVIDENCE") && !failures.includes("CORRUPTED_EVIDENCE") && !failures.includes("UNSUPPORTED_EVIDENCE"),
    support_sufficient: !failures.includes("SUPPORT_THRESHOLD_UNMET"),
    recurrence_valid: !failures.includes("RECURRENCE_THRESHOLD_UNMET"),
    historical_consistent: !failures.includes("HISTORICAL_INCONSISTENCY"),
    governance_traceable: !failures.includes("GOVERNANCE_LINEAGE_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VIOLATION"),
    replay_validated: !failures.includes("REPLAY_DIVERGENCE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    lineage_complete: !failures.includes("MISSING_LINEAGE"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: recordsVerified && registryVerified,
    advisory_only: records.every((record) => record.advisory_only),
    no_adaptive_behavior: records.every((record) => !record.adaptive_behavior),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternValidationEvidenceResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    validation_records: result.validation_records,
    registry: result.registry,
    validation: result.validation,
    detection_replay_hash: result.detection_result.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<PatternValidationEvidenceResult, "integrity_hash">): string {
  return hash({
    pattern_validation_evidence_engine_version: result.pattern_validation_evidence_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_record_hashes: result.validation_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    detection_hash: result.detection_result.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    adaptive_behavior: result.adaptive_behavior,
  });
}

export function validatePatternEvidence(input: PatternValidationInput = {}): PatternValidationEvidenceResult {
  const scenario = input.scenario ?? "BASELINE";
  const detection_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const validation_records = buildValidationRecords(detection_result, scenario);
  const registry = buildRegistry(detection_result, validation_records, scenario);
  const failures = collectFailures(detection_result, validation_records, registry, scenario);
  const validation = buildValidation(validation_records, registry, failures);
  const base: Omit<PatternValidationEvidenceResult, "integrity_hash" | "replay_hash"> = {
    pattern_validation_evidence_engine_version: PATTERN_VALIDATION_VERSION,
    detection_result,
    api_surface,
    validation_records,
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
    strategic_scoring: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternEvidenceValidation(result: PatternValidationEvidenceResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternDetection(result.detection_result);
}

export function computePatternValidationRecordHash(record: Omit<PatternValidationRecord, "integrity_hash"> | PatternValidationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getPatternValidationEvidenceFoundation(): PatternValidationEvidenceFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_validation_evidence_engine_version: PATTERN_VALIDATION_VERSION,
    api_surface,
    result: validatePatternEvidence(),
  });
}

export const PatternValidationEvidenceEngine = Object.freeze({
  validate: validatePatternEvidence,
  replay: replayPatternEvidenceValidation,
});
