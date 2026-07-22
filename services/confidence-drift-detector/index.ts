import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeConfidenceCalibration } from "@/services/confidence-calibration-engine";
import type {
  ConfidenceDriftApiSurface,
  ConfidenceDriftCategory,
  ConfidenceDriftFailure,
  ConfidenceDriftFoundation,
  ConfidenceDriftInput,
  ConfidenceDriftRecord,
  ConfidenceDriftRegistry,
  ConfidenceDriftResult,
  ConfidenceDriftTimeline,
  ConfidenceDriftTrend,
  ConfidenceDriftType,
  ConfidenceDriftValidation,
  ConfidenceTrendProfile,
  DriftAnalysisReport,
} from "@/types/confidence-drift-detector";

const CONFIDENCE_DRIFT_VERSION = "confidence-drift-detector/v1" as const;
const DETECTION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<ConfidenceDriftInput["scenario"]>;
type DriftSample = Readonly<{
  category: ConfidenceDriftCategory;
  types: readonly ConfidenceDriftType[];
  baseline: number;
  observed: number;
  velocity: number;
  duration: number;
  evidenceBaseline: number;
  evidenceObserved: number;
  calibrationBaseline: number;
  calibrationObserved: number;
  errorGrowthRate: number;
  environmentalSensitivity: number;
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

function buildApiSurface(): ConfidenceDriftApiSurface {
  const base: Omit<ConfidenceDriftApiSurface, "integrity_hash"> = {
    api_id: "confidence_drift_detector_api",
    analyze_drift: "POST /confidence-drift-detector/analyze",
    retrieve_records: "POST /confidence-drift-detector/records",
    retrieve_timeline: "POST /confidence-drift-detector/timeline",
    retrieve_trends: "POST /confidence-drift-detector/trends",
    retrieve_report: "POST /confidence-drift-detector/report",
    retrieve_registry: "POST /confidence-drift-detector/registry",
    retrieve_evidence_drift: "POST /confidence-drift-detector/evidence",
    retrieve_environment_drift: "POST /confidence-drift-detector/environment",
    retrieve_mission_drift: "POST /confidence-drift-detector/mission",
    retrieve_tenant_drift: "POST /confidence-drift-detector/tenant",
    retrieve_seasonal_drift: "POST /confidence-drift-detector/seasonal",
    retrieve_domain_drift: "POST /confidence-drift-detector/domain",
    replay_analysis: "POST /confidence-drift-detector/replay",
    retrieve_contract: "GET /confidence-drift-detector/contract",
    update_supported: false,
    delete_supported: false,
    confidence_mutation_supported: false,
    recalibration_supported: false,
    adaptation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): DriftSample {
  const map: Partial<Record<Scenario, DriftSample>> = {
    NONE: { category: "NONE", types: ["CONFIDENCE_ERROR"], baseline: 0.88, observed: 0.87, velocity: 0.01, duration: 30, evidenceBaseline: 0.9, evidenceObserved: 0.89, calibrationBaseline: 0.9, calibrationObserved: 0.89, errorGrowthRate: 0.01, environmentalSensitivity: 0.04 },
    MINOR: { category: "MINOR", types: ["CONFIDENCE_ERROR", "CALIBRATION"], baseline: 0.88, observed: 0.82, velocity: 0.04, duration: 45, evidenceBaseline: 0.9, evidenceObserved: 0.85, calibrationBaseline: 0.9, calibrationObserved: 0.84, errorGrowthRate: 0.08, environmentalSensitivity: 0.12 },
    MODERATE: { category: "MODERATE", types: ["CONFIDENCE_ERROR", "CALIBRATION"], baseline: 0.88, observed: 0.74, velocity: 0.09, duration: 75, evidenceBaseline: 0.9, evidenceObserved: 0.76, calibrationBaseline: 0.9, calibrationObserved: 0.75, errorGrowthRate: 0.18, environmentalSensitivity: 0.23 },
    SEVERE: { category: "SEVERE", types: ["CONFIDENCE_ERROR", "CALIBRATION", "EVIDENCE_QUALITY"], baseline: 0.88, observed: 0.59, velocity: 0.18, duration: 120, evidenceBaseline: 0.9, evidenceObserved: 0.58, calibrationBaseline: 0.9, calibrationObserved: 0.61, errorGrowthRate: 0.35, environmentalSensitivity: 0.42 },
    CRITICAL: { category: "CRITICAL", types: ["CONFIDENCE_ERROR", "CALIBRATION", "EVIDENCE_QUALITY", "ENVIRONMENTAL"], baseline: 0.88, observed: 0.37, velocity: 0.31, duration: 180, evidenceBaseline: 0.9, evidenceObserved: 0.35, calibrationBaseline: 0.9, calibrationObserved: 0.4, errorGrowthRate: 0.58, environmentalSensitivity: 0.68 },
    EVIDENCE_DETERIORATION: { category: "SEVERE", types: ["EVIDENCE_QUALITY"], baseline: 0.87, observed: 0.69, velocity: 0.13, duration: 90, evidenceBaseline: 0.93, evidenceObserved: 0.49, calibrationBaseline: 0.88, calibrationObserved: 0.75, errorGrowthRate: 0.22, environmentalSensitivity: 0.2 },
    ENVIRONMENTAL_SHIFT: { category: "MODERATE", types: ["ENVIRONMENTAL"], baseline: 0.86, observed: 0.73, velocity: 0.1, duration: 70, evidenceBaseline: 0.89, evidenceObserved: 0.78, calibrationBaseline: 0.87, calibrationObserved: 0.76, errorGrowthRate: 0.2, environmentalSensitivity: 0.55 },
    MISSION_SPECIFIC: { category: "MODERATE", types: ["MISSION"], baseline: 0.85, observed: 0.72, velocity: 0.09, duration: 80, evidenceBaseline: 0.9, evidenceObserved: 0.76, calibrationBaseline: 0.88, calibrationObserved: 0.74, errorGrowthRate: 0.17, environmentalSensitivity: 0.24 },
    TENANT_SPECIFIC: { category: "SEVERE", types: ["TENANT"], baseline: 0.86, observed: 0.61, velocity: 0.17, duration: 100, evidenceBaseline: 0.91, evidenceObserved: 0.64, calibrationBaseline: 0.89, calibrationObserved: 0.62, errorGrowthRate: 0.31, environmentalSensitivity: 0.28 },
    SEASONAL_VARIATION: { category: "MINOR", types: ["SEASONAL"], baseline: 0.86, observed: 0.8, velocity: 0.05, duration: 60, evidenceBaseline: 0.88, evidenceObserved: 0.82, calibrationBaseline: 0.87, calibrationObserved: 0.81, errorGrowthRate: 0.1, environmentalSensitivity: 0.18 },
    DOMAIN_SPECIFIC: { category: "MODERATE", types: ["DOMAIN"], baseline: 0.87, observed: 0.71, velocity: 0.12, duration: 95, evidenceBaseline: 0.9, evidenceObserved: 0.72, calibrationBaseline: 0.89, calibrationObserved: 0.7, errorGrowthRate: 0.24, environmentalSensitivity: 0.29 },
  };
  return map[scenario] ?? map.MODERATE!;
}

function trendFor(delta: number, volatility = 0): ConfidenceDriftTrend {
  if (volatility > 0.25) return "VOLATILE";
  if (delta > 0.04) return "DEGRADING";
  if (delta < -0.04) return "IMPROVING";
  return "STABLE";
}

function severityDistribution(records: readonly ConfidenceDriftRecord[]): Readonly<Record<ConfidenceDriftCategory, number>> {
  const categories: ConfidenceDriftCategory[] = ["NONE", "MINOR", "MODERATE", "SEVERE", "CRITICAL"];
  return Object.freeze(categories.reduce((distribution, category) => ({
    ...distribution,
    [category]: records.filter((record) => record.drift_category === category).length,
  }), {} as Record<ConfidenceDriftCategory, number>));
}

function categoryForType(records: readonly ConfidenceDriftRecord[], type: ConfidenceDriftType): ConfidenceDriftCategory {
  return records.find((record) => record.drift_type === type)?.drift_category ?? "NONE";
}

function buildDriftRecords(sample: DriftSample, scenario: Scenario, calibrationRef: string): readonly ConfidenceDriftRecord[] {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_drift_history_1", "replay_ref_confidence_drift_baseline_1"]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_drift_1"]);
  const supporting_evidence_refs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence_history_ref_confidence_1", "evidence_history_ref_confidence_2"]);
  return freezeArray(sample.types.map((type, index) => {
    const typeAdjustment = index * 0.015;
    const base: Omit<ConfidenceDriftRecord, "integrity_hash"> = {
      confidence_drift_id: `confidence_drift_${hash(`${scenario}:${type}:${sample.category}`).slice(0, 16)}`,
      tenant_id: scenario === "CROSS_TENANT" && type === "TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
      mission_scope: type === "MISSION" ? "mission_scope_recommendation_intelligence" : "mission_scope_confidence_monitoring",
      drift_type: type,
      drift_category: sample.category,
      baseline_confidence: scenario === "MISSING_BASELINE" ? 0 : sample.baseline,
      observed_confidence: clamp(sample.observed - typeAdjustment),
      drift_magnitude: clamp(Math.abs(sample.baseline - sample.observed) + typeAdjustment),
      drift_velocity: clamp(sample.velocity + typeAdjustment),
      drift_duration_days: sample.duration + (index * 5),
      supporting_evidence_refs,
      outcome_refs: freezeArray(["outcome_history_ref_confidence_1"]),
      calibration_refs: freezeArray([calibrationRef]),
      governance_refs,
      replay_refs,
      detection_timestamp: DETECTION_TIMESTAMP,
      advisory_only: true,
      mutates_confidence: false,
      triggers_adaptation: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && index === 0) return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.confidence_drift_id }) });
    if (scenario === "CONFIDENCE_MUTATION" && index === 0) return Object.freeze({ ...record, mutates_confidence: true as false });
    if (scenario === "AUTO_RECALIBRATION" && index === 0) return Object.freeze({ ...record, triggers_adaptation: true as false });
    return record;
  }));
}

function buildTrendProfile(sample: DriftSample, scenario: Scenario): ConfidenceTrendProfile {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_trend_1"]);
  const confidenceDelta = sample.baseline - sample.observed;
  const evidenceDelta = sample.evidenceBaseline - sample.evidenceObserved;
  const calibrationDelta = sample.calibrationBaseline - sample.calibrationObserved;
  const base: Omit<ConfidenceTrendProfile, "integrity_hash"> = {
    trend_profile_id: `confidence_trend_profile_${hash(`${scenario}:${confidenceDelta}:${calibrationDelta}`).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    analysis_period: "2026-Q3 trailing 180d",
    confidence_trend: trendFor(confidenceDelta, sample.velocity),
    calibration_trend: trendFor(calibrationDelta, sample.velocity),
    evidence_trend: trendFor(evidenceDelta, sample.environmentalSensitivity > 0.6 ? 0.3 : 0),
    error_trend: trendFor(sample.errorGrowthRate),
    drift_summary: `${sample.category} confidence drift detected across ${sample.types.join(", ")} dimensions.`,
    error_growth_rate: sample.errorGrowthRate,
    calibration_drift_rate: clamp(calibrationDelta),
    evidence_quality_delta: clamp(evidenceDelta),
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(records: readonly ConfidenceDriftRecord[], sample: DriftSample, scenario: Scenario): ConfidenceDriftTimeline {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_drift_timeline_1"]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_drift_timeline_1"]);
  const base: Omit<ConfidenceDriftTimeline, "integrity_hash"> = {
    timeline_id: `confidence_drift_timeline_${hash(records.map((record) => record.confidence_drift_id)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    drift_event_refs: records.map((record) => record.confidence_drift_id),
    drift_start_timestamp: "2026-01-11T00:00:00.000Z",
    drift_duration_days: Math.max(...records.map((record) => record.drift_duration_days)),
    severity_history: freezeArray(["NONE", "MINOR", sample.category]),
    confidence_history: freezeArray([sample.baseline, clamp((sample.baseline + sample.observed) / 2), sample.observed]),
    evidence_history: freezeArray([sample.evidenceBaseline, clamp((sample.evidenceBaseline + sample.evidenceObserved) / 2), sample.evidenceObserved]),
    calibration_history: freezeArray([sample.calibrationBaseline, clamp((sample.calibrationBaseline + sample.calibrationObserved) / 2), sample.calibrationObserved]),
    replay_refs,
    governance_refs,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(records: readonly ConfidenceDriftRecord[], sample: DriftSample, timeline: ConfidenceDriftTimeline, scenario: Scenario): DriftAnalysisReport {
  const distribution = severityDistribution(records);
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_drift_report_1"]);
  const governance_findings = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([
    `${sample.category} drift remains advisory and requires governed review before any adaptation proposal.`,
  ]);
  const base: Omit<DriftAnalysisReport, "integrity_hash"> = {
    report_id: `confidence_drift_report_${hash(timeline.timeline_id).slice(0, 14)}`,
    reporting_period: "2026-Q3",
    drift_summary: `${sample.category} confidence drift observed with ${records.length} drift event(s).`,
    detected_patterns: freezeArray([...new Set(records.map((record) => record.drift_type))]),
    severity_distribution: distribution,
    mission_drift: categoryForType(records, "MISSION"),
    tenant_drift: categoryForType(records, "TENANT"),
    seasonal_drift: categoryForType(records, "SEASONAL"),
    domain_drift: categoryForType(records, "DOMAIN"),
    governance_findings,
    recommended_actions: freezeArray([
      "Preserve drift finding in the adaptive intelligence ledger.",
      "Route severe or critical drift to governance review before downstream confidence adaptation.",
    ]),
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(records: readonly ConfidenceDriftRecord[], trend: ConfidenceTrendProfile, timeline: ConfidenceDriftTimeline, report: DriftAnalysisReport, scenario: Scenario): ConfidenceDriftRegistry {
  const categories: ConfidenceDriftCategory[] = ["NONE", "MINOR", "MODERATE", "SEVERE", "CRITICAL"];
  const types: ConfidenceDriftType[] = ["CONFIDENCE_ERROR", "CALIBRATION", "EVIDENCE_QUALITY", "ENVIRONMENTAL", "MISSION", "TENANT", "SEASONAL", "DOMAIN"];
  const severity_index = categories.reduce((index, category) => ({
    ...index,
    [category]: freezeArray(records.filter((record) => record.drift_category === category).map((record) => record.confidence_drift_id)),
  }), {} as Record<ConfidenceDriftCategory, readonly string[]>);
  const type_index = types.reduce((index, type) => ({
    ...index,
    [type]: freezeArray(records.filter((record) => record.drift_type === type).map((record) => record.confidence_drift_id)),
  }), {} as Record<ConfidenceDriftType, readonly string[]>);
  const base: Omit<ConfidenceDriftRegistry, "integrity_hash"> = {
    registry_id: `confidence_drift_registry_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    drift_record_refs: records.map((record) => record.confidence_drift_id),
    trend_profile_refs: freezeArray([trend.trend_profile_id]),
    timeline_refs: freezeArray([timeline.timeline_id]),
    report_refs: freezeArray([report.report_id]),
    severity_index: Object.freeze(severity_index),
    type_index: Object.freeze(type_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(records: readonly ConfidenceDriftRecord[], trend: ConfidenceTrendProfile, timeline: ConfidenceDriftTimeline, report: DriftAnalysisReport, registry: ConfidenceDriftRegistry, scenario: Scenario): readonly ConfidenceDriftFailure[] {
  const failures: ConfidenceDriftFailure[] = [];
  if (scenario === "MISSING_BASELINE" || records.some((record) => record.baseline_confidence <= 0)) failures.push("HISTORICAL_BASELINE_MISSING");
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => record.supporting_evidence_refs.length === 0)) failures.push("EVIDENCE_HISTORY_MISSING");
  if (scenario === "MISSING_REPLAY" || records.some((record) => record.replay_refs.length === 0) || trend.replay_refs.length === 0 || timeline.replay_refs.length === 0 || report.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => record.governance_refs.length === 0) || timeline.governance_refs.length === 0 || report.governance_findings.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || records.some((record) => record.tenant_id !== registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || hashWithoutIntegrity(trend) !== trend.integrity_hash || hashWithoutIntegrity(timeline) !== timeline.integrity_hash || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "CONFIDENCE_MUTATION" || records.some((record) => record.mutates_confidence)) failures.push("CONFIDENCE_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_ANALYSIS");
  if (scenario === "AUTO_RECALIBRATION" || records.some((record) => record.triggers_adaptation)) failures.push("AUTOMATIC_RECALIBRATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly ConfidenceDriftFailure[]): ConfidenceDriftValidation["state"] {
  if (failures.includes("EVIDENCE_HISTORY_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(records: readonly ConfidenceDriftRecord[], trend: ConfidenceTrendProfile, timeline: ConfidenceDriftTimeline, report: DriftAnalysisReport, registry: ConfidenceDriftRegistry, failures: readonly ConfidenceDriftFailure[]): ConfidenceDriftValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const trendVerified = hashWithoutIntegrity(trend) === trend.integrity_hash;
  const timelineVerified = hashWithoutIntegrity(timeline) === timeline.integrity_hash;
  const reportVerified = hashWithoutIntegrity(report) === report.integrity_hash;
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<ConfidenceDriftValidation, "integrity_hash"> = {
    validation_id: "confidence_drift_detector_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && trendVerified && timelineVerified && reportVerified && registryVerified,
    failures,
    baseline_complete: !failures.includes("HISTORICAL_BASELINE_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_HISTORY_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_ANALYSIS"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: records.every((record) => record.advisory_only),
    no_confidence_mutation: records.every((record) => !record.mutates_confidence),
    no_automatic_recalibration: records.every((record) => !record.triggers_adaptation),
    integrity_verified: recordsVerified && trendVerified && timelineVerified && reportVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceDriftResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    drift_records: result.drift_records,
    trend_profile: result.trend_profile,
    timeline: result.timeline,
    report: result.report,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<ConfidenceDriftResult, "integrity_hash">): string {
  return hash({
    confidence_drift_detector_version: result.confidence_drift_detector_version,
    api_surface_hash: result.api_surface.integrity_hash,
    drift_record_hashes: result.drift_records.map((record) => record.integrity_hash),
    trend_profile_hash: result.trend_profile.integrity_hash,
    timeline_hash: result.timeline.integrity_hash,
    report_hash: result.report.integrity_hash,
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeConfidenceDrift(input: ConfidenceDriftInput = {}): ConfidenceDriftResult {
  const scenario = input.scenario ?? "BASELINE";
  const calibration = input.calibration_result ?? analyzeConfidenceCalibration();
  const calibrationRef = calibration.calibration_results[0]?.calibration_result_id ?? "calibration_ref_missing";
  const api_surface = buildApiSurface();
  const sample = sampleForScenario(scenario);
  const drift_records = buildDriftRecords(sample, scenario, calibrationRef);
  const trend_profile = buildTrendProfile(sample, scenario);
  const timeline = buildTimeline(drift_records, sample, scenario);
  const report = buildReport(drift_records, sample, timeline, scenario);
  const registry = buildRegistry(drift_records, trend_profile, timeline, report, scenario);
  const failures = collectFailures(drift_records, trend_profile, timeline, report, registry, scenario);
  const validation = buildValidation(drift_records, trend_profile, timeline, report, registry, failures);
  const base: Omit<ConfidenceDriftResult, "integrity_hash" | "replay_hash"> = {
    confidence_drift_detector_version: CONFIDENCE_DRIFT_VERSION,
    api_surface,
    drift_records,
    trend_profile,
    timeline,
    report,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_confidence: false,
    updates_model: false,
    triggers_adaptation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceDrift(result: ConfidenceDriftResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConfidenceDriftFoundation(): ConfidenceDriftFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_drift_detector_version: CONFIDENCE_DRIFT_VERSION,
    api_surface,
    result: analyzeConfidenceDrift(),
  });
}

export const ConfidenceDriftDetector = Object.freeze({
  analyze: analyzeConfidenceDrift,
  replay: replayConfidenceDrift,
});
