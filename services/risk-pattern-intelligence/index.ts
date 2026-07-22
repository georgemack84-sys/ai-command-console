import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskDrift } from "@/services/risk-drift-detector";
import { analyzeRiskSeverityRecalibration } from "@/services/risk-severity-recalibrator";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";
import type {
  RiskPatternApiSurface,
  RiskPatternCategory,
  RiskPatternConfidence,
  RiskPatternConfidenceBand,
  RiskPatternEvidenceRegistry,
  RiskPatternFailure,
  RiskPatternFoundation,
  RiskPatternInput,
  RiskPatternLedger,
  RiskPatternRecommendation,
  RiskPatternRecommendationCategory,
  RiskPatternRecord,
  RiskPatternResult,
  RiskPatternTimeline,
  RiskPatternValidation,
} from "@/types/risk-pattern-intelligence";

const RISK_PATTERN_VERSION = "risk-pattern-intelligence/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskPatternInput["scenario"]>;
type PatternSample = Readonly<{
  category: RiskPatternCategory;
  recommendation: RiskPatternRecommendationCategory;
  domain: RiskAdaptationDomain;
  frequency: number;
  confidence: number;
  band: RiskPatternConfidenceBand;
  name: string;
  factors: readonly string[];
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

function buildApiSurface(): RiskPatternApiSurface {
  const base: Omit<RiskPatternApiSurface, "integrity_hash"> = {
    api_id: "risk_pattern_intelligence_api",
    analyze_patterns: "POST /risk-pattern-intelligence/analyze",
    retrieve_patterns: "POST /risk-pattern-intelligence/patterns",
    retrieve_classifications: "POST /risk-pattern-intelligence/classifications",
    retrieve_confidence: "POST /risk-pattern-intelligence/confidence",
    retrieve_timeline: "POST /risk-pattern-intelligence/timeline",
    retrieve_recommendations: "POST /risk-pattern-intelligence/recommendations",
    retrieve_evidence: "POST /risk-pattern-intelligence/evidence",
    retrieve_ledger: "POST /risk-pattern-intelligence/ledger",
    retrieve_governance: "POST /risk-pattern-intelligence/governance",
    retrieve_validation: "POST /risk-pattern-intelligence/validation",
    replay_analysis: "POST /risk-pattern-intelligence/replay",
    retrieve_contract: "GET /risk-pattern-intelligence/contract",
    update_supported: false,
    delete_supported: false,
    production_risk_mutation_supported: false,
    threshold_mutation_supported: false,
    governance_policy_mutation_supported: false,
    governance_decision_override_supported: false,
    operator_override_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): PatternSample {
  const map: Partial<Record<Scenario, PatternSample>> = {
    SEVERITY_UNDERESTIMATION: { category: "SEVERITY_UNDERESTIMATION", recommendation: "SEVERITY_RECALIBRATION", domain: "MISSION_RISK", frequency: 7, confidence: 0.88, band: "HIGH", name: "Repeated severity suppression in recovery missions", factors: ["recovery_dependency_load", "late-impact evidence"] },
    SEVERITY_OVERESTIMATION: { category: "SEVERITY_OVERESTIMATION", recommendation: "SEVERITY_RECALIBRATION", domain: "MISSION_RISK", frequency: 5, confidence: 0.74, band: "MEDIUM", name: "Repeated severity inflation in routine missions", factors: ["low mission volatility", "false alarm history"] },
    PROBABILITY_UNDERESTIMATION: { category: "PROBABILITY_UNDERESTIMATION", recommendation: "PROBABILITY_RECALIBRATION", domain: "FORECAST_RISK", frequency: 8, confidence: 0.9, band: "HIGH", name: "Recurring probability underestimation", factors: ["sparse telemetry", "historical occurrence gap"] },
    PROBABILITY_OVERESTIMATION: { category: "PROBABILITY_OVERESTIMATION", recommendation: "PROBABILITY_RECALIBRATION", domain: "FORECAST_RISK", frequency: 6, confidence: 0.77, band: "MEDIUM", name: "Recurring probability overestimation", factors: ["volatile alert source", "low realized occurrence"] },
    BLIND_SPOT: { category: "RECURRING_BLIND_SPOT", recommendation: "ADDITIONAL_EVIDENCE", domain: "OPERATIONAL_RISK", frequency: 9, confidence: 0.86, band: "HIGH", name: "Dependency cascade blind spot", factors: ["dependency telemetry missing", "cross-team handoff"] },
    FALSE_ALARM: { category: "FALSE_ALARM", recommendation: "ENHANCED_MONITORING", domain: "OPERATIONAL_RISK", frequency: 6, confidence: 0.72, band: "MEDIUM", name: "Repeated false-positive risk signal", factors: ["transient infrastructure signal", "short observation window"] },
    GOVERNANCE_RISK: { category: "MISSED_GOVERNANCE_RISK", recommendation: "GOVERNANCE_REVIEW", domain: "GOVERNANCE_RISK", frequency: 4, confidence: 0.82, band: "HIGH", name: "Delayed governance risk recognition", factors: ["approval-path ambiguity", "authority metadata gap"] },
    CONSTITUTIONAL_RISK: { category: "CONSTITUTIONAL_RISK_PATTERN", recommendation: "CONSTITUTIONAL_REVIEW", domain: "GOVERNANCE_RISK", frequency: 4, confidence: 0.91, band: "CRITICAL", name: "Constitutional review concentration", factors: ["safeguard activation cluster", "sensitive authority boundary"] },
    MISSION_TYPE: { category: "MISSION_TYPE_PATTERN", recommendation: "DOCUMENTATION_IMPROVEMENT", domain: "STRATEGIC_RISK", frequency: 5, confidence: 0.79, band: "MEDIUM", name: "Strategic mission variance pattern", factors: ["multi-domain scope", "longer decision horizon"] },
    TENANT_SPECIFIC: { category: "TENANT_SPECIFIC_PATTERN", recommendation: "ENHANCED_MONITORING", domain: "OPERATIONAL_RISK", frequency: 5, confidence: 0.8, band: "HIGH", name: "Tenant-local risk behavior", factors: ["tenant workflow variant", "localized dependency"] },
    OPERATOR_TENDENCY: { category: "OPERATOR_TENDENCY", recommendation: "DOCUMENTATION_IMPROVEMENT", domain: "OPERATIONAL_RISK", frequency: 4, confidence: 0.71, band: "MEDIUM", name: "Operator review tendency", factors: ["review cadence", "manual escalation timing"] },
    ENVIRONMENTAL: { category: "ENVIRONMENTAL_INFLUENCE", recommendation: "ENHANCED_MONITORING", domain: "OPERATIONAL_RISK", frequency: 7, confidence: 0.84, band: "HIGH", name: "Environmental influence on prediction quality", factors: ["incident load", "release window"] },
    ESCALATION_FAILURE: { category: "ESCALATION_FAILURE", recommendation: "ESCALATION_REFINEMENT", domain: "GOVERNANCE_RISK", frequency: 5, confidence: 0.87, band: "HIGH", name: "Recurring escalation delay", factors: ["threshold too high", "late governance detection"] },
    ROLLBACK_FAILURE: { category: "ROLLBACK_FAILURE", recommendation: "ROLLBACK_REFINEMENT", domain: "OPERATIONAL_RISK", frequency: 5, confidence: 0.85, band: "HIGH", name: "Recurring rollback delay", factors: ["recovery cost underestimated", "rollback criteria ambiguity"] },
    COMPOSITE: { category: "COMPOSITE_BEHAVIORAL_PATTERN", recommendation: "SIMULATION_REQUIREMENT", domain: "MISSION_RISK", frequency: 10, confidence: 0.93, band: "CRITICAL", name: "Composite behavioral risk pattern", factors: ["severity drift", "probability drift", "governance delay"] },
  };
  return map[scenario] ?? map.SEVERITY_UNDERESTIMATION!;
}

function buildPattern(scenario: Scenario, driftRef: string): RiskPatternRecord {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskPatternRecord, "integrity_hash"> = {
    risk_pattern_id: `risk_pattern_${hash(`${scenario}:${sample.category}:${sample.name}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: sample.category === "MISSION_TYPE_PATTERN" ? "mission_scope_pattern_mission_type" : "mission_scope_risk_pattern",
    risk_domain: sample.domain,
    pattern_category: sample.category,
    pattern_name: sample.name,
    pattern_description: `${sample.name} observed across ${sample.frequency} historical mission outcomes.`,
    pattern_frequency: scenario === "MISSING_OBSERVATIONS" ? 1 : sample.frequency,
    historical_occurrence_refs: scenario === "MISSING_OBSERVATIONS" ? freezeArray(["risk_pattern_occurrence_ref_1"]) : freezeArray(["risk_pattern_occurrence_ref_1", "risk_pattern_occurrence_ref_2", driftRef]),
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_pattern_evidence_ref_1"]),
    pattern_confidence: scenario === "MISSING_CONFIDENCE" ? 0 : sample.confidence,
    governance_impact: sample.domain === "GOVERNANCE_RISK" ? "Governance review required before downstream use." : "Governance-visible advisory pattern.",
    constitutional_impact: sample.category === "CONSTITUTIONAL_RISK_PATTERN" ? "Constitutional review required before downstream use." : "No constitutional change authorized.",
    operator_impact: "Operator-visible intelligence only; no authority changes.",
    environmental_factors: freezeArray(sample.factors),
    recommendation_summary: `${sample.recommendation} recommended for governed review.`,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["risk_pattern_replay_ref_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["risk_pattern_lineage_ref_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    observational_only: true,
    mutates_production_risk_models: false,
    changes_escalation_thresholds: false,
    changes_rollback_thresholds: false,
    changes_governance_policy: false,
    overrides_governance_decisions: false,
    overrides_operator_authority: false,
    rewrites_historical_evidence: false,
    rewrites_mission_history: false,
    suppresses_constitutional_risk: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.risk_pattern_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...record, mutates_production_risk_models: true as false });
  if (scenario === "ESCALATION_THRESHOLD_MUTATION") return Object.freeze({ ...record, changes_escalation_thresholds: true as false });
  if (scenario === "ROLLBACK_THRESHOLD_MUTATION") return Object.freeze({ ...record, changes_rollback_thresholds: true as false });
  if (scenario === "GOVERNANCE_POLICY_MUTATION") return Object.freeze({ ...record, changes_governance_policy: true as false });
  if (scenario === "GOVERNANCE_DECISION_OVERRIDE") return Object.freeze({ ...record, overrides_governance_decisions: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_historical_evidence: true as false });
  if (scenario === "MISSION_HISTORY_REWRITE") return Object.freeze({ ...record, rewrites_mission_history: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_risk: true as false });
  return record;
}

function buildConfidence(pattern: RiskPatternRecord, scenario: Scenario): RiskPatternConfidence {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskPatternConfidence, "integrity_hash"> = {
    confidence_id: `risk_pattern_confidence_${hash(pattern.risk_pattern_id).slice(0, 14)}`,
    risk_pattern_id: pattern.risk_pattern_id,
    confidence_score: pattern.pattern_confidence,
    confidence_band: sample.band,
    frequency_score: Math.min(1, pattern.pattern_frequency / 10),
    evidence_completeness_score: pattern.supporting_evidence_refs.length ? 0.92 : 0,
    consistency_score: sample.confidence - 0.06,
    reproducibility_score: pattern.replay_refs.length ? 0.95 : 0,
    cross_mission_confirmation_score: pattern.historical_occurrence_refs.length >= 3 ? 0.9 : 0.35,
    data_sufficiency_score: pattern.pattern_frequency >= 3 ? 0.9 : 0.3,
    confidence_explanation: `${sample.band} confidence based on frequency, evidence completeness, and replay reproducibility.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(pattern: RiskPatternRecord, scenario: Scenario): RiskPatternTimeline {
  const base: Omit<RiskPatternTimeline, "integrity_hash"> = {
    timeline_id: `risk_pattern_timeline_${hash(pattern.risk_pattern_id).slice(0, 14)}`,
    risk_pattern_id: pattern.risk_pattern_id,
    first_occurrence: "2026-01",
    pattern_growth: scenario === "MISSING_TIMELINE" ? freezeArray([]) : freezeArray([1, Math.max(2, Math.floor(pattern.pattern_frequency / 2)), pattern.pattern_frequency]),
    stable_periods: freezeArray(["2026-03"]),
    frequency_changes: freezeArray(["2026-05: frequency increased after mission outcome batch"]),
    significant_events: freezeArray(["risk_drift_review", "severity_recalibration_review"]),
    governance_interventions: pattern.risk_domain === "GOVERNANCE_RISK" ? freezeArray(["governance_pattern_review_ref_1"]) : freezeArray([]),
    historical_milestones: freezeArray(["first_occurrence_recorded", "cross_mission_confirmation"]),
    replay_refs: pattern.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecommendation(pattern: RiskPatternRecord, scenario: Scenario): RiskPatternRecommendation {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskPatternRecommendation, "integrity_hash"> = {
    recommendation_id: `risk_pattern_recommendation_${hash(pattern.risk_pattern_id).slice(0, 14)}`,
    risk_pattern_id: pattern.risk_pattern_id,
    category: sample.recommendation,
    recommendation_summary: pattern.recommendation_summary,
    governance_review_required: pattern.risk_domain === "GOVERNANCE_RISK" || sample.band === "CRITICAL",
    simulation_required: sample.recommendation === "SIMULATION_REQUIREMENT" || sample.band === "CRITICAL",
    operator_review_required: true,
    expected_benefit: Math.min(0.45, Math.max(0.12, pattern.pattern_confidence - 0.55)),
    evidence_refs: pattern.supporting_evidence_refs,
    replay_refs: pattern.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(pattern: RiskPatternRecord, driftRef: string, recalibrationRef: string, scenario: Scenario): RiskPatternEvidenceRegistry {
  const base: Omit<RiskPatternEvidenceRegistry, "integrity_hash"> = {
    evidence_registry_id: `risk_pattern_evidence_${hash(pattern.risk_pattern_id).slice(0, 14)}`,
    risk_pattern_id: pattern.risk_pattern_id,
    historical_assessment_refs: pattern.historical_occurrence_refs,
    actual_outcome_refs: scenario === "MISSING_OBSERVATIONS" ? freezeArray([]) : freezeArray(["risk_pattern_actual_outcome_ref_1"]),
    drift_refs: freezeArray([driftRef]),
    recalibration_refs: freezeArray([recalibrationRef]),
    governance_decision_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["risk_pattern_governance_decision_ref_1"]),
    escalation_history_refs: freezeArray(["risk_pattern_escalation_history_ref_1"]),
    rollback_history_refs: freezeArray(["risk_pattern_rollback_history_ref_1"]),
    operational_telemetry_refs: pattern.pattern_category === "ENVIRONMENTAL_INFLUENCE" ? freezeArray(["risk_pattern_environment_telemetry_ref_1"]) : freezeArray(["risk_pattern_operational_telemetry_ref_1"]),
    supporting_document_refs: pattern.supporting_evidence_refs,
    replay_refs: pattern.replay_refs,
    lineage_refs: pattern.lineage_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(patterns: readonly RiskPatternRecord[], confidence: RiskPatternConfidence, timeline: RiskPatternTimeline, recommendations: readonly RiskPatternRecommendation[], evidence: RiskPatternEvidenceRegistry): RiskPatternLedger {
  const categories: RiskPatternCategory[] = ["SEVERITY_UNDERESTIMATION", "SEVERITY_OVERESTIMATION", "PROBABILITY_UNDERESTIMATION", "PROBABILITY_OVERESTIMATION", "RECURRING_BLIND_SPOT", "FALSE_ALARM", "MISSED_GOVERNANCE_RISK", "CONSTITUTIONAL_RISK_PATTERN", "MISSION_TYPE_PATTERN", "TENANT_SPECIFIC_PATTERN", "OPERATOR_TENDENCY", "ENVIRONMENTAL_INFLUENCE", "ESCALATION_FAILURE", "ROLLBACK_FAILURE", "COMPOSITE_BEHAVIORAL_PATTERN"];
  const recommendationCategories: RiskPatternRecommendationCategory[] = ["SEVERITY_RECALIBRATION", "PROBABILITY_RECALIBRATION", "ENHANCED_MONITORING", "ADDITIONAL_EVIDENCE", "GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "ESCALATION_REFINEMENT", "ROLLBACK_REFINEMENT", "SIMULATION_REQUIREMENT", "DOCUMENTATION_IMPROVEMENT"];
  const category_index = categories.reduce((index, category) => ({ ...index, [category]: freezeArray(patterns.filter((pattern) => pattern.pattern_category === category).map((pattern) => pattern.risk_pattern_id)) }), {} as Record<RiskPatternCategory, readonly string[]>);
  const recommendation_index = recommendationCategories.reduce((index, category) => ({ ...index, [category]: freezeArray(recommendations.filter((recommendation) => recommendation.category === category).map((recommendation) => recommendation.recommendation_id)) }), {} as Record<RiskPatternRecommendationCategory, readonly string[]>);
  const base: Omit<RiskPatternLedger, "integrity_hash"> = {
    ledger_id: `risk_pattern_ledger_${hash(patterns.map((pattern) => pattern.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    pattern_refs: patterns.map((pattern) => pattern.risk_pattern_id),
    confidence_refs: freezeArray([confidence.confidence_id]),
    timeline_refs: freezeArray([timeline.timeline_id]),
    recommendation_refs: recommendations.map((recommendation) => recommendation.recommendation_id),
    evidence_registry_refs: freezeArray([evidence.evidence_registry_id]),
    category_index: Object.freeze(category_index),
    recommendation_index: Object.freeze(recommendation_index),
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(pattern: RiskPatternRecord, confidence: RiskPatternConfidence, timeline: RiskPatternTimeline, recommendations: readonly RiskPatternRecommendation[], evidence: RiskPatternEvidenceRegistry, ledger: RiskPatternLedger, scenario: Scenario): readonly RiskPatternFailure[] {
  const failures: RiskPatternFailure[] = [];
  if (scenario === "MISSING_OBSERVATIONS" || pattern.pattern_frequency < 2 || pattern.historical_occurrence_refs.length < 2 || evidence.actual_outcome_refs.length === 0) failures.push("MULTIPLE_OBSERVATIONS_MISSING");
  if (scenario === "MISSING_EVIDENCE" || pattern.supporting_evidence_refs.length === 0 || evidence.supporting_document_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_CLASSIFICATION" || !pattern.pattern_category) failures.push("DETERMINISTIC_CLASSIFICATION_MISSING");
  if (scenario === "MISSING_CONFIDENCE" || confidence.confidence_score <= 0) failures.push("CONFIDENCE_EVALUATION_MISSING");
  if (scenario === "MISSING_REPLAY" || pattern.replay_refs.length === 0 || timeline.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || evidence.governance_decision_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL") failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || pattern.lineage_refs.length === 0 || evidence.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "MISSING_TIMELINE" || timeline.pattern_growth.length === 0) failures.push("HISTORY_TIMELINE_MISSING");
  if (scenario === "CROSS_TENANT" || pattern.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(pattern) !== pattern.integrity_hash || hashWithoutIntegrity(confidence) !== confidence.integrity_hash || hashWithoutIntegrity(timeline) !== timeline.integrity_hash || recommendations.some((recommendation) => hashWithoutIntegrity(recommendation) !== recommendation.integrity_hash) || hashWithoutIntegrity(evidence) !== evidence.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "PRODUCTION_MUTATION" || pattern.mutates_production_risk_models) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (scenario === "ESCALATION_THRESHOLD_MUTATION" || pattern.changes_escalation_thresholds) failures.push("ESCALATION_THRESHOLD_MUTATION_DETECTED");
  if (scenario === "ROLLBACK_THRESHOLD_MUTATION" || pattern.changes_rollback_thresholds) failures.push("ROLLBACK_THRESHOLD_MUTATION_DETECTED");
  if (scenario === "GOVERNANCE_POLICY_MUTATION" || pattern.changes_governance_policy) failures.push("GOVERNANCE_POLICY_MUTATION_DETECTED");
  if (scenario === "GOVERNANCE_DECISION_OVERRIDE" || pattern.overrides_governance_decisions) failures.push("GOVERNANCE_DECISION_OVERRIDE_DETECTED");
  if (scenario === "OPERATOR_OVERRIDE" || pattern.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (scenario === "EVIDENCE_REWRITE" || pattern.rewrites_historical_evidence) failures.push("HISTORICAL_EVIDENCE_REWRITE_DETECTED");
  if (scenario === "MISSION_HISTORY_REWRITE" || pattern.rewrites_mission_history) failures.push("MISSION_HISTORY_REWRITE_DETECTED");
  if (scenario === "CONSTITUTIONAL_SUPPRESSION" || pattern.suppresses_constitutional_risk) failures.push("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_PATTERN_ANALYSIS");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskPatternFailure[]): RiskPatternValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("MULTIPLE_OBSERVATIONS_MISSING")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(pattern: RiskPatternRecord, confidence: RiskPatternConfidence, timeline: RiskPatternTimeline, recommendations: readonly RiskPatternRecommendation[], evidence: RiskPatternEvidenceRegistry, ledger: RiskPatternLedger, failures: readonly RiskPatternFailure[]): RiskPatternValidation {
  const integrityVerified = hashWithoutIntegrity(pattern) === pattern.integrity_hash && hashWithoutIntegrity(confidence) === confidence.integrity_hash && hashWithoutIntegrity(timeline) === timeline.integrity_hash && recommendations.every((recommendation) => hashWithoutIntegrity(recommendation) === recommendation.integrity_hash) && hashWithoutIntegrity(evidence) === evidence.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskPatternValidation, "integrity_hash"> = {
    validation_id: "risk_pattern_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    multiple_observations_complete: !failures.includes("MULTIPLE_OBSERVATIONS_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    deterministic_classification_complete: !failures.includes("DETERMINISTIC_CLASSIFICATION_MISSING"),
    confidence_evaluation_complete: !failures.includes("CONFIDENCE_EVALUATION_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_REFERENCES_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    history_timeline_complete: !failures.includes("HISTORY_TIMELINE_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_PATTERN_ANALYSIS"),
    advisory_only: pattern.advisory_only,
    observational_only: pattern.observational_only,
    no_production_risk_model_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_threshold_mutation: !failures.includes("ESCALATION_THRESHOLD_MUTATION_DETECTED") && !failures.includes("ROLLBACK_THRESHOLD_MUTATION_DETECTED"),
    no_governance_policy_mutation: !failures.includes("GOVERNANCE_POLICY_MUTATION_DETECTED"),
    no_governance_decision_override: !failures.includes("GOVERNANCE_DECISION_OVERRIDE_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    no_historical_evidence_rewrite: !failures.includes("HISTORICAL_EVIDENCE_REWRITE_DETECTED"),
    no_mission_history_rewrite: !failures.includes("MISSION_HISTORY_REWRITE_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskPatternResult, "integrity_hash" | "replay_hash">): string {
  return hash({ patterns: result.patterns, confidence: result.confidence, timeline: result.timeline, recommendations: result.recommendations, evidence_registry: result.evidence_registry, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskPatternResult, "integrity_hash">): string {
  return hash({
    risk_pattern_intelligence_version: result.risk_pattern_intelligence_version,
    api_surface_hash: result.api_surface.integrity_hash,
    pattern_hashes: result.patterns.map((pattern) => pattern.integrity_hash),
    confidence_hash: result.confidence.integrity_hash,
    timeline_hash: result.timeline.integrity_hash,
    recommendation_hashes: result.recommendations.map((recommendation) => recommendation.integrity_hash),
    evidence_hash: result.evidence_registry.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskPatternIntelligence(input: RiskPatternInput = {}): RiskPatternResult {
  const scenario = input.scenario ?? "BASELINE";
  const drift = input.drift_result ?? analyzeRiskDrift({ scenario: "SEVERITY" });
  const recalibration = input.recalibration_result ?? analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" });
  const driftRef = drift.records[0]?.risk_drift_id ?? "risk_drift_ref_missing";
  const recalibrationRef = recalibration.records[0]?.recalibration_id ?? "risk_recalibration_ref_missing";
  const api_surface = buildApiSurface();
  const pattern = buildPattern(scenario, driftRef);
  const confidence = buildConfidence(pattern, scenario);
  const timeline = buildTimeline(pattern, scenario);
  const recommendation = buildRecommendation(pattern, scenario);
  const recommendations = freezeArray([recommendation]);
  const evidence_registry = buildEvidence(pattern, driftRef, recalibrationRef, scenario);
  const patterns = freezeArray([pattern]);
  const ledger = buildLedger(patterns, confidence, timeline, recommendations, evidence_registry);
  const failures = collectFailures(pattern, confidence, timeline, recommendations, evidence_registry, ledger, scenario);
  const validation = buildValidation(pattern, confidence, timeline, recommendations, evidence_registry, ledger, failures);
  const base: Omit<RiskPatternResult, "integrity_hash" | "replay_hash"> = {
    risk_pattern_intelligence_version: RISK_PATTERN_VERSION,
    api_surface,
    patterns,
    confidence,
    timeline,
    recommendations,
    evidence_registry,
    ledger,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.deterministic_classification_complete,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    observational_only: true,
    mutates_production_risk_models: false,
    changes_escalation_thresholds: false,
    changes_rollback_thresholds: false,
    changes_governance_policy: false,
    changes_constitutional_safeguards: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskPatternIntelligence(result: RiskPatternResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskPatternIntelligenceFoundation(): RiskPatternFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_pattern_intelligence_version: RISK_PATTERN_VERSION,
    api_surface,
    result: analyzeRiskPatternIntelligence(),
  });
}

export const RiskPatternIntelligence = Object.freeze({
  analyze: analyzeRiskPatternIntelligence,
  replay: replayRiskPatternIntelligence,
});
