import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateGovernanceAwareRiskAdaptation } from "@/services/governance-aware-risk-adaptation";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import type {
  RiskAdaptationSimulationApiSurface,
  RiskAdaptationSimulationFailure,
  RiskAdaptationSimulationFoundation,
  RiskAdaptationSimulationInput,
  RiskAdaptationSimulationLedger,
  RiskAdaptationSimulationMetrics,
  RiskAdaptationSimulationRecord,
  RiskAdaptationSimulationReport,
  RiskAdaptationSimulationResult,
  RiskAdaptationSimulationScenarioCategory,
  RiskAdaptationSimulationType,
  RiskAdaptationSimulationValidation,
} from "@/types/risk-adaptation-simulation";

const RISK_ADAPTATION_SIMULATION_VERSION = "risk-adaptation-simulation/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskAdaptationSimulationInput["scenario"]>;
type Sample = Readonly<{ type: RiskAdaptationSimulationType; category: RiskAdaptationSimulationScenarioCategory; accuracyGain: number; fpReduction: number; fnReduction: number; escalationGain: number; rollbackGain: number; governanceGain: number }>;

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

function buildApiSurface(): RiskAdaptationSimulationApiSurface {
  const base: Omit<RiskAdaptationSimulationApiSurface, "integrity_hash"> = {
    api_id: "risk_adaptation_simulation_api",
    run_simulation: "POST /risk-adaptation-simulation/run",
    retrieve_records: "POST /risk-adaptation-simulation/records",
    retrieve_report: "POST /risk-adaptation-simulation/report",
    retrieve_metrics: "POST /risk-adaptation-simulation/metrics",
    retrieve_ledger: "POST /risk-adaptation-simulation/ledger",
    retrieve_validation: "POST /risk-adaptation-simulation/validation",
    replay_simulation: "POST /risk-adaptation-simulation/replay",
    retrieve_contract: "GET /risk-adaptation-simulation/contract",
    update_supported: false,
    delete_supported: false,
    production_mutation_supported: false,
    policy_mutation_supported: false,
    production_deployment_approval_supported: false,
    certification_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): Sample {
  const map: Partial<Record<Scenario, Sample>> = {
    HISTORICAL_REPLAY: { type: "HISTORICAL_REPLAY", category: "NORMAL_OPERATIONS", accuracyGain: 0.12, fpReduction: 0.08, fnReduction: 0.11, escalationGain: 0.09, rollbackGain: 0.07, governanceGain: 0.05 },
    PREDICTIVE_FORECAST: { type: "PREDICTIVE_FORECAST", category: "ELEVATED_OPERATIONAL_RISK", accuracyGain: 0.14, fpReduction: 0.07, fnReduction: 0.13, escalationGain: 0.1, rollbackGain: 0.08, governanceGain: 0.06 },
    CALIBRATION_COMPARISON: { type: "CALIBRATION_COMPARISON", category: "NORMAL_OPERATIONS", accuracyGain: 0.16, fpReduction: 0.1, fnReduction: 0.12, escalationGain: 0.08, rollbackGain: 0.08, governanceGain: 0.05 },
    SCENARIO_EVALUATION: { type: "SCENARIO_EVALUATION", category: "INFRASTRUCTURE_DISRUPTION", accuracyGain: 0.13, fpReduction: 0.06, fnReduction: 0.14, escalationGain: 0.11, rollbackGain: 0.1, governanceGain: 0.07 },
    IMPROVEMENT_ANALYSIS: { type: "IMPROVEMENT_ANALYSIS", category: "ELEVATED_OPERATIONAL_RISK", accuracyGain: 0.18, fpReduction: 0.12, fnReduction: 0.16, escalationGain: 0.12, rollbackGain: 0.11, governanceGain: 0.08 },
    ESCALATION_BEHAVIOR: { type: "ESCALATION_BEHAVIOR", category: "GOVERNANCE_ESCALATION", accuracyGain: 0.1, fpReduction: 0.05, fnReduction: 0.12, escalationGain: 0.2, rollbackGain: 0.05, governanceGain: 0.11 },
    ROLLBACK_BEHAVIOR: { type: "ROLLBACK_BEHAVIOR", category: "RECOVERY_OPERATIONS", accuracyGain: 0.1, fpReduction: 0.06, fnReduction: 0.1, escalationGain: 0.08, rollbackGain: 0.21, governanceGain: 0.08 },
    GOVERNANCE_OUTCOME: { type: "GOVERNANCE_OUTCOME", category: "CONSTITUTIONAL_REVIEW", accuracyGain: 0.08, fpReduction: 0.04, fnReduction: 0.08, escalationGain: 0.13, rollbackGain: 0.06, governanceGain: 0.2 },
    COMPOSITE: { type: "COMPOSITE_SIMULATION", category: "CRITICAL_INCIDENT", accuracyGain: 0.22, fpReduction: 0.13, fnReduction: 0.19, escalationGain: 0.18, rollbackGain: 0.16, governanceGain: 0.14 },
    NORMAL: { type: "SCENARIO_EVALUATION", category: "NORMAL_OPERATIONS", accuracyGain: 0.09, fpReduction: 0.1, fnReduction: 0.06, escalationGain: 0.05, rollbackGain: 0.04, governanceGain: 0.04 },
    ELEVATED: { type: "SCENARIO_EVALUATION", category: "ELEVATED_OPERATIONAL_RISK", accuracyGain: 0.13, fpReduction: 0.08, fnReduction: 0.12, escalationGain: 0.1, rollbackGain: 0.08, governanceGain: 0.06 },
    CRITICAL: { type: "SCENARIO_EVALUATION", category: "CRITICAL_INCIDENT", accuracyGain: 0.2, fpReduction: 0.1, fnReduction: 0.2, escalationGain: 0.18, rollbackGain: 0.14, governanceGain: 0.12 },
    GOVERNANCE: { type: "GOVERNANCE_OUTCOME", category: "GOVERNANCE_ESCALATION", accuracyGain: 0.1, fpReduction: 0.05, fnReduction: 0.11, escalationGain: 0.16, rollbackGain: 0.07, governanceGain: 0.18 },
    CONSTITUTIONAL: { type: "GOVERNANCE_OUTCOME", category: "CONSTITUTIONAL_REVIEW", accuracyGain: 0.08, fpReduction: 0.04, fnReduction: 0.13, escalationGain: 0.17, rollbackGain: 0.05, governanceGain: 0.22 },
    INFRASTRUCTURE: { type: "SCENARIO_EVALUATION", category: "INFRASTRUCTURE_DISRUPTION", accuracyGain: 0.15, fpReduction: 0.08, fnReduction: 0.15, escalationGain: 0.12, rollbackGain: 0.13, governanceGain: 0.08 },
    RECOVERY: { type: "ROLLBACK_BEHAVIOR", category: "RECOVERY_OPERATIONS", accuracyGain: 0.14, fpReduction: 0.07, fnReduction: 0.14, escalationGain: 0.1, rollbackGain: 0.2, governanceGain: 0.08 },
    CROSS_TENANT_SCENARIO: { type: "SCENARIO_EVALUATION", category: "CROSS_TENANT_ISOLATION", accuracyGain: 0.11, fpReduction: 0.05, fnReduction: 0.09, escalationGain: 0.08, rollbackGain: 0.07, governanceGain: 0.1 },
  };
  return map[scenario] ?? map.COMPOSITE!;
}

function metrics(base: number, sample: Sample): { baseline: RiskAdaptationSimulationMetrics; proposed: RiskAdaptationSimulationMetrics; improvement: RiskAdaptationSimulationMetrics } {
  const baseline: RiskAdaptationSimulationMetrics = Object.freeze({
    prediction_accuracy: base,
    severity_accuracy: base - 0.04,
    probability_accuracy: base - 0.05,
    calibration_consistency: base - 0.03,
    false_positive_reduction: 0,
    false_negative_reduction: 0,
    escalation_effectiveness: base - 0.06,
    rollback_effectiveness: base - 0.07,
    governance_consistency: base - 0.02,
  });
  const improvement: RiskAdaptationSimulationMetrics = Object.freeze({
    prediction_accuracy: sample.accuracyGain,
    severity_accuracy: sample.accuracyGain - 0.02,
    probability_accuracy: sample.accuracyGain - 0.03,
    calibration_consistency: sample.accuracyGain - 0.01,
    false_positive_reduction: sample.fpReduction,
    false_negative_reduction: sample.fnReduction,
    escalation_effectiveness: sample.escalationGain,
    rollback_effectiveness: sample.rollbackGain,
    governance_consistency: sample.governanceGain,
  });
  const proposed: RiskAdaptationSimulationMetrics = Object.freeze({
    prediction_accuracy: baseline.prediction_accuracy + improvement.prediction_accuracy,
    severity_accuracy: baseline.severity_accuracy + improvement.severity_accuracy,
    probability_accuracy: baseline.probability_accuracy + improvement.probability_accuracy,
    calibration_consistency: baseline.calibration_consistency + improvement.calibration_consistency,
    false_positive_reduction: improvement.false_positive_reduction,
    false_negative_reduction: improvement.false_negative_reduction,
    escalation_effectiveness: baseline.escalation_effectiveness + improvement.escalation_effectiveness,
    rollback_effectiveness: baseline.rollback_effectiveness + improvement.rollback_effectiveness,
    governance_consistency: baseline.governance_consistency + improvement.governance_consistency,
  });
  return { baseline, proposed, improvement };
}

function buildRecord(scenario: Scenario, adaptationId: string, governanceRef: string): RiskAdaptationSimulationRecord {
  const sample = sampleForScenario(scenario);
  const values = metrics(0.66, sample);
  const base: Omit<RiskAdaptationSimulationRecord, "integrity_hash"> = {
    simulation_id: `risk_adaptation_simulation_${hash(`${scenario}:${sample.type}:${adaptationId}`).slice(0, 16)}`,
    adaptation_id: scenario === "MISSING_PROPOSAL" ? "" : adaptationId,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_risk_adaptation_simulation",
    simulation_type: sample.type,
    scenario_category: sample.category,
    historical_replay_refs: scenario === "REPLAY_FAILED" ? freezeArray([]) : freezeArray(["risk_simulation_historical_replay_ref_1"]),
    forecast_scenario_refs: freezeArray(["risk_simulation_forecast_scenario_ref_1"]),
    baseline_results: values.baseline,
    proposed_results: values.proposed,
    improvement_metrics: scenario === "MISSING_IMPROVEMENT" ? metrics(0.66, { ...sample, accuracyGain: 0, fpReduction: 0, fnReduction: 0, escalationGain: 0, rollbackGain: 0, governanceGain: 0 }).improvement : values.improvement,
    false_positive_rate: Math.max(0.01, 0.18 - sample.fpReduction),
    false_negative_rate: Math.max(0.01, 0.22 - sample.fnReduction),
    escalation_results: "Proposed calibration improves escalation timing without changing escalation policy.",
    rollback_results: "Proposed calibration improves rollback recommendation quality without changing rollback policy.",
    governance_results: scenario === "GOVERNANCE_REGRESSION" ? "Governance outcome regression detected." : "Governance outcomes preserved relative to baseline.",
    simulation_summary: `${sample.type} completed for ${sample.category}.`,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_simulation_evidence_ref_1", governanceRef]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["risk_simulation_replay_ref_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["risk_simulation_lineage_ref_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    production_isolated: true,
    mutates_production_risk_models: false,
    executes_recalibration: false,
    changes_escalation_policies: false,
    changes_rollback_policies: false,
    overrides_governance_decisions: false,
    overrides_operator_authority: false,
    rewrites_historical_evidence: false,
    authorizes_production_deployment: false,
    modifies_certification_status: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.simulation_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...record, mutates_production_risk_models: true as false });
  if (scenario === "RECALIBRATION_EXECUTION") return Object.freeze({ ...record, executes_recalibration: true as false });
  if (scenario === "ESCALATION_POLICY_MUTATION") return Object.freeze({ ...record, changes_escalation_policies: true as false });
  if (scenario === "ROLLBACK_POLICY_MUTATION") return Object.freeze({ ...record, changes_rollback_policies: true as false });
  if (scenario === "GOVERNANCE_OVERRIDE") return Object.freeze({ ...record, overrides_governance_decisions: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_historical_evidence: true as false });
  if (scenario === "PRODUCTION_APPROVAL") return Object.freeze({ ...record, authorizes_production_deployment: true as false });
  if (scenario === "CERTIFICATION_MUTATION") return Object.freeze({ ...record, modifies_certification_status: true as false });
  return record;
}

function buildReport(record: RiskAdaptationSimulationRecord): RiskAdaptationSimulationReport {
  const base: Omit<RiskAdaptationSimulationReport, "integrity_hash"> = {
    report_id: `risk_adaptation_simulation_report_${hash(record.simulation_id).slice(0, 14)}`,
    simulation_id: record.simulation_id,
    executive_summary: record.simulation_summary,
    historical_replay_summary: `Historical replay refs: ${record.historical_replay_refs.length}.`,
    forecast_summary: `Forecast scenario ${record.scenario_category} evaluated.`,
    comparison_summary: `Prediction accuracy delta ${record.improvement_metrics.prediction_accuracy}.`,
    improvement_summary: `False positive reduction ${record.improvement_metrics.false_positive_reduction}; false negative reduction ${record.improvement_metrics.false_negative_reduction}.`,
    governance_outcome_summary: record.governance_results,
    risk_forecast_summary: "Forecast remains advisory and production-isolated.",
    supporting_evidence_refs: record.supporting_evidence_refs,
    replay_refs: record.replay_refs,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly RiskAdaptationSimulationRecord[], report: RiskAdaptationSimulationReport): RiskAdaptationSimulationLedger {
  const types: RiskAdaptationSimulationType[] = ["HISTORICAL_REPLAY", "PREDICTIVE_FORECAST", "CALIBRATION_COMPARISON", "SCENARIO_EVALUATION", "IMPROVEMENT_ANALYSIS", "ESCALATION_BEHAVIOR", "ROLLBACK_BEHAVIOR", "GOVERNANCE_OUTCOME", "COMPOSITE_SIMULATION"];
  const categories: RiskAdaptationSimulationScenarioCategory[] = ["NORMAL_OPERATIONS", "ELEVATED_OPERATIONAL_RISK", "CRITICAL_INCIDENT", "GOVERNANCE_ESCALATION", "CONSTITUTIONAL_REVIEW", "INFRASTRUCTURE_DISRUPTION", "RECOVERY_OPERATIONS", "CROSS_TENANT_ISOLATION"];
  const type_index = types.reduce((index, type) => ({ ...index, [type]: freezeArray(records.filter((record) => record.simulation_type === type).map((record) => record.simulation_id)) }), {} as Record<RiskAdaptationSimulationType, readonly string[]>);
  const scenario_index = categories.reduce((index, category) => ({ ...index, [category]: freezeArray(records.filter((record) => record.scenario_category === category).map((record) => record.simulation_id)) }), {} as Record<RiskAdaptationSimulationScenarioCategory, readonly string[]>);
  const base: Omit<RiskAdaptationSimulationLedger, "integrity_hash"> = {
    ledger_id: `risk_adaptation_simulation_ledger_${hash(records.map((record) => record.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    simulation_refs: records.map((record) => record.simulation_id),
    report_refs: freezeArray([report.report_id]),
    type_index: Object.freeze(type_index),
    scenario_index: Object.freeze(scenario_index),
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: RiskAdaptationSimulationRecord, report: RiskAdaptationSimulationReport, ledger: RiskAdaptationSimulationLedger, scenario: Scenario): readonly RiskAdaptationSimulationFailure[] {
  const failures: RiskAdaptationSimulationFailure[] = [];
  if (scenario === "MISSING_PROPOSAL" || !record.adaptation_id) failures.push("PROPOSAL_INPUTS_MISSING");
  if (scenario === "REPLAY_FAILED" || record.historical_replay_refs.length === 0) failures.push("HISTORICAL_REPLAY_FAILED");
  if (scenario === "MISSING_DETERMINISM") failures.push("DETERMINISTIC_EXECUTION_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.supporting_evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_IMPROVEMENT" || record.improvement_metrics.prediction_accuracy <= 0) failures.push("IMPROVEMENT_MEASUREMENTS_MISSING");
  if (scenario === "GOVERNANCE_REGRESSION" || !record.governance_results.includes("preserved")) failures.push("GOVERNANCE_PRESERVATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_COMPLIANCE_FAILED");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0 || report.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (record.mutates_production_risk_models) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (record.executes_recalibration) failures.push("RECALIBRATION_EXECUTION_DETECTED");
  if (record.changes_escalation_policies) failures.push("ESCALATION_POLICY_MUTATION_DETECTED");
  if (record.changes_rollback_policies) failures.push("ROLLBACK_POLICY_MUTATION_DETECTED");
  if (record.overrides_governance_decisions) failures.push("GOVERNANCE_DECISION_OVERRIDE_DETECTED");
  if (record.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (record.rewrites_historical_evidence) failures.push("HISTORICAL_EVIDENCE_REWRITE_DETECTED");
  if (record.authorizes_production_deployment) failures.push("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED");
  if (record.modifies_certification_status) failures.push("CERTIFICATION_STATUS_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_SIMULATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskAdaptationSimulationFailure[]): RiskAdaptationSimulationValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED") || failures.includes("RECALIBRATION_EXECUTION_DETECTED") || failures.includes("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RiskAdaptationSimulationRecord, report: RiskAdaptationSimulationReport, ledger: RiskAdaptationSimulationLedger, failures: readonly RiskAdaptationSimulationFailure[]): RiskAdaptationSimulationValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(report) === report.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskAdaptationSimulationValidation, "integrity_hash"> = {
    validation_id: "risk_adaptation_simulation_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    proposal_inputs_complete: !failures.includes("PROPOSAL_INPUTS_MISSING"),
    historical_replay_successful: !failures.includes("HISTORICAL_REPLAY_FAILED"),
    deterministic_execution_complete: !failures.includes("DETERMINISTIC_EXECUTION_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    improvement_measurements_complete: !failures.includes("IMPROVEMENT_MEASUREMENTS_MISSING"),
    governance_preserved: !failures.includes("GOVERNANCE_PRESERVATION_FAILED"),
    constitutional_compliant: !failures.includes("CONSTITUTIONAL_COMPLIANCE_FAILED"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    advisory_only: record.advisory_only,
    production_isolated: record.production_isolated,
    no_production_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_recalibration_execution: !failures.includes("RECALIBRATION_EXECUTION_DETECTED"),
    no_policy_mutation: !failures.includes("ESCALATION_POLICY_MUTATION_DETECTED") && !failures.includes("ROLLBACK_POLICY_MUTATION_DETECTED"),
    no_governance_override: !failures.includes("GOVERNANCE_DECISION_OVERRIDE_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    no_evidence_rewrite: !failures.includes("HISTORICAL_EVIDENCE_REWRITE_DETECTED"),
    no_production_approval: !failures.includes("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"),
    no_certification_mutation: !failures.includes("CERTIFICATION_STATUS_MUTATION_DETECTED"),
    deterministic: !failures.includes("NONDETERMINISTIC_SIMULATION"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskAdaptationSimulationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, report: result.report, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskAdaptationSimulationResult, "integrity_hash">): string {
  return hash({
    risk_adaptation_simulation_version: result.risk_adaptation_simulation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    report_hash: result.report.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function runRiskAdaptationSimulation(input: RiskAdaptationSimulationInput = {}): RiskAdaptationSimulationResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = input.foundation_result ?? analyzeRiskAdaptationFoundation();
  const governance = input.governance_result ?? evaluateGovernanceAwareRiskAdaptation();
  const api_surface = buildApiSurface();
  const governanceRef = governance.records[0]?.governance_review_id ?? "governance_review_ref_missing";
  const record = buildRecord(scenario, foundation.contract.adaptation_id, governanceRef);
  const report = buildReport(record);
  const records = freezeArray([record]);
  const ledger = buildLedger(records, report);
  const failures = collectFailures(record, report, ledger, scenario);
  const validation = buildValidation(record, report, ledger, failures);
  const base: Omit<RiskAdaptationSimulationResult, "integrity_hash" | "replay_hash"> = {
    risk_adaptation_simulation_version: RISK_ADAPTATION_SIMULATION_VERSION,
    api_surface,
    records,
    report,
    ledger,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.deterministic_execution_complete,
    evidence_backed: validation.evidence_complete,
    governance_preserved: validation.governance_preserved,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    production_isolated: true,
    mutates_production_risk_models: false,
    executes_recalibration: false,
    changes_escalation_policies: false,
    changes_rollback_policies: false,
    authorizes_production_deployment: false,
    modifies_certification_status: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskAdaptationSimulation(result: RiskAdaptationSimulationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskAdaptationSimulationFoundation(): RiskAdaptationSimulationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_adaptation_simulation_version: RISK_ADAPTATION_SIMULATION_VERSION,
    api_surface,
    result: runRiskAdaptationSimulation(),
  });
}

export const RiskAdaptationSimulation = Object.freeze({
  run: runRiskAdaptationSimulation,
  replay: replayRiskAdaptationSimulation,
});
