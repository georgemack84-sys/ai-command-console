import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskActualization } from "@/services/risk-actualization-analyzer";
import type {
  RiskDriftApiSurface,
  RiskDriftClassification,
  RiskDriftEvidenceRegistry,
  RiskDriftFailure,
  RiskDriftFoundation,
  RiskDriftInput,
  RiskDriftLedger,
  RiskDriftRecord,
  RiskDriftResult,
  RiskDriftTimeline,
  RiskDriftType,
  RiskDriftValidation,
  RiskTrendAnalysis,
  RiskTrendDirection,
} from "@/types/risk-drift-detector";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";

const RISK_DRIFT_VERSION = "risk-drift-detector/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskDriftInput["scenario"]>;
type DriftSample = Readonly<{
  type: RiskDriftType;
  classification: RiskDriftClassification;
  direction: RiskTrendDirection;
  domain: RiskAdaptationDomain;
  score: number;
  confidenceLow: number;
  confidenceHigh: number;
  rate: number;
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

function buildApiSurface(): RiskDriftApiSurface {
  const base: Omit<RiskDriftApiSurface, "integrity_hash"> = {
    api_id: "risk_drift_detector_api",
    analyze_drift: "POST /risk-drift-detector/analyze",
    retrieve_records: "POST /risk-drift-detector/records",
    retrieve_trends: "POST /risk-drift-detector/trends",
    retrieve_confidence: "POST /risk-drift-detector/confidence",
    retrieve_timeline: "POST /risk-drift-detector/timeline",
    retrieve_evidence: "POST /risk-drift-detector/evidence",
    retrieve_ledger: "POST /risk-drift-detector/ledger",
    retrieve_severity: "POST /risk-drift-detector/severity",
    retrieve_probability: "POST /risk-drift-detector/probability",
    retrieve_escalation: "POST /risk-drift-detector/escalation",
    retrieve_governance: "POST /risk-drift-detector/governance",
    retrieve_mission: "POST /risk-drift-detector/mission",
    retrieve_operator: "POST /risk-drift-detector/operator",
    retrieve_tenant: "POST /risk-drift-detector/tenant",
    retrieve_domain: "POST /risk-drift-detector/domain",
    retrieve_validation: "POST /risk-drift-detector/validation",
    replay_analysis: "POST /risk-drift-detector/replay",
    retrieve_contract: "GET /risk-drift-detector/contract",
    update_supported: false,
    delete_supported: false,
    production_risk_mutation_supported: false,
    threshold_mutation_supported: false,
    governance_policy_mutation_supported: false,
    constitutional_suppression_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): DriftSample {
  const map: Partial<Record<Scenario, DriftSample>> = {
    IMPROVING: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "IMPROVING", direction: "IMPROVING", domain: "MISSION_RISK", score: 0.12, confidenceLow: 0.08, confidenceHigh: 0.18, rate: -0.04, stability: 0.88 },
    STABLE: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "STABLE", direction: "STABLE", domain: "MISSION_RISK", score: 0.06, confidenceLow: 0.03, confidenceHigh: 0.1, rate: 0.01, stability: 0.93 },
    MINOR: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "MINOR_DRIFT", direction: "DEGRADING", domain: "MISSION_RISK", score: 0.22, confidenceLow: 0.16, confidenceHigh: 0.3, rate: 0.05, stability: 0.78 },
    MODERATE: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "MODERATE_DRIFT", direction: "DEGRADING", domain: "MISSION_RISK", score: 0.42, confidenceLow: 0.33, confidenceHigh: 0.52, rate: 0.11, stability: 0.66 },
    SIGNIFICANT: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "SIGNIFICANT_DRIFT", direction: "DEGRADING", domain: "OPERATIONAL_RISK", score: 0.64, confidenceLow: 0.54, confidenceHigh: 0.74, rate: 0.2, stability: 0.49 },
    CRITICAL: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "CRITICAL_DRIFT", direction: "VOLATILE", domain: "MISSION_RISK", score: 0.86, confidenceLow: 0.77, confidenceHigh: 0.94, rate: 0.32, stability: 0.22 },
    GOVERNANCE_SENSITIVE: { type: "GOVERNANCE_DRIFT", classification: "GOVERNANCE_SENSITIVE_DRIFT", direction: "DEGRADING", domain: "GOVERNANCE_RISK", score: 0.68, confidenceLow: 0.58, confidenceHigh: 0.79, rate: 0.21, stability: 0.44 },
    CONSTITUTIONAL: { type: "GOVERNANCE_DRIFT", classification: "CONSTITUTIONAL_DRIFT", direction: "DEGRADING", domain: "GOVERNANCE_RISK", score: 0.74, confidenceLow: 0.65, confidenceHigh: 0.86, rate: 0.26, stability: 0.38 },
    TENANT_SPECIFIC: { type: "TENANT_SPECIFIC_DRIFT", classification: "TENANT_SPECIFIC_DRIFT", direction: "DEGRADING", domain: "OPERATIONAL_RISK", score: 0.57, confidenceLow: 0.46, confidenceHigh: 0.68, rate: 0.17, stability: 0.58 },
    DOMAIN_SPECIFIC: { type: "DOMAIN_DRIFT", classification: "DOMAIN_SPECIFIC_DRIFT", direction: "DEGRADING", domain: "STRATEGIC_RISK", score: 0.6, confidenceLow: 0.5, confidenceHigh: 0.71, rate: 0.18, stability: 0.55 },
    SEVERITY: { type: "SEVERITY_DRIFT", classification: "MODERATE_DRIFT", direction: "DEGRADING", domain: "MISSION_RISK", score: 0.44, confidenceLow: 0.34, confidenceHigh: 0.55, rate: 0.12, stability: 0.64 },
    PROBABILITY: { type: "PROBABILITY_DRIFT", classification: "MODERATE_DRIFT", direction: "DEGRADING", domain: "FORECAST_RISK", score: 0.46, confidenceLow: 0.36, confidenceHigh: 0.57, rate: 0.13, stability: 0.61 },
    ESCALATION: { type: "ESCALATION_DRIFT", classification: "SIGNIFICANT_DRIFT", direction: "VOLATILE", domain: "OPERATIONAL_RISK", score: 0.62, confidenceLow: 0.51, confidenceHigh: 0.73, rate: 0.19, stability: 0.4 },
    GOVERNANCE: { type: "GOVERNANCE_DRIFT", classification: "GOVERNANCE_SENSITIVE_DRIFT", direction: "DEGRADING", domain: "GOVERNANCE_RISK", score: 0.66, confidenceLow: 0.55, confidenceHigh: 0.77, rate: 0.2, stability: 0.43 },
    MISSION: { type: "MISSION_TYPE_DRIFT", classification: "MODERATE_DRIFT", direction: "DEGRADING", domain: "MISSION_RISK", score: 0.5, confidenceLow: 0.39, confidenceHigh: 0.61, rate: 0.15, stability: 0.6 },
    OPERATOR: { type: "OPERATOR_SPECIFIC_DRIFT", classification: "MINOR_DRIFT", direction: "STABLE", domain: "OPERATIONAL_RISK", score: 0.26, confidenceLow: 0.18, confidenceHigh: 0.34, rate: 0.06, stability: 0.77 },
    TENANT: { type: "TENANT_SPECIFIC_DRIFT", classification: "TENANT_SPECIFIC_DRIFT", direction: "DEGRADING", domain: "OPERATIONAL_RISK", score: 0.55, confidenceLow: 0.44, confidenceHigh: 0.66, rate: 0.16, stability: 0.57 },
    DOMAIN: { type: "DOMAIN_DRIFT", classification: "DOMAIN_SPECIFIC_DRIFT", direction: "DEGRADING", domain: "STRATEGIC_RISK", score: 0.58, confidenceLow: 0.47, confidenceHigh: 0.69, rate: 0.17, stability: 0.56 },
    ENVIRONMENTAL: { type: "ENVIRONMENTAL_DRIFT", classification: "SIGNIFICANT_DRIFT", direction: "VOLATILE", domain: "OPERATIONAL_RISK", score: 0.63, confidenceLow: 0.52, confidenceHigh: 0.75, rate: 0.2, stability: 0.42 },
    COMPOSITE: { type: "COMPOSITE_PREDICTION_DRIFT", classification: "SIGNIFICANT_DRIFT", direction: "DEGRADING", domain: "MISSION_RISK", score: 0.67, confidenceLow: 0.56, confidenceHigh: 0.78, rate: 0.22, stability: 0.46 },
  };
  return map[scenario] ?? map.MODERATE!;
}

function buildRecord(scenario: Scenario, actualizationRef: string): RiskDriftRecord {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskDriftRecord, "integrity_hash"> = {
    risk_drift_id: `risk_drift_${hash(`${scenario}:${sample.type}:${sample.classification}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: sample.type === "MISSION_TYPE_DRIFT" ? "mission_scope_risk_mission_category" : "mission_scope_risk_drift",
    risk_domain: sample.domain,
    drift_type: sample.type,
    drift_classification: sample.classification,
    analysis_period: "2026-Q3 trailing 180d",
    baseline_period: "2026-Q1",
    comparison_period: "2026-Q3",
    historical_accuracy_refs: scenario === "MISSING_HISTORY" ? freezeArray([]) : freezeArray([actualizationRef, "risk_accuracy_history_ref_1"]),
    drift_score: sample.score,
    confidence_interval: freezeArray([sample.confidenceLow, sample.confidenceHigh]) as readonly [number, number],
    trend_direction: sample.direction,
    drift_summary: `${sample.classification} detected for ${sample.type}.`,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_drift_evidence_ref_1"]),
    governance_impact: sample.type === "GOVERNANCE_DRIFT" ? "Governance review cadence affected." : "Governance impact observed only.",
    operator_impact: sample.type === "OPERATOR_SPECIFIC_DRIFT" ? "Operator interaction trend observed analytically only." : "No authority changes.",
    recommended_review: freezeArray(["Review under governed risk adaptation workflow.", sample.score > 0.6 ? "Require governance review before downstream recalibration." : "Continue monitoring before proposal generation."]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_risk_drift_1"]),
    constitutional_refs: scenario === "MISSING_CONSTITUTIONAL" ? freezeArray([]) : freezeArray(["constitutional_ref_risk_drift_1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_risk_drift_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["lineage_ref_risk_drift_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    observational_only: true,
    updates_risk_model: false,
    updates_risk_thresholds: false,
    rewrites_evidence: false,
    rewrites_mission_history: false,
    changes_governance_policy: false,
    suppresses_constitutional_risk: false,
    overrides_operator_authority: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.risk_drift_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...record, updates_risk_model: true as false });
  if (scenario === "THRESHOLD_MUTATION") return Object.freeze({ ...record, updates_risk_thresholds: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_evidence: true as false });
  if (scenario === "MISSION_HISTORY_REWRITE") return Object.freeze({ ...record, rewrites_mission_history: true as false });
  if (scenario === "GOVERNANCE_POLICY_MUTATION") return Object.freeze({ ...record, changes_governance_policy: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_risk: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  return record;
}

function buildTrend(record: RiskDriftRecord, sample: DriftSample): RiskTrendAnalysis {
  const base: Omit<RiskTrendAnalysis, "integrity_hash"> = {
    trend_id: `risk_trend_${hash(record.risk_drift_id).slice(0, 14)}`,
    drift_record_id: record.risk_drift_id,
    direction_of_change: sample.direction,
    rate_of_change: sample.rate,
    stability_measurement: sample.stability,
    historical_progression: freezeArray([Math.max(0, sample.score - 0.18), Math.max(0, sample.score - 0.08), sample.score]),
    comparative_baseline: Math.max(0, sample.score - 0.18),
    trend_explanation: `${sample.direction} risk prediction trend over ${record.analysis_period}.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(record: RiskDriftRecord, scenario: Scenario): RiskDriftTimeline {
  const base: Omit<RiskDriftTimeline, "integrity_hash"> = {
    timeline_id: `risk_drift_timeline_${hash(record.risk_drift_id).slice(0, 14)}`,
    drift_record_id: record.risk_drift_id,
    drift_initiation: "2026-01",
    drift_acceleration: record.drift_score > 0.5 ? "2026-05" : "none",
    stable_periods: freezeArray(["2026-02"]),
    recovery_periods: record.trend_direction === "IMPROVING" ? freezeArray(["2026-06"]) : freezeArray([]),
    significant_events: freezeArray(["mission_outcome_batch_1", "risk_actualization_review_1"]),
    governance_interventions: record.drift_type === "GOVERNANCE_DRIFT" ? freezeArray(["governance_intervention_ref_1"]) : freezeArray([]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceRegistry(record: RiskDriftRecord, scenario: Scenario): RiskDriftEvidenceRegistry {
  const base: Omit<RiskDriftEvidenceRegistry, "integrity_hash"> = {
    evidence_registry_id: `risk_drift_evidence_registry_${hash(record.risk_drift_id).slice(0, 14)}`,
    drift_record_id: record.risk_drift_id,
    evidence_refs: record.supporting_evidence_refs,
    historical_assessment_refs: record.historical_accuracy_refs,
    actual_outcome_refs: scenario === "MISSING_HISTORY" ? freezeArray([]) : freezeArray(["risk_actual_outcome_history_ref_1"]),
    multi_mission_validation_refs: scenario === "MISSING_MULTI_MISSION" ? freezeArray([]) : freezeArray(["multi_mission_validation_ref_1"]),
    confidence_threshold_refs: scenario === "MISSING_CONFIDENCE_THRESHOLD" ? freezeArray([]) : freezeArray(["confidence_threshold_validation_ref_1"]),
    false_positive_mitigation_applied: scenario !== "MISSING_STATISTICS" && scenario !== "MISSING_MULTI_MISSION" && scenario !== "MISSING_CONFIDENCE_THRESHOLD",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly RiskDriftRecord[], trend: RiskTrendAnalysis, timeline: RiskDriftTimeline, evidence: RiskDriftEvidenceRegistry): RiskDriftLedger {
  const classifications: RiskDriftClassification[] = ["IMPROVING", "STABLE", "MINOR_DRIFT", "MODERATE_DRIFT", "SIGNIFICANT_DRIFT", "CRITICAL_DRIFT", "GOVERNANCE_SENSITIVE_DRIFT", "CONSTITUTIONAL_DRIFT", "TENANT_SPECIFIC_DRIFT", "DOMAIN_SPECIFIC_DRIFT"];
  const types: RiskDriftType[] = ["SEVERITY_DRIFT", "PROBABILITY_DRIFT", "ESCALATION_DRIFT", "GOVERNANCE_DRIFT", "MISSION_TYPE_DRIFT", "OPERATOR_SPECIFIC_DRIFT", "TENANT_SPECIFIC_DRIFT", "DOMAIN_DRIFT", "ENVIRONMENTAL_DRIFT", "COMPOSITE_PREDICTION_DRIFT"];
  const classification_index = classifications.reduce((index, classification) => ({ ...index, [classification]: freezeArray(records.filter((record) => record.drift_classification === classification).map((record) => record.risk_drift_id)) }), {} as Record<RiskDriftClassification, readonly string[]>);
  const type_index = types.reduce((index, type) => ({ ...index, [type]: freezeArray(records.filter((record) => record.drift_type === type).map((record) => record.risk_drift_id)) }), {} as Record<RiskDriftType, readonly string[]>);
  const base: Omit<RiskDriftLedger, "integrity_hash"> = {
    ledger_id: `risk_drift_ledger_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    drift_record_refs: records.map((record) => record.risk_drift_id),
    trend_refs: freezeArray([trend.trend_id]),
    timeline_refs: freezeArray([timeline.timeline_id]),
    evidence_registry_refs: freezeArray([evidence.evidence_registry_id]),
    classification_index: Object.freeze(classification_index),
    type_index: Object.freeze(type_index),
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: RiskDriftRecord, trend: RiskTrendAnalysis, timeline: RiskDriftTimeline, evidence: RiskDriftEvidenceRegistry, ledger: RiskDriftLedger, scenario: Scenario): readonly RiskDriftFailure[] {
  const failures: RiskDriftFailure[] = [];
  if (scenario === "MISSING_HISTORY" || record.historical_accuracy_refs.length === 0 || evidence.actual_outcome_refs.length === 0) failures.push("HISTORICAL_DATASET_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.supporting_evidence_refs.length === 0 || evidence.evidence_refs.length === 0) failures.push("EVIDENCE_MISSING");
  if (scenario === "MISSING_STATISTICS" || !evidence.false_positive_mitigation_applied) failures.push("STATISTICAL_CONSISTENCY_MISSING");
  if (scenario === "MISSING_MULTI_MISSION" || evidence.multi_mission_validation_refs.length === 0) failures.push("MULTI_MISSION_VALIDATION_MISSING");
  if (scenario === "MISSING_CONFIDENCE_THRESHOLD" || evidence.confidence_threshold_refs.length === 0) failures.push("CONFIDENCE_THRESHOLD_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0 || timeline.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || record.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL" || record.constitutional_refs.length === 0) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || hashWithoutIntegrity(trend) !== trend.integrity_hash || hashWithoutIntegrity(timeline) !== timeline.integrity_hash || hashWithoutIntegrity(evidence) !== evidence.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "PRODUCTION_MUTATION" || record.updates_risk_model) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (scenario === "THRESHOLD_MUTATION" || record.updates_risk_thresholds) failures.push("RISK_THRESHOLD_MUTATION_DETECTED");
  if (scenario === "EVIDENCE_REWRITE" || record.rewrites_evidence) failures.push("EVIDENCE_REWRITE_DETECTED");
  if (scenario === "MISSION_HISTORY_REWRITE" || record.rewrites_mission_history) failures.push("MISSION_HISTORY_REWRITE_DETECTED");
  if (scenario === "GOVERNANCE_POLICY_MUTATION" || record.changes_governance_policy) failures.push("GOVERNANCE_POLICY_MUTATION_DETECTED");
  if (scenario === "CONSTITUTIONAL_SUPPRESSION" || record.suppresses_constitutional_risk) failures.push("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED");
  if (scenario === "OPERATOR_OVERRIDE" || record.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_DRIFT_ANALYSIS");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskDriftFailure[]): RiskDriftValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("HISTORICAL_DATASET_MISSING")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RiskDriftRecord, trend: RiskTrendAnalysis, timeline: RiskDriftTimeline, evidence: RiskDriftEvidenceRegistry, ledger: RiskDriftLedger, failures: readonly RiskDriftFailure[]): RiskDriftValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(trend) === trend.integrity_hash && hashWithoutIntegrity(timeline) === timeline.integrity_hash && hashWithoutIntegrity(evidence) === evidence.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskDriftValidation, "integrity_hash"> = {
    validation_id: "risk_drift_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    historical_dataset_complete: !failures.includes("HISTORICAL_DATASET_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    statistical_consistency_complete: !failures.includes("STATISTICAL_CONSISTENCY_MISSING"),
    multi_mission_validation_complete: !failures.includes("MULTI_MISSION_VALIDATION_MISSING"),
    confidence_threshold_validation_complete: !failures.includes("CONFIDENCE_THRESHOLD_VALIDATION_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_REFERENCES_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_DRIFT_ANALYSIS"),
    false_positive_mitigation_verified: evidence.false_positive_mitigation_applied,
    advisory_only: record.advisory_only,
    observational_only: record.observational_only,
    no_production_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_threshold_mutation: !failures.includes("RISK_THRESHOLD_MUTATION_DETECTED"),
    no_evidence_rewrite: !failures.includes("EVIDENCE_REWRITE_DETECTED"),
    no_history_rewrite: !failures.includes("MISSION_HISTORY_REWRITE_DETECTED"),
    no_governance_policy_mutation: !failures.includes("GOVERNANCE_POLICY_MUTATION_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskDriftResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, trend: result.trend, timeline: result.timeline, evidence_registry: result.evidence_registry, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskDriftResult, "integrity_hash">): string {
  return hash({
    risk_drift_detector_version: result.risk_drift_detector_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    trend_hash: result.trend.integrity_hash,
    timeline_hash: result.timeline.integrity_hash,
    evidence_hash: result.evidence_registry.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskDrift(input: RiskDriftInput = {}): RiskDriftResult {
  const scenario = input.scenario ?? "BASELINE";
  const actualization = input.actualization_result ?? analyzeRiskActualization();
  const actualizationRef = actualization.records[0]?.actualization_id ?? "risk_actualization_ref_missing";
  const api_surface = buildApiSurface();
  const sample = sampleForScenario(scenario);
  const record = buildRecord(scenario, actualizationRef);
  const trend = buildTrend(record, sample);
  const timeline = buildTimeline(record, scenario);
  const evidence_registry = buildEvidenceRegistry(record, scenario);
  const records = freezeArray([record]);
  const ledger = buildLedger(records, trend, timeline, evidence_registry);
  const failures = collectFailures(record, trend, timeline, evidence_registry, ledger, scenario);
  const validation = buildValidation(record, trend, timeline, evidence_registry, ledger, failures);
  const base: Omit<RiskDriftResult, "integrity_hash" | "replay_hash"> = {
    risk_drift_detector_version: RISK_DRIFT_VERSION,
    api_surface,
    records,
    trend,
    timeline,
    evidence_registry,
    ledger,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    observational_only: true,
    updates_risk_model: false,
    updates_risk_thresholds: false,
    changes_governance_policy: false,
    changes_constitutional_safeguards: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskDrift(result: RiskDriftResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskDriftFoundation(): RiskDriftFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_drift_detector_version: RISK_DRIFT_VERSION,
    api_surface,
    result: analyzeRiskDrift(),
  });
}

export const RiskDriftDetector = Object.freeze({
  analyze: analyzeRiskDrift,
  replay: replayRiskDrift,
});
