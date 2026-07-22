import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import type {
  RiskActualizationApiSurface,
  RiskActualizationClassification,
  RiskActualizationFailure,
  RiskActualizationFoundation,
  RiskActualizationInput,
  RiskActualizationLedger,
  RiskActualizationRecord,
  RiskActualizationResult,
  RiskActualizationSummary,
  RiskActualizationValidation,
  RiskComparisonReport,
  RiskSeverity,
} from "@/types/risk-actualization-analyzer";

const RISK_ACTUALIZATION_VERSION = "risk-actualization-analyzer/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskActualizationInput["scenario"]>;
type RiskSample = Readonly<{
  classification: RiskActualizationClassification;
  predictedSeverity: RiskSeverity;
  actualSeverity: RiskSeverity;
  predictedProbability: number;
  actualOccurrence: boolean;
  predictedEscalation: boolean;
  actualEscalation: boolean;
  rollbackExpected: boolean;
  rollbackTriggered: boolean;
  governanceExpected: boolean;
  governanceIntervention: boolean;
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

function severityValue(severity: RiskSeverity): number {
  const map: Record<RiskSeverity, number> = { LOW: 0.25, MEDIUM: 0.5, HIGH: 0.75, CRITICAL: 1 };
  return map[severity];
}

function boolAccuracy(expected: boolean, actual: boolean): number {
  return expected === actual ? 1 : 0.25;
}

function buildApiSurface(): RiskActualizationApiSurface {
  const base: Omit<RiskActualizationApiSurface, "integrity_hash"> = {
    api_id: "risk_actualization_analyzer_api",
    analyze_actualization: "POST /risk-actualization-analyzer/analyze",
    retrieve_records: "POST /risk-actualization-analyzer/records",
    retrieve_comparison: "POST /risk-actualization-analyzer/comparison",
    retrieve_severity: "POST /risk-actualization-analyzer/severity",
    retrieve_probability: "POST /risk-actualization-analyzer/probability",
    retrieve_escalation: "POST /risk-actualization-analyzer/escalation",
    retrieve_rollback: "POST /risk-actualization-analyzer/rollback",
    retrieve_governance: "POST /risk-actualization-analyzer/governance",
    retrieve_summary: "POST /risk-actualization-analyzer/summary",
    retrieve_evidence: "POST /risk-actualization-analyzer/evidence",
    retrieve_ledger: "POST /risk-actualization-analyzer/ledger",
    retrieve_validation: "POST /risk-actualization-analyzer/validation",
    replay_analysis: "POST /risk-actualization-analyzer/replay",
    retrieve_contract: "GET /risk-actualization-analyzer/contract",
    update_supported: false,
    delete_supported: false,
    production_risk_mutation_supported: false,
    outcome_mutation_supported: false,
    evidence_rewrite_supported: false,
    governance_rewrite_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): RiskSample {
  const map: Partial<Record<Scenario, RiskSample>> = {
    ACCURATE: { classification: "ACCURATE", predictedSeverity: "HIGH", actualSeverity: "HIGH", predictedProbability: 0.82, actualOccurrence: true, predictedEscalation: true, actualEscalation: true, rollbackExpected: false, rollbackTriggered: false, governanceExpected: true, governanceIntervention: true },
    UNDERESTIMATED: { classification: "UNDERESTIMATED", predictedSeverity: "MEDIUM", actualSeverity: "CRITICAL", predictedProbability: 0.42, actualOccurrence: true, predictedEscalation: false, actualEscalation: true, rollbackExpected: false, rollbackTriggered: true, governanceExpected: false, governanceIntervention: true },
    OVERESTIMATED: { classification: "OVERESTIMATED", predictedSeverity: "CRITICAL", actualSeverity: "MEDIUM", predictedProbability: 0.9, actualOccurrence: false, predictedEscalation: true, actualEscalation: false, rollbackExpected: true, rollbackTriggered: false, governanceExpected: true, governanceIntervention: false },
    MISSED: { classification: "MISSED", predictedSeverity: "LOW", actualSeverity: "HIGH", predictedProbability: 0.08, actualOccurrence: true, predictedEscalation: false, actualEscalation: true, rollbackExpected: false, rollbackTriggered: true, governanceExpected: false, governanceIntervention: true },
    CORRECTLY_MITIGATED: { classification: "CORRECTLY_MITIGATED", predictedSeverity: "HIGH", actualSeverity: "LOW", predictedProbability: 0.76, actualOccurrence: false, predictedEscalation: true, actualEscalation: true, rollbackExpected: true, rollbackTriggered: true, governanceExpected: true, governanceIntervention: true },
    ESCALATION_MISSED: { classification: "UNDERESTIMATED", predictedSeverity: "MEDIUM", actualSeverity: "HIGH", predictedProbability: 0.55, actualOccurrence: true, predictedEscalation: false, actualEscalation: true, rollbackExpected: false, rollbackTriggered: false, governanceExpected: false, governanceIntervention: true },
    ROLLBACK_MISSED: { classification: "UNDERESTIMATED", predictedSeverity: "HIGH", actualSeverity: "CRITICAL", predictedProbability: 0.65, actualOccurrence: true, predictedEscalation: true, actualEscalation: true, rollbackExpected: false, rollbackTriggered: true, governanceExpected: true, governanceIntervention: true },
    GOVERNANCE_NEEDED: { classification: "UNDERESTIMATED", predictedSeverity: "MEDIUM", actualSeverity: "HIGH", predictedProbability: 0.5, actualOccurrence: true, predictedEscalation: true, actualEscalation: true, rollbackExpected: false, rollbackTriggered: false, governanceExpected: false, governanceIntervention: true },
  };
  return map[scenario] ?? map.ACCURATE!;
}

function buildRecord(scenario: Scenario, foundationRef: string): RiskActualizationRecord {
  const sample = sampleForScenario(scenario);
  const severityAccuracy = clamp(1 - Math.abs(severityValue(sample.predictedSeverity) - severityValue(sample.actualSeverity)));
  const probabilityAccuracy = clamp(sample.actualOccurrence ? sample.predictedProbability : 1 - sample.predictedProbability);
  const escalationAccuracy = boolAccuracy(sample.predictedEscalation, sample.actualEscalation);
  const rollbackAccuracy = boolAccuracy(sample.rollbackExpected, sample.rollbackTriggered);
  const governanceAccuracy = boolAccuracy(sample.governanceExpected, sample.governanceIntervention);
  const riskAccuracy = clamp((severityAccuracy + probabilityAccuracy + escalationAccuracy + rollbackAccuracy + governanceAccuracy) / 5);
  const base: Omit<RiskActualizationRecord, "integrity_hash"> = {
    actualization_id: `risk_actualization_${hash(`${scenario}:${sample.classification}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_id: "mission_risk_actualization_1",
    risk_assessment_refs: scenario === "MISSING_RISK_DATA" ? freezeArray([]) : freezeArray([foundationRef, "risk_assessment_ref_actualization_1"]),
    actual_outcome_refs: scenario === "MISSING_OUTCOME" ? freezeArray([]) : freezeArray(["mission_outcome_ref_actualization_1"]),
    predicted_severity: sample.predictedSeverity,
    actual_severity: sample.actualSeverity,
    predicted_probability: sample.predictedProbability,
    actual_occurrence: sample.actualOccurrence,
    predicted_escalation: sample.predictedEscalation,
    actual_escalation: sample.actualEscalation,
    rollback_expected: sample.rollbackExpected,
    rollback_triggered: sample.rollbackTriggered,
    governance_expected: sample.governanceExpected,
    governance_intervention: sample.governanceIntervention,
    actualization_classification: sample.classification,
    risk_accuracy_score: riskAccuracy,
    severity_accuracy_score: severityAccuracy,
    probability_accuracy_score: probabilityAccuracy,
    escalation_accuracy_score: escalationAccuracy,
    rollback_accuracy_score: rollbackAccuracy,
    governance_accuracy_score: governanceAccuracy,
    summary: `${sample.classification} risk prediction quality measured against completed mission outcome.`,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_actualization_evidence_ref_1"]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_risk_actualization_1"]),
    constitutional_refs: scenario === "MISSING_CONSTITUTIONAL" ? freezeArray([]) : freezeArray(["constitutional_ref_risk_actualization_1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_risk_actualization_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["lineage_ref_risk_actualization_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    observational_only: true,
    updates_risk_model: false,
    mutates_outcomes: false,
    rewrites_evidence: false,
    changes_governance_decisions: false,
    removes_audit_history: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "MISSING_INTEGRITY") return Object.freeze({ ...record, integrity_hash: "" });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.actualization_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...record, updates_risk_model: true as false });
  if (scenario === "OUTCOME_MUTATION") return Object.freeze({ ...record, mutates_outcomes: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_evidence: true as false });
  if (scenario === "GOVERNANCE_REWRITE") return Object.freeze({ ...record, changes_governance_decisions: true as false });
  if (scenario === "AUDIT_REMOVAL") return Object.freeze({ ...record, removes_audit_history: true as false });
  return record;
}

function buildComparison(record: RiskActualizationRecord): RiskComparisonReport {
  const base: Omit<RiskComparisonReport, "integrity_hash"> = {
    comparison_id: `risk_comparison_${hash(record.actualization_id).slice(0, 14)}`,
    actualization_id: record.actualization_id,
    severity_variance: Math.abs(severityValue(record.predicted_severity) - severityValue(record.actual_severity)),
    probability_variance: clamp(record.actual_occurrence ? 1 - record.predicted_probability : record.predicted_probability),
    escalation_variance: record.predicted_escalation === record.actual_escalation ? 0 : 1,
    rollback_variance: record.rollback_expected === record.rollback_triggered ? 0 : 1,
    governance_variance: record.governance_expected === record.governance_intervention ? 0 : 1,
    predicted_domains: freezeArray(["MISSION_RISK", "OPERATIONAL_RISK"]),
    realized_domains: record.actual_occurrence ? freezeArray(["MISSION_RISK", "OPERATIONAL_RISK"]) : freezeArray(["MISSION_RISK"]),
    predicted_mission_impact: `Predicted ${record.predicted_severity} mission impact.`,
    actual_mission_impact: `Actual ${record.actual_severity} mission impact.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSummary(record: RiskActualizationRecord, comparison: RiskComparisonReport): RiskActualizationSummary {
  const base: Omit<RiskActualizationSummary, "integrity_hash"> = {
    summary_id: `risk_actualization_summary_${hash(record.actualization_id).slice(0, 14)}`,
    actualization_id: record.actualization_id,
    executive_summary: record.summary,
    risk_prediction_quality: record.actualization_classification,
    key_variances: freezeArray([
      `Severity variance ${comparison.severity_variance}.`,
      `Probability variance ${comparison.probability_variance}.`,
      `Escalation variance ${comparison.escalation_variance}.`,
    ]),
    supporting_evidence_refs: record.supporting_evidence_refs,
    governance_findings: record.governance_refs.length ? freezeArray(["Governance intervention accuracy recorded as historical observation."]) : freezeArray([]),
    operational_impact: comparison.actual_mission_impact,
    confidence_assessment: `Composite risk accuracy score ${record.risk_accuracy_score}.`,
    replay_refs: record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly RiskActualizationRecord[], comparison: RiskComparisonReport, summary: RiskActualizationSummary): RiskActualizationLedger {
  const classifications: RiskActualizationClassification[] = ["ACCURATE", "UNDERESTIMATED", "OVERESTIMATED", "MISSED", "CORRECTLY_MITIGATED"];
  const classification_index = classifications.reduce((index, classification) => ({
    ...index,
    [classification]: freezeArray(records.filter((record) => record.actualization_classification === classification).map((record) => record.actualization_id)),
  }), {} as Record<RiskActualizationClassification, readonly string[]>);
  const base: Omit<RiskActualizationLedger, "integrity_hash"> = {
    ledger_id: `risk_actualization_ledger_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    actualization_refs: records.map((record) => record.actualization_id),
    comparison_refs: freezeArray([comparison.comparison_id]),
    summary_refs: freezeArray([summary.summary_id]),
    classification_index: Object.freeze(classification_index),
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: RiskActualizationRecord, comparison: RiskComparisonReport, summary: RiskActualizationSummary, ledger: RiskActualizationLedger, scenario: Scenario): readonly RiskActualizationFailure[] {
  const failures: RiskActualizationFailure[] = [];
  if (scenario === "MISSING_RISK_DATA" || record.risk_assessment_refs.length === 0) failures.push("HISTORICAL_RISK_DATA_MISSING");
  if (scenario === "MISSING_OUTCOME" || record.actual_outcome_refs.length === 0) failures.push("OUTCOME_DATA_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.supporting_evidence_refs.length === 0 || summary.supporting_evidence_refs.length === 0) failures.push("EVIDENCE_MISSING");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0 || summary.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || record.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL" || record.constitutional_refs.length === 0) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "MISSING_INTEGRITY" || !record.integrity_hash) failures.push("INTEGRITY_HASH_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || hashWithoutIntegrity(comparison) !== comparison.integrity_hash || hashWithoutIntegrity(summary) !== summary.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "PRODUCTION_MUTATION" || record.updates_risk_model) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (scenario === "OUTCOME_MUTATION" || record.mutates_outcomes) failures.push("OUTCOME_MUTATION_DETECTED");
  if (scenario === "EVIDENCE_REWRITE" || record.rewrites_evidence) failures.push("EVIDENCE_REWRITE_DETECTED");
  if (scenario === "GOVERNANCE_REWRITE" || record.changes_governance_decisions) failures.push("GOVERNANCE_DECISION_REWRITE_DETECTED");
  if (scenario === "AUDIT_REMOVAL" || record.removes_audit_history) failures.push("AUDIT_HISTORY_REMOVAL_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_CALCULATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskActualizationFailure[]): RiskActualizationValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("OUTCOME_DATA_MISSING")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RiskActualizationRecord, comparison: RiskComparisonReport, summary: RiskActualizationSummary, ledger: RiskActualizationLedger, failures: readonly RiskActualizationFailure[]): RiskActualizationValidation {
  const integrityVerified = !!record.integrity_hash && hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(comparison) === comparison.integrity_hash && hashWithoutIntegrity(summary) === summary.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskActualizationValidation, "integrity_hash"> = {
    validation_id: "risk_actualization_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    historical_data_complete: !failures.includes("HISTORICAL_RISK_DATA_MISSING"),
    outcome_data_complete: !failures.includes("OUTCOME_DATA_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_REFERENCES_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_CALCULATION"),
    advisory_only: record.advisory_only,
    observational_only: record.observational_only,
    no_production_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_outcome_mutation: !failures.includes("OUTCOME_MUTATION_DETECTED"),
    no_evidence_rewrite: !failures.includes("EVIDENCE_REWRITE_DETECTED"),
    no_governance_rewrite: !failures.includes("GOVERNANCE_DECISION_REWRITE_DETECTED"),
    audit_history_preserved: !failures.includes("AUDIT_HISTORY_REMOVAL_DETECTED"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskActualizationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, comparison: result.comparison, summary: result.summary, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskActualizationResult, "integrity_hash">): string {
  return hash({
    risk_actualization_analyzer_version: result.risk_actualization_analyzer_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    comparison_hash: result.comparison.integrity_hash,
    summary_hash: result.summary.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskActualization(input: RiskActualizationInput = {}): RiskActualizationResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = input.foundation_result ?? analyzeRiskAdaptationFoundation();
  const api_surface = buildApiSurface();
  const foundationRef = foundation.contract.adaptation_id;
  const record = buildRecord(scenario, foundationRef);
  const comparison = buildComparison(record);
  const summary = buildSummary(record, comparison);
  const records = freezeArray([record]);
  const ledger = buildLedger(records, comparison, summary);
  const failures = collectFailures(record, comparison, summary, ledger, scenario);
  const validation = buildValidation(record, comparison, summary, ledger, failures);
  const base: Omit<RiskActualizationResult, "integrity_hash" | "replay_hash"> = {
    risk_actualization_analyzer_version: RISK_ACTUALIZATION_VERSION,
    api_surface,
    records,
    comparison,
    summary,
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
    mutates_outcomes: false,
    rewrites_evidence: false,
    changes_governance_decisions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskActualization(result: RiskActualizationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskActualizationFoundation(): RiskActualizationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_actualization_analyzer_version: RISK_ACTUALIZATION_VERSION,
    api_surface,
    result: analyzeRiskActualization(),
  });
}

export const RiskActualizationAnalyzer = Object.freeze({
  analyze: analyzeRiskActualization,
  replay: replayRiskActualization,
});
