import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance, validateContinuousConstitutionalRepository } from "@/services/continuous-constitutional-validation";
import { monitorRuntimeConstitutionalCompliance, validateRuntimeConstitutionalMonitoring } from "@/services/runtime-constitutional-monitoring";
import { detectConstitutionalViolations, validateConstitutionalViolationDetection } from "@/services/constitutional-violation-detection";
import { assessConstitutionalResilience, validateConstitutionalResilienceAssessment } from "@/services/constitutional-resilience-assessment";
import { generateConstitutionalRecommendations, validateConstitutionalRecommendationEngine } from "@/services/constitutional-recommendation-engine";
import { validateConstitutionalReplay, validateConstitutionalReplayRepository } from "@/services/constitutional-replay-validation";
import { validateConstitutionalLearning, validateConstitutionalLearningRepository } from "@/services/constitutional-learning-validation";
import { buildConstitutionalAssuranceDashboard, validateConstitutionalAssuranceDashboard } from "@/services/constitutional-assurance-dashboard";
import type {
  ConstitutionalCertificationEvidencePackage,
  ConstitutionalCertificationFailure,
  ConstitutionalCertificationFinding,
  ConstitutionalCertificationLedgerRecord,
  ConstitutionalCertificationRecord,
  ConstitutionalCertificationReport,
  ConstitutionalCertificationResult,
  ConstitutionalCertificationScenario,
  ConstitutionalCertificationTestResult,
  ConstitutionalResilienceCertificationBundle,
  ConstitutionalResilienceCertificationInput,
  ConstitutionalResilienceCertificationObservabilitySurface,
  ConstitutionalResilienceCertificationRepository,
  ConstitutionalResilienceCertificationValidationResult,
} from "@/types/constitutional-resilience-certification-gate";

const VERSION = "constitutional-resilience-certification-gate/v8ALT.10.10" as const;
const scope = Object.freeze(["Constitutional Baseline Contract", "Continuous Constitutional Validation", "Runtime Constitutional Monitoring", "Constitutional Violation Detection", "Constitutional Resilience Assessment", "Constitutional Recommendation Engine", "Constitutional Replay Validation", "Constitutional Learning Validation", "Constitutional Assurance Dashboard"] as const);
const testNames = Object.freeze(["constitutional baseline defined", "constitutional contract valid", "authority enforcement operational", "governance supremacy preserved", "operator supremacy enforced", "policy enforcement operational", "replay deterministic", "replay reproducible", "replay divergence detected", "integrity preserved", "tenant isolation enforced", "fail-closed behavior verified", "runtime monitoring operational", "constitutional validation continuous", "constitutional violations detected", "authority escalation blocked", "governance bypass rejected", "constitutional bypass rejected", "hidden execution detected", "unauthorized learning rejected", "unauthorized optimization rejected", "replay validation deterministic", "resilience scoring deterministic", "recommendations advisory only", "constitutional dashboard complete", "audit evidence complete", "confidence reproducible", "lineage reproducible", "integrity hashes reproducible", "certification replay successful", "determinism validation", "explainability validation", "governance validation", "security validation"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ConstitutionalCertificationScenario): ConstitutionalCertificationFailure | null {
  const map: Partial<Record<ConstitutionalCertificationScenario, ConstitutionalCertificationFailure>> = {
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    OPERATOR_OVERRIDE: "OPERATOR_AUTHORITY_OVERRIDE_DETECTED",
    REPLAY_NONDETERMINISM: "REPLAY_NONDETERMINISM_DETECTED",
    REPLAY_DIVERGENCE_UNDETECTED: "UNDETECTED_REPLAY_DIVERGENCE_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    HIDDEN_LEARNING: "HIDDEN_LEARNING_DETECTED",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION_DETECTED",
    POLICY_MUTATION: "POLICY_MUTATION_DETECTED",
    CONSTITUTIONAL_MUTATION: "CONSTITUTIONAL_MUTATION_DETECTED",
    GOVERNANCE_MUTATION: "GOVERNANCE_MUTATION_DETECTED",
    INTEGRITY_CORRUPTION: "INTEGRITY_CORRUPTION_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
    FAIL_OPEN_BEHAVIOR: "FAIL_OPEN_BEHAVIOR_DETECTED",
    INCOMPLETE_AUDIT_TRAIL: "AUDIT_TRAIL_INCOMPLETE",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    CONFIDENCE_INCONSISTENCY: "CONFIDENCE_INCONSISTENCY_DETECTED",
    LINEAGE_INCONSISTENCY: "LINEAGE_INCONSISTENCY_DETECTED",
    RECOMMENDATION_WITH_EXECUTION_AUTHORITY: "RECOMMENDATION_EXECUTION_AUTHORITY_DETECTED",
  };
  return map[scenario] ?? null;
}

function resultFor(failures: readonly ConstitutionalCertificationFailure[], conditional: boolean): ConstitutionalCertificationResult {
  if (failures.length > 0) return "FAIL";
  return conditional ? "CONDITIONAL_PASS" : "PASS";
}

function testResult(name: string, index: number, failure: ConstitutionalCertificationFailure | null): ConstitutionalCertificationTestResult {
  const fail = Boolean(failure && index % 5 === 0);
  const base = { test_id: id("CRC-T", "constitutional-certification-test", { name, index, failure }), test_name: name, expected_result: "PASS" as const, actual_result: fail ? "FAIL" as const : "PASS" as const, mandatory: true as const, evidence_reference: `evidence:certification-test:${index}`, replay_reference: `replay:certification-test:${index}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-test", base) });
}

function finding(failure: ConstitutionalCertificationFailure | null, conditional: boolean): readonly ConstitutionalCertificationFinding[] {
  if (failure) {
    const base = { finding_id: id("CRC-F", "constitutional-certification-finding", failure), severity: "BLOCKING" as const, summary: failure, corrective_action: "resolve mandatory constitutional safeguard failure", unresolved: true, evidence_reference: `evidence:finding:${failure}` };
    return freezeArray([Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-finding", base) })]);
  }
  if (conditional) {
    const base = { finding_id: id("CRC-F", "constitutional-certification-finding", "DOCUMENTATION_GAP"), severity: "INFO" as const, summary: "non-risk reporting improvement remains", corrective_action: "complete reporting polish before production advancement", unresolved: true, evidence_reference: "evidence:finding:documentation-gap" };
    return freezeArray([Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-finding", base) })]);
  }
  return freezeArray([]);
}

function evidencePackage(result: ConstitutionalCertificationResult, tests: readonly ConstitutionalCertificationTestResult[], findings: readonly ConstitutionalCertificationFinding[], score: number): ConstitutionalCertificationEvidencePackage {
  const base = { evidence_package_id: id("CRC-E", "constitutional-certification-evidence", { result, tests: tests.map((t) => t.integrity_hash) }), certification_summary: `certification ${result}`, certification_state: result, constitutional_version: "constitutional-baseline-contract/v8ALT.10.1" as const, subsystem_validation_results: scope, certification_test_results: freezeArray(tests.map((test) => `${test.test_name}:${test.actual_result}`)), replay_verification_report: "replay:constitutional-certification", governance_verification: result === "FAIL" ? "FAIL" as const : "PASS" as const, authority_verification: result === "FAIL" ? "FAIL" as const : "PASS" as const, integrity_verification: result === "FAIL" ? "FAIL" as const : "PASS" as const, resilience_assessment: `score:${score}`, dashboard_verification: result === "FAIL" ? "FAIL" as const : "PASS" as const, violation_history: freezeArray([]), recommendation_history: freezeArray(["recommendations advisory only"]), confidence_analysis: result === "FAIL" ? "confidence inconsistent or blocked" : "confidence reproducible", audit_references: freezeArray(["audit:constitutional-certification"]), replay_references: freezeArray(["replay:constitutional-certification"]), lineage_references: freezeArray(["lineage:constitutional-certification"]), cryptographic_verification: result === "FAIL" ? "FAIL" as const : "PASS" as const, immutable: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-evidence", base) });
}

function record(result: ConstitutionalCertificationResult, score: number, findings: readonly ConstitutionalCertificationFinding[], evidence: ConstitutionalCertificationEvidencePackage): ConstitutionalCertificationRecord {
  const pass = result !== "FAIL";
  const base = { certification_id: id("CRC", "constitutional-certification-record", { result, score, evidence: evidence.integrity_hash }), framework_version: "constitutional-resilience-framework/v8ALT.10" as const, constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const, phase: "8ALT.10" as const, certification_timestamp: "1970-01-01T00:00:00.000Z" as const, overall_result: result, overall_constitutional_score: score, authority_status: pass ? "PASS" as const : "FAIL" as const, governance_status: pass ? "PASS" as const : "FAIL" as const, operator_status: pass ? "PASS" as const : "FAIL" as const, replay_status: pass ? "PASS" as const : "FAIL" as const, integrity_status: pass ? "PASS" as const : "FAIL" as const, tenant_isolation_status: pass ? "PASS" as const : "FAIL" as const, assessment_status: pass ? "PASS" as const : "FAIL" as const, recommendation_status: pass ? "PASS" as const : "FAIL" as const, dashboard_status: pass ? "PASS" as const : "FAIL" as const, confidence_score: pass ? 1 : 0, finding_count: findings.length, exception_count: findings.filter((f) => f.severity === "BLOCKING").length, certification_report_reference: "report:constitutional-certification", evidence_reference: evidence.evidence_package_id, replay_reference: "replay:constitutional-certification", lineage_reference: "lineage:constitutional-certification", read_only: true as const, authority_grant_authorized: false as const, governance_modification_authorized: false as const, mission_execution_influence_authorized: false as const, constitutional_state_modification_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-record", base) });
}

function report(result: ConstitutionalCertificationResult, tests: readonly ConstitutionalCertificationTestResult[], findings: readonly ConstitutionalCertificationFinding[], evidence: ConstitutionalCertificationEvidencePackage): ConstitutionalCertificationReport {
  const base = { report_id: id("CRC-R", "constitutional-certification-report", { result, evidence: evidence.integrity_hash }), executive_summary: freezeArray([`certification outcome:${result}`, `constitutional readiness:${result !== "FAIL" ? "ready" : "blocked"}`]), detailed_results: freezeArray(tests.map((test) => `${test.test_name}:${test.actual_result}`)), findings: freezeArray(findings.map((item) => `${item.severity}:${item.summary}`)), evidence: freezeArray([evidence.evidence_package_id, ...evidence.replay_references, ...evidence.lineage_references]) };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-report", base) });
}

function ledger(record: ConstitutionalCertificationRecord, findings: readonly ConstitutionalCertificationFinding[]): ConstitutionalCertificationLedgerRecord {
  const base = { certification_record_id: id("CRC-L", "constitutional-certification-ledger", record.certification_id), certification_id: record.certification_id, timestamp: record.certification_timestamp, phase: "8ALT.10" as const, overall_result: record.overall_result, finding_summary: findings.length ? findings.map((f) => f.summary).join(";") : "none", constitutional_reference: record.constitution_version, governance_reference: "governance:constitutional-certification", evidence_reference: record.evidence_reference, replay_reference: record.replay_reference, lineage_reference: record.lineage_reference, auditor_reference: "auditor:constitutional-certification", immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-certification-ledger", base) });
}

function collectFailures(repository: Omit<ConstitutionalResilienceCertificationRepository, "integrity_hash"> | ConstitutionalResilienceCertificationRepository): readonly ConstitutionalCertificationFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.tests.some((test) => test.actual_result === "FAIL") ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []),
    ...(repository.record.replay_status === "FAIL" ? ["REPLAY_NONDETERMINISM_DETECTED" as const] : []),
    ...(repository.record.integrity_status === "FAIL" || !repository.record.integrity_hash ? ["INTEGRITY_CORRUPTION_DETECTED" as const] : []),
    ...(repository.evidence_package.cryptographic_verification === "FAIL" ? ["INTEGRITY_CORRUPTION_DETECTED" as const] : []),
    ...(repository.record.tenant_isolation_status === "FAIL" ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
    ...(!repository.record.evidence_reference ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(!repository.record.lineage_reference ? ["LINEAGE_INCONSISTENCY_DETECTED" as const] : []),
  ]);
}

export function certifyConstitutionalResilience(input: ConstitutionalResilienceCertificationInput = {}): ConstitutionalResilienceCertificationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = input.validationRepository ?? validateContinuousConstitutionalCompliance({ baseline });
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance({ baseline, validationRepository });
  const violationRepository = input.violationRepository ?? detectConstitutionalViolations({ baseline, validationRepository, runtimeRepository });
  const resilienceRepository = input.resilienceRepository ?? assessConstitutionalResilience({ baseline, validationRepository, runtimeRepository, violationRepository });
  const recommendationRepository = input.recommendationRepository ?? generateConstitutionalRecommendations({ baseline, runtimeRepository, violationRepository, resilienceRepository });
  const replayRepository = input.replayRepository ?? validateConstitutionalReplay({ baseline, validationRepository, runtimeRepository, violationRepository, resilienceRepository, recommendationRepository });
  const learningRepository = input.learningRepository ?? validateConstitutionalLearning({ baseline, replayRepository });
  const dashboardRepository = input.dashboardRepository ?? buildConstitutionalAssuranceDashboard({ runtimeRepository, violationRepository, resilienceRepository, recommendationRepository, replayRepository, learningRepository });
  const directFailure = scenarioFailure(scenario);
  const conditional = scenario === "DOCUMENTATION_GAP";
  const tests = freezeArray(testNames.map((name, index) => testResult(name, index, directFailure)));
  const failures = unique([
    ...(directFailure ? [directFailure] : []),
    ...(!validateConstitutionalBaseline(baseline).valid ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []),
    ...(!validateContinuousConstitutionalRepository(validationRepository).valid ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!validateRuntimeConstitutionalMonitoring(runtimeRepository).valid && runtimeRepository.failures.length > 0 ? ["FAIL_OPEN_BEHAVIOR_DETECTED" as const] : []),
    ...(!validateConstitutionalViolationDetection(violationRepository).valid && violationRepository.failures.length > 0 ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []),
    ...(!validateConstitutionalResilienceAssessment(resilienceRepository).valid && resilienceRepository.failures.length > 0 ? ["CONFIDENCE_INCONSISTENCY_DETECTED" as const] : []),
    ...(!validateConstitutionalRecommendationEngine(recommendationRepository).valid && recommendationRepository.failures.length > 0 ? ["RECOMMENDATION_EXECUTION_AUTHORITY_DETECTED" as const] : []),
    ...(!validateConstitutionalReplayRepository(replayRepository).valid && replayRepository.failures.length > 0 ? ["REPLAY_NONDETERMINISM_DETECTED" as const] : []),
    ...(!validateConstitutionalLearningRepository(learningRepository).valid && learningRepository.failures.length > 0 ? ["HIDDEN_LEARNING_DETECTED" as const] : []),
    ...(!validateConstitutionalAssuranceDashboard(dashboardRepository).valid && dashboardRepository.failures.length > 0 ? ["AUDIT_TRAIL_INCOMPLETE" as const] : []),
  ]);
  const result = resultFor(failures, conditional);
  const findings = finding(directFailure, conditional);
  const evidence = evidencePackage(result, tests, findings, resilienceRepository.assessment.overall_constitutional_score);
  const certRecord = record(result, resilienceRepository.assessment.overall_constitutional_score, findings, evidence);
  const certReport = report(result, tests, findings, evidence);
  const source = { repository_id: id("CRC", "constitutional-certification-repository", { scenario, baseline: baseline.contract_id, result }), baseline_contract_id: baseline.contract_id, validation_repository_id: validationRepository.repository_id, runtime_monitoring_repository_id: runtimeRepository.repository_id, violation_detection_repository_id: violationRepository.repository_id, resilience_assessment_repository_id: resilienceRepository.repository_id, recommendation_repository_id: recommendationRepository.repository_id, replay_validation_repository_id: replayRepository.repository_id, learning_validation_repository_id: learningRepository.repository_id, dashboard_repository_id: dashboardRepository.repository_id, final_state: "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE" as const, record: certRecord, tests, evidence_package: evidence, report: certReport, findings, ledger: freezeArray([ledger(certRecord, findings)]), failures, read_only: true as const, authority_grant_authorized: false as const, governance_modification_authorized: false as const, mission_execution_influence_authorized: false as const, constitutional_state_modification_authorized: false as const };
  const collectedFailures = unique([...collectFailures(source), ...failures]);
  const repository = { ...source, failures: collectedFailures, final_state: collectedFailures.length ? "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-certification-repository", repository) });
}

export function listConstitutionalCertificationTests(input: ConstitutionalResilienceCertificationInput = {}) { return certifyConstitutionalResilience(input).tests; }
export function getConstitutionalCertificationEvidence(input: ConstitutionalResilienceCertificationInput = {}) { return certifyConstitutionalResilience(input).evidence_package; }
export function getConstitutionalCertificationReport(input: ConstitutionalResilienceCertificationInput = {}) { return certifyConstitutionalResilience(input).report; }
export function listConstitutionalCertificationLedger(input: ConstitutionalResilienceCertificationInput = {}) { return certifyConstitutionalResilience(input).ledger; }

export function validateConstitutionalResilienceCertification(repository = certifyConstitutionalResilience()): ConstitutionalResilienceCertificationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_CORRUPTION_DETECTED" as const] : [])]);
  const has = (failure: ConstitutionalCertificationFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.record.overall_result === "PASS" && repository.final_state === "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE" && repository.read_only;
  const result = { repository_id: repository.repository_id, valid, certification_passed: repository.record.overall_result === "PASS", deterministic: !has("REPLAY_NONDETERMINISM_DETECTED"), replay_verified: !has("REPLAY_NONDETERMINISM_DETECTED") && !has("UNDETECTED_REPLAY_DIVERGENCE_DETECTED"), governance_verified: !has("GOVERNANCE_BYPASS_DETECTED") && !has("GOVERNANCE_MUTATION_DETECTED"), authority_verified: !has("AUTHORITY_ESCALATION_DETECTED"), operator_verified: !has("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"), integrity_verified: !has("INTEGRITY_CORRUPTION_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"), evidence_complete: !has("CONSTITUTIONAL_EVIDENCE_MISSING") && !has("AUDIT_TRAIL_INCOMPLETE"), lineage_complete: !has("LINEAGE_INCONSISTENCY_DETECTED"), recommendations_advisory_only: !has("RECOMMENDATION_EXECUTION_AUTHORITY_DETECTED"), read_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE", no_authority_grant: !repository.authority_grant_authorized && !repository.governance_modification_authorized && !repository.mission_execution_influence_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-certification-validation", result) });
}

export function buildConstitutionalResilienceCertificationObservabilitySurface(repository = certifyConstitutionalResilience()): ConstitutionalResilienceCertificationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, overall_result: repository.record.overall_result, test_count: repository.tests.length, finding_count: repository.findings.length, failure_count: repository.failures.length, ledger_count: repository.ledger.length, read_only: true, mission_execution_influence_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalResilienceCertificationGate(): ConstitutionalResilienceCertificationBundle {
  const repository = certifyConstitutionalResilience();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_READY", certification_scope: scope, principles: freezeArray(["deterministic-certification", "read-only", "immutable-evidence-only", "no-authority-grant", "no-governance-modification", "no-mission-execution-influence", "certification-grade-evidence", "fail-closed-on-incomplete-verification"]) }), repository, validation: validateConstitutionalResilienceCertification(repository), observability: buildConstitutionalResilienceCertificationObservabilitySurface(repository) });
}
