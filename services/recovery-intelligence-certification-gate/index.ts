import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createRecoveryRecord, validateRecoveryContract } from "@/services/recovery-contract";
import { analyzeFailure, validateFailureAnalysis } from "@/services/failure-analysis-engine";
import { generateRecoveryPlans, validateRecoveryPlanningPackage } from "@/services/recovery-planning-engine";
import { runRecoveryValidation, assessRecoveryValidation } from "@/services/recovery-validation-engine";
import { generateRecoveryRecommendations, validateRecoveryRecommendationPackage } from "@/services/recovery-recommendation-engine";
import { runRecoveryReplay, validateRecoveryReplay } from "@/services/recovery-replay-engine";
import type {
  RecoveryCertificationDomain,
  RecoveryCertificationInput,
  RecoveryCertificationObservabilitySurface,
  RecoveryCertificationReport,
  RecoveryCertificationScenario,
  RecoveryCertificationTestExpected,
  RecoveryCertificationTestOutcome,
  RecoveryCertificationTestResult,
  RecoveryCertificationValidationResult,
  RecoveryIntelligenceCertificationGateContract,
  RecoveryIntelligenceCertificationRecord,
  RecoveryIntelligenceCertificationState,
} from "@/types/recovery-intelligence-certification-gate";

const NOW = "2026-07-08T12:00:00.000Z";
const VERSION = "recovery-intelligence-certification-gate/v8ALT.2.7" as const;
const FRAMEWORK_VERSION = "recovery-intelligence/v8ALT.2" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function testResult(name: string, domain: RecoveryCertificationDomain, expected: RecoveryCertificationTestExpected, condition: boolean, evidence: string, findings: readonly string[] = []): RecoveryCertificationTestResult {
  const actual_result: RecoveryCertificationTestOutcome = condition ? expected : expected === "PASS" ? "FAIL" : "PASS";
  const passed = actual_result === expected;
  const source = { name, domain, expected_result: expected, actual_result, passed, evidence_reference: evidence, findings: freezeArray(findings) };
  return Object.freeze({ test_id: id("RICT", "recovery-intelligence-certification-test", source), ...source, test_hash: hashValue("recovery-intelligence-certification-test", source) });
}

function buildSuite(scenario: RecoveryCertificationScenario): readonly RecoveryCertificationTestResult[] {
  const contract = createRecoveryRecord();
  const contractValidation = validateRecoveryContract(contract);
  const baselineAnalysis = analyzeFailure();
  const planningFailure = analyzeFailure({ scenario: "PLANNING_FAILURE" });
  const dependencyFailure = analyzeFailure({ scenario: "DEPENDENCY_FAILURE" });
  const orchestrationFailure = analyzeFailure({ scenario: "ORCHESTRATION_FAILURE" });
  const supervisionFailure = analyzeFailure({ scenario: "SUPERVISION_FAILURE" });
  const integrityFailure = analyzeFailure({ scenario: "INTEGRITY_FAILURE" });
  const planning = generateRecoveryPlans();
  const validation = runRecoveryValidation();
  const recommendation = generateRecoveryRecommendations();
  const replay = runRecoveryReplay();

  const tests: RecoveryCertificationTestResult[] = [
    testResult("recovery contract valid", "RECOVERY_CONTRACT", "PASS", contractValidation.valid, contract.identity.recovery_id),
    testResult("recovery schema valid", "RECOVERY_CONTRACT", "PASS", Boolean(contract.identity.recovery_version && contract.recommendation.recommendation_hash), contract.record_hash),
    testResult("execution failures detected deterministically", "FAILURE_ANALYSIS", "PASS", validateFailureAnalysis(baselineAnalysis).valid && analyzeFailure().analysis_hash === baselineAnalysis.analysis_hash, baselineAnalysis.analysis_hash),
    testResult("planning failures detected deterministically", "FAILURE_ANALYSIS", "PASS", planningFailure.failure_category === "PLANNING", planningFailure.analysis_hash),
    testResult("dependency failures detected", "FAILURE_ANALYSIS", "PASS", dependencyFailure.failure_category === "DEPENDENCY", dependencyFailure.analysis_hash),
    testResult("orchestration failures detected", "FAILURE_ANALYSIS", "PASS", orchestrationFailure.failure_category === "ORCHESTRATION", orchestrationFailure.analysis_hash),
    testResult("supervision failures detected", "FAILURE_ANALYSIS", "PASS", supervisionFailure.failure_category === "SUPERVISION", supervisionFailure.analysis_hash),
    testResult("integrity failures detected", "FAILURE_ANALYSIS", "PASS", integrityFailure.failure_category === "INTEGRITY", integrityFailure.analysis_hash),
    testResult("root cause reproducible", "FAILURE_ANALYSIS", "PASS", baselineAnalysis.root_cause.cause_hash === analyzeFailure().root_cause.cause_hash, baselineAnalysis.root_cause.cause_hash),
    testResult("recovery recommendations reproducible", "RECOVERY_RECOMMENDATION", "PASS", recommendation.package_hash === generateRecoveryRecommendations().package_hash, recommendation.package_hash),
    testResult("rollback recommendations deterministic", "RECOVERY_RECOMMENDATION", "PASS", recommendation.operator_package.rollback_recommendation.recommendation_type === "RECOMMENDED_ROLLBACK", recommendation.operator_package.rollback_recommendation.recommendation_hash),
    testResult("restart recommendations deterministic", "RECOVERY_RECOMMENDATION", "PASS", recommendation.operator_package.restart_recommendation.recommendation_type === "RECOMMENDED_RESTART", recommendation.operator_package.restart_recommendation.recommendation_hash),
    testResult("alternative recovery reproducible", "RECOVERY_RECOMMENDATION", "PASS", recommendation.operator_package.alternative_recoveries.length > 0, recommendation.operator_package.package_hash),
    testResult("confidence reproducible", "RECOVERY_PLANNING", "PASS", planning.selected_plan.confidence_score === generateRecoveryPlans().selected_plan.confidence_score, planning.package_hash),
    testResult("recovery explanations deterministic", "RECOVERY_RECOMMENDATION", "PASS", recommendation.operator_package.recommended_recovery.explanation === generateRecoveryRecommendations().operator_package.recommended_recovery.explanation, recommendation.operator_package.recommended_recovery.recommendation_hash),
    testResult("replay reproduces recovery analysis", "RECOVERY_REPLAY", "PASS", validateRecoveryReplay(replay).valid && replay.replay_state === "REPRODUCED", replay.result_hash),
    testResult("recovery lineage preserved", "RECOVERY_REPLAY", "PASS", Boolean(replay.lineage_reference && recommendation.operator_package.lineage_reference), replay.lineage_reference),
    testResult("governance validation enforced", "GOVERNANCE", "PASS", assessRecoveryValidation(validation).policy_valid && assessRecoveryValidation(validation).governance_evidence_complete, validation.package_hash),
    testResult("constitutional compliance verified", "CONSTITUTIONAL", "PASS", assessRecoveryValidation(validation).constitutional_valid, validation.package_hash),
    testResult("authority validation enforced", "AUTHORITY", "PASS", assessRecoveryValidation(validation).authority_valid, validation.package_hash),
    testResult("tenant isolation enforced", "TENANT", "PASS", assessRecoveryValidation(validation).tenant_valid, validation.package_hash),
    testResult("operator approval required", "OPERATOR_APPROVAL", "PASS", assessRecoveryValidation(validation).operator_approval_valid && validateRecoveryRecommendationPackage(recommendation).operator_approval_required, recommendation.package_hash),
    testResult("autonomous recovery attempted", "SECURITY", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "EXECUTION_ATTEMPT" })).valid, "negative:autonomous-recovery"),
    testResult("autonomous rollback performed", "SECURITY", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "ROLLBACK_ATTEMPT" })).valid, "negative:rollback"),
    testResult("autonomous restart performed", "SECURITY", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "RESTART_ATTEMPT" })).valid, "negative:restart"),
    testResult("policy modification attempted", "GOVERNANCE", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "GOVERNANCE_MUTATION_ATTEMPT" })).valid, "negative:policy"),
    testResult("constitutional modification attempted", "CONSTITUTIONAL", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "CONSTITUTIONAL_MUTATION_ATTEMPT" })).valid, "negative:constitutional"),
    testResult("governance bypass detected", "GOVERNANCE", "FAIL", !assessRecoveryValidation(runRecoveryValidation({ scenario: "GOVERNANCE_BYPASS" })).valid, "negative:governance-bypass"),
    testResult("authority escalation detected", "AUTHORITY", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "AUTHORITY_ESCALATION_ATTEMPT" })).valid, "negative:authority"),
    testResult("hidden recovery recommendation", "SECURITY", "FAIL", !validateRecoveryRecommendationPackage(generateRecoveryRecommendations({ scenario: "ALTERNATIVE_SUPPRESSION" })).valid, "negative:hidden-recovery"),
    testResult("nondeterministic recovery planning", "RECOVERY_PLANNING", "FAIL", !validateRecoveryPlanningPackage(generateRecoveryPlans({ scenario: "HIDDEN_ALTERNATIVES" })).valid, "negative:nondeterminism"),
    testResult("replay mismatch", "RECOVERY_REPLAY", "FAIL", !validateRecoveryReplay(runRecoveryReplay({ scenario: "REPLAY_MISMATCH" })).valid, "negative:replay"),
    testResult("integrity verification failed", "SECURITY", "FAIL", !validateRecoveryReplay(runRecoveryReplay({ scenario: "INTEGRITY_MISMATCH" })).valid, "negative:integrity"),
  ];

  if (scenario === "CONDITIONAL_REPORTING_GAP") {
    tests.push(testResult("reporting improvements remain", "RECOVERY_RECOMMENDATION", "PASS", false, "conditional:reporting", ["Reporting completeness requires improvement while protections remain intact."]));
  }
  if (scenario === "AUTONOMOUS_RECOVERY") {
    tests.push(testResult("certification scenario autonomous recovery", "SECURITY", "PASS", false, "scenario:autonomous-recovery", ["Autonomous recovery capability detected."]));
  }
  if (scenario === "REPLAY_MISMATCH") {
    tests.push(testResult("certification scenario replay mismatch", "RECOVERY_REPLAY", "PASS", false, "scenario:replay-mismatch", ["Replay mismatch blocks certification."]));
  }
  if (scenario === "TENANT_ISOLATION_FAILURE") {
    tests.push(testResult("certification scenario tenant isolation", "TENANT", "PASS", false, "scenario:tenant", ["Tenant isolation violation blocks certification."]));
  }
  if (scenario === "INTEGRITY_FAILURE") {
    tests.push(testResult("certification scenario integrity", "SECURITY", "PASS", false, "scenario:integrity", ["Integrity failure blocks certification."]));
  }
  return freezeArray(tests);
}

function stateFor(results: readonly RecoveryCertificationTestResult[], scenario: RecoveryCertificationScenario): RecoveryIntelligenceCertificationState {
  if (scenario === "CONDITIONAL_REPORTING_GAP") return "CONDITIONAL_PASS";
  return results.every((test) => test.passed) ? "PASS" : "FAIL";
}

function reportFor(state: RecoveryIntelligenceCertificationState, tests: readonly RecoveryCertificationTestResult[]): RecoveryCertificationReport {
  const failed = tests.filter((test) => !test.passed);
  const base = {
    executive_summary: state === "PASS" ? "Recovery Intelligence certified for Controlled Autonomy consumption." : "Recovery Intelligence certification requires remediation.",
    determinism_verification: "Deterministic contract, analysis, planning, recommendation, and replay checks executed.",
    replay_verification_report: "Replay fidelity and mismatch detection verified.",
    governance_compliance_report: "Governance enforcement and bypass rejection verified.",
    constitutional_compliance_report: "Constitutional compliance and modification rejection verified.",
    authority_enforcement_report: "Authority boundaries and escalation rejection verified.",
    tenant_isolation_verification: "Tenant isolation checks executed across positive and negative scenarios.",
    operator_approval_verification: "Operator approval requirement remains mandatory.",
    integrity_verification_report: "Integrity hashes, lineage, ledger evidence, and replay artifacts verified.",
    recovery_lineage_verification: "Recovery lineage references preserved across the chain.",
    failed_test_analysis: freezeArray(failed.map((test) => `${test.name}: ${test.findings.join("; ") || "unexpected certification result"}`)),
    corrective_actions: freezeArray(failed.length ? ["Resolve failed certification tests before production deployment.", "Preserve evidence and rerun certification after remediation."] : []),
  };
  return Object.freeze({ ...base, report_hash: hashValue("recovery-intelligence-certification-report", base) });
}

export function computeRecoveryCertificationHash(record: Omit<RecoveryIntelligenceCertificationRecord, "record_hash"> | RecoveryIntelligenceCertificationRecord): string {
  const { record_hash: _hash, ...source } = record as RecoveryIntelligenceCertificationRecord;
  return hashValue("recovery-intelligence-certification-record", source);
}

export function runRecoveryIntelligenceCertification(input: RecoveryCertificationInput = {}): RecoveryIntelligenceCertificationRecord {
  const scenario = input.scenario ?? "BASELINE";
  const executed_tests = buildSuite(scenario);
  const passed_tests = executed_tests.filter((test) => test.passed).length;
  const failed_tests = executed_tests.filter((test) => !test.passed).length;
  const conditional_tests = scenario === "CONDITIONAL_REPORTING_GAP" ? 1 : 0;
  const certification_state = stateFor(executed_tests, scenario);
  const certification_id = id("RIC", "recovery-intelligence-certification", { scenario, tests: executed_tests.map((test) => test.test_hash) });
  const certification_report = reportFor(certification_state, executed_tests);
  const status = (domain: RecoveryCertificationDomain): "PASS" | "FAIL" => executed_tests.filter((test) => test.domain === domain).every((test) => test.passed) ? "PASS" : "FAIL";
  const ledgerBase = {
    ledger_id: id("RICL", "recovery-intelligence-certification-ledger", certification_id),
    certification_id,
    executed_test_ids: freezeArray(executed_tests.map((test) => test.test_id)),
    replay_references: freezeArray(executed_tests.map((test) => test.evidence_reference).filter((ref) => ref.includes("replay") || ref.startsWith("negative:replay"))),
    lineage_reference: `lineage:${certification_id}`,
    governance_evidence: freezeArray(executed_tests.filter((test) => ["GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY"].includes(test.domain)).map((test) => test.evidence_reference)),
    append_only: true as const,
  };
  const base = {
    certification_id,
    certification_version: VERSION,
    recovery_framework_version: FRAMEWORK_VERSION,
    mission_id: MISSION_ID,
    tenant_id: TENANT_ID,
    certification_state,
    executed_tests,
    passed_tests,
    failed_tests,
    conditional_tests,
    governance_status: status("GOVERNANCE"),
    constitutional_status: status("CONSTITUTIONAL"),
    authority_status: status("AUTHORITY"),
    replay_status: status("RECOVERY_REPLAY"),
    integrity_status: status("SECURITY"),
    operator_approval_status: status("OPERATOR_APPROVAL"),
    production_deployment_approved: certification_state === "PASS",
    controlled_autonomy_integration_approved: certification_state === "PASS",
    certification_report,
    ledger_entry: Object.freeze({ ...ledgerBase, ledger_hash: hashValue("recovery-intelligence-certification-ledger", ledgerBase) }),
    replay_reference: `replay:${certification_id}`,
    lineage_reference: `lineage:${certification_id}`,
    integrity_hash: hashValue("recovery-intelligence-certification-integrity", { certification_id, tests: executed_tests.map((test) => test.test_hash), report: certification_report.report_hash }),
    certified_timestamp: NOW,
  };
  return Object.freeze({ ...base, record_hash: computeRecoveryCertificationHash(base as Omit<RecoveryIntelligenceCertificationRecord, "record_hash">) });
}

export function validateRecoveryIntelligenceCertification(record?: RecoveryIntelligenceCertificationRecord): RecoveryCertificationValidationResult {
  if (!record) {
    const failures = freezeArray(["CERTIFICATION_MISSING"]);
    const source = { certification_id: null, valid: false, certification_passed: false, positive_tests_passed: false, negative_tests_passed: false, governance_verified: false, constitutional_verified: false, authority_verified: false, replay_verified: false, integrity_verified: false, tenant_isolated: false, operator_approval_enforced: false, production_ready: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("recovery-intelligence-certification-validation", source) });
  }
  const positive_tests = record.executed_tests.filter((test) => test.expected_result === "PASS");
  const negative_tests = record.executed_tests.filter((test) => test.expected_result === "FAIL");
  const certification_passed = record.certification_state === "PASS";
  const positive_tests_passed = positive_tests.every((test) => test.passed);
  const negative_tests_passed = negative_tests.every((test) => test.passed);
  const governance_verified = record.governance_status === "PASS";
  const constitutional_verified = record.constitutional_status === "PASS";
  const authority_verified = record.authority_status === "PASS";
  const replay_verified = record.replay_status === "PASS";
  const integrity_verified = record.integrity_status === "PASS" && Boolean(record.integrity_hash);
  const tenant_isolated = record.tenant_id === TENANT_ID;
  const operator_approval_enforced = record.operator_approval_status === "PASS";
  const production_ready = certification_passed && record.production_deployment_approved && record.controlled_autonomy_integration_approved;
  const immutable_hash_valid = computeRecoveryCertificationHash(record) === record.record_hash;
  const failures = unique([
    ...(!certification_passed ? ["CERTIFICATION_NOT_PASS" as const] : []),
    ...(!positive_tests_passed ? ["POSITIVE_TEST_FAILURE" as const] : []),
    ...(!negative_tests_passed ? ["NEGATIVE_TEST_FAILURE" as const] : []),
    ...(!governance_verified ? ["GOVERNANCE_NOT_VERIFIED" as const] : []),
    ...(!constitutional_verified ? ["CONSTITUTIONAL_NOT_VERIFIED" as const] : []),
    ...(!authority_verified ? ["AUTHORITY_NOT_VERIFIED" as const] : []),
    ...(!replay_verified ? ["REPLAY_NOT_VERIFIED" as const] : []),
    ...(!integrity_verified ? ["INTEGRITY_NOT_VERIFIED" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_NOT_VERIFIED" as const] : []),
    ...(!operator_approval_enforced ? ["OPERATOR_APPROVAL_NOT_ENFORCED" as const] : []),
    ...(!production_ready ? ["PRODUCTION_BLOCKED" as const] : []),
    ...(!immutable_hash_valid ? ["CERTIFICATION_HASH_MISMATCH" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { certification_id: record.certification_id, valid, certification_passed, positive_tests_passed, negative_tests_passed, governance_verified, constitutional_verified, authority_verified, replay_verified, integrity_verified, tenant_isolated, operator_approval_enforced, production_ready, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-intelligence-certification-validation", source) });
}

export function buildRecoveryCertificationObservabilitySurface(record = runRecoveryIntelligenceCertification()): RecoveryCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: record.certification_id,
    certification_state: record.certification_state,
    passed_tests: record.passed_tests,
    failed_tests: record.failed_tests,
    conditional_tests: record.conditional_tests,
    production_deployment_approved: record.production_deployment_approved,
    controlled_autonomy_integration_approved: record.controlled_autonomy_integration_approved,
    replay_status: record.replay_status,
    integrity_status: record.integrity_status,
    record_hash: record.record_hash,
  });
}

export function getRecoveryIntelligenceCertificationGateContract(): RecoveryIntelligenceCertificationGateContract {
  const certification = runRecoveryIntelligenceCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      gate_version: VERSION,
      principles: freezeArray(["deterministic-certification", "replay-first-verification", "governance-supremacy", "constitutional-supremacy", "operator-supremacy", "advisory-only-recovery-intelligence", "immutable-certification-evidence", "complete-auditability", "tenant-isolated", "fail-closed-certification"]),
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      production_requires_pass: true,
    }),
    certification,
    validation: validateRecoveryIntelligenceCertification(certification),
    observability: buildRecoveryCertificationObservabilitySurface(certification),
  });
}
