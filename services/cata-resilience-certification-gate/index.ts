import { certifyAutonomyMaturity } from "@/services/autonomy-maturity-certification-gate";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  CataResilienceCertificationArea,
  CataResilienceCertificationBundle,
  CataResilienceCertificationFailure,
  CataResilienceCertificationInput,
  CataResilienceCertificationObservabilitySurface,
  CataResilienceCertificationOutcome,
  CataResilienceCertificationRecord,
  CataResilienceCertificationReport,
  CataResilienceCertificationRepository,
  CataResilienceCertificationScenario,
  CataResilienceCertificationTest,
  CataResilienceCertificationValidationResult,
  CataResilienceEvidencePackage,
} from "@/types/cata-resilience-certification-gate";

const VERSION = "cata-resilience-certification-gate/v8ALT.12" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: CataResilienceCertificationScenario): CataResilienceCertificationFailure | null {
  const map: Partial<Record<CataResilienceCertificationScenario, CataResilienceCertificationFailure>> = {
    RUNTIME_ASSURANCE_MISSING: "RUNTIME_ASSURANCE_MISSING",
    RUNTIME_DRIFT: "RUNTIME_DRIFT_DETECTED",
    AUTONOMOUS_RECOVERY: "AUTONOMOUS_RECOVERY_DETECTED",
    RECOVERY_REPLAY_MISMATCH: "RECOVERY_REPLAY_MISMATCH_DETECTED",
    PREDICTION_INCONSISTENCY: "PREDICTION_INCONSISTENCY_DETECTED",
    MISSION_HEALTH_GAP: "MISSION_HEALTH_EVIDENCE_INCOMPLETE",
    EXPLAINABILITY_INCOMPLETE: "EXPLAINABILITY_INCOMPLETE",
    STRESS_UNRESOLVED_CRITICAL_FAILURE: "UNRESOLVED_CRITICAL_STRESS_FAILURE",
    COORDINATION_NONDETERMINISTIC: "COORDINATION_NONDETERMINISTIC_DETECTED",
    HIDDEN_COMMUNICATION: "HIDDEN_COMMUNICATION_DETECTED",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION_DETECTED",
    OUTCOME_MODIFICATION: "OUTCOME_MODIFICATION_DETECTED",
    UNAUTHORIZED_LEARNING: "UNAUTHORIZED_LEARNING_DETECTED",
    POLICY_MODIFICATION: "POLICY_MODIFICATION_DETECTED",
    CONSTITUTIONAL_MODIFICATION: "CONSTITUTIONAL_MODIFICATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    CERTIFICATION_SUITE_FAILURE: "CERTIFICATION_SUITE_FAILED",
    INCOMPLETE_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
    INCOMPLETE_REPLAY_REFERENCES: "REPLAY_REFERENCES_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function tests(scenario: CataResilienceCertificationScenario): readonly CataResilienceCertificationTest[] {
  const rows: readonly [CataResilienceCertificationArea, string, CataResilienceCertificationScenario | null][] = [
    ["RUNTIME_ASSURANCE", "Adaptive Runtime Assurance operational", "RUNTIME_ASSURANCE_MISSING"],
    ["RUNTIME_ASSURANCE", "Runtime assurance deterministic", "RUNTIME_DRIFT"],
    ["RECOVERY_INTELLIGENCE", "Recovery recommendations reproducible", "AUTONOMOUS_RECOVERY"],
    ["RECOVERY_INTELLIGENCE", "Recovery replay deterministic", "RECOVERY_REPLAY_MISMATCH"],
    ["PREDICTIVE_INTELLIGENCE", "Predictive intelligence reproducible", "PREDICTION_INCONSISTENCY"],
    ["MISSION_HEALTH", "Mission health operational", "MISSION_HEALTH_GAP"],
    ["EXPLAINABILITY", "Explainability complete", "EXPLAINABILITY_INCOMPLETE"],
    ["EXPLAINABILITY", "Evidence chain reproducible", "INCOMPLETE_EVIDENCE"],
    ["STRESS_SIMULATION", "Stress simulations successful", "STRESS_UNRESOLVED_CRITICAL_FAILURE"],
    ["STRESS_SIMULATION", "Critical failure recovery verified", "STRESS_UNRESOLVED_CRITICAL_FAILURE"],
    ["MULTI_AGENT_COORDINATION", "Multi-agent coordination deterministic", "COORDINATION_NONDETERMINISTIC"],
    ["MULTI_AGENT_COORDINATION", "Coordination replay reproducible", "HIDDEN_COMMUNICATION"],
    ["CONTINUOUS_OPTIMIZATION", "Continuous optimization governance-safe", "UNAUTHORIZED_OPTIMIZATION"],
    ["CONTINUOUS_OPTIMIZATION", "Optimization preserves outcomes", "OUTCOME_MODIFICATION"],
    ["KNOWLEDGE_EVOLUTION", "Knowledge evolution bounded", "UNAUTHORIZED_LEARNING"],
    ["KNOWLEDGE_EVOLUTION", "Knowledge evolution cannot modify Constitution", "CONSTITUTIONAL_MODIFICATION"],
    ["CONSTITUTIONAL_RESILIENCE", "Constitutional resilience verified", "CONSTITUTIONAL_VIOLATION"],
    ["GOVERNANCE_VALIDATION", "Governance enforcement operational", "GOVERNANCE_BYPASS"],
    ["AUTHORITY_VALIDATION", "Authority enforcement operational", "AUTHORITY_ESCALATION"],
    ["REPLAY_VALIDATION", "Replay deterministic", "REPLAY_MISMATCH"],
    ["INTEGRITY_VALIDATION", "Integrity verified", "INTEGRITY_FAILURE"],
    ["VISIBILITY", "Operator visibility complete", null],
    ["TENANT_ISOLATION", "Tenant isolation enforced", "TENANT_ISOLATION_FAILURE"],
    ["CERTIFICATION_REPLAY", "Certification replay reproducible", "CERTIFICATION_SUITE_FAILURE"],
  ];
  return freezeArray(rows.map(([area, name, failScenario], index) => {
    const actual_result = failScenario === scenario ? "FAIL" as const : scenario === "DOCUMENTATION_GAP" && area === "VISIBILITY" ? "CONDITIONAL_PASS" as const : "PASS" as const;
    const base = { test_id: id("CATA-CERT-T", "cata-resilience-certification-test", `${area}:${name}`), area, name, expected_result: "PASS" as const, actual_result, evidence_reference: scenario === "INCOMPLETE_EVIDENCE" && area === "EXPLAINABILITY" ? "" : `evidence:cata-certification:${index + 1}`, replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && (area === "REPLAY_VALIDATION" || area === "CERTIFICATION_REPLAY") ? "" : `replay:cata-certification:${index + 1}` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && area === "INTEGRITY_VALIDATION" ? "" : hashValue("cata-resilience-certification-test", base) });
  }));
}

function evidencePackage(upstream: CataResilienceCertificationRepository["upstream_maturity_certification"], scenario: CataResilienceCertificationScenario): CataResilienceEvidencePackage {
  const complete = scenario !== "INCOMPLETE_EVIDENCE";
  const evidence = (name: string, blocked = false) => freezeArray(complete && !blocked ? [`evidence:${name}:validated`, upstream.repository_id] : []);
  const base = {
    package_id: id("CATA-CERT-E", "cata-resilience-evidence-package", scenario),
    upstream_maturity_certification_id: upstream.record.certification_id,
    runtime_evidence: evidence("runtime", scenario === "RUNTIME_ASSURANCE_MISSING"),
    recovery_evidence: evidence("recovery", scenario === "AUTONOMOUS_RECOVERY"),
    predictive_evidence: evidence("prediction", scenario === "PREDICTION_INCONSISTENCY"),
    mission_health_evidence: evidence("mission-health", scenario === "MISSION_HEALTH_GAP"),
    explainability_evidence: evidence("explainability", scenario === "EXPLAINABILITY_INCOMPLETE"),
    stress_evidence: evidence("stress", scenario === "STRESS_UNRESOLVED_CRITICAL_FAILURE"),
    coordination_evidence: evidence("coordination", scenario === "COORDINATION_NONDETERMINISTIC" || scenario === "HIDDEN_COMMUNICATION"),
    optimization_evidence: evidence("optimization", scenario === "UNAUTHORIZED_OPTIMIZATION" || scenario === "OUTCOME_MODIFICATION"),
    knowledge_evidence: evidence("knowledge", scenario === "UNAUTHORIZED_LEARNING"),
    constitutional_evidence: evidence("constitutional", scenario === "CONSTITUTIONAL_VIOLATION" || scenario === "CONSTITUTIONAL_MODIFICATION"),
    governance_evidence: evidence("governance", scenario === "GOVERNANCE_BYPASS" || scenario === "POLICY_MODIFICATION"),
    authority_evidence: evidence("authority", scenario === "AUTHORITY_ESCALATION"),
    replay_evidence: evidence("replay", scenario === "REPLAY_MISMATCH" || scenario === "RECOVERY_REPLAY_MISMATCH"),
    integrity_evidence: evidence("integrity", scenario === "INTEGRITY_FAILURE"),
    tenant_isolation_evidence: evidence("tenant-isolation", scenario === "TENANT_ISOLATION_FAILURE"),
    complete,
    immutable: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("cata-resilience-evidence-package", base) });
}

function outcome(testRows: readonly CataResilienceCertificationTest[], evidence: CataResilienceEvidencePackage, upstream: CataResilienceCertificationRepository["upstream_maturity_certification"], scenario: CataResilienceCertificationScenario): CataResilienceCertificationOutcome {
  if (scenario === "DOCUMENTATION_GAP") return "CONDITIONAL_PASS";
  if (!evidence.complete || upstream.record.outcome !== "PASS" || testRows.some((test) => test.actual_result === "FAIL")) return "FAIL";
  return "PASS";
}

function record(result: CataResilienceCertificationOutcome, scenario: CataResilienceCertificationScenario): CataResilienceCertificationRecord {
  const base = {
    certification_id: id("CATA-CERT", "cata-resilience-certification", scenario),
    architecture_version: "phase-8-alt-resilience-architecture/v8ALT.12" as const,
    gate_version: VERSION,
    upstream_maturity_certification_version: "autonomy-maturity-certification-gate/v8ALT.11.12" as const,
    outcome: result,
    production_readiness_verified: result === "PASS",
    production_deployment_authorized: false as const,
    next_phase_progression_authorized: false as const,
    autonomous_execution_authorized: false as const,
    autonomous_recovery_authorized: false as const,
    autonomous_optimization_authorized: false as const,
    autonomous_learning_activation_authorized: false as const,
    runtime_behavior_modification_authorized: false as const,
    governance_modification_authorized: false as const,
    constitutional_modification_authorized: false as const,
    operator_authority_bypass_authorized: false as const,
    timestamp: "1970-01-01T00:00:00.000Z" as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("cata-resilience-certification-record", base) });
}

function reports(result: CataResilienceCertificationOutcome, evidence: CataResilienceEvidencePackage, scenario: CataResilienceCertificationScenario): readonly CataResilienceCertificationReport[] {
  const types: readonly CataResilienceCertificationReport["report_type"][] = ["CATA_RESILIENCE_CERTIFICATION_FRAMEWORK", "COMPREHENSIVE_CERTIFICATION_TEST_SUITE", "DETERMINISTIC_REPLAY_VALIDATION", "RUNTIME_ASSURANCE_VALIDATION", "RECOVERY_INTELLIGENCE_CERTIFICATION", "PREDICTIVE_INTELLIGENCE_CERTIFICATION", "MISSION_HEALTH_CERTIFICATION", "EXPLAINABILITY_CERTIFICATION", "STRESS_SIMULATION", "MULTI_AGENT_COORDINATION_VALIDATION", "CONTINUOUS_OPTIMIZATION_SAFETY", "KNOWLEDGE_EVOLUTION_BOUNDARY", "CONSTITUTIONAL_RESILIENCE", "AUTONOMY_MATURITY_ASSESSMENT", "GOVERNANCE_AUTHORITY_COMPLIANCE", "INTEGRITY_VERIFICATION", "TENANT_ISOLATION_VERIFICATION", "FINAL_PRODUCTION_CERTIFICATION_PACKAGE"];
  const evidenceRefs = freezeArray([evidence.package_id, evidence.upstream_maturity_certification_id]);
  return freezeArray(types.map((report_type, index) => {
    const base = { report_id: id("CATA-CERT-R", "cata-resilience-report", report_type), report_type, outcome: result, summary: freezeArray([`${report_type} outcome ${result}`, "certification is evidence-only and does not authorize production deployment or autonomous action"]), evidence_references: evidenceRefs, replay_reference: scenario === "INCOMPLETE_REPLAY_REFERENCES" && report_type === "DETERMINISTIC_REPLAY_VALIDATION" ? "" : `replay:cata-certification-report:${index + 1}`, lineage_reference: `lineage:cata-certification-report:${index + 1}` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && report_type === "INTEGRITY_VERIFICATION" ? "" : hashValue("cata-resilience-report", base) });
  }));
}

function upstreamForScenario(scenario: CataResilienceCertificationScenario) {
  if (scenario === "CERTIFICATION_SUITE_FAILURE") return certifyAutonomyMaturity({ scenario: "CERTIFICATION_TEST_FAILURE" });
  if (scenario === "REPLAY_MISMATCH") return certifyAutonomyMaturity({ scenario: "REPLAY_MISMATCH" });
  if (scenario === "INTEGRITY_FAILURE") return certifyAutonomyMaturity({ scenario: "INTEGRITY_FAILURE" });
  if (scenario === "GOVERNANCE_BYPASS" || scenario === "POLICY_MODIFICATION") return certifyAutonomyMaturity({ scenario: "GOVERNANCE_FAILURE" });
  if (scenario === "CONSTITUTIONAL_VIOLATION" || scenario === "CONSTITUTIONAL_MODIFICATION") return certifyAutonomyMaturity({ scenario: "CONSTITUTIONAL_FAILURE" });
  if (scenario === "TENANT_ISOLATION_FAILURE") return certifyAutonomyMaturity({ scenario: "TENANT_ISOLATION_FAILURE" });
  if (scenario === "HIDDEN_EXECUTION") return certifyAutonomyMaturity({ scenario: "HIDDEN_ASSESSMENT_LOGIC" });
  if (scenario === "DOCUMENTATION_GAP") return certifyAutonomyMaturity({ scenario: "DOCUMENTATION_GAP" });
  return certifyAutonomyMaturity();
}

function collectFailures(repository: Omit<CataResilienceCertificationRepository, "integrity_hash"> | CataResilienceCertificationRepository): readonly CataResilienceCertificationFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.tests.some((test) => test.actual_result === "FAIL") ? ["CERTIFICATION_SUITE_FAILED" as const] : []),
    ...(!repository.evidence_package.complete || repository.tests.some((test) => !test.evidence_reference) ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(repository.tests.some((test) => !test.replay_reference) || repository.reports.some((report) => !report.replay_reference) ? ["REPLAY_REFERENCES_INCOMPLETE" as const] : []),
    ...(!repository.record.integrity_hash || !repository.evidence_package.integrity_hash || repository.tests.some((test) => !test.integrity_hash) || repository.reports.some((report) => !report.integrity_hash) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.upstream_maturity_certification.record.outcome !== "PASS" && repository.upstream_maturity_certification.record.outcome !== "CONDITIONAL_PASS" ? ["CERTIFICATION_SUITE_FAILED" as const] : []),
    ...(repository.upstream_maturity_certification.failures.includes("REPLAY_MISMATCH_DETECTED") ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.upstream_maturity_certification.failures.includes("GOVERNANCE_FAILURE_DETECTED") ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(repository.upstream_maturity_certification.failures.includes("CONSTITUTIONAL_FAILURE_DETECTED") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(repository.upstream_maturity_certification.failures.includes("TENANT_ISOLATION_FAILURE_DETECTED") ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
  ]);
}

export function certifyCataResilience(input: CataResilienceCertificationInput = {}): CataResilienceCertificationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const upstream = input.upstream_maturity_certification ?? upstreamForScenario(scenario);
  const testRows = tests(scenario);
  const evidence = evidencePackage(upstream, scenario);
  const directFailure = scenarioFailure(scenario);
  const result = directFailure && scenario !== "DOCUMENTATION_GAP" ? "FAIL" : outcome(testRows, evidence, upstream, scenario);
  const certRecord = record(result, scenario);
  const certReports = reports(result, evidence, scenario);
  const source = { repository_id: id("CATA-CERT", "cata-resilience-certification-gate", scenario), final_state: "CATA_RESILIENCE_CERTIFICATION_COMPLETE" as const, upstream_maturity_certification: upstream, record: certRecord, tests: testRows, evidence_package: evidence, reports: certReports, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, immutable: true as const, tenant_isolated: scenario !== "TENANT_ISOLATION_FAILURE" };
  const failures = collectFailures(source);
  const final_state = result === "CONDITIONAL_PASS" ? "CATA_RESILIENCE_CERTIFICATION_CONDITIONAL" as const : failures.length ? "CATA_RESILIENCE_CERTIFICATION_FAILED" as const : source.final_state;
  const repository = { ...source, failures, final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("cata-resilience-certification-repository", repository) });
}

export function listCataResilienceCertificationTests(input: CataResilienceCertificationInput = {}) { return certifyCataResilience(input).tests; }
export function getCataResilienceCertificationEvidence(input: CataResilienceCertificationInput = {}) { return certifyCataResilience(input).evidence_package; }
export function listCataResilienceCertificationReports(input: CataResilienceCertificationInput = {}) { return certifyCataResilience(input).reports; }

export function validateCataResilienceCertification(repository = certifyCataResilience()): CataResilienceCertificationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: CataResilienceCertificationFailure) => failures.includes(failure);
  const result = {
    repository_id: repository.repository_id,
    valid: failures.length === 0 && repository.record.outcome === "PASS",
    all_tests_passed: repository.tests.every((test) => test.actual_result === "PASS"),
    upstream_maturity_certified: repository.upstream_maturity_certification.record.outcome === "PASS" && repository.upstream_maturity_certification.failures.length === 0,
    replay_verified: !has("REPLAY_MISMATCH_DETECTED") && !has("RECOVERY_REPLAY_MISMATCH_DETECTED") && !has("REPLAY_REFERENCES_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"),
    governance_verified: !has("GOVERNANCE_BYPASS_DETECTED"),
    constitutional_verified: !has("CONSTITUTIONAL_VIOLATION_DETECTED") && !has("CONSTITUTIONAL_MODIFICATION_DETECTED"),
    authority_enforced: !has("AUTHORITY_ESCALATION_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"),
    evidence_complete: !has("CERTIFICATION_EVIDENCE_INCOMPLETE"),
    explainability_complete: !has("EXPLAINABILITY_INCOMPLETE"),
    stress_failures_resolved: !has("UNRESOLVED_CRITICAL_STRESS_FAILURE"),
    no_hidden_execution: !has("HIDDEN_EXECUTION_DETECTED") && !has("HIDDEN_COMMUNICATION_DETECTED"),
    no_unauthorized_learning: !has("UNAUTHORIZED_LEARNING_DETECTED"),
    no_unauthorized_optimization: !has("UNAUTHORIZED_OPTIMIZATION_DETECTED") && !has("OUTCOME_MODIFICATION_DETECTED"),
    no_policy_or_constitutional_modification: !has("POLICY_MODIFICATION_DETECTED") && !has("CONSTITUTIONAL_MODIFICATION_DETECTED"),
    production_deployment_authorized: false as const,
    next_phase_progression_authorized: false as const,
    failures,
  };
  return Object.freeze({ ...result, validation_hash: hashValue("cata-resilience-certification-validation", result) });
}

export function buildCataResilienceCertificationObservabilitySurface(repository = certifyCataResilience()): CataResilienceCertificationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, outcome: repository.record.outcome, test_count: repository.tests.length, report_count: repository.reports.length, failure_count: repository.failures.length, production_readiness_verified: repository.record.production_readiness_verified, production_deployment_authorized: false, advisory_only: true, tenant_isolated: repository.tenant_isolated, integrity_hash: repository.integrity_hash });
}

export function getCataResilienceCertificationGateBundle(): CataResilienceCertificationBundle {
  const repository = certifyCataResilience();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CATA_RESILIENCE_CERTIFICATION_GATE_READY", principles: freezeArray(["phase-8-capstone-certification", "deterministic-test-matrix", "full-evidence-chain", "replay-verified", "integrity-verified", "governance-verified", "constitutional-verified", "operator-authority-preserved", "tenant-isolated", "advisory-only", "production-readiness-evidence-only", "no-deployment-authorization"]) }), repository, validation: validateCataResilienceCertification(repository), observability: buildCataResilienceCertificationObservabilitySurface(repository) });
}
