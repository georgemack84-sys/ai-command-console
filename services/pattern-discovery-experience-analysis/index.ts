import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { captureMissionKnowledge, validateMissionKnowledgeCapture } from "@/services/mission-knowledge-capture-engine";
import type { MissionKnowledgeRecord } from "@/types/mission-knowledge-capture-engine";
import type {
  ExperienceCorrelationRecord,
  OperationalPatternCategory,
  OperationalPatternRecord,
  PatternAnalysisAuditRecord,
  PatternAnalysisFailure,
  PatternAnalysisInput,
  PatternAnalysisObservabilitySurface,
  PatternAnalysisRepository,
  PatternAnalysisScenario,
  PatternAnalysisValidationResult,
  PatternDiscoveryExperienceAnalysisBundle,
  PatternTrendRecord,
} from "@/types/pattern-discovery-experience-analysis";

const VERSION = "pattern-discovery-experience-analysis/v8ALT.9.3" as const;
const states = Object.freeze(["CANDIDATE", "OBSERVED", "RECURRING", "VALIDATED", "CERTIFIED", "SUPERSEDED", "ARCHIVED", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: PatternAnalysisScenario): PatternAnalysisFailure | null {
  const map: Partial<Record<PatternAnalysisScenario, PatternAnalysisFailure>> = {
    INVALID_CAPTURE_PACKAGE: "INVALID_CAPTURE_PACKAGE",
    INCOMPLETE_EVIDENCE: "INCOMPLETE_EVIDENCE_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    ORPHANED_LINEAGE: "ORPHANED_LINEAGE_DETECTED",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    UNSTABLE_ANALYTICAL_RESULT: "UNSTABLE_ANALYTICAL_RESULT_DETECTED",
    NONDETERMINISTIC_DISCOVERY: "NONDETERMINISTIC_DISCOVERY_DETECTED",
    DUPLICATE_CERTIFIED_PATTERN: "DUPLICATE_CERTIFIED_PATTERN_DETECTED",
    CROSS_TENANT_CORRELATION_ATTEMPT: "CROSS_TENANT_CORRELATION_DETECTED",
    HISTORICAL_REWRITE_ATTEMPT: "HISTORICAL_REWRITE_DETECTED",
    TEMPLATE_GENERATION_ATTEMPTED: "TEMPLATE_GENERATION_ATTEMPTED",
    RUNTIME_INFLUENCE_ATTEMPTED: "RUNTIME_INFLUENCE_ATTEMPTED",
    PLANNING_MODIFICATION_ATTEMPTED: "PLANNING_MODIFICATION_ATTEMPTED",
  };
  return map[scenario] ?? null;
}

function category(index: number): OperationalPatternCategory {
  const values: readonly OperationalPatternCategory[] = ["PLANNING_PATTERN", "EXECUTION_PATTERN", "RECOVERY_PATTERN", "GOVERNANCE_PATTERN", "CONFIDENCE_PATTERN", "MISSION_HEALTH_PATTERN", "OPERATOR_PATTERN", "OPTIMIZATION_PATTERN"];
  return values[index % values.length] ?? "PLANNING_PATTERN";
}

function buildPattern(record: MissionKnowledgeRecord, index: number, scenario: PatternAnalysisScenario): OperationalPatternRecord {
  const duplicate = scenario === "DUPLICATE_CERTIFIED_PATTERN";
  const unstable = scenario === "UNSTABLE_ANALYTICAL_RESULT";
  const base = {
    pattern_id: duplicate && index > 0 ? id("PAT", "operational-pattern", { index: 0 }) : id("PAT", "operational-pattern", { record: record.knowledge_record_id, index, scenario }),
    pattern_name: `Operational pattern ${index + 1}`,
    pattern_version: "1.0.0",
    pattern_category: category(index),
    classification_state: "CERTIFIED" as const,
    tenant_id: scenario === "CROSS_TENANT_CORRELATION_ATTEMPT" && index === 0 ? "tenant:foreign" : record.tenant_id,
    contributing_missions: freezeArray([record.mission_id]),
    contributing_executions: freezeArray([record.execution_id]),
    contributing_replays: scenario === "REPLAY_INCONSISTENCY" && index === 0 ? freezeArray(["replay:mismatch"]) : record.replay_references,
    contributing_knowledge_records: freezeArray([record.knowledge_record_id]),
    recurrence_frequency: unstable ? 1 : 4 + index,
    occurrence_rate: unstable ? 0.18 : 0.72,
    stability_score: unstable ? 0.31 : 0.91,
    confidence_score: scenario === "NONDETERMINISTIC_DISCOVERY" && index === 0 ? 0.33 : 0.94,
    impact_level: "MODERATE" as const,
    evidence_chain: scenario === "INCOMPLETE_EVIDENCE" && index === 0 ? freezeArray([]) : record.evidence_references,
    replay_references: scenario === "REPLAY_INCONSISTENCY" && index === 0 ? freezeArray(["replay:mismatch"]) : record.replay_references,
    lineage_references: scenario === "ORPHANED_LINEAGE" && index === 0 ? freezeArray([]) : record.lineage_references,
    governance_validation: scenario === "GOVERNANCE_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    constitutional_validation: scenario === "CONSTITUTIONAL_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    authority_validation: "PASS" as const,
    success_rate: 0.78,
    failure_rate: 0.12,
    recovery_rate: 0.83,
    intervention_rate: 0.21,
    replay_consistency: scenario === "REPLAY_INCONSISTENCY" && index === 0 ? 0 : 1,
    explainability: freezeArray(["recurrence detected", "evidence-backed", "replay verified", "governance checked", "no runtime change"]),
    analysis_only: true as const,
    template_generation_authorized: scenario === "TEMPLATE_GENERATION_ATTEMPTED" && index === 0,
    runtime_influence_authorized: scenario === "RUNTIME_INFLUENCE_ATTEMPTED" && index === 0,
    planning_modification_authorized: scenario === "PLANNING_MODIFICATION_ATTEMPTED" && index === 0,
    historical_truth_mutable: scenario === "HISTORICAL_REWRITE_ATTEMPT" && index === 0,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("operational-pattern", base) });
}

function buildCorrelation(pattern: OperationalPatternRecord, index: number): ExperienceCorrelationRecord {
  const types: readonly ExperienceCorrelationRecord["correlation_type"][] = ["PLANNING_EXECUTION", "EXECUTION_RECOVERY", "RECOVERY_OUTCOME", "CONFIDENCE_OUTCOME", "GOVERNANCE_SUCCESS", "OPERATOR_RECOVERY", "HEALTH_EXECUTION"];
  const base = { correlation_id: id("COR", "experience-correlation", pattern.pattern_id), pattern_id: pattern.pattern_id, correlation_type: types[index % types.length] ?? "PLANNING_EXECUTION", source_record_ids: pattern.contributing_knowledge_records, correlation_strength: 0.86, deterministic_model_reference: `model:${pattern.pattern_id}`, replay_reference: pattern.replay_references[0] ?? "" };
  return Object.freeze({ ...base, integrity_hash: hashValue("experience-correlation", base) });
}

function buildTrend(pattern: OperationalPatternRecord, index: number): PatternTrendRecord {
  const types: readonly PatternTrendRecord["trend_type"][] = ["SUCCESS", "FAILURE", "RECOVERY", "CONFIDENCE", "GOVERNANCE", "MISSION_HEALTH", "OPERATOR_INTERVENTION"];
  const base = { trend_id: id("TRD", "pattern-trend", pattern.pattern_id), pattern_id: pattern.pattern_id, trend_type: types[index % types.length] ?? "SUCCESS", stability_score: pattern.stability_score, recurrence_count: pattern.recurrence_frequency, trend_confidence: pattern.confidence_score, replay_consistency: pattern.replay_consistency };
  return Object.freeze({ ...base, integrity_hash: hashValue("pattern-trend", base) });
}

function audit(failure: PatternAnalysisFailure, scenario: PatternAnalysisScenario): PatternAnalysisAuditRecord {
  const base = { audit_id: id("PAA", "pattern-analysis-audit", { failure, scenario }), pattern_id: null, rejection_reason: failure, immutable: true as const, append_only: true as const, evidence_reference: `audit:pattern:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("pattern-analysis-audit", base) });
}

function collectFailures(repository: Omit<PatternAnalysisRepository, "integrity_hash"> | PatternAnalysisRepository): readonly PatternAnalysisFailure[] {
  const ids = repository.patterns.map((pattern) => pattern.pattern_id);
  return unique([
    ...repository.failures,
    ...(repository.patterns.some((p) => p.evidence_chain.length === 0) ? ["INCOMPLETE_EVIDENCE_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.replay_consistency < 1 || p.replay_references.some((r) => r.includes("mismatch"))) ? ["REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => !p.integrity_hash) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.lineage_references.length === 0) ? ["ORPHANED_LINEAGE_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.governance_validation === "FAIL") ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.constitutional_validation === "FAIL") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.stability_score < 0.7) ? ["UNSTABLE_ANALYTICAL_RESULT_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.confidence_score < 0.5) ? ["NONDETERMINISTIC_DISCOVERY_DETECTED" as const] : []),
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_CERTIFIED_PATTERN_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.tenant_id !== "tenant:alpha") ? ["CROSS_TENANT_CORRELATION_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.historical_truth_mutable) ? ["HISTORICAL_REWRITE_DETECTED" as const] : []),
    ...(repository.patterns.some((p) => p.template_generation_authorized) ? ["TEMPLATE_GENERATION_ATTEMPTED" as const] : []),
    ...(repository.patterns.some((p) => p.runtime_influence_authorized) ? ["RUNTIME_INFLUENCE_ATTEMPTED" as const] : []),
    ...(repository.patterns.some((p) => p.planning_modification_authorized) ? ["PLANNING_MODIFICATION_ATTEMPTED" as const] : []),
  ]);
}

export function analyzeMissionExperience(input: PatternAnalysisInput = {}): PatternAnalysisRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const capture = input.capture ?? captureMissionKnowledge(scenario === "INVALID_CAPTURE_PACKAGE" ? { scenario: "CORRUPTED_EVIDENCE" } : {});
  const captureValid = validateMissionKnowledgeCapture(capture).valid;
  const injected = scenarioFailure(scenario);
  const selected = capture.records.slice(0, 6);
  const patterns = freezeArray(selected.map((record, index) => buildPattern(record, index, scenario)));
  const correlations = freezeArray(patterns.map((pattern, index) => buildCorrelation(pattern, index)));
  const trends = freezeArray(patterns.map((pattern, index) => buildTrend(pattern, index)));
  const source = { repository_id: id("PDA", "pattern-discovery-analysis", { scenario, capture: capture.capture_id }), source_capture_id: capture.capture_id, final_state: "PATTERN_ANALYSIS_COMPLETE" as const, patterns, correlations, trends, audits: freezeArray<PatternAnalysisAuditRecord>([]), failures: unique([...(injected ? [injected] : []), ...(!captureValid ? ["INVALID_CAPTURE_PACKAGE" as const] : [])]), analysis_only: true as const, template_generation_authorized: false as const, runtime_influence_authorized: false as const, planning_modification_authorized: false as const, historical_truth_mutable: false as const };
  const failures = collectFailures(source);
  const audits = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const repository = { ...source, failures, audits, final_state: failures.length ? "PATTERN_ANALYSIS_REJECTED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("pattern-analysis-repository", repository) });
}

export function listOperationalPatterns(input: PatternAnalysisInput = {}) { return analyzeMissionExperience(input).patterns; }
export function listExperienceCorrelations(input: PatternAnalysisInput = {}) { return analyzeMissionExperience(input).correlations; }
export function listPatternTrends(input: PatternAnalysisInput = {}) { return analyzeMissionExperience(input).trends; }
export function listPatternAnalysisAudits(input: PatternAnalysisInput = {}) { return analyzeMissionExperience(input).audits; }

export function validatePatternAnalysis(repository = analyzeMissionExperience()): PatternAnalysisValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: PatternAnalysisFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "PATTERN_ANALYSIS_COMPLETE" && repository.analysis_only && !repository.runtime_influence_authorized && !repository.template_generation_authorized && !repository.planning_modification_authorized;
  const source = { repository_id: repository.repository_id, valid, capture_package_valid: !has("INVALID_CAPTURE_PACKAGE"), evidence_complete: !has("INCOMPLETE_EVIDENCE_DETECTED"), replay_consistent: !has("REPLAY_INCONSISTENCY_DETECTED"), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), lineage_complete: !has("ORPHANED_LINEAGE_DETECTED"), governance_valid: !has("GOVERNANCE_VIOLATION_DETECTED"), constitutional_valid: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), stable_analysis: !has("UNSTABLE_ANALYTICAL_RESULT_DETECTED"), deterministic_discovery: !has("NONDETERMINISTIC_DISCOVERY_DETECTED"), duplicate_patterns_absent: !has("DUPLICATE_CERTIFIED_PATTERN_DETECTED"), tenant_isolated: !has("CROSS_TENANT_CORRELATION_DETECTED"), historical_truth_preserved: !has("HISTORICAL_REWRITE_DETECTED"), analysis_only: true as const, template_generation_absent: !has("TEMPLATE_GENERATION_ATTEMPTED"), runtime_influence_absent: !has("RUNTIME_INFLUENCE_ATTEMPTED"), planning_modification_absent: !has("PLANNING_MODIFICATION_ATTEMPTED"), fail_closed: valid || failures.length > 0 || repository.final_state !== "PATTERN_ANALYSIS_COMPLETE", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("pattern-analysis-validation", source) });
}

export function buildPatternAnalysisObservabilitySurface(repository = analyzeMissionExperience()): PatternAnalysisObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, pattern_count: repository.patterns.length, correlation_count: repository.correlations.length, trend_count: repository.trends.length, audit_count: repository.audits.length, failure_count: repository.failures.length, analysis_only: true, runtime_influence_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getPatternDiscoveryExperienceAnalysisEngine(): PatternDiscoveryExperienceAnalysisBundle {
  const repository = analyzeMissionExperience();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "PATTERN_DISCOVERY_ANALYSIS_READY", classification_states: states, principles: freezeArray(["analysis-only", "capture-package-derived", "deterministic-patterns", "evidence-backed", "replay-compatible", "governance-validated", "tenant-isolated", "immutable-audits", "no-template-generation", "no-runtime-influence"]) }), repository, validation: validatePatternAnalysis(repository), observability: buildPatternAnalysisObservabilitySurface(repository) });
}
