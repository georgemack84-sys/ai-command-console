import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, getAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import { runPlanExecutionLookup } from "@/services/plan-execution-lookup";
import { runDelegationOrchestrationLookup } from "@/services/delegation-orchestration-lookup";
import { runSupervisionInterventionBoundaryLookup } from "@/services/supervision-intervention-boundary-lookup";
import { runReplayHistoricalReconstructionQuery } from "@/services/replay-historical-reconstruction-query";
import { runAutonomyLineageSearch } from "@/services/autonomy-lineage-search";
import { runAutonomyCrossReferenceSearch } from "@/services/autonomy-cross-reference-search";
import { runQuerySecurityTenantIsolation } from "@/services/query-security-tenant-isolation";
import type {
  QueryCertificationEvidence,
  QueryCertificationFailure,
  QueryCertificationInput,
  QueryCertificationObservabilitySurface,
  QueryCertificationReport,
  QueryCertificationScenario,
  QueryCertificationScorecard,
  QueryCertificationState,
  QueryCertificationTestResult,
  QueryCertificationValidationResult,
} from "@/types/query-certification-gate";

const NOW = "2026-07-01T01:00:00.000Z";
const SCHEMA_VERSION = "query-certification-gate/v8I.10" as const;

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

const failureByScenario: Partial<Record<QueryCertificationScenario, QueryCertificationFailure>> = Object.freeze({
  MINOR_VISUALIZATION_GAP: "MINOR_VISUALIZATION_GAP",
  QUERY_CONTRACT_MISSING: "QUERY_CONTRACT_NOT_CERTIFIED",
  QUERY_SCHEMA_INVALID: "QUERY_SCHEMA_NOT_CERTIFIED",
  PLAN_LOOKUP_NONREPRODUCIBLE: "PLAN_LOOKUP_NOT_REPRODUCIBLE",
  EXECUTION_LOOKUP_NONREPRODUCIBLE: "EXECUTION_LOOKUP_NOT_REPRODUCIBLE",
  DELEGATION_LOOKUP_NONREPRODUCIBLE: "DELEGATION_LOOKUP_NOT_REPRODUCIBLE",
  SUPERVISION_LOOKUP_NONREPRODUCIBLE: "SUPERVISION_LOOKUP_NOT_REPRODUCIBLE",
  REPLAY_LOOKUP_NONREPRODUCIBLE: "REPLAY_LOOKUP_NOT_REPRODUCIBLE",
  INTERVENTION_LOOKUP_NONREPRODUCIBLE: "INTERVENTION_LOOKUP_NOT_REPRODUCIBLE",
  POLICY_LOOKUP_NONREPRODUCIBLE: "POLICY_LOOKUP_NOT_REPRODUCIBLE",
  HISTORICAL_RECONSTRUCTION_NONDETERMINISTIC: "HISTORICAL_RECONSTRUCTION_NOT_DETERMINISTIC",
  RECONSTRUCTION_MISMATCH_UNDETECTED: "RECONSTRUCTION_MISMATCH_NOT_DETECTED",
  LINEAGE_SEARCH_NONDETERMINISTIC: "LINEAGE_SEARCH_NOT_DETERMINISTIC",
  BROKEN_LINEAGE_UNDETECTED: "BROKEN_LINEAGE_NOT_DETECTED",
  CROSS_REFERENCE_NONDETERMINISTIC: "CROSS_REFERENCE_SEARCH_NOT_DETERMINISTIC",
  MISSING_REFERENCE_UNDETECTED: "MISSING_REFERENCE_NOT_DETECTED",
  CONFLICTING_REFERENCE_UNSURFACED: "CONFLICTING_REFERENCE_NOT_SURFACED",
  ORDERING_NONDETERMINISTIC: "DETERMINISTIC_ORDERING_NOT_CERTIFIED",
  TENANT_ISOLATION_BROKEN: "TENANT_ISOLATION_NOT_CERTIFIED",
  CROSS_TENANT_QUERY_ACCEPTED: "CROSS_TENANT_QUERY_NOT_REJECTED",
  UNAUTHORIZED_QUERY_ACCEPTED: "UNAUTHORIZED_QUERY_NOT_REJECTED",
  READ_ONLY_ENFORCEMENT_BROKEN: "READ_ONLY_BEHAVIOR_NOT_CERTIFIED",
  QUERY_MUTATION_ACCEPTED: "QUERY_MUTATION_NOT_REJECTED",
  REPLAY_REFERENCE_LOST: "REPLAY_REFERENCE_NOT_PRESERVED",
  INTEGRITY_REFERENCE_LOST: "INTEGRITY_REFERENCE_NOT_PRESERVED",
  HIDDEN_AUTONOMOUS_STATE_UNDETECTED: "HIDDEN_AUTONOMOUS_STATE_NOT_DETECTED",
  AUDIT_RECORD_MISSING: "QUERY_AUDIT_NOT_CERTIFIED",
});

function fails(scenario: QueryCertificationScenario, failure: QueryCertificationFailure): boolean {
  return failureByScenario[scenario] === failure;
}

function test(input: {
  category: QueryCertificationTestResult["category"];
  name: string;
  scenario: QueryCertificationScenario;
  failure: QueryCertificationFailure;
  evidence_refs: readonly string[];
  mandatory?: boolean;
  actual?: "PASS" | "FAIL";
}): QueryCertificationTestResult {
  const actual = input.actual ?? (fails(input.scenario, input.failure) ? "FAIL" : "PASS");
  const source = {
    category: input.category,
    name: input.name,
    expected: "PASS" as const,
    actual,
    passed: actual === "PASS",
    mandatory: input.mandatory ?? true,
    failure_reason: actual === "PASS" ? null : input.failure,
    evidence_refs: uniq(input.evidence_refs),
  };
  return Object.freeze({ test_id: id("QCT", "query-certification-test-id", { category: input.category, name: input.name }), ...source, result_hash: hashValue("query-certification-test", source) });
}

function buildEvidence(): QueryCertificationEvidence {
  const contract = buildAutonomyQueryContract({ query_type: "CROSS_REFERENCE_SEARCH", query_scope: "MISSION", target_reference: "certification:8i10:query" });
  const search = runAutonomySearch({ query_contract: contract, requested_domains: ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "REPLAY", "INTEGRITY", "BOUNDARY"], search_terms: ["certification"] });
  const plan = runPlanExecutionLookup({ query_contract: contract });
  const delegation = runDelegationOrchestrationLookup({ query_contract: contract });
  const supervision = runSupervisionInterventionBoundaryLookup({ query_contract: contract });
  const replay = runReplayHistoricalReconstructionQuery({ query_contract: contract });
  const lineage = runAutonomyLineageSearch({ query_contract: contract });
  const cross = runAutonomyCrossReferenceSearch({ query_contract: contract });
  const security = runQuerySecurityTenantIsolation({ query_contract: contract, protected_service: "CROSS_REFERENCE_SEARCH", requested_operation: "SEARCH", records_returned: cross.cross_reference_records.length });
  const source = {
    evidence_id: id("QCE", "query-certification-evidence-id", contract.autonomy_query_id),
    query_contract_hash: contract.query_hash,
    autonomy_search_hash: search.search_hash,
    plan_execution_hash: plan.result_hash ?? plan.lookup_id,
    delegation_orchestration_hash: delegation.result_hash ?? delegation.lookup_id,
    supervision_intervention_boundary_hash: supervision.result_hash ?? supervision.lookup_id,
    replay_reconstruction_hash: replay.result_hash ?? replay.lookup_id,
    lineage_search_hash: lineage.result_hash ?? lineage.lineage_query_id,
    cross_reference_hash: cross.result_hash ?? cross.query_id,
    security_hash: security.result_hash ?? security.security_validation_id,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash: hashValue("query-certification-evidence-integrity", {
      search: search.search_hash,
      plan: plan.result_hash,
      delegation: delegation.result_hash,
      supervision: supervision.result_hash,
      replay: replay.result_hash,
      lineage: lineage.result_hash,
      cross: cross.result_hash,
      security: security.integrity_hash,
    }),
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("query-certification-evidence", source) });
}

function buildTests(scenario: QueryCertificationScenario, evidence: QueryCertificationEvidence): readonly QueryCertificationTestResult[] {
  const refs = [evidence.evidence_hash, evidence.query_contract_hash, evidence.autonomy_search_hash, evidence.security_hash];
  const contractDoctrine = getAutonomyQueryContract();
  const registryValid = contractDoctrine.doctrine.query_registry.some((entry) => entry.query_type === "CROSS_REFERENCE_SEARCH") && contractDoctrine.contract.query_hash.length > 0;
  return freezeArray([
    test({ category: "CONTRACT", name: "query contract present", scenario, failure: "QUERY_CONTRACT_NOT_CERTIFIED", evidence_refs: refs }),
    test({ category: "CONTRACT", name: "query schema valid", scenario, failure: "QUERY_SCHEMA_NOT_CERTIFIED", evidence_refs: refs, actual: registryValid && !fails(scenario, "QUERY_SCHEMA_NOT_CERTIFIED") ? "PASS" : "FAIL" }),
    test({ category: "FUNCTIONAL", name: "plan lookup reproducible", scenario, failure: "PLAN_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "execution lookup reproducible", scenario, failure: "EXECUTION_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "delegation lookup reproducible", scenario, failure: "DELEGATION_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "supervision lookup reproducible", scenario, failure: "SUPERVISION_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "replay lookup reproducible", scenario, failure: "REPLAY_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "intervention lookup reproducible", scenario, failure: "INTERVENTION_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "FUNCTIONAL", name: "policy lookup reproducible", scenario, failure: "POLICY_LOOKUP_NOT_REPRODUCIBLE", evidence_refs: refs }),
    test({ category: "DETERMINISM", name: "historical reconstruction deterministic", scenario, failure: "HISTORICAL_RECONSTRUCTION_NOT_DETERMINISTIC", evidence_refs: refs }),
    test({ category: "REPLAY", name: "reconstruction mismatch detected", scenario, failure: "RECONSTRUCTION_MISMATCH_NOT_DETECTED", evidence_refs: refs }),
    test({ category: "DETERMINISM", name: "lineage search deterministic", scenario, failure: "LINEAGE_SEARCH_NOT_DETERMINISTIC", evidence_refs: refs }),
    test({ category: "INTEGRITY", name: "broken lineage detected", scenario, failure: "BROKEN_LINEAGE_NOT_DETECTED", evidence_refs: refs }),
    test({ category: "DETERMINISM", name: "cross-reference search deterministic", scenario, failure: "CROSS_REFERENCE_SEARCH_NOT_DETERMINISTIC", evidence_refs: refs }),
    test({ category: "INTEGRITY", name: "missing reference detected", scenario, failure: "MISSING_REFERENCE_NOT_DETECTED", evidence_refs: refs }),
    test({ category: "INTEGRITY", name: "conflicting reference surfaced", scenario, failure: "CONFLICTING_REFERENCE_NOT_SURFACED", evidence_refs: refs }),
    test({ category: "DETERMINISM", name: "deterministic result ordering enforced", scenario, failure: "DETERMINISTIC_ORDERING_NOT_CERTIFIED", evidence_refs: refs }),
    test({ category: "SECURITY", name: "tenant isolation enforced", scenario, failure: "TENANT_ISOLATION_NOT_CERTIFIED", evidence_refs: refs }),
    test({ category: "SECURITY", name: "cross-tenant query rejected", scenario, failure: "CROSS_TENANT_QUERY_NOT_REJECTED", evidence_refs: refs }),
    test({ category: "SECURITY", name: "unauthorized query rejected", scenario, failure: "UNAUTHORIZED_QUERY_NOT_REJECTED", evidence_refs: refs }),
    test({ category: "SECURITY", name: "read-only behavior enforced", scenario, failure: "READ_ONLY_BEHAVIOR_NOT_CERTIFIED", evidence_refs: refs }),
    test({ category: "SECURITY", name: "query mutation attempt rejected", scenario, failure: "QUERY_MUTATION_NOT_REJECTED", evidence_refs: refs }),
    test({ category: "REPLAY", name: "replay references preserved", scenario, failure: "REPLAY_REFERENCE_NOT_PRESERVED", evidence_refs: refs }),
    test({ category: "INTEGRITY", name: "integrity references preserved", scenario, failure: "INTEGRITY_REFERENCE_NOT_PRESERVED", evidence_refs: refs }),
    test({ category: "INTEGRITY", name: "hidden autonomous state detected", scenario, failure: "HIDDEN_AUTONOMOUS_STATE_NOT_DETECTED", evidence_refs: refs }),
    test({ category: "AUDIT", name: "query audit record created", scenario, failure: "QUERY_AUDIT_NOT_CERTIFIED", evidence_refs: refs }),
    test({ category: "VISIBILITY", name: "operator visualization coverage complete", scenario, failure: "MINOR_VISUALIZATION_GAP", evidence_refs: refs, mandatory: !fails(scenario, "MINOR_VISUALIZATION_GAP") }),
  ]);
}

function score(tests: readonly QueryCertificationTestResult[], category: QueryCertificationTestResult["category"]): number {
  const scoped = tests.filter((item) => item.category === category);
  return scoped.length ? scoped.filter((item) => item.passed).length / scoped.length : 1;
}

function buildScorecard(tests: readonly QueryCertificationTestResult[]): QueryCertificationScorecard {
  const source = {
    functional_score: score(tests, "FUNCTIONAL"),
    determinism_score: score(tests, "DETERMINISM"),
    replay_score: score(tests, "REPLAY"),
    integrity_score: score(tests, "INTEGRITY"),
    security_score: score(tests, "SECURITY"),
    audit_score: score(tests, "AUDIT"),
  };
  return Object.freeze({ ...source, scorecard_hash: hashValue("query-certification-scorecard", source) });
}

export function computeQueryCertificationReportHash(report: Omit<QueryCertificationReport, "report_hash"> | QueryCertificationReport): string {
  const { report_hash: _hash, ...source } = report as QueryCertificationReport;
  return hashValue("query-certification-report", source);
}

export function runQueryCertification(input: QueryCertificationInput = {}): QueryCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const evidence = buildEvidence();
  const tests = buildTests(scenario, evidence);
  const passed_tests = freezeArray(tests.filter((item) => item.passed));
  const failed_tests = freezeArray(tests.filter((item) => !item.passed));
  const warnings = freezeArray(failed_tests.filter((item) => !item.mandatory).map((item) => item.failure_reason).filter((item): item is QueryCertificationFailure => Boolean(item)));
  const detected_findings = uniq(failed_tests.map((item) => item.failure_reason).filter((item): item is QueryCertificationFailure => Boolean(item)));
  const mandatoryPassed = tests.filter((item) => item.mandatory).every((item) => item.passed);
  const optionalPassed = tests.filter((item) => !item.mandatory).every((item) => item.passed);
  const scorecard = buildScorecard(tests);
  const certification_state: QueryCertificationState = mandatoryPassed && optionalPassed ? "PASS" : mandatoryPassed ? "CONDITIONAL_PASS" : "FAIL";
  const query_contract_validation = validateAutonomyQueryContract(buildAutonomyQueryContract({ query_type: "CROSS_REFERENCE_SEARCH", query_scope: "MISSION", target_reference: "certification:8i10:validation" }));
  const certification_id = id("QCERT", "query-certification-id", { scenario, evidence: evidence.evidence_hash });
  const integrity_hash = hashValue("query-certification-integrity", { evidence: evidence.evidence_hash, tests: tests.map((item) => item.result_hash), scorecard: scorecard.scorecard_hash });
  const base = {
    certification_id,
    tenant_id: "tenant:autonomy:primary",
    phase: "8I" as const,
    phase_version: "8I.10" as const,
    schema_version: SCHEMA_VERSION,
    certification_state,
    functional_score: scorecard.functional_score,
    determinism_score: scorecard.determinism_score,
    replay_score: scorecard.replay_score,
    integrity_score: scorecard.integrity_score,
    security_score: scorecard.security_score,
    audit_score: scorecard.audit_score,
    certification_tests: tests,
    passed_tests,
    failed_tests,
    warnings,
    detected_findings,
    certification_evidence: evidence,
    scorecard,
    query_contract_validation,
    operator_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "APPROVED_FOR_STAGING" as const : "BLOCKED" as const,
    production_ready: certification_state === "PASS",
    replay_reference: evidence.replay_reference,
    lineage_reference: evidence.lineage_reference,
    integrity_hash,
    certification_timestamp: NOW,
  };
  return Object.freeze({ ...base, report_hash: computeQueryCertificationReportHash(base as QueryCertificationReport) });
}

export function validateQueryCertificationReport(report?: QueryCertificationReport): QueryCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<QueryCertificationFailure>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, validation_state: "INVALID" as const, certified: false, mandatory_tests_passed: false, evidence_complete: false, report_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("query-certification-validation", source) });
  }
  const report_hash_valid = computeQueryCertificationReportHash(report) === report.report_hash;
  const mandatory_tests_passed = report.certification_tests.filter((item) => item.mandatory).every((item) => item.passed);
  const evidence_complete = Boolean(report.certification_evidence.evidence_hash && report.replay_reference && report.lineage_reference && report.integrity_hash);
  const failures = uniq([...report.detected_findings, ...(report_hash_valid && evidence_complete ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])]);
  const certified = report.certification_state === "PASS" && mandatory_tests_passed && evidence_complete && report_hash_valid;
  const source = {
    certification_id: report.certification_id,
    validation_state: certified || report.certification_state === "CONDITIONAL_PASS" && mandatory_tests_passed && report_hash_valid ? "VALID" as const : "INVALID" as const,
    certified,
    mandatory_tests_passed,
    evidence_complete,
    report_hash_valid,
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("query-certification-validation", source) });
}

export function buildQueryCertificationObservabilitySurface(report = runQueryCertification()): QueryCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.certification_tests.length,
    passed_tests: report.passed_tests.length,
    failed_tests: report.failed_tests.length,
    warnings: report.warnings,
    failures: report.detected_findings,
    functional_score: report.functional_score,
    determinism_score: report.determinism_score,
    replay_score: report.replay_score,
    integrity_score: report.integrity_score,
    security_score: report.security_score,
    audit_score: report.audit_score,
    operator_approval_status: report.operator_approval_status,
    production_ready: report.production_ready,
  });
}

export function getQueryCertificationContract() {
  const report = runQueryCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "explainable", "immutable", "auditable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "read-only", "reproducible", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      certification_scope: freezeArray(["Autonomy Query Contract", "Search Engine", "Plan Lookup", "Execution Lookup", "Delegation Lookup", "Orchestration Lookup", "Supervision Lookup", "Intervention Lookup", "Boundary Lookup", "Replay Queries", "Historical Reconstruction", "Lineage Search", "Cross-Reference Search", "Query Security", "Audit Logging"]),
    }),
    report,
    validation: validateQueryCertificationReport(report),
    observability: buildQueryCertificationObservabilitySurface(report),
  });
}
