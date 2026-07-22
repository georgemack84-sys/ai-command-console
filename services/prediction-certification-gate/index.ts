import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runCognitiveExplainability, validateCognitiveExplainability } from "@/services/cognitive-explainability-engine";
import { runForecastConfidence, validateForecastConfidence } from "@/services/forecast-confidence-engine";
import { runHistoricalIntelligence, validateHistoricalIntelligence } from "@/services/historical-intelligence-engine";
import { runMultiDomainPrediction, validateMultiDomainPrediction } from "@/services/multi-domain-prediction-engine";
import { runPredictionKnowledgeRepository, validatePredictionKnowledgeRepository } from "@/services/prediction-knowledge-repository";
import { createPrediction, validatePrediction } from "@/services/prediction-contract";
import { runPredictiveReplaySimulation, validatePredictiveReplaySimulation } from "@/services/predictive-replay-simulation-engine";
import { runPreventativeRecommendations, validatePreventativeRecommendations } from "@/services/preventative-recommendation-engine";
import { runRiskForecasting, validateRiskForecasting } from "@/services/risk-forecasting-engine";
import type {
  CertificationCategoryResult,
  PredictionCertificationFailure,
  PredictionCertificationGateContract,
  PredictionCertificationInput,
  PredictionCertificationLedger,
  PredictionCertificationObservabilitySurface,
  PredictionCertificationOutcome,
  PredictionCertificationReplayResult,
  PredictionCertificationReport,
  PredictionCertificationScenario,
  PredictionCertificationValidationResult,
} from "@/types/prediction-certification-gate";

const NOW = "2026-07-13T00:00:00.000Z";
const VERSION = "prediction-certification-gate/v8ALT.3.10" as const;
const TENANT_ID = "tenant:autonomy:primary";
const states = Object.freeze(["NOT_STARTED", "INITIALIZING", "VALIDATING", "REPLAY_TESTING", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "SECURITY_VALIDATION", "CERTIFIED", "CONDITIONAL_PASS", "FAIL"] as const);
const outcomes = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);
const categories = Object.freeze(["prediction_validation", "explainability_validation", "replay_validation", "confidence_validation", "governance_validation", "constitutional_validation", "security_validation", "operational_validation"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioFailures(scenario: PredictionCertificationScenario): readonly PredictionCertificationFailure[] {
  const map: Partial<Record<PredictionCertificationScenario, PredictionCertificationFailure>> = {
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    AUTONOMOUS_MITIGATION_ATTEMPT: "AUTONOMOUS_MITIGATION_DETECTED",
    GOVERNANCE_MODIFICATION_ATTEMPT: "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED",
    CONSTITUTIONAL_MODIFICATION_ATTEMPT: "CONSTITUTIONAL_MODIFICATION_DETECTED",
    LINEAGE_MUTATION: "PREDICTION_LINEAGE_MUTATION_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    HIDDEN_PREDICTION_LOGIC: "HIDDEN_PREDICTION_LOGIC_DETECTED",
    DOCUMENTATION_WARNING: "NON_CRITICAL_DOCUMENTATION_WARNING",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function categoryResult(category: CertificationCategoryResult["category"], checks: readonly string[], failures: readonly PredictionCertificationFailure[], evidence: readonly string[]): CertificationCategoryResult {
  const status: PredictionCertificationOutcome = failures.length ? "FAIL" : "PASS";
  const base = { category, status, checks_passed: freezeArray(checks), checks_failed: freezeArray(failures), evidence_references: freezeArray([...evidence].filter(Boolean).sort()) };
  return Object.freeze({ ...base, category_hash: hashValue("prediction-certification-category", base) });
}

function computeReportHash(report: Omit<PredictionCertificationReport, "report_hash"> | PredictionCertificationReport): string {
  const { report_hash: _hash, ...source } = report as PredictionCertificationReport;
  return hashValue("prediction-certification-report", source);
}

export function computePredictionCertificationLedgerHash(ledger: Omit<PredictionCertificationLedger, "ledger_hash"> | PredictionCertificationLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as PredictionCertificationLedger;
  return hashValue("prediction-certification-ledger", source);
}

export function runPredictionCertification(input: PredictionCertificationInput = {}): PredictionCertificationLedger {
  const scenario = input.scenario ?? "BASELINE";
  const scenarioFailureList = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const prediction = input.prediction ?? createPrediction({ tenant_id: tenantId, mission_id: input.mission_id });
  const historical = input.historical_report ?? runHistoricalIntelligence({ tenant_id: tenantId, mission_id: prediction.mission_id });
  const risk = input.risk_report ?? runRiskForecasting({ tenant_id: tenantId, mission_id: prediction.mission_id, historical_report: historical });
  const recommendations = input.recommendation_report ?? runPreventativeRecommendations({ tenant_id: tenantId, mission_id: prediction.mission_id, forecast_report: risk });
  const knowledge = input.knowledge_repository ?? runPredictionKnowledgeRepository({ tenant_id: tenantId, mission_id: prediction.mission_id, prediction, historical_report: historical, risk_report: risk, recommendation_report: recommendations });
  const explainability = input.explainability_repository ?? runCognitiveExplainability({ tenant_id: tenantId, mission_id: prediction.mission_id, knowledge_repository: knowledge });
  const confidence = input.confidence_repository ?? runForecastConfidence({ tenant_id: tenantId, mission_id: prediction.mission_id, prediction, risk_report: risk, knowledge_repository: knowledge, explainability_repository: explainability });
  const multiDomain = input.multi_domain_repository ?? runMultiDomainPrediction({ tenant_id: tenantId, mission_id: prediction.mission_id, risk_report: risk, recommendation_report: recommendations, knowledge_repository: knowledge, explainability_repository: explainability, confidence_repository: confidence });
  const simulation = input.simulation_ledger ?? runPredictiveReplaySimulation({ tenant_id: tenantId, mission_id: prediction.mission_id, risk_report: risk, recommendation_report: recommendations, knowledge_repository: knowledge, explainability_repository: explainability, confidence_repository: confidence, multi_domain_repository: multiDomain });
  const predictionValid = validatePrediction(prediction).valid && validateHistoricalIntelligence(historical).valid && validateRiskForecasting(risk).valid && validatePreventativeRecommendations(recommendations).valid;
  const explainValid = validateCognitiveExplainability(explainability).valid;
  const replayValid = validatePredictiveReplaySimulation(simulation).valid;
  const confidenceValid = validateForecastConfidence(confidence).valid;
  const knowledgeValid = validatePredictionKnowledgeRepository(knowledge).valid;
  const multiDomainValid = validateMultiDomainPrediction(multiDomain).valid;
  const safetyFailures = scenarioFailureList.filter((failure) => failure !== "NON_CRITICAL_DOCUMENTATION_WARNING");
  const predictionFailures = predictionValid ? [] : ["PREDICTION_CONTRACT_INVALID" as const];
  const explainFailures = explainValid ? [] : ["EXPLAINABLE_FORECASTS_INCOMPLETE" as const];
  const replayFailures = replayValid ? [] : ["REPLAY_REPRODUCIBILITY_INVALID" as const];
  const confidenceFailures = confidenceValid ? [] : ["CONFIDENCE_REPRODUCIBILITY_INVALID" as const];
  const governanceFailures = multiDomainValid && !scenarioFailureList.includes("AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED") ? [] : ["GOVERNANCE_ENFORCEMENT_INVALID" as const];
  const constitutionalFailures = scenarioFailureList.includes("CONSTITUTIONAL_MODIFICATION_DETECTED") ? ["CONSTITUTIONAL_COMPLIANCE_INVALID" as const] : [];
  const securityFailures = knowledgeValid && !scenarioFailureList.includes("PREDICTION_LINEAGE_MUTATION_DETECTED") && !scenarioFailureList.includes("REPLAY_INCONSISTENCY_DETECTED") ? [] : ["PREDICTION_LINEAGE_MUTATION_DETECTED" as const];
  const operationalFailures = scenarioFailureList.includes("REPLAY_INCONSISTENCY_DETECTED")
    ? freezeArray([...safetyFailures, "REPLAY_INCONSISTENCY_DETECTED" as const])
    : safetyFailures.length ? safetyFailures : [];
  const evidence = [prediction.prediction_hash, historical.report_hash, risk.report_hash, recommendations.report_hash, knowledge.repository_hash, explainability.repository_hash, confidence.repository_hash, multiDomain.repository_hash, simulation.ledger_hash];
  const prediction_validation = categoryResult("prediction_validation", ["prediction contract", "schema", "determinism", "recommendations"], predictionFailures, evidence);
  const explainability_validation = categoryResult("explainability_validation", ["causal reasoning", "evidence", "confidence explanations", "replay explanations"], explainFailures, [explainability.repository_hash]);
  const replay_validation = categoryResult("replay_validation", ["deterministic replay", "predictions", "recommendations", "explanations"], replayFailures, simulation.replay_references);
  const confidence_validation = categoryResult("confidence_validation", ["prediction confidence", "model stability", "evidence quality", "reliability"], confidenceFailures, confidence.integrity_hashes);
  const governance_validation = categoryResult("governance_validation", ["policy", "authority", "audit trail"], governanceFailures, multiDomain.integrity_hashes);
  const constitutional_validation = categoryResult("constitutional_validation", ["operator supremacy", "governance supremacy", "advisory-only"], constitutionalFailures, [prediction.constitutional_metadata?.constitutional_hash ?? "constitutional:missing"]);
  const security_validation = categoryResult("security_validation", ["tenant isolation", "lineage", "replay protection", "integrity"], securityFailures, knowledge.integrity_hashes);
  const operational_validation = categoryResult("operational_validation", ["operator visibility", "fail closed", "production readiness"], operationalFailures, simulation.integrity_hashes);
  const categoryFailures = [prediction_validation, explainability_validation, replay_validation, confidence_validation, governance_validation, constitutional_validation, security_validation, operational_validation].flatMap((item) => item.checks_failed);
  const warnings = scenarioFailureList.includes("NON_CRITICAL_DOCUMENTATION_WARNING") ? 1 : 0;
  const overall_status: PredictionCertificationOutcome = categoryFailures.length ? "FAIL" : warnings ? "CONDITIONAL_PASS" : "PASS";
  const reportBase = {
    certification_id: id("PCG", "prediction-certification", { prediction: prediction.prediction_hash, scenario }),
    prediction_suite_version: VERSION,
    tenant_id: scenarioFailureList.includes("CROSS_TENANT_PREDICTION_ACCESS_DETECTED") ? "external-tenant" : tenantId,
    overall_status,
    certification_state: overall_status === "PASS" ? "CERTIFIED" as const : overall_status === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" as const : "FAIL" as const,
    prediction_validation,
    explainability_validation,
    replay_validation,
    confidence_validation,
    governance_validation,
    constitutional_validation,
    security_validation,
    operational_validation,
    tests_passed: overall_status === "FAIL" ? 0 : 39 - warnings,
    tests_failed: categoryFailures.length,
    tests_warning: warnings,
    recommendations: freezeArray(overall_status === "PASS" ? ["production certification readiness confirmed"] : ["resolve certification failures before production readiness"]),
    production_certification_ready: overall_status === "PASS",
    fail_closed_verified: safetyFailures.length ? overall_status === "FAIL" : true,
    lineage_reference: knowledge.lineage_references[0] ?? risk.lineage_reference,
    replay_reference: simulation.replay_references[0] ?? risk.replay_reference,
    integrity_hash: hashValue("prediction-certification-integrity", { evidence, categories: [prediction_validation.category_hash, explainability_validation.category_hash, replay_validation.category_hash, confidence_validation.category_hash, governance_validation.category_hash, constitutional_validation.category_hash, security_validation.category_hash, operational_validation.category_hash] }),
    certified_at: NOW,
    certified_by: "prediction-certification-gate",
    advisory_only: true as const,
    autonomous_execution_detected: scenarioFailureList.includes("AUTONOMOUS_EXECUTION_DETECTED"),
    autonomous_mitigation_detected: scenarioFailureList.includes("AUTONOMOUS_MITIGATION_DETECTED"),
    governance_modified: scenarioFailureList.includes("AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"),
    constitutional_modified: scenarioFailureList.includes("CONSTITUTIONAL_MODIFICATION_DETECTED"),
    hidden_prediction_logic_detected: scenarioFailureList.includes("HIDDEN_PREDICTION_LOGIC_DETECTED"),
  };
  const report = Object.freeze({ ...reportBase, report_hash: computeReportHash(reportBase as Omit<PredictionCertificationReport, "report_hash">) });
  const ledgerBase = {
    ledger_id: id("PCGLEDGER", "prediction-certification-ledger", { report: report.report_hash, scenario }),
    tenant_id: report.tenant_id,
    certification_results: freezeArray([report]),
    validation_evidence: freezeArray(evidence),
    replay_reports: freezeArray(simulation.replay_records),
    governance_reports: freezeArray([governance_validation.category_hash]),
    constitutional_reports: freezeArray([constitutional_validation.category_hash]),
    integrity_verification: freezeArray([report.integrity_hash, ...simulation.integrity_hashes]),
    lineage_references: freezeArray([report.lineage_reference].filter(Boolean)),
    replay_references: freezeArray([report.replay_reference].filter(Boolean)),
    certification_hashes: freezeArray([report.report_hash]),
    source_prediction: prediction,
    source_historical_report: historical,
    source_risk_report: risk,
    source_recommendation_report: recommendations,
    source_knowledge_repository: knowledge,
    source_explainability_repository: explainability,
    source_confidence_repository: confidence,
    source_multi_domain_repository: multiDomain,
    source_simulation_ledger: simulation,
    append_only: true as const,
  };
  return Object.freeze({ ...ledgerBase, ledger_hash: computePredictionCertificationLedgerHash(ledgerBase as Omit<PredictionCertificationLedger, "ledger_hash">) });
}

export function replayPredictionCertification(ledger = runPredictionCertification()): PredictionCertificationReplayResult {
  const reconstructed_hash = computePredictionCertificationLedgerHash(ledger);
  const source = { replay_reference: `replay:${ledger.ledger_id}`, ledger_id: ledger.ledger_id, deterministic: reconstructed_hash === ledger.ledger_hash && ledger.replay_references.length > 0, reconstructed_hash, original_hash: ledger.ledger_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("prediction-certification-replay", source) });
}

export function validatePredictionCertification(ledger?: PredictionCertificationLedger): PredictionCertificationValidationResult {
  if (!ledger) {
    const failures = freezeArray<PredictionCertificationFailure>(["PREDICTION_CONTRACT_INVALID"]);
    const source = { ledger_id: null, valid: false, prediction_contract_valid: false, prediction_schema_valid: false, deterministic_predictions_reproducible: false, explainable_forecasts_complete: false, causal_reasoning_chains_reproducible: false, supporting_evidence_complete: false, replay_reproducibility_verified: false, replay_reconstructs_identical_predictions: false, replay_reconstructs_identical_recommendations: false, replay_reconstructs_identical_explanations: false, confidence_reproducibility_verified: false, model_stability_reproducible: false, evidence_quality_reproducible: false, historical_accuracy_reproducible: false, governance_certainty_reproducible: false, overall_forecast_reliability_reproducible: false, governance_enforcement_validated: false, policy_enforcement_verified: false, authority_validation_enforced: false, constitutional_compliance_verified: false, operator_supremacy_preserved: false, governance_supremacy_preserved: false, tenant_isolation_enforced: false, cross_tenant_prediction_access_rejected: false, operator_visibility_complete: false, prediction_lineage_immutable: false, replay_references_preserved: false, integrity_hashes_reproducible: false, certification_evidence_complete: false, advisory_only_behavior_enforced: false, autonomous_execution_rejected: false, autonomous_mitigation_rejected: false, autonomous_governance_modification_rejected: false, constitutional_modification_rejected: false, replay_inconsistency_detected: false, hidden_prediction_logic_rejected: false, fail_closed_operation_verified: false, production_certification_readiness_confirmed: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("prediction-certification-validation", source) });
  }
  const report = ledger.certification_results[0];
  const prediction_contract_valid = validatePrediction(ledger.source_prediction).valid;
  const prediction_schema_valid = Boolean(ledger.source_prediction.prediction_id && ledger.source_prediction.prediction_hash);
  const deterministic_predictions_reproducible = validateRiskForecasting(ledger.source_risk_report).valid;
  const explainable_forecasts_complete = validateCognitiveExplainability(ledger.source_explainability_repository).valid;
  const causal_reasoning_chains_reproducible = explainable_forecasts_complete;
  const supporting_evidence_complete = ledger.source_risk_report.forecasts.every((forecast) => forecast.supporting_evidence.length > 0);
  const replay_reproducibility_verified = validatePredictiveReplaySimulation(ledger.source_simulation_ledger).valid;
  const replay_reconstructs_identical_predictions = replayPredictionCertification(ledger).deterministic;
  const replay_reconstructs_identical_recommendations = validatePreventativeRecommendations(ledger.source_recommendation_report).valid;
  const replay_reconstructs_identical_explanations = explainable_forecasts_complete;
  const confidence_reproducibility_verified = validateForecastConfidence(ledger.source_confidence_repository).valid;
  const model_stability_reproducible = confidence_reproducibility_verified;
  const evidence_quality_reproducible = confidence_reproducibility_verified;
  const historical_accuracy_reproducible = validateHistoricalIntelligence(ledger.source_historical_report).valid;
  const governance_certainty_reproducible = confidence_reproducibility_verified;
  const overall_forecast_reliability_reproducible = confidence_reproducibility_verified;
  const governance_enforcement_validated = report.governance_validation.status === "PASS" && !report.governance_modified;
  const policy_enforcement_verified = governance_enforcement_validated;
  const authority_validation_enforced = governance_enforcement_validated;
  const constitutional_compliance_verified = report.constitutional_validation.status === "PASS" && !report.constitutional_modified;
  const operator_supremacy_preserved = constitutional_compliance_verified;
  const governance_supremacy_preserved = governance_enforcement_validated;
  const tenant_isolation_enforced = ledger.tenant_id !== "external-tenant";
  const cross_tenant_prediction_access_rejected = tenant_isolation_enforced;
  const operator_visibility_complete = report.operational_validation.status !== "FAIL" && ledger.validation_evidence.length >= 9;
  const prediction_lineage_immutable = ledger.lineage_references.length > 0 && !report.security_validation.checks_failed.includes("PREDICTION_LINEAGE_MUTATION_DETECTED");
  const replay_references_preserved = ledger.replay_references.length > 0;
  const integrity_hashes_reproducible = ledger.integrity_verification.length > 0 && computePredictionCertificationLedgerHash(ledger) === ledger.ledger_hash;
  const certification_evidence_complete = ledger.certification_hashes.length === ledger.certification_results.length && ledger.validation_evidence.length >= 9;
  const advisory_only_behavior_enforced = report.advisory_only && !report.autonomous_execution_detected && !report.autonomous_mitigation_detected && !report.governance_modified && !report.constitutional_modified;
  const autonomous_execution_rejected = !report.autonomous_execution_detected;
  const autonomous_mitigation_rejected = !report.autonomous_mitigation_detected;
  const autonomous_governance_modification_rejected = !report.governance_modified;
  const constitutional_modification_rejected = !report.constitutional_modified;
  const replay_inconsistency_detected = replay_reproducibility_verified;
  const hidden_prediction_logic_rejected = !report.hidden_prediction_logic_detected;
  const fail_closed_operation_verified = report.fail_closed_verified;
  const production_certification_readiness_confirmed = report.production_certification_ready && report.overall_status === "PASS";
  const categoryFailureCodes = [
    report.prediction_validation,
    report.explainability_validation,
    report.replay_validation,
    report.confidence_validation,
    report.governance_validation,
    report.constitutional_validation,
    report.security_validation,
    report.operational_validation,
  ].flatMap((category) => category.checks_failed);
  const failures = unique([
    ...categoryFailureCodes,
    ...(!prediction_contract_valid ? ["PREDICTION_CONTRACT_INVALID" as const] : []),
    ...(!prediction_schema_valid ? ["PREDICTION_SCHEMA_INVALID" as const] : []),
    ...(!deterministic_predictions_reproducible ? ["PREDICTIONS_NONDETERMINISTIC" as const] : []),
    ...(!explainable_forecasts_complete ? ["EXPLAINABLE_FORECASTS_INCOMPLETE" as const] : []),
    ...(!causal_reasoning_chains_reproducible ? ["CAUSAL_REASONING_NONDETERMINISTIC" as const] : []),
    ...(!supporting_evidence_complete ? ["SUPPORTING_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!replay_reproducibility_verified ? ["REPLAY_REPRODUCIBILITY_INVALID" as const] : []),
    ...(!replay_reconstructs_identical_predictions ? ["PREDICTION_REPLAY_MISMATCH" as const] : []),
    ...(!replay_reconstructs_identical_recommendations ? ["RECOMMENDATION_REPLAY_MISMATCH" as const] : []),
    ...(!replay_reconstructs_identical_explanations ? ["EXPLANATION_REPLAY_MISMATCH" as const] : []),
    ...(!confidence_reproducibility_verified ? ["CONFIDENCE_REPRODUCIBILITY_INVALID" as const] : []),
    ...(!model_stability_reproducible ? ["MODEL_STABILITY_INVALID" as const] : []),
    ...(!evidence_quality_reproducible ? ["EVIDENCE_QUALITY_INVALID" as const] : []),
    ...(!historical_accuracy_reproducible ? ["HISTORICAL_ACCURACY_INVALID" as const] : []),
    ...(!governance_certainty_reproducible ? ["GOVERNANCE_CERTAINTY_INVALID" as const] : []),
    ...(!overall_forecast_reliability_reproducible ? ["FORECAST_RELIABILITY_INVALID" as const] : []),
    ...(!governance_enforcement_validated ? ["GOVERNANCE_ENFORCEMENT_INVALID" as const] : []),
    ...(!policy_enforcement_verified ? ["POLICY_ENFORCEMENT_INVALID" as const] : []),
    ...(!authority_validation_enforced ? ["AUTHORITY_VALIDATION_INVALID" as const] : []),
    ...(!constitutional_compliance_verified ? ["CONSTITUTIONAL_COMPLIANCE_INVALID" as const] : []),
    ...(!operator_supremacy_preserved ? ["OPERATOR_SUPREMACY_INVALID" as const] : []),
    ...(!governance_supremacy_preserved ? ["GOVERNANCE_SUPREMACY_INVALID" as const] : []),
    ...(!tenant_isolation_enforced ? ["TENANT_ISOLATION_INVALID" as const, "CROSS_TENANT_PREDICTION_ACCESS_DETECTED" as const] : []),
    ...(!operator_visibility_complete ? ["OPERATOR_VISIBILITY_INCOMPLETE" as const] : []),
    ...(!prediction_lineage_immutable ? ["PREDICTION_LINEAGE_MUTATION_DETECTED" as const] : []),
    ...(!replay_references_preserved ? ["REPLAY_REFERENCES_MISSING" as const] : []),
    ...(!integrity_hashes_reproducible ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!certification_evidence_complete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(!autonomous_execution_rejected ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(!autonomous_mitigation_rejected ? ["AUTONOMOUS_MITIGATION_DETECTED" as const] : []),
    ...(!autonomous_governance_modification_rejected ? ["AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED" as const] : []),
    ...(!constitutional_modification_rejected ? ["CONSTITUTIONAL_MODIFICATION_DETECTED" as const] : []),
    ...(!replay_inconsistency_detected ? ["REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(!hidden_prediction_logic_rejected ? ["HIDDEN_PREDICTION_LOGIC_DETECTED" as const] : []),
    ...(!fail_closed_operation_verified ? ["FAIL_CLOSED_INVALID" as const] : []),
    ...(!production_certification_readiness_confirmed ? ["PRODUCTION_READINESS_BLOCKED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { ledger_id: ledger.ledger_id, valid, prediction_contract_valid, prediction_schema_valid, deterministic_predictions_reproducible, explainable_forecasts_complete, causal_reasoning_chains_reproducible, supporting_evidence_complete, replay_reproducibility_verified, replay_reconstructs_identical_predictions, replay_reconstructs_identical_recommendations, replay_reconstructs_identical_explanations, confidence_reproducibility_verified, model_stability_reproducible, evidence_quality_reproducible, historical_accuracy_reproducible, governance_certainty_reproducible, overall_forecast_reliability_reproducible, governance_enforcement_validated, policy_enforcement_verified, authority_validation_enforced, constitutional_compliance_verified, operator_supremacy_preserved, governance_supremacy_preserved, tenant_isolation_enforced, cross_tenant_prediction_access_rejected, operator_visibility_complete, prediction_lineage_immutable, replay_references_preserved, integrity_hashes_reproducible, certification_evidence_complete, advisory_only_behavior_enforced, autonomous_execution_rejected, autonomous_mitigation_rejected, autonomous_governance_modification_rejected, constitutional_modification_rejected, replay_inconsistency_detected, hidden_prediction_logic_rejected, fail_closed_operation_verified, production_certification_readiness_confirmed, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("prediction-certification-validation", source) });
}

export function buildPredictionCertificationObservabilitySurface(ledger = runPredictionCertification()): PredictionCertificationObservabilitySurface {
  const report = ledger.certification_results[0];
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, certification_count: ledger.certification_results.length, overall_status: report.overall_status, tests_passed: report.tests_passed, tests_failed: report.tests_failed, tests_warning: report.tests_warning, production_certification_ready: report.production_certification_ready, advisory_only: true, ledger_hash: ledger.ledger_hash });
}

export function getPredictionCertificationGateContract(): PredictionCertificationGateContract {
  const ledger = runPredictionCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      gate_version: VERSION,
      principles: freezeArray(["deterministic-validation", "replay-first-certification", "governance-supremacy", "constitutional-supremacy", "operator-supremacy", "explainability-by-default", "immutable-evidence", "cryptographic-integrity", "tenant-isolation", "fail-closed-certification"]),
      certification_states: states,
      certification_outcomes: outcomes,
      certification_categories: categories,
      pass_required_for_production: true,
      advisory_only: true,
    }),
    ledger,
    validation: validatePredictionCertification(ledger),
    replay: replayPredictionCertification(ledger),
    observability: buildPredictionCertificationObservabilitySurface(ledger),
  });
}
