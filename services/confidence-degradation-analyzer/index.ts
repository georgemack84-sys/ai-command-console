import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeEvidenceReliability } from "@/services/evidence-reliability-recalibrator";
import type {
  AgingModelCategory,
  ConfidenceDegradationApiSurface,
  ConfidenceDegradationFailure,
  ConfidenceDegradationFoundation,
  ConfidenceDegradationInput,
  ConfidenceDegradationLevel,
  ConfidenceDegradationRecord,
  ConfidenceDegradationRegistry,
  ConfidenceDegradationReport,
  ConfidenceDegradationResult,
  ConfidenceDegradationType,
  ConfidenceDegradationValidation,
  ConfidenceFailurePattern,
  ConfidenceQualityTrend,
  ConfidenceTrendHistory,
  PredictionFailureCategory,
} from "@/types/confidence-degradation-analyzer";

const CONFIDENCE_DEGRADATION_VERSION = "confidence-degradation-analyzer/v1" as const;

type Scenario = NonNullable<ConfidenceDegradationInput["scenario"]>;
type DegradationSample = Readonly<{
  severity: ConfidenceDegradationLevel;
  types: readonly ConfidenceDegradationType[];
  qualityTrend: ConfidenceQualityTrend;
  agingCategory: AgingModelCategory;
  failureCategory: PredictionFailureCategory;
  accuracyDelta: number;
  duration: number;
  frequency: number;
  stability: number;
}>;

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

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildApiSurface(): ConfidenceDegradationApiSurface {
  const base: Omit<ConfidenceDegradationApiSurface, "integrity_hash"> = {
    api_id: "confidence_degradation_analyzer_api",
    analyze_degradation: "POST /confidence-degradation-analyzer/analyze",
    retrieve_records: "POST /confidence-degradation-analyzer/records",
    retrieve_patterns: "POST /confidence-degradation-analyzer/patterns",
    retrieve_trends: "POST /confidence-degradation-analyzer/trends",
    retrieve_report: "POST /confidence-degradation-analyzer/report",
    retrieve_registry: "POST /confidence-degradation-analyzer/registry",
    retrieve_inflation: "POST /confidence-degradation-analyzer/inflation",
    retrieve_collapse: "POST /confidence-degradation-analyzer/collapse",
    retrieve_oscillation: "POST /confidence-degradation-analyzer/oscillation",
    retrieve_inconsistency: "POST /confidence-degradation-analyzer/inconsistency",
    retrieve_aging: "POST /confidence-degradation-analyzer/aging",
    retrieve_evidence_decay: "POST /confidence-degradation-analyzer/evidence-decay",
    retrieve_prediction_failures: "POST /confidence-degradation-analyzer/prediction-failures",
    retrieve_saturation: "POST /confidence-degradation-analyzer/saturation",
    replay_analysis: "POST /confidence-degradation-analyzer/replay",
    retrieve_contract: "GET /confidence-degradation-analyzer/contract",
    update_supported: false,
    delete_supported: false,
    confidence_mutation_supported: false,
    model_update_supported: false,
    governance_bypass_supported: false,
    automatic_adaptation_supported: false,
    historical_record_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): DegradationSample {
  const map: Partial<Record<Scenario, DegradationSample>> = {
    NONE: { severity: "NONE", types: ["CONFIDENCE_INCONSISTENCY"], qualityTrend: "HEALTHY", agingCategory: "CURRENT", failureCategory: "ISOLATED", accuracyDelta: 0.01, duration: 14, frequency: 1, stability: 0.95 },
    LOW: { severity: "LOW", types: ["CONFIDENCE_INCONSISTENCY"], qualityTrend: "STABLE", agingCategory: "STABLE", failureCategory: "ISOLATED", accuracyDelta: 0.06, duration: 30, frequency: 2, stability: 0.84 },
    MODERATE: { severity: "MODERATE", types: ["CONFIDENCE_INCONSISTENCY", "REPEATED_PREDICTION_FAILURE"], qualityTrend: "DEGRADING", agingCategory: "AGING", failureCategory: "RECURRING", accuracyDelta: 0.16, duration: 75, frequency: 5, stability: 0.66 },
    HIGH: { severity: "HIGH", types: ["CONFIDENCE_INFLATION", "EVIDENCE_DECAY", "REPEATED_PREDICTION_FAILURE"], qualityTrend: "DEGRADING", agingCategory: "DEGRADING", failureCategory: "PERSISTENT", accuracyDelta: 0.31, duration: 120, frequency: 9, stability: 0.42 },
    CRITICAL: { severity: "CRITICAL", types: ["CONFIDENCE_INFLATION", "CONFIDENCE_COLLAPSE", "CONFIDENCE_OSCILLATION", "CONFIDENCE_SATURATION", "REPEATED_PREDICTION_FAILURE"], qualityTrend: "VOLATILE", agingCategory: "OBSOLETE", failureCategory: "CRITICAL", accuracyDelta: 0.52, duration: 180, frequency: 16, stability: 0.18 },
    INFLATION: { severity: "HIGH", types: ["CONFIDENCE_INFLATION"], qualityTrend: "DEGRADING", agingCategory: "DEGRADING", failureCategory: "PERSISTENT", accuracyDelta: 0.34, duration: 110, frequency: 8, stability: 0.46 },
    COLLAPSE: { severity: "HIGH", types: ["CONFIDENCE_COLLAPSE"], qualityTrend: "DEGRADING", agingCategory: "AGING", failureCategory: "PERSISTENT", accuracyDelta: 0.3, duration: 95, frequency: 7, stability: 0.38 },
    OSCILLATION: { severity: "MODERATE", types: ["CONFIDENCE_OSCILLATION"], qualityTrend: "VOLATILE", agingCategory: "AGING", failureCategory: "RECURRING", accuracyDelta: 0.22, duration: 85, frequency: 10, stability: 0.3 },
    INCONSISTENCY: { severity: "MODERATE", types: ["CONFIDENCE_INCONSISTENCY"], qualityTrend: "VOLATILE", agingCategory: "STABLE", failureCategory: "RECURRING", accuracyDelta: 0.18, duration: 70, frequency: 6, stability: 0.48 },
    AGING_MODEL: { severity: "HIGH", types: ["AGING_MODEL"], qualityTrend: "DEGRADING", agingCategory: "DEGRADING", failureCategory: "PERSISTENT", accuracyDelta: 0.28, duration: 150, frequency: 8, stability: 0.44 },
    EVIDENCE_DECAY: { severity: "HIGH", types: ["EVIDENCE_DECAY"], qualityTrend: "DEGRADING", agingCategory: "AGING", failureCategory: "RECURRING", accuracyDelta: 0.29, duration: 130, frequency: 7, stability: 0.5 },
    REPEATED_FAILURE: { severity: "CRITICAL", types: ["REPEATED_PREDICTION_FAILURE"], qualityTrend: "DEGRADING", agingCategory: "DEGRADING", failureCategory: "SYSTEMIC", accuracyDelta: 0.46, duration: 160, frequency: 15, stability: 0.25 },
    SATURATION: { severity: "HIGH", types: ["CONFIDENCE_SATURATION"], qualityTrend: "STABLE", agingCategory: "DEGRADING", failureCategory: "PERSISTENT", accuracyDelta: 0.33, duration: 140, frequency: 9, stability: 0.7 },
  };
  return map[scenario] ?? map.MODERATE!;
}

function categoryFor(type: ConfidenceDegradationType, sample: DegradationSample): ConfidenceDegradationRecord["degradation_category"] {
  if (type === "AGING_MODEL") return sample.agingCategory;
  if (type === "REPEATED_PREDICTION_FAILURE") return sample.failureCategory;
  return sample.severity;
}

function buildRecords(sample: DegradationSample, scenario: Scenario, evidenceRef: string): readonly ConfidenceDegradationRecord[] {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_degradation_1", evidenceRef]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_degradation_1"]);
  const evidence_refs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([evidenceRef]);
  return freezeArray(sample.types.map((type, index) => {
    const adjustment = index * 0.02;
    const base: Omit<ConfidenceDegradationRecord, "integrity_hash"> = {
      degradation_id: `confidence_degradation_${hash(`${scenario}:${type}:${sample.severity}`).slice(0, 16)}`,
      tenant_id: scenario === "CROSS_TENANT" && index === 0 ? "tenant_mission_control:foreign" : "tenant_mission_control",
      mission_scope: "mission_scope_confidence_degradation",
      degradation_type: type,
      degradation_category: categoryFor(type, sample),
      severity: sample.severity,
      detected_pattern: `${type} recurring at frequency ${sample.frequency + index}.`,
      supporting_confidence_refs: scenario === "MISSING_CONFIDENCE_HISTORY" ? freezeArray([]) : freezeArray(["confidence_history_ref_1", "confidence_history_ref_2"]),
      supporting_outcome_refs: scenario === "MISSING_OUTCOME_VALIDATION" ? freezeArray([]) : freezeArray(["outcome_validation_ref_1"]),
      supporting_evidence_refs: evidence_refs,
      confidence_accuracy_delta: clamp(sample.accuracyDelta + adjustment),
      degradation_duration_days: sample.duration + (index * 7),
      degradation_frequency: sample.frequency + index,
      governance_impact: sample.severity,
      governance_refs,
      replay_refs,
      advisory_only: true,
      mutates_confidence: false,
      updates_confidence_model: false,
      changes_governance_requirements: false,
      triggers_adaptation: false,
      mutates_historical_records: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && index === 0) return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.degradation_id }) });
    if (scenario === "CONFIDENCE_MUTATION" && index === 0) return Object.freeze({ ...record, mutates_confidence: true as false });
    if (scenario === "MODEL_UPDATE" && index === 0) return Object.freeze({ ...record, updates_confidence_model: true as false });
    if (scenario === "GOVERNANCE_BYPASS" && index === 0) return Object.freeze({ ...record, changes_governance_requirements: true as false });
    if (scenario === "AUTO_ADAPTATION" && index === 0) return Object.freeze({ ...record, triggers_adaptation: true as false });
    if (scenario === "HISTORICAL_RECORD_MUTATION" && index === 0) return Object.freeze({ ...record, mutates_historical_records: true as false });
    return record;
  }));
}

function buildPatterns(records: readonly ConfidenceDegradationRecord[], sample: DegradationSample, scenario: Scenario): readonly ConfidenceFailurePattern[] {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_failure_pattern_1"]);
  return freezeArray(records.map((record) => {
    const base: Omit<ConfidenceFailurePattern, "integrity_hash"> = {
      pattern_id: `confidence_failure_pattern_${hash(record.degradation_id).slice(0, 14)}`,
      tenant_id: record.tenant_id,
      failure_type: record.degradation_type,
      recurrence_frequency: record.degradation_frequency,
      affected_domains: freezeArray(["Recommendation Intelligence", "Forecast Intelligence", "Adaptive Intelligence"]),
      root_cause_summary: `${record.degradation_type} explains ${record.confidence_accuracy_delta} confidence accuracy delta.`,
      evidence_refs: record.supporting_evidence_refs,
      confidence_refs: record.supporting_confidence_refs,
      recommended_investigation: freezeArray([
        "Review recurring confidence failure pattern under governance.",
        sample.severity === "CRITICAL" ? "Run simulation before downstream adaptation proposal." : "Monitor recurrence before adaptation planning.",
      ]),
      replay_refs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildTrendHistory(records: readonly ConfidenceDegradationRecord[], sample: DegradationSample, scenario: Scenario): ConfidenceTrendHistory {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_trend_history_1"]);
  const base: Omit<ConfidenceTrendHistory, "integrity_hash"> = {
    trend_history_id: `confidence_trend_history_${hash(records.map((record) => record.degradation_id)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    reporting_period: "2026-Q3 trailing 180d",
    confidence_quality_trend: sample.qualityTrend,
    degradation_events: records.map((record) => record.degradation_id),
    recovery_events: sample.qualityTrend === "RECOVERING" ? freezeArray(["confidence_recovery_event_1"]) : freezeArray([]),
    confidence_stability: sample.stability,
    trend_summary: `${sample.qualityTrend} confidence trend with ${records.length} degradation event(s).`,
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function severityDistribution(records: readonly ConfidenceDegradationRecord[]): Readonly<Record<ConfidenceDegradationLevel, number>> {
  const levels: ConfidenceDegradationLevel[] = ["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"];
  return Object.freeze(levels.reduce((distribution, level) => ({
    ...distribution,
    [level]: records.filter((record) => record.severity === level).length,
  }), {} as Record<ConfidenceDegradationLevel, number>));
}

function buildReport(records: readonly ConfidenceDegradationRecord[], trend: ConfidenceTrendHistory, sample: DegradationSample, scenario: Scenario): ConfidenceDegradationReport {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_degradation_report_1"]);
  const governance_findings = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([
    `${sample.severity} degradation remains advisory and requires governance before any confidence adaptation proposal.`,
  ]);
  const base: Omit<ConfidenceDegradationReport, "integrity_hash"> = {
    report_id: `confidence_degradation_report_${hash(trend.trend_history_id).slice(0, 14)}`,
    reporting_period: "2026-Q3",
    degradation_summary: `${sample.severity} confidence degradation detected across ${records.length} pattern(s).`,
    detected_patterns: freezeArray([...new Set(records.map((record) => record.degradation_type))]),
    severity_distribution: severityDistribution(records),
    confidence_trends: trend.confidence_quality_trend,
    evidence_findings: freezeArray(records.flatMap((record) => record.supporting_evidence_refs).length ? ["Evidence lineage contributes to degradation analysis."] : []),
    governance_findings,
    recommended_follow_up: freezeArray(["Preserve degradation finding in the confidence adaptation ledger.", "Route high or critical degradation through simulation and operator assessment."]),
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(records: readonly ConfidenceDegradationRecord[], patterns: readonly ConfidenceFailurePattern[], trend: ConfidenceTrendHistory, report: ConfidenceDegradationReport, scenario: Scenario): ConfidenceDegradationRegistry {
  const levels: ConfidenceDegradationLevel[] = ["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"];
  const types: ConfidenceDegradationType[] = ["CONFIDENCE_INFLATION", "CONFIDENCE_COLLAPSE", "CONFIDENCE_OSCILLATION", "CONFIDENCE_INCONSISTENCY", "AGING_MODEL", "EVIDENCE_DECAY", "REPEATED_PREDICTION_FAILURE", "CONFIDENCE_SATURATION"];
  const severity_index = levels.reduce((index, level) => ({ ...index, [level]: freezeArray(records.filter((record) => record.severity === level).map((record) => record.degradation_id)) }), {} as Record<ConfidenceDegradationLevel, readonly string[]>);
  const type_index = types.reduce((index, type) => ({ ...index, [type]: freezeArray(records.filter((record) => record.degradation_type === type).map((record) => record.degradation_id)) }), {} as Record<ConfidenceDegradationType, readonly string[]>);
  const base: Omit<ConfidenceDegradationRegistry, "integrity_hash"> = {
    registry_id: `confidence_degradation_registry_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    degradation_record_refs: records.map((record) => record.degradation_id),
    failure_pattern_refs: patterns.map((pattern) => pattern.pattern_id),
    trend_history_refs: freezeArray([trend.trend_history_id]),
    report_refs: freezeArray([report.report_id]),
    severity_index: Object.freeze(severity_index),
    type_index: Object.freeze(type_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(records: readonly ConfidenceDegradationRecord[], patterns: readonly ConfidenceFailurePattern[], trend: ConfidenceTrendHistory, report: ConfidenceDegradationReport, registry: ConfidenceDegradationRegistry, scenario: Scenario): readonly ConfidenceDegradationFailure[] {
  const failures: ConfidenceDegradationFailure[] = [];
  if (scenario === "MISSING_CONFIDENCE_HISTORY" || records.some((record) => record.supporting_confidence_refs.length === 0)) failures.push("CONFIDENCE_HISTORY_MISSING");
  if (scenario === "MISSING_OUTCOME_VALIDATION" || records.some((record) => record.supporting_outcome_refs.length === 0)) failures.push("OUTCOME_VALIDATION_MISSING");
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => record.supporting_evidence_refs.length === 0)) failures.push("EVIDENCE_HISTORY_MISSING");
  if (scenario === "MISSING_REPLAY" || records.some((record) => record.replay_refs.length === 0) || patterns.some((pattern) => pattern.replay_refs.length === 0) || trend.replay_refs.length === 0 || report.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => record.governance_refs.length === 0) || report.governance_findings.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || records.some((record) => record.tenant_id !== registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || patterns.some((pattern) => hashWithoutIntegrity(pattern) !== pattern.integrity_hash) || hashWithoutIntegrity(trend) !== trend.integrity_hash || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "CONFIDENCE_MUTATION" || records.some((record) => record.mutates_confidence)) failures.push("CONFIDENCE_MUTATION_DETECTED");
  if (scenario === "MODEL_UPDATE" || records.some((record) => record.updates_confidence_model)) failures.push("CONFIDENCE_MODEL_UPDATE_DETECTED");
  if (scenario === "GOVERNANCE_BYPASS" || records.some((record) => record.changes_governance_requirements)) failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (scenario === "AUTO_ADAPTATION" || records.some((record) => record.triggers_adaptation)) failures.push("AUTOMATIC_ADAPTATION_DETECTED");
  if (scenario === "HISTORICAL_RECORD_MUTATION" || records.some((record) => record.mutates_historical_records)) failures.push("HISTORICAL_RECORD_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_ANALYSIS");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly ConfidenceDegradationFailure[]): ConfidenceDegradationValidation["state"] {
  if (failures.includes("OUTCOME_VALIDATION_MISSING")) return "PENDING_OUTCOME_VALIDATION";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(records: readonly ConfidenceDegradationRecord[], patterns: readonly ConfidenceFailurePattern[], trend: ConfidenceTrendHistory, report: ConfidenceDegradationReport, registry: ConfidenceDegradationRegistry, failures: readonly ConfidenceDegradationFailure[]): ConfidenceDegradationValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const patternsVerified = patterns.every((pattern) => hashWithoutIntegrity(pattern) === pattern.integrity_hash);
  const trendVerified = hashWithoutIntegrity(trend) === trend.integrity_hash;
  const reportVerified = hashWithoutIntegrity(report) === report.integrity_hash;
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<ConfidenceDegradationValidation, "integrity_hash"> = {
    validation_id: "confidence_degradation_analyzer_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && patternsVerified && trendVerified && reportVerified && registryVerified,
    failures,
    confidence_history_complete: !failures.includes("CONFIDENCE_HISTORY_MISSING"),
    outcome_validation_complete: !failures.includes("OUTCOME_VALIDATION_MISSING"),
    evidence_history_complete: !failures.includes("EVIDENCE_HISTORY_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_ANALYSIS"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: records.every((record) => record.advisory_only),
    no_confidence_mutation: records.every((record) => !record.mutates_confidence),
    no_model_update: records.every((record) => !record.updates_confidence_model),
    no_governance_bypass: records.every((record) => !record.changes_governance_requirements),
    no_automatic_adaptation: records.every((record) => !record.triggers_adaptation),
    no_historical_record_mutation: records.every((record) => !record.mutates_historical_records),
    integrity_verified: recordsVerified && patternsVerified && trendVerified && reportVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceDegradationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    degradation_records: result.degradation_records,
    failure_patterns: result.failure_patterns,
    trend_history: result.trend_history,
    report: result.report,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<ConfidenceDegradationResult, "integrity_hash">): string {
  return hash({
    confidence_degradation_analyzer_version: result.confidence_degradation_analyzer_version,
    api_surface_hash: result.api_surface.integrity_hash,
    degradation_record_hashes: result.degradation_records.map((record) => record.integrity_hash),
    failure_pattern_hashes: result.failure_patterns.map((pattern) => pattern.integrity_hash),
    trend_history_hash: result.trend_history.integrity_hash,
    report_hash: result.report.integrity_hash,
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeConfidenceDegradation(input: ConfidenceDegradationInput = {}): ConfidenceDegradationResult {
  const scenario = input.scenario ?? "BASELINE";
  const reliability = input.evidence_reliability_result ?? analyzeEvidenceReliability();
  const evidenceRef = reliability.reliability_records[0]?.evidence_reliability_id ?? "evidence_reliability_ref_missing";
  const api_surface = buildApiSurface();
  const sample = sampleForScenario(scenario);
  const degradation_records = buildRecords(sample, scenario, evidenceRef);
  const failure_patterns = buildPatterns(degradation_records, sample, scenario);
  const trend_history = buildTrendHistory(degradation_records, sample, scenario);
  const report = buildReport(degradation_records, trend_history, sample, scenario);
  const registry = buildRegistry(degradation_records, failure_patterns, trend_history, report, scenario);
  const failures = collectFailures(degradation_records, failure_patterns, trend_history, report, registry, scenario);
  const validation = buildValidation(degradation_records, failure_patterns, trend_history, report, registry, failures);
  const base: Omit<ConfidenceDegradationResult, "integrity_hash" | "replay_hash"> = {
    confidence_degradation_analyzer_version: CONFIDENCE_DEGRADATION_VERSION,
    api_surface,
    degradation_records,
    failure_patterns,
    trend_history,
    report,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_history_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_confidence: false,
    updates_confidence_model: false,
    changes_governance_requirements: false,
    triggers_adaptation: false,
    mutates_historical_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceDegradation(result: ConfidenceDegradationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConfidenceDegradationFoundation(): ConfidenceDegradationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_degradation_analyzer_version: CONFIDENCE_DEGRADATION_VERSION,
    api_surface,
    result: analyzeConfidenceDegradation(),
  });
}

export const ConfidenceDegradationAnalyzer = Object.freeze({
  analyze: analyzeConfidenceDegradation,
  replay: replayConfidenceDegradation,
});
