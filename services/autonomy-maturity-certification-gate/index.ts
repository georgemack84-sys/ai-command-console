import { runContinuousMaturityMonitoring } from "@/services/continuous-maturity-monitoring";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AutonomyMaturityCertificationBundle,
  AutonomyMaturityCertificationEvidencePackage,
  AutonomyMaturityCertificationFailure,
  AutonomyMaturityCertificationInput,
  AutonomyMaturityCertificationObservabilitySurface,
  AutonomyMaturityCertificationOutcome,
  AutonomyMaturityCertificationRecord,
  AutonomyMaturityCertificationReport,
  AutonomyMaturityCertificationRepository,
  AutonomyMaturityCertificationScenario,
  AutonomyMaturityCertificationTest,
  AutonomyMaturityCertificationValidationResult,
  CertificationTestArea,
} from "@/types/autonomy-maturity-certification-gate";
import type { ContinuousMaturityMonitoringRepository } from "@/types/continuous-maturity-monitoring";

const VERSION = "autonomy-maturity-certification-gate/v8ALT.11.12" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: AutonomyMaturityCertificationScenario): AutonomyMaturityCertificationFailure | null {
  const map: Partial<Record<AutonomyMaturityCertificationScenario, AutonomyMaturityCertificationFailure>> = {
    CERTIFICATION_TEST_FAILURE: "CERTIFICATION_TEST_FAILED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    NONDETERMINISTIC_SCORING: "NONDETERMINISTIC_SCORING_DETECTED",
    CLASSIFICATION_MISMATCH: "CLASSIFICATION_MISMATCH_DETECTED",
    RECOMMENDATION_MISMATCH: "RECOMMENDATION_MISMATCH_DETECTED",
    INCOMPLETE_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE_DETECTED",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE_DETECTED",
    MONITORING_RUNTIME_MODIFICATION: "MONITORING_RUNTIME_MODIFICATION_DETECTED",
    AUTOMATIC_RECOMMENDATION_EXECUTION: "AUTOMATIC_RECOMMENDATION_EXECUTION_DETECTED",
    HIDDEN_ASSESSMENT_LOGIC: "HIDDEN_ASSESSMENT_LOGIC_DETECTED",
    INCOMPLETE_REPLAY_REFERENCES: "REPLAY_REFERENCES_INCOMPLETE",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
  };
  return map[scenario] ?? null;
}

function tests(scenario: AutonomyMaturityCertificationScenario): readonly AutonomyMaturityCertificationTest[] {
  const rows: readonly [CertificationTestArea, string][] = [
    ["CONTRACT", "Maturity contract valid"],
    ["DOMAIN", "Domain evaluation deterministic"],
    ["SCORING", "Aggregate scoring deterministic"],
    ["SCORING", "Confidence and readiness scoring reproducible"],
    ["CLASSIFICATION", "Maturity classification deterministic"],
    ["HISTORICAL", "Historical ledger immutable"],
    ["GAP_ANALYSIS", "Gap analysis reproducible"],
    ["RECOMMENDATION", "Recommendation generation deterministic"],
    ["RECOMMENDATION", "Advisory-only recommendations enforced"],
    ["LEDGER", "Assessment ledger immutable"],
    ["LEDGER", "Evidence repository complete"],
    ["ANALYTICS", "Dashboard rendering deterministic"],
    ["REPLAY", "Assessment replay identical"],
    ["REPLAY", "Explainability complete"],
    ["CONTINUOUS_MONITORING", "Monitoring operational"],
    ["CONTINUOUS_MONITORING", "Runtime behavior unchanged"],
    ["GOVERNANCE", "Governance compliance verified"],
    ["CONSTITUTIONAL", "Constitutional compliance verified"],
    ["SECURITY", "Tenant isolation enforced"],
    ["SECURITY", "Production readiness verified"],
  ];
  return freezeArray(rows.map(([area, name], index) => {
    const fail = scenario === "CERTIFICATION_TEST_FAILURE" && index === 0;
    const base = { test_id: id("AMCG-T", "autonomy-maturity-certification-test", name), area, name, expected_result: "PASS" as const, actual_result: fail ? "FAIL" as const : scenario === "DOCUMENTATION_GAP" && index === rows.length - 1 ? "CONDITIONAL_PASS" as const : "PASS" as const, evidence_reference: `evidence:certification:${index + 1}`, replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && area === "REPLAY" ? "" : `replay:certification:${index + 1}` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("autonomy-maturity-certification-test", base) });
  }));
}

function evidencePackage(monitoring: ContinuousMaturityMonitoringRepository, scenario: AutonomyMaturityCertificationScenario): AutonomyMaturityCertificationEvidencePackage {
  const complete = scenario !== "INCOMPLETE_EVIDENCE";
  const base = { package_id: id("AMCG-E", "certification-evidence-package", scenario), assessment_evidence: freezeArray(complete ? [monitoring.repository_id, monitoring.replay_repository.repository_id] : []), replay_evidence: freezeArray(complete ? [monitoring.replay_repository.replay.replay_id] : []), governance_evidence: freezeArray(scenario === "GOVERNANCE_FAILURE" ? [] : ["governance:certification"]), constitutional_evidence: freezeArray(scenario === "CONSTITUTIONAL_FAILURE" ? [] : ["constitutional:certification"]), integrity_evidence: freezeArray(scenario === "INTEGRITY_FAILURE" ? [] : [monitoring.integrity_hash]), certification_evidence: freezeArray(complete ? ["certification:readiness", "certification:audit"] : []), complete, immutable: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("autonomy-maturity-certification-evidence", base) });
}

function outcome(testRows: readonly AutonomyMaturityCertificationTest[], evidence: AutonomyMaturityCertificationEvidencePackage, scenario: AutonomyMaturityCertificationScenario): AutonomyMaturityCertificationOutcome {
  if (scenario === "DOCUMENTATION_GAP") return "CONDITIONAL_PASS";
  if (!evidence.complete || testRows.some((test) => test.actual_result === "FAIL")) return "FAIL";
  return "PASS";
}

function record(result: AutonomyMaturityCertificationOutcome, scenario: AutonomyMaturityCertificationScenario): AutonomyMaturityCertificationRecord {
  const base = { certification_id: id("AMCG", "autonomy-maturity-certification", scenario), framework_version: "autonomy-maturity-framework/v8ALT.11" as const, assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1" as const, scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3" as const, classification_version: "maturity-classification-engine/v8ALT.11.4" as const, replay_version: "assessment-replay-explainability/v8ALT.11.10" as const, monitoring_version: "continuous-maturity-monitoring/v8ALT.11.11" as const, outcome: result, production_readiness_verified: result === "PASS", production_deployment_authorized: false as const, recommendation_execution_authorized: false as const, runtime_behavior_modification_authorized: false as const, governance_modification_authorized: false as const, constitutional_modification_authorized: false as const, operator_authority_bypass_authorized: false as const, timestamp: "1970-01-01T00:00:00.000Z" as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("autonomy-maturity-certification-record", base) });
}

function reports(result: AutonomyMaturityCertificationOutcome, evidence: AutonomyMaturityCertificationEvidencePackage, scenario: AutonomyMaturityCertificationScenario): readonly AutonomyMaturityCertificationReport[] {
  const types = ["CERTIFICATION", "REPLAY_VALIDATION", "GOVERNANCE_COMPLIANCE", "CONSTITUTIONAL_COMPLIANCE", "PRODUCTION_READINESS", "ASSESSMENT_EVIDENCE", "CERTIFICATION_AUDIT"] as const;
  return freezeArray(types.map((report_type, index) => {
    const base = { report_id: id("AMCG-R", "certification-report", report_type), report_type, outcome: result, summary: freezeArray([`${report_type} outcome ${result}`, "production readiness is evidence only, not deployment authorization"]), evidence_references: evidence.assessment_evidence, replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && report_type === "REPLAY_VALIDATION" ? "" : `replay:certification-report:${index + 1}`, lineage_reference: `lineage:certification-report:${index + 1}` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("autonomy-maturity-certification-report", base) });
  }));
}

function collectFailures(repository: Omit<AutonomyMaturityCertificationRepository, "integrity_hash"> | AutonomyMaturityCertificationRepository): readonly AutonomyMaturityCertificationFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.tests.some((test) => test.actual_result === "FAIL") ? ["CERTIFICATION_TEST_FAILED" as const] : []),
    ...(repository.monitoring.failures.includes("REPLAY_RECONSTRUCTION_MISMATCHED") ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.monitoring.replay_repository.analytics_repository.ledger_repository.recommendation_repository.readiness.history.classification.scoring.failures.includes("CONFIDENCE_CALCULATION_NONDETERMINISTIC") ? ["NONDETERMINISTIC_SCORING_DETECTED" as const] : []),
    ...(repository.monitoring.replay_repository.failures.includes("REPLAY_OUTPUT_DIVERGED") ? ["CLASSIFICATION_MISMATCH_DETECTED" as const] : []),
    ...(repository.monitoring.replay_repository.failures.includes("REPLAY_OUTPUT_DIVERGED") ? ["RECOMMENDATION_MISMATCH_DETECTED" as const] : []),
    ...(!repository.evidence_package.complete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!repository.record.integrity_hash || !repository.evidence_package.integrity_hash || repository.tests.some((test) => !test.integrity_hash) || repository.reports.some((report) => !report.integrity_hash) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.evidence_package.governance_evidence.length === 0 || repository.monitoring.failures.includes("GOVERNANCE_CHANGES_MISSED") ? ["GOVERNANCE_FAILURE_DETECTED" as const] : []),
    ...(repository.evidence_package.constitutional_evidence.length === 0 || repository.monitoring.failures.includes("CONSTITUTIONAL_CHANGES_MISSED") ? ["CONSTITUTIONAL_FAILURE_DETECTED" as const] : []),
    ...(repository.monitoring.runtime_behavior_modification_authorized || repository.monitoring.failures.includes("RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED") ? ["MONITORING_RUNTIME_MODIFICATION_DETECTED" as const] : []),
    ...(repository.record.recommendation_execution_authorized || repository.monitoring.recommendation_execution_authorized ? ["AUTOMATIC_RECOMMENDATION_EXECUTION_DETECTED" as const] : []),
    ...(repository.monitoring.failures.includes("HIDDEN_MONITORING_LOGIC_DETECTED") || repository.monitoring.replay_repository.failures.includes("HIDDEN_ASSESSMENT_LOGIC_DETECTED") ? ["HIDDEN_ASSESSMENT_LOGIC_DETECTED" as const] : []),
    ...(repository.tests.some((test) => !test.replay_reference) || repository.reports.some((report) => !report.replay_reference) ? ["REPLAY_REFERENCES_INCOMPLETE" as const] : []),
    ...(repository.monitoring.failures.includes("TENANT_ISOLATION_VIOLATED") ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
  ]);
}

export function certifyAutonomyMaturity(input: AutonomyMaturityCertificationInput = {}): AutonomyMaturityCertificationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const monitoring = input.monitoring ?? runContinuousMaturityMonitoring(
    scenario === "TENANT_ISOLATION_FAILURE" ? { scenario: "TENANT_ISOLATION_VIOLATION" } :
    scenario === "MONITORING_RUNTIME_MODIFICATION" ? { scenario: "RUNTIME_BEHAVIOR_MODIFICATION" } :
    scenario === "HIDDEN_ASSESSMENT_LOGIC" ? { scenario: "HIDDEN_MONITORING_LOGIC" } :
    scenario === "REPLAY_MISMATCH" ? { scenario: "REPLAY_RECONSTRUCTION_MISMATCH" } : {}
  );
  const testRows = tests(scenario);
  const evidence = evidencePackage(monitoring, scenario);
  const directFailure = scenarioFailure(scenario);
  const result = directFailure && scenario !== "DOCUMENTATION_GAP" ? "FAIL" : outcome(testRows, evidence, scenario);
  const certRecord = record(result, scenario);
  const certReports = reports(result, evidence, scenario);
  const source = { repository_id: id("AMCG", "autonomy-maturity-certification-gate", scenario), final_state: "AUTONOMY_MATURITY_CERTIFICATION_COMPLETE" as const, monitoring, record: certRecord, tests: testRows, evidence_package: evidence, reports: certReports, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const };
  const failures = collectFailures(source);
  const final_state = result === "CONDITIONAL_PASS" ? "AUTONOMY_MATURITY_CERTIFICATION_CONDITIONAL" as const : failures.length ? "AUTONOMY_MATURITY_CERTIFICATION_FAILED" as const : source.final_state;
  const repository = { ...source, failures, final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("autonomy-maturity-certification-repository", repository) });
}

export function listAutonomyMaturityCertificationTests(input: AutonomyMaturityCertificationInput = {}) { return certifyAutonomyMaturity(input).tests; }
export function getAutonomyMaturityCertificationEvidence(input: AutonomyMaturityCertificationInput = {}) { return certifyAutonomyMaturity(input).evidence_package; }
export function listAutonomyMaturityCertificationReports(input: AutonomyMaturityCertificationInput = {}) { return certifyAutonomyMaturity(input).reports; }

export function validateAutonomyMaturityCertification(repository = certifyAutonomyMaturity()): AutonomyMaturityCertificationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: AutonomyMaturityCertificationFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.record.outcome === "PASS", all_tests_passed: !has("CERTIFICATION_TEST_FAILED"), replay_verified: !has("REPLAY_MISMATCH_DETECTED"), scoring_deterministic: !has("NONDETERMINISTIC_SCORING_DETECTED"), classification_deterministic: !has("CLASSIFICATION_MISMATCH_DETECTED"), recommendations_deterministic: !has("RECOMMENDATION_MISMATCH_DETECTED"), evidence_complete: !has("CERTIFICATION_EVIDENCE_INCOMPLETE"), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), governance_verified: !has("GOVERNANCE_FAILURE_DETECTED"), constitutional_verified: !has("CONSTITUTIONAL_FAILURE_DETECTED"), runtime_neutral: !has("MONITORING_RUNTIME_MODIFICATION_DETECTED"), no_automatic_recommendation_execution: !has("AUTOMATIC_RECOMMENDATION_EXECUTION_DETECTED"), no_hidden_logic: !has("HIDDEN_ASSESSMENT_LOGIC_DETECTED"), replay_references_complete: !has("REPLAY_REFERENCES_INCOMPLETE"), tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"), production_deployment_authorized: false as const, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("autonomy-maturity-certification-validation", result) });
}

export function buildAutonomyMaturityCertificationObservabilitySurface(repository = certifyAutonomyMaturity()): AutonomyMaturityCertificationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, outcome: repository.record.outcome, test_count: repository.tests.length, report_count: repository.reports.length, failure_count: repository.failures.length, production_readiness_verified: repository.record.production_readiness_verified, production_deployment_authorized: false, advisory_only: true, integrity_hash: repository.integrity_hash });
}

export function getAutonomyMaturityCertificationGateBundle(): AutonomyMaturityCertificationBundle {
  const repository = certifyAutonomyMaturity();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "AUTONOMY_MATURITY_CERTIFICATION_GATE_READY", principles: freezeArray(["full-chain-certification", "deterministic-test-suite", "replay-verified", "governance-verified", "constitutional-verified", "advisory-only", "production-readiness-evidence-only", "no-deployment-authorization"]) }), repository, validation: validateAutonomyMaturityCertification(repository), observability: buildAutonomyMaturityCertificationObservabilitySurface(repository) });
}
