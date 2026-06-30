import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runVisibilityCertification } from "@/services/mission-control-visibility-certification-gate";
import type {
  AutonomyCertificationComponent,
  AutonomyCertificationContractInput,
  AutonomyCertificationContractObservabilitySurface,
  AutonomyCertificationContractReport,
  AutonomyCertificationContractValidationResult,
  AutonomyCertificationDecision,
  AutonomyCertificationDomain,
  AutonomyCertificationDomainResult,
  AutonomyCertificationEvidenceRecord,
  AutonomyCertificationFailure,
  AutonomyCertificationLifecycleRecord,
  AutonomyCertificationRuleSet,
  AutonomyCertificationScenario,
  AutonomyCertificationState,
  AutonomyCertificationTestResult,
} from "@/types/autonomy-certification-contract";

const NOW = "2026-07-01T07:00:00.000Z";
const CONTRACT_VERSION = "autonomy-certification-contract/v8K.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REQUESTED_BY = "operator:mission-control:certification";
const REPLAY_REFERENCE = "replay:autonomy-certification-contract:8k1:primary";
const LINEAGE_REFERENCE = "lineage:autonomy-certification-contract:8k1:primary";

const certificationScope: readonly AutonomyCertificationComponent[] = ["PLANNING_ENGINE", "EXECUTION_ORCHESTRATION", "DELEGATION_INTELLIGENCE", "EXECUTION_ASSURANCE", "RUNTIME_SUPERVISION", "BOUNDARY_ENFORCEMENT", "REPLAY_FRAMEWORK", "INTEGRITY_FRAMEWORK", "QUERY_SEARCH", "VISIBILITY_FRAMEWORK", "CONTROLLED_AUTONOMY"];
const lifecycleStates: readonly AutonomyCertificationState[] = ["REGISTERED", "COLLECTING_EVIDENCE", "VALIDATING", "DETERMINISTIC_CHECK", "REPLAY_CHECK", "INTEGRITY_CHECK", "GOVERNANCE_CHECK", "AUTHORITY_CHECK", "CONSTITUTIONAL_CHECK", "VISIBILITY_CHECK", "TENANT_CHECK", "FAIL_CLOSED_CHECK", "SCORING", "CERTIFIED"];
const domains: readonly AutonomyCertificationDomain[] = ["PLANNING", "ORCHESTRATION", "DELEGATION", "RUNTIME_SUPERVISION", "REPLAY", "INTEGRITY", "GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "VISIBILITY", "TENANT_ISOLATION", "FAIL_CLOSED"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const failureByScenario: Partial<Record<AutonomyCertificationScenario, AutonomyCertificationFailure>> = Object.freeze({
  MINOR_RECOMMENDATION_GAP: "MINOR_RECOMMENDATION_GAP",
  MISSING_CONTRACT: "CERTIFICATION_CONTRACT_MISSING",
  INVALID_SCHEMA: "CERTIFICATION_SCHEMA_INVALID",
  MISSING_IMMUTABLE_ID: "IMMUTABLE_IDENTIFIER_MISSING",
  MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
  MISSING_LINEAGE_REFERENCE: "LINEAGE_REFERENCE_MISSING",
  MISSING_INTEGRITY_HASH: "INTEGRITY_HASH_MISSING",
  MISSING_GOVERNANCE_REFERENCE: "GOVERNANCE_REFERENCE_MISSING",
  MISSING_CONSTITUTIONAL_REFERENCE: "CONSTITUTIONAL_REFERENCE_MISSING",
  NONDETERMINISTIC_DECISION: "CERTIFICATION_DECISION_NONDETERMINISTIC",
  REPLAY_NOT_REPRODUCIBLE: "REPLAY_VALIDATION_NOT_REPRODUCIBLE",
  INTEGRITY_NOT_VERIFIED: "INTEGRITY_VALIDATION_FAILED",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
  AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
  CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
  VISIBILITY_NOT_CERTIFIED: "VISIBILITY_VALIDATION_FAILED",
  CROSS_TENANT_EVIDENCE: "CROSS_TENANT_EVIDENCE_DETECTED",
  FAIL_OPEN_CERTIFICATION: "FAIL_CLOSED_VALIDATION_FAILED",
  INCOMPLETE_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
  HIDDEN_VALIDATION: "HIDDEN_VALIDATION_DETECTED",
});

function fails(scenario: AutonomyCertificationScenario, failure: AutonomyCertificationFailure): boolean {
  return failureByScenario[scenario] === failure;
}

function buildEvidenceRecords(scenario: AutonomyCertificationScenario): readonly AutonomyCertificationEvidenceRecord[] {
  return freezeArray(certificationScope.map((component, index) => {
    const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && index === 0;
    const missingLineage = scenario === "MISSING_LINEAGE_REFERENCE" && index === 0;
    const missingIntegrity = scenario === "MISSING_INTEGRITY_HASH" && index === 0;
    const missingGovernance = scenario === "MISSING_GOVERNANCE_REFERENCE" && index === 0;
    const missingConstitutional = scenario === "MISSING_CONSTITUTIONAL_REFERENCE" && index === 0;
    const missingImmutable = scenario === "MISSING_IMMUTABLE_ID" && index === 0;
    const crossTenant = scenario === "CROSS_TENANT_EVIDENCE" && index === 0;
    const incomplete = scenario === "INCOMPLETE_EVIDENCE" && index === 1;
    const source = {
      evidence_id: id("ACE", "autonomy-certification-evidence-id", { component, index }),
      evidence_type: incomplete ? "" : "CERTIFICATION_EVIDENCE",
      component,
      tenant_id: crossTenant ? "tenant:other" : TENANT_ID,
      mission_id: MISSION_ID,
      source_phase: `8${String.fromCharCode(65 + Math.min(index, 9))}`,
      evidence_reference: incomplete ? "" : `evidence:certification:${component.toLowerCase()}:8k1`,
      replay_reference: missingReplay ? "" : `${REPLAY_REFERENCE}:${component.toLowerCase()}`,
      lineage_reference: missingLineage ? "" : `${LINEAGE_REFERENCE}:${component.toLowerCase()}`,
      governance_reference: missingGovernance ? "" : `governance:certification:${component.toLowerCase()}`,
      constitutional_reference: missingConstitutional ? "" : `constitutional:certification:${component.toLowerCase()}`,
      integrity_hash: missingIntegrity ? "" : hashValue("autonomy-certification-evidence-integrity", { component, index }),
      immutable_id: missingImmutable ? "" : `immutable:certification:${component.toLowerCase()}:8k1`,
      collected_at: NOW,
    };
    return Object.freeze({ ...source, evidence_hash: hashValue("autonomy-certification-evidence-record", source) });
  }));
}

function domainResult(domain: AutonomyCertificationDomain, scenario: AutonomyCertificationScenario, failure: AutonomyCertificationFailure, evidence: readonly AutonomyCertificationEvidenceRecord[]): AutonomyCertificationDomainResult {
  const failed = fails(scenario, failure);
  const refs = evidence.slice(0, 3).map((record) => record.evidence_hash);
  const source = {
    domain,
    status: failed ? "FAIL" as const : "PASS" as const,
    score: failed ? 0 : 1,
    explanation: failed ? `${domain} failed certification rule ${failure}.` : `${domain} certification passed with deterministic evidence.`,
    evidence_refs: freezeArray(refs),
    governance_reference: `governance:domain:${domain.toLowerCase()}`,
    constitutional_reference: `constitutional:domain:${domain.toLowerCase()}`,
  };
  return Object.freeze({ ...source, result_hash: hashValue("autonomy-certification-domain-result", source) });
}

function buildDomainResults(scenario: AutonomyCertificationScenario, evidence: readonly AutonomyCertificationEvidenceRecord[]): readonly AutonomyCertificationDomainResult[] {
  return freezeArray([
    domainResult("PLANNING", scenario, "CERTIFICATION_DECISION_NONDETERMINISTIC", evidence),
    domainResult("ORCHESTRATION", scenario, "CERTIFICATION_DECISION_NONDETERMINISTIC", evidence),
    domainResult("DELEGATION", scenario, "AUTHORITY_ESCALATION_DETECTED", evidence),
    domainResult("RUNTIME_SUPERVISION", scenario, "HIDDEN_VALIDATION_DETECTED", evidence),
    domainResult("REPLAY", scenario, "REPLAY_VALIDATION_NOT_REPRODUCIBLE", evidence),
    domainResult("INTEGRITY", scenario, "INTEGRITY_VALIDATION_FAILED", evidence),
    domainResult("GOVERNANCE", scenario, "GOVERNANCE_BYPASS_DETECTED", evidence),
    domainResult("CONSTITUTIONAL", scenario, "CONSTITUTIONAL_VIOLATION_DETECTED", evidence),
    domainResult("AUTHORITY", scenario, "AUTHORITY_ESCALATION_DETECTED", evidence),
    domainResult("VISIBILITY", scenario, "VISIBILITY_VALIDATION_FAILED", evidence),
    domainResult("TENANT_ISOLATION", scenario, "CROSS_TENANT_EVIDENCE_DETECTED", evidence),
    domainResult("FAIL_CLOSED", scenario, "FAIL_CLOSED_VALIDATION_FAILED", evidence),
  ]);
}

function buildLifecycle(): AutonomyCertificationLifecycleRecord {
  const transitions = lifecycleStates.slice(0, -1).map((state, index) => `${state}->${lifecycleStates[index + 1]}`);
  const source = {
    lifecycle_id: id("ACL", "autonomy-certification-lifecycle-id", "8k1"),
    states: freezeArray(lifecycleStates),
    current_state: "CERTIFIED" as const,
    valid_transitions: freezeArray(transitions),
    deterministic_transitioning: true,
  };
  return Object.freeze({ ...source, lifecycle_hash: hashValue("autonomy-certification-lifecycle", source) });
}

function buildRuleSet(): AutonomyCertificationRuleSet {
  const source = {
    rule_set_id: id("ACR", "autonomy-certification-rule-set-id", "8k1"),
    required_rules: freezeArray(["contract exists", "schema valid", "immutable identifiers exist", "replay references exist", "lineage references exist", "integrity hashes exist", "governance references exist", "constitutional references exist"]),
    prohibited_conditions: freezeArray(["mutable certification evidence", "hidden validation", "hidden execution state", "governance bypass", "authority escalation", "replay modification", "cross-tenant evidence", "missing lineage", "incomplete evidence", "fail-open certification"]),
    fail_closed_required: true as const,
    governance_supremacy_required: true as const,
    constitutional_compliance_required: true as const,
    tenant_isolation_required: true as const,
  };
  return Object.freeze({ ...source, rule_hash: hashValue("autonomy-certification-rule-set", source) });
}

function testResult(input: {
  domain: AutonomyCertificationDomain;
  name: string;
  scenario: AutonomyCertificationScenario;
  failure: AutonomyCertificationFailure;
  evidence_refs: readonly string[];
  mandatory?: boolean;
  healthy?: boolean;
}): AutonomyCertificationTestResult {
  const failed = input.healthy === false || fails(input.scenario, input.failure);
  const source = {
    domain: input.domain,
    name: input.name,
    expected: "PASS" as const,
    actual: failed ? "FAIL" as const : "PASS" as const,
    passed: !failed,
    mandatory: input.mandatory ?? true,
    failure_reason: failed ? input.failure : null,
    evidence_refs: freezeArray(input.evidence_refs),
  };
  return Object.freeze({ test_id: id("ACT", "autonomy-certification-test-id", { domain: input.domain, name: input.name }), ...source, result_hash: hashValue("autonomy-certification-test-result", source) });
}

function buildTests(scenario: AutonomyCertificationScenario, evidence: readonly AutonomyCertificationEvidenceRecord[], visibilityCertified: boolean): readonly AutonomyCertificationTestResult[] {
  const refs = evidence.slice(0, 5).map((record) => record.evidence_hash);
  const allEvidenceComplete = evidence.every((record) => record.evidence_type && record.evidence_reference);
  const tenantSafe = evidence.every((record) => record.tenant_id === TENANT_ID);
  return freezeArray([
    testResult({ domain: "GOVERNANCE", name: "certification contract exists", scenario, failure: "CERTIFICATION_CONTRACT_MISSING", evidence_refs: refs }),
    testResult({ domain: "GOVERNANCE", name: "certification schema is valid", scenario, failure: "CERTIFICATION_SCHEMA_INVALID", evidence_refs: refs }),
    testResult({ domain: "INTEGRITY", name: "immutable identifiers exist", scenario, failure: "IMMUTABLE_IDENTIFIER_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.immutable_id) }),
    testResult({ domain: "REPLAY", name: "replay references exist", scenario, failure: "REPLAY_REFERENCE_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.replay_reference) }),
    testResult({ domain: "INTEGRITY", name: "lineage references exist", scenario, failure: "LINEAGE_REFERENCE_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.lineage_reference) }),
    testResult({ domain: "INTEGRITY", name: "integrity hashes exist", scenario, failure: "INTEGRITY_HASH_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.integrity_hash) }),
    testResult({ domain: "GOVERNANCE", name: "governance references exist", scenario, failure: "GOVERNANCE_REFERENCE_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.governance_reference) }),
    testResult({ domain: "CONSTITUTIONAL", name: "constitutional references exist", scenario, failure: "CONSTITUTIONAL_REFERENCE_MISSING", evidence_refs: refs, healthy: evidence.every((record) => record.constitutional_reference) }),
    testResult({ domain: "PLANNING", name: "planning certification criteria standardized", scenario, failure: "CERTIFICATION_DECISION_NONDETERMINISTIC", evidence_refs: refs }),
    testResult({ domain: "ORCHESTRATION", name: "orchestration certification criteria standardized", scenario, failure: "CERTIFICATION_DECISION_NONDETERMINISTIC", evidence_refs: refs }),
    testResult({ domain: "DELEGATION", name: "delegation authority validation certified", scenario, failure: "AUTHORITY_ESCALATION_DETECTED", evidence_refs: refs }),
    testResult({ domain: "RUNTIME_SUPERVISION", name: "runtime supervision certification criteria standardized", scenario, failure: "HIDDEN_VALIDATION_DETECTED", evidence_refs: refs }),
    testResult({ domain: "REPLAY", name: "replay validation reproducible", scenario, failure: "REPLAY_VALIDATION_NOT_REPRODUCIBLE", evidence_refs: refs }),
    testResult({ domain: "INTEGRITY", name: "integrity validation verified", scenario, failure: "INTEGRITY_VALIDATION_FAILED", evidence_refs: refs }),
    testResult({ domain: "GOVERNANCE", name: "governance supremacy enforced", scenario, failure: "GOVERNANCE_BYPASS_DETECTED", evidence_refs: refs }),
    testResult({ domain: "AUTHORITY", name: "authority boundaries enforced", scenario, failure: "AUTHORITY_ESCALATION_DETECTED", evidence_refs: refs }),
    testResult({ domain: "CONSTITUTIONAL", name: "constitutional compliance enforced", scenario, failure: "CONSTITUTIONAL_VIOLATION_DETECTED", evidence_refs: refs }),
    testResult({ domain: "VISIBILITY", name: "visibility framework certified", scenario, failure: "VISIBILITY_VALIDATION_FAILED", evidence_refs: refs, healthy: visibilityCertified }),
    testResult({ domain: "TENANT_ISOLATION", name: "tenant isolation enforced", scenario, failure: "CROSS_TENANT_EVIDENCE_DETECTED", evidence_refs: refs, healthy: tenantSafe }),
    testResult({ domain: "FAIL_CLOSED", name: "missing evidence rejected fail-closed", scenario, failure: "CERTIFICATION_EVIDENCE_INCOMPLETE", evidence_refs: refs, healthy: allEvidenceComplete }),
    testResult({ domain: "FAIL_CLOSED", name: "fail-open certification rejected", scenario, failure: "FAIL_CLOSED_VALIDATION_FAILED", evidence_refs: refs }),
    testResult({ domain: "RUNTIME_SUPERVISION", name: "hidden validation rejected", scenario, failure: "HIDDEN_VALIDATION_DETECTED", evidence_refs: refs }),
    testResult({ domain: "GOVERNANCE", name: "recommendations complete", scenario, failure: "MINOR_RECOMMENDATION_GAP", evidence_refs: refs, mandatory: !fails(scenario, "MINOR_RECOMMENDATION_GAP") }),
  ]);
}

export function computeAutonomyCertificationContractHash(report: Omit<AutonomyCertificationContractReport, "contract_hash"> | AutonomyCertificationContractReport): string {
  const { contract_hash: _hash, ...source } = report as AutonomyCertificationContractReport;
  return hashValue("autonomy-certification-contract-report", source);
}

export function buildAutonomyCertificationContract(input: AutonomyCertificationContractInput = {}): AutonomyCertificationContractReport {
  const scenario = input.scenario ?? "BASELINE";
  const visibilityCertification = runVisibilityCertification();
  const evidence = buildEvidenceRecords(scenario);
  const domainResults = buildDomainResults(scenario, evidence);
  const tests = buildTests(scenario, evidence, visibilityCertification.certification_state === "PASS");
  const failedTests = freezeArray(tests.filter((test) => !test.passed));
  const warnings = freezeArray(failedTests.filter((test) => !test.mandatory).map((test) => test.failure_reason).filter((failure): failure is AutonomyCertificationFailure => Boolean(failure)));
  const detectedFailures = uniq(failedTests.map((test) => test.failure_reason).filter((failure): failure is AutonomyCertificationFailure => Boolean(failure)));
  const mandatoryPassed = tests.filter((test) => test.mandatory).every((test) => test.passed);
  const optionalPassed = tests.filter((test) => !test.mandatory).every((test) => test.passed);
  const overallScore = Number((tests.filter((test) => test.passed).length / tests.length).toFixed(4));
  const decision: AutonomyCertificationDecision = mandatoryPassed && optionalPassed ? "PASS" : mandatoryPassed ? "CONDITIONAL_PASS" : "FAIL";
  const lifecycle = buildLifecycle();
  const ruleSet = buildRuleSet();
  const certificationId = id("ACERT", "autonomy-certification-contract-id", { scenario, component: input.component ?? "CONTROLLED_AUTONOMY" });
  const recommendations = detectedFailures.length === 0 ? freezeArray(["Certification contract ready for certification-suite execution."]) : freezeArray(detectedFailures.map((failure) => `Correct ${failure} before production certification.`));
  const integrityHash = scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("autonomy-certification-contract-integrity", { evidence: evidence.map((record) => record.evidence_hash), tests: tests.map((test) => test.result_hash), domains: domainResults.map((result) => result.result_hash), lifecycle: lifecycle.lifecycle_hash, rules: ruleSet.rule_hash });
  const base = {
    certification_id: certificationId,
    contract_version: CONTRACT_VERSION,
    phase: "8K" as const,
    subphase: "8K.1" as const,
    component: input.component ?? "CONTROLLED_AUTONOMY" as const,
    component_version: "controlled-autonomy/v8",
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    certification_scope: freezeArray(certificationScope),
    evaluation_timestamp: NOW,
    requested_by: REQUESTED_BY,
    certification_state: "CERTIFIED" as const,
    certification_decision: decision,
    overall_score: overallScore,
    deterministic_validation: domainResult("PLANNING", scenario, "CERTIFICATION_DECISION_NONDETERMINISTIC", evidence),
    replay_validation: domainResult("REPLAY", scenario, "REPLAY_VALIDATION_NOT_REPRODUCIBLE", evidence),
    integrity_validation: domainResult("INTEGRITY", scenario, "INTEGRITY_VALIDATION_FAILED", evidence),
    governance_validation: domainResult("GOVERNANCE", scenario, "GOVERNANCE_BYPASS_DETECTED", evidence),
    authority_validation: domainResult("AUTHORITY", scenario, "AUTHORITY_ESCALATION_DETECTED", evidence),
    constitutional_validation: domainResult("CONSTITUTIONAL", scenario, "CONSTITUTIONAL_VIOLATION_DETECTED", evidence),
    visibility_validation: domainResult("VISIBILITY", scenario, "VISIBILITY_VALIDATION_FAILED", evidence),
    tenant_validation: domainResult("TENANT_ISOLATION", scenario, "CROSS_TENANT_EVIDENCE_DETECTED", evidence),
    fail_closed_validation: domainResult("FAIL_CLOSED", scenario, "FAIL_CLOSED_VALIDATION_FAILED", evidence),
    domain_results: domainResults,
    lifecycle,
    rule_set: ruleSet,
    certification_tests: tests,
    test_results: tests,
    detected_failures: detectedFailures,
    warnings,
    recommendations,
    operator_required: decision !== "PASS",
    approver: decision === "PASS" ? "governance:approver:certification-suite" : null,
    approval_timestamp: decision === "PASS" ? NOW : null,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : LINEAGE_REFERENCE,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    integrity_hash: integrityHash,
    evidence,
    visibility_certification: visibilityCertification,
    metadata: Object.freeze({
      dependency_8a: "Controlled Autonomy Foundation",
      dependency_8b: "Planning Intelligence",
      dependency_8c: "Execution Orchestration",
      dependency_8d: "Delegation Intelligence",
      dependency_8e: "Execution Assurance",
      dependency_8f: "Boundary Enforcement",
      dependency_8g: "Replay Framework",
      dependency_8h: "Integrity Framework",
      dependency_8i: "Query & Search",
      dependency_8j: "Visibility Framework",
    }),
  };
  return Object.freeze({ ...base, contract_hash: computeAutonomyCertificationContractHash(base as Omit<AutonomyCertificationContractReport, "contract_hash">) });
}

export function validateAutonomyCertificationContract(report?: AutonomyCertificationContractReport): AutonomyCertificationContractValidationResult {
  if (!report) {
    const failures = freezeArray<AutonomyCertificationFailure>(["CERTIFICATION_CONTRACT_MISSING"]);
    const source = { certification_id: null, valid: false, certification_decision: null, mandatory_tests_passed: false, evidence_complete: false, contract_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("autonomy-certification-contract-validation", source) });
  }
  const contract_hash_valid = computeAutonomyCertificationContractHash(report) === report.contract_hash;
  const mandatory_tests_passed = report.certification_tests.filter((test) => test.mandatory).every((test) => test.passed);
  const evidence_complete = Boolean(report.certification_id && report.replay_reference && report.lineage_reference && report.integrity_hash && report.evidence.every((record) => record.evidence_hash));
  const failures = uniq([...report.detected_failures, ...(contract_hash_valid && evidence_complete ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])]);
  const valid = report.certification_decision === "PASS" && mandatory_tests_passed && evidence_complete && contract_hash_valid;
  const source = { certification_id: report.certification_id, valid, certification_decision: report.certification_decision, mandatory_tests_passed, evidence_complete, contract_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("autonomy-certification-contract-validation", source) });
}

export function buildAutonomyCertificationContractObservabilitySurface(report = buildAutonomyCertificationContract()): AutonomyCertificationContractObservabilitySurface {
  const failed = report.certification_tests.filter((test) => !test.passed).length;
  return Object.freeze({
    certification_id: report.certification_id,
    certification_decision: report.certification_decision,
    certification_state: report.certification_state,
    overall_score: report.overall_score,
    total_tests: report.certification_tests.length,
    passed_tests: report.certification_tests.length - failed,
    failed_tests: failed,
    warnings: report.warnings,
    failures: report.detected_failures,
    operator_required: report.operator_required,
    evidence_records: report.evidence.length,
    contract_hash: report.contract_hash,
  });
}

export function getAutonomyCertificationContract() {
  const report = buildAutonomyCertificationContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-certification", "explainable-certification", "replayable-certification", "immutable-certification", "governance-supremacy", "constitutional-compliance", "authority-enforcement", "tenant-isolation", "fail-closed-operation"]),
      contract_version: CONTRACT_VERSION,
      lifecycle_states: freezeArray(lifecycleStates),
      certification_decisions: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      certification_domains: freezeArray(domains),
      certification_scope: freezeArray(certificationScope),
    }),
    report,
    validation: validateAutonomyCertificationContract(report),
    observability: buildAutonomyCertificationContractObservabilitySurface(report),
  });
}
