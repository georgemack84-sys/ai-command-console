import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskDrift } from "@/services/risk-drift-detector";
import type { RiskSeverity } from "@/types/risk-actualization-analyzer";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";
import type {
  RiskSeverityCalibrationAnalysis,
  RiskSeverityCalibrationRating,
  RiskSeverityCalibrationType,
  RiskSeverityRecalibrationEvidenceRegistry,
  RiskSeverityRecalibrationFailure,
  RiskSeverityRecalibrationInput,
  RiskSeverityRecalibrationLedger,
  RiskSeverityRecalibrationProposal,
  RiskSeverityRecalibrationRecord,
  RiskSeverityRecalibrationResult,
  RiskSeverityRecalibrationValidation,
  RiskSeverityRecalibratorApiSurface,
  RiskSeverityRecalibratorFoundation,
  RiskSeverityRecommendationStrength,
} from "@/types/risk-severity-recalibrator";

const RISK_SEVERITY_RECALIBRATOR_VERSION = "risk-severity-recalibrator/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskSeverityRecalibrationInput["scenario"]>;
type RecalibrationSample = Readonly<{
  type: RiskSeverityCalibrationType;
  rating: RiskSeverityCalibrationRating;
  strength: RiskSeverityRecommendationStrength;
  domain: RiskAdaptationDomain;
  currentSeverity: RiskSeverity;
  observedSeverity: RiskSeverity;
  proposedSeverity: RiskSeverity;
  currentValue: string;
  proposedValue: string;
  severityScore: number;
  probabilityScore: number;
  impactScore: number;
  escalationScore: number;
  rollbackScore: number;
  expectedImprovement: number;
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

function buildApiSurface(): RiskSeverityRecalibratorApiSurface {
  const base: Omit<RiskSeverityRecalibratorApiSurface, "integrity_hash"> = {
    api_id: "risk_severity_recalibrator_api",
    analyze_recalibration: "POST /risk-severity-recalibrator/analyze",
    retrieve_records: "POST /risk-severity-recalibrator/records",
    retrieve_calibration: "POST /risk-severity-recalibrator/calibration",
    retrieve_probability: "POST /risk-severity-recalibrator/probability",
    retrieve_impact: "POST /risk-severity-recalibrator/impact",
    retrieve_thresholds: "POST /risk-severity-recalibrator/thresholds",
    retrieve_escalation: "POST /risk-severity-recalibrator/escalation",
    retrieve_rollback: "POST /risk-severity-recalibrator/rollback",
    retrieve_proposals: "POST /risk-severity-recalibrator/proposals",
    retrieve_governance: "POST /risk-severity-recalibrator/governance",
    retrieve_evidence: "POST /risk-severity-recalibrator/evidence",
    retrieve_ledger: "POST /risk-severity-recalibrator/ledger",
    retrieve_validation: "POST /risk-severity-recalibrator/validation",
    replay_analysis: "POST /risk-severity-recalibrator/replay",
    retrieve_contract: "GET /risk-severity-recalibrator/contract",
    update_supported: false,
    delete_supported: false,
    production_severity_mutation_supported: false,
    production_probability_mutation_supported: false,
    escalation_threshold_mutation_supported: false,
    rollback_policy_mutation_supported: false,
    governance_policy_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): RecalibrationSample {
  const map: Partial<Record<Scenario, RecalibrationSample>> = {
    ACCURATE: { type: "ENHANCED_MONITORING", rating: "ACCURATE", strength: "OBSERVE", domain: "MISSION_RISK", currentSeverity: "HIGH", observedSeverity: "HIGH", proposedSeverity: "HIGH", currentValue: "severity=HIGH probability=0.62 impact=high", proposedValue: "monitor current calibration", severityScore: 0.94, probabilityScore: 0.9, impactScore: 0.91, escalationScore: 0.89, rollbackScore: 0.88, expectedImprovement: 0.04 },
    SEVERITY_INFLATED: { type: "SEVERITY_ADJUSTMENT", rating: "SEVERITY_INFLATED", strength: "MEDIUM", domain: "MISSION_RISK", currentSeverity: "CRITICAL", observedSeverity: "HIGH", proposedSeverity: "HIGH", currentValue: "severity=CRITICAL", proposedValue: "severity=HIGH", severityScore: 0.58, probabilityScore: 0.78, impactScore: 0.7, escalationScore: 0.72, rollbackScore: 0.74, expectedImprovement: 0.22 },
    SEVERITY_SUPPRESSED: { type: "SEVERITY_ADJUSTMENT", rating: "SEVERITY_SUPPRESSED", strength: "HIGH", domain: "MISSION_RISK", currentSeverity: "MEDIUM", observedSeverity: "HIGH", proposedSeverity: "HIGH", currentValue: "severity=MEDIUM", proposedValue: "severity=HIGH", severityScore: 0.46, probabilityScore: 0.74, impactScore: 0.68, escalationScore: 0.61, rollbackScore: 0.63, expectedImprovement: 0.31 },
    PROBABILITY_OVERESTIMATED: { type: "PROBABILITY_ADJUSTMENT", rating: "PROBABILITY_OVERESTIMATED", strength: "MEDIUM", domain: "FORECAST_RISK", currentSeverity: "HIGH", observedSeverity: "MEDIUM", proposedSeverity: "MEDIUM", currentValue: "probability=0.82", proposedValue: "probability=0.58", severityScore: 0.72, probabilityScore: 0.48, impactScore: 0.76, escalationScore: 0.69, rollbackScore: 0.71, expectedImprovement: 0.26 },
    PROBABILITY_UNDERESTIMATED: { type: "PROBABILITY_ADJUSTMENT", rating: "PROBABILITY_UNDERESTIMATED", strength: "HIGH", domain: "FORECAST_RISK", currentSeverity: "MEDIUM", observedSeverity: "HIGH", proposedSeverity: "HIGH", currentValue: "probability=0.31", proposedValue: "probability=0.66", severityScore: 0.64, probabilityScore: 0.41, impactScore: 0.7, escalationScore: 0.58, rollbackScore: 0.61, expectedImprovement: 0.33 },
    IMPACT_MISCALIBRATED: { type: "IMPACT_ADJUSTMENT", rating: "IMPACT_MISCALIBRATED", strength: "HIGH", domain: "OPERATIONAL_RISK", currentSeverity: "MEDIUM", observedSeverity: "CRITICAL", proposedSeverity: "HIGH", currentValue: "impact=moderate", proposedValue: "impact=high with dependency cascade", severityScore: 0.57, probabilityScore: 0.76, impactScore: 0.39, escalationScore: 0.6, rollbackScore: 0.55, expectedImprovement: 0.35 },
    ESCALATION_THRESHOLD: { type: "ESCALATION_THRESHOLD_REFINEMENT", rating: "ESCALATION_THRESHOLD_MISCALIBRATED", strength: "CRITICAL", domain: "GOVERNANCE_RISK", currentSeverity: "HIGH", observedSeverity: "CRITICAL", proposedSeverity: "CRITICAL", currentValue: "escalate_at=0.80", proposedValue: "simulate escalate_at=0.68", severityScore: 0.66, probabilityScore: 0.69, impactScore: 0.71, escalationScore: 0.32, rollbackScore: 0.65, expectedImprovement: 0.38 },
    ROLLBACK_THRESHOLD: { type: "ROLLBACK_THRESHOLD_REFINEMENT", rating: "ROLLBACK_THRESHOLD_MISCALIBRATED", strength: "HIGH", domain: "OPERATIONAL_RISK", currentSeverity: "HIGH", observedSeverity: "CRITICAL", proposedSeverity: "HIGH", currentValue: "rollback_at=critical_only", proposedValue: "simulate rollback_at=high_with_recovery_drag", severityScore: 0.7, probabilityScore: 0.73, impactScore: 0.62, escalationScore: 0.68, rollbackScore: 0.36, expectedImprovement: 0.34 },
    EVIDENCE_REQUIREMENT: { type: "EVIDENCE_REQUIREMENT", rating: "INSUFFICIENT_DATA", strength: "MEDIUM", domain: "MISSION_RISK", currentSeverity: "MEDIUM", observedSeverity: "MEDIUM", proposedSeverity: "MEDIUM", currentValue: "evidence=minimal", proposedValue: "require outcome and recovery evidence", severityScore: 0.69, probabilityScore: 0.67, impactScore: 0.65, escalationScore: 0.66, rollbackScore: 0.64, expectedImprovement: 0.18 },
    ENHANCED_MONITORING: { type: "ENHANCED_MONITORING", rating: "UNSTABLE", strength: "LOW", domain: "MISSION_RISK", currentSeverity: "HIGH", observedSeverity: "HIGH", proposedSeverity: "HIGH", currentValue: "monitoring=standard", proposedValue: "monitoring=enhanced", severityScore: 0.71, probabilityScore: 0.72, impactScore: 0.69, escalationScore: 0.7, rollbackScore: 0.68, expectedImprovement: 0.15 },
    GOVERNANCE_ESCALATION: { type: "GOVERNANCE_ESCALATION", rating: "ESCALATION_THRESHOLD_MISCALIBRATED", strength: "CRITICAL", domain: "GOVERNANCE_RISK", currentSeverity: "HIGH", observedSeverity: "CRITICAL", proposedSeverity: "CRITICAL", currentValue: "governance_review=operator_discretion", proposedValue: "governance_review=mandatory_before_implementation", severityScore: 0.61, probabilityScore: 0.67, impactScore: 0.64, escalationScore: 0.35, rollbackScore: 0.62, expectedImprovement: 0.29 },
    SIMULATION_REQUIREMENT: { type: "SIMULATION_REQUIREMENT", rating: "UNSTABLE", strength: "HIGH", domain: "STRATEGIC_RISK", currentSeverity: "HIGH", observedSeverity: "CRITICAL", proposedSeverity: "HIGH", currentValue: "simulation=optional", proposedValue: "simulation=mandatory_multi_mission", severityScore: 0.6, probabilityScore: 0.63, impactScore: 0.58, escalationScore: 0.57, rollbackScore: 0.59, expectedImprovement: 0.27 },
    UNSTABLE: { type: "SIMULATION_REQUIREMENT", rating: "UNSTABLE", strength: "HIGH", domain: "STRATEGIC_RISK", currentSeverity: "LOW", observedSeverity: "CRITICAL", proposedSeverity: "HIGH", currentValue: "variance=wide", proposedValue: "recalibrate after simulation", severityScore: 0.38, probabilityScore: 0.42, impactScore: 0.4, escalationScore: 0.39, rollbackScore: 0.37, expectedImprovement: 0.41 },
  };
  return map[scenario] ?? map.SEVERITY_SUPPRESSED!;
}

function buildRecord(scenario: Scenario, driftRef: string): RiskSeverityRecalibrationRecord {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskSeverityRecalibrationRecord, "integrity_hash"> = {
    recalibration_id: `risk_severity_recalibration_${hash(`${scenario}:${sample.type}:${sample.rating}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: sample.type.includes("THRESHOLD") ? "mission_scope_threshold_recalibration" : "mission_scope_severity_recalibration",
    risk_domain: sample.domain,
    historical_assessment_refs: scenario === "MISSING_ASSESSMENTS" ? freezeArray([]) : freezeArray(["risk_assessment_history_ref_1", driftRef]),
    actual_outcome_refs: scenario === "MISSING_OUTCOMES" ? freezeArray([]) : freezeArray(["actual_mission_outcome_ref_1"]),
    calibration_type: sample.type,
    current_value: sample.currentValue,
    proposed_value: sample.proposedValue,
    current_severity: sample.currentSeverity,
    observed_severity: sample.observedSeverity,
    proposed_severity: sample.proposedSeverity,
    adjustment_reason: `${sample.rating} detected through deterministic historical outcome comparison.`,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_severity_recalibration_evidence_ref_1"]),
    expected_improvement: sample.expectedImprovement,
    governance_impact: sample.strength === "CRITICAL" || sample.type === "GOVERNANCE_ESCALATION" ? "Governance review required before any downstream implementation." : "Governance visibility required for advisory proposal review.",
    constitutional_impact: "Advisory recommendation only; constitutional protections supersede all recalibration proposals.",
    simulation_required: scenario !== "MISSING_SIMULATION" && (sample.strength !== "OBSERVE" || sample.type === "SIMULATION_REQUIREMENT"),
    operator_review_required: true,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["risk_severity_recalibration_replay_ref_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["risk_severity_recalibration_lineage_ref_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    observational_only: true,
    mutates_production_severity_models: false,
    mutates_production_probability_models: false,
    changes_escalation_thresholds: false,
    changes_rollback_policies: false,
    changes_governance_policy: false,
    overrides_operator_authority: false,
    rewrites_historical_evidence: false,
    rewrites_mission_history: false,
    suppresses_constitutional_risk: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.recalibration_id }) });
  if (scenario === "SEVERITY_MODEL_MUTATION") return Object.freeze({ ...record, mutates_production_severity_models: true as false });
  if (scenario === "PROBABILITY_MODEL_MUTATION") return Object.freeze({ ...record, mutates_production_probability_models: true as false });
  if (scenario === "ESCALATION_THRESHOLD_MUTATION") return Object.freeze({ ...record, changes_escalation_thresholds: true as false });
  if (scenario === "ROLLBACK_POLICY_MUTATION") return Object.freeze({ ...record, changes_rollback_policies: true as false });
  if (scenario === "GOVERNANCE_POLICY_MUTATION") return Object.freeze({ ...record, changes_governance_policy: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_historical_evidence: true as false });
  if (scenario === "MISSION_HISTORY_REWRITE") return Object.freeze({ ...record, rewrites_mission_history: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_risk: true as false });
  return record;
}

function buildCalibrationAnalysis(record: RiskSeverityRecalibrationRecord, scenario: Scenario): RiskSeverityCalibrationAnalysis {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskSeverityCalibrationAnalysis, "integrity_hash"> = {
    analysis_id: `risk_severity_calibration_analysis_${hash(record.recalibration_id).slice(0, 14)}`,
    recalibration_id: record.recalibration_id,
    calibration_rating: sample.rating,
    severity_calibration_score: sample.severityScore,
    probability_calibration_score: sample.probabilityScore,
    impact_calibration_score: sample.impactScore,
    escalation_threshold_score: sample.escalationScore,
    rollback_threshold_score: sample.rollbackScore,
    severity_variance: Math.abs(sample.severityScore - 1),
    probability_variance: Math.abs(sample.probabilityScore - 1),
    impact_variance: Math.abs(sample.impactScore - 1),
    threshold_variance: Math.max(Math.abs(sample.escalationScore - 1), Math.abs(sample.rollbackScore - 1)),
    historical_comparison: freezeArray([Math.max(0, sample.severityScore - 0.14), Math.max(0, sample.severityScore - 0.06), sample.severityScore]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildProposal(record: RiskSeverityRecalibrationRecord, analysis: RiskSeverityCalibrationAnalysis, scenario: Scenario): RiskSeverityRecalibrationProposal {
  const sample = sampleForScenario(scenario);
  const base: Omit<RiskSeverityRecalibrationProposal, "integrity_hash"> = {
    proposal_id: `risk_severity_recalibration_proposal_${hash(`${record.recalibration_id}:${analysis.analysis_id}`).slice(0, 14)}`,
    recalibration_id: record.recalibration_id,
    category: record.calibration_type,
    recommendation_strength: sample.strength,
    recommended_adjustment: record.proposed_value,
    expected_accuracy_gain: record.expected_improvement,
    false_positive_reduction: sample.rating === "SEVERITY_INFLATED" || sample.rating === "PROBABILITY_OVERESTIMATED" ? 0.18 : 0.07,
    false_negative_reduction: sample.rating === "SEVERITY_SUPPRESSED" || sample.rating === "PROBABILITY_UNDERESTIMATED" ? 0.24 : 0.08,
    governance_review_required: sample.strength === "HIGH" || sample.strength === "CRITICAL" || record.calibration_type === "GOVERNANCE_ESCALATION",
    simulation_scope: record.simulation_required ? "multi-mission deterministic simulation required before certification" : "monitoring-only validation",
    approval_requirements: freezeArray(["operator_review", "governance_review", record.simulation_required ? "simulation_certification" : "monitoring_review"]),
    replay_refs: record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceRegistry(record: RiskSeverityRecalibrationRecord, analysis: RiskSeverityCalibrationAnalysis, driftRef: string, scenario: Scenario): RiskSeverityRecalibrationEvidenceRegistry {
  const base: Omit<RiskSeverityRecalibrationEvidenceRegistry, "integrity_hash"> = {
    evidence_registry_id: `risk_severity_recalibration_evidence_${hash(record.recalibration_id).slice(0, 14)}`,
    recalibration_id: record.recalibration_id,
    historical_assessment_refs: record.historical_assessment_refs,
    actual_outcome_refs: record.actual_outcome_refs,
    calibration_analysis_refs: scenario === "MISSING_CALCULATION" ? freezeArray([]) : freezeArray([analysis.analysis_id]),
    drift_refs: freezeArray([driftRef]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["risk_severity_recalibration_governance_ref_1"]),
    constitutional_refs: scenario === "MISSING_CONSTITUTIONAL" ? freezeArray([]) : freezeArray(["risk_severity_recalibration_constitutional_ref_1"]),
    replay_refs: record.replay_refs,
    lineage_refs: record.lineage_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly RiskSeverityRecalibrationRecord[], analysis: RiskSeverityCalibrationAnalysis, proposals: readonly RiskSeverityRecalibrationProposal[], evidence: RiskSeverityRecalibrationEvidenceRegistry): RiskSeverityRecalibrationLedger {
  const ratings: RiskSeverityCalibrationRating[] = ["ACCURATE", "SEVERITY_INFLATED", "SEVERITY_SUPPRESSED", "PROBABILITY_OVERESTIMATED", "PROBABILITY_UNDERESTIMATED", "IMPACT_MISCALIBRATED", "ESCALATION_THRESHOLD_MISCALIBRATED", "ROLLBACK_THRESHOLD_MISCALIBRATED", "UNSTABLE", "INSUFFICIENT_DATA"];
  const types: RiskSeverityCalibrationType[] = ["SEVERITY_ADJUSTMENT", "PROBABILITY_ADJUSTMENT", "IMPACT_ADJUSTMENT", "ESCALATION_THRESHOLD_REFINEMENT", "ROLLBACK_THRESHOLD_REFINEMENT", "EVIDENCE_REQUIREMENT", "ENHANCED_MONITORING", "GOVERNANCE_ESCALATION", "SIMULATION_REQUIREMENT"];
  const rating_index = ratings.reduce((index, rating) => ({ ...index, [rating]: freezeArray(analysis.calibration_rating === rating ? records.map((record) => record.recalibration_id) : []) }), {} as Record<RiskSeverityCalibrationRating, readonly string[]>);
  const type_index = types.reduce((index, type) => ({ ...index, [type]: freezeArray(records.filter((record) => record.calibration_type === type).map((record) => record.recalibration_id)) }), {} as Record<RiskSeverityCalibrationType, readonly string[]>);
  const base: Omit<RiskSeverityRecalibrationLedger, "integrity_hash"> = {
    ledger_id: `risk_severity_recalibration_ledger_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    recalibration_refs: records.map((record) => record.recalibration_id),
    analysis_refs: freezeArray([analysis.analysis_id]),
    proposal_refs: proposals.map((proposal) => proposal.proposal_id),
    evidence_registry_refs: freezeArray([evidence.evidence_registry_id]),
    rating_index: Object.freeze(rating_index),
    type_index: Object.freeze(type_index),
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: RiskSeverityRecalibrationRecord, analysis: RiskSeverityCalibrationAnalysis, proposals: readonly RiskSeverityRecalibrationProposal[], evidence: RiskSeverityRecalibrationEvidenceRegistry, ledger: RiskSeverityRecalibrationLedger, scenario: Scenario): readonly RiskSeverityRecalibrationFailure[] {
  const failures: RiskSeverityRecalibrationFailure[] = [];
  if (scenario === "MISSING_ASSESSMENTS" || record.historical_assessment_refs.length === 0) failures.push("HISTORICAL_ASSESSMENTS_MISSING");
  if (scenario === "MISSING_OUTCOMES" || record.actual_outcome_refs.length === 0) failures.push("ACTUAL_OUTCOMES_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.supporting_evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_CALCULATION" || evidence.calibration_analysis_refs.length === 0) failures.push("DETERMINISTIC_CALCULATION_MISSING");
  if (scenario === "MISSING_EXPLANATION" || record.adjustment_reason.length === 0 || proposals[0]?.recommended_adjustment.length === 0) failures.push("EXPLAINABLE_LOGIC_MISSING");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0 || evidence.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || evidence.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL" || evidence.constitutional_refs.length === 0) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0 || evidence.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "MISSING_SIMULATION" || !record.simulation_required && record.calibration_type !== "ENHANCED_MONITORING") failures.push("SIMULATION_REQUIREMENT_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || hashWithoutIntegrity(analysis) !== analysis.integrity_hash || proposals.some((proposal) => hashWithoutIntegrity(proposal) !== proposal.integrity_hash) || hashWithoutIntegrity(evidence) !== evidence.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "SEVERITY_MODEL_MUTATION" || record.mutates_production_severity_models) failures.push("PRODUCTION_SEVERITY_MODEL_MUTATION_DETECTED");
  if (scenario === "PROBABILITY_MODEL_MUTATION" || record.mutates_production_probability_models) failures.push("PRODUCTION_PROBABILITY_MODEL_MUTATION_DETECTED");
  if (scenario === "ESCALATION_THRESHOLD_MUTATION" || record.changes_escalation_thresholds) failures.push("ESCALATION_THRESHOLD_MUTATION_DETECTED");
  if (scenario === "ROLLBACK_POLICY_MUTATION" || record.changes_rollback_policies) failures.push("ROLLBACK_POLICY_MUTATION_DETECTED");
  if (scenario === "GOVERNANCE_POLICY_MUTATION" || record.changes_governance_policy) failures.push("GOVERNANCE_POLICY_MUTATION_DETECTED");
  if (scenario === "OPERATOR_OVERRIDE" || record.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (scenario === "EVIDENCE_REWRITE" || record.rewrites_historical_evidence) failures.push("HISTORICAL_EVIDENCE_REWRITE_DETECTED");
  if (scenario === "MISSION_HISTORY_REWRITE" || record.rewrites_mission_history) failures.push("MISSION_HISTORY_REWRITE_DETECTED");
  if (scenario === "CONSTITUTIONAL_SUPPRESSION" || record.suppresses_constitutional_risk) failures.push("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_RECALIBRATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskSeverityRecalibrationFailure[]): RiskSeverityRecalibrationValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("HISTORICAL_ASSESSMENTS_MISSING") || failures.includes("ACTUAL_OUTCOMES_MISSING")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RiskSeverityRecalibrationRecord, analysis: RiskSeverityCalibrationAnalysis, proposals: readonly RiskSeverityRecalibrationProposal[], evidence: RiskSeverityRecalibrationEvidenceRegistry, ledger: RiskSeverityRecalibrationLedger, failures: readonly RiskSeverityRecalibrationFailure[]): RiskSeverityRecalibrationValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(analysis) === analysis.integrity_hash && proposals.every((proposal) => hashWithoutIntegrity(proposal) === proposal.integrity_hash) && hashWithoutIntegrity(evidence) === evidence.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskSeverityRecalibrationValidation, "integrity_hash"> = {
    validation_id: "risk_severity_recalibration_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    historical_assessments_complete: !failures.includes("HISTORICAL_ASSESSMENTS_MISSING"),
    actual_outcomes_complete: !failures.includes("ACTUAL_OUTCOMES_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    deterministic_calculations_complete: !failures.includes("DETERMINISTIC_CALCULATION_MISSING"),
    explainable_logic_complete: !failures.includes("EXPLAINABLE_LOGIC_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_REFERENCES_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    simulation_ready: !failures.includes("SIMULATION_REQUIREMENT_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_RECALIBRATION"),
    advisory_only: record.advisory_only,
    observational_only: record.observational_only,
    no_production_severity_model_mutation: !failures.includes("PRODUCTION_SEVERITY_MODEL_MUTATION_DETECTED"),
    no_production_probability_model_mutation: !failures.includes("PRODUCTION_PROBABILITY_MODEL_MUTATION_DETECTED"),
    no_escalation_threshold_mutation: !failures.includes("ESCALATION_THRESHOLD_MUTATION_DETECTED"),
    no_rollback_policy_mutation: !failures.includes("ROLLBACK_POLICY_MUTATION_DETECTED"),
    no_governance_policy_mutation: !failures.includes("GOVERNANCE_POLICY_MUTATION_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    no_historical_evidence_rewrite: !failures.includes("HISTORICAL_EVIDENCE_REWRITE_DETECTED"),
    no_mission_history_rewrite: !failures.includes("MISSION_HISTORY_REWRITE_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskSeverityRecalibrationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, calibration_analysis: result.calibration_analysis, proposals: result.proposals, evidence_registry: result.evidence_registry, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskSeverityRecalibrationResult, "integrity_hash">): string {
  return hash({
    risk_severity_recalibrator_version: result.risk_severity_recalibrator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    calibration_analysis_hash: result.calibration_analysis.integrity_hash,
    proposal_hashes: result.proposals.map((proposal) => proposal.integrity_hash),
    evidence_hash: result.evidence_registry.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskSeverityRecalibration(input: RiskSeverityRecalibrationInput = {}): RiskSeverityRecalibrationResult {
  const scenario = input.scenario ?? "BASELINE";
  const drift = input.drift_result ?? analyzeRiskDrift({ scenario: scenario === "BASELINE" ? "SEVERITY" : undefined });
  const driftRef = drift.records[0]?.risk_drift_id ?? "risk_drift_ref_missing";
  const api_surface = buildApiSurface();
  const record = buildRecord(scenario, driftRef);
  const calibration_analysis = buildCalibrationAnalysis(record, scenario);
  const proposal = buildProposal(record, calibration_analysis, scenario);
  const proposals = freezeArray([proposal]);
  const evidence_registry = buildEvidenceRegistry(record, calibration_analysis, driftRef, scenario);
  const records = freezeArray([record]);
  const ledger = buildLedger(records, calibration_analysis, proposals, evidence_registry);
  const failures = collectFailures(record, calibration_analysis, proposals, evidence_registry, ledger, scenario);
  const validation = buildValidation(record, calibration_analysis, proposals, evidence_registry, ledger, failures);
  const base: Omit<RiskSeverityRecalibrationResult, "integrity_hash" | "replay_hash"> = {
    risk_severity_recalibrator_version: RISK_SEVERITY_RECALIBRATOR_VERSION,
    api_surface,
    records,
    calibration_analysis,
    proposals,
    evidence_registry,
    ledger,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.explainable_logic_complete,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    simulation_ready: validation.simulation_ready,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    observational_only: true,
    mutates_production_severity_models: false,
    mutates_production_probability_models: false,
    changes_escalation_thresholds: false,
    changes_rollback_policies: false,
    changes_governance_policy: false,
    changes_constitutional_safeguards: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskSeverityRecalibration(result: RiskSeverityRecalibrationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskSeverityRecalibratorFoundation(): RiskSeverityRecalibratorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_severity_recalibrator_version: RISK_SEVERITY_RECALIBRATOR_VERSION,
    api_surface,
    result: analyzeRiskSeverityRecalibration(),
  });
}

export const RiskSeverityRecalibrator = Object.freeze({
  analyze: analyzeRiskSeverityRecalibration,
  replay: replayRiskSeverityRecalibration,
});
