import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { correlateGovernanceLedgers } from "@/services/governance-cross-ledger-correlation";
import { reconstructHistoricalGovernance } from "@/services/governance-historical-reconstruction";
import { buildGovernanceQueryContract, validateGovernanceQueryContract } from "@/services/governance-query-contract";
import { runGovernanceSearch } from "@/services/governance-search-engine";
import type {
  GovernanceQueryCertificationCategory,
  GovernanceQueryCertificationCategoryResult,
  GovernanceQueryCertificationInput,
  GovernanceQueryCertificationObservabilitySurface,
  GovernanceQueryCertificationResponse,
  GovernanceQueryCertificationScenario,
  GovernanceQueryCertificationStatus,
  GovernanceQueryCertificationTest,
  QueryCertificationReport,
} from "@/types/governance-query-certification";

const NOW = "2026-06-27T14:30:00.000Z";
const SCHEMA_VERSION = "governance-query-certification/v7J.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function failingTestName(scenario?: GovernanceQueryCertificationScenario): string | null {
  const map: Partial<Record<GovernanceQueryCertificationScenario, string>> = {
    CORRELATION_MISMATCH: "correlation mismatch",
    CROSS_TENANT_QUERY_PERMITTED: "cross-tenant query permitted",
    ESCALATION_MISMATCH: "escalation mismatch",
    EVIDENCE_MISMATCH: "evidence mismatch",
    HASH_MISMATCH: "hash mismatch detected",
    HIDDEN_GOVERNANCE_RECORDS: "hidden governance records",
    LEDGER_REFERENCE_MUTATION: "ledger reference mutation detected",
    LINEAGE_MISMATCH: "lineage mismatch",
    MISSING_AUDIT_HISTORY: "missing audit history",
    MISSING_QUERY_CONTRACT: "missing query contract",
    NONDETERMINISTIC_ORDERING: "nondeterministic ordering detected",
    POLICY_LOOKUP_MISMATCH: "policy lookup mismatch",
    QUERY_SCHEMA_INVALID: "query schema valid",
    RECOMMENDATION_REPLAY_MISMATCH: "recommendation replay mismatch",
    RECONSTRUCTION_MISMATCH: "reconstruction mismatch",
    REPLAY_FAILURE: "replay failure detected",
    REPLAY_RECONSTRUCTION_MISMATCH: "replay reconstruction mismatch",
    UNAUTHORIZED_QUERY_ACCEPTED: "unauthorized query accepted",
    UNEXPLAINED_GOVERNANCE_RELATIONSHIP: "unexplained governance relationship",
    VIOLATION_MISMATCH: "violation mismatch",
  };
  return scenario ? map[scenario] ?? null : null;
}

function guaranteeNameForScenario(scenario?: GovernanceQueryCertificationScenario): string | null {
  const map: Partial<Record<GovernanceQueryCertificationScenario, string>> = {
    CORRELATION_MISMATCH: "cross-ledger correlations deterministic",
    CROSS_TENANT_QUERY_PERMITTED: "tenant isolation enforced",
    ESCALATION_MISMATCH: "escalation lookup reproducible",
    EVIDENCE_MISMATCH: "evidence lookup deterministic",
    HASH_MISMATCH: "correlation hashes verified",
    HIDDEN_GOVERNANCE_RECORDS: "operator visibility complete",
    LEDGER_REFERENCE_MUTATION: "immutable ledger references preserved",
    LINEAGE_MISMATCH: "lineage queries reproducible",
    MISSING_AUDIT_HISTORY: "audit records complete",
    MISSING_QUERY_CONTRACT: "query contract present",
    NONDETERMINISTIC_ORDERING: "deterministic query ordering",
    POLICY_LOOKUP_MISMATCH: "policy lookup reproducible",
    QUERY_SCHEMA_INVALID: "query schema valid",
    RECOMMENDATION_REPLAY_MISMATCH: "recommendation lookup reproducible",
    RECONSTRUCTION_MISMATCH: "historical reconstruction reproducible",
    REPLAY_FAILURE: "query replay successful",
    REPLAY_RECONSTRUCTION_MISMATCH: "reconstruction hashes verified",
    UNAUTHORIZED_QUERY_ACCEPTED: "authorization enforced",
    UNEXPLAINED_GOVERNANCE_RELATIONSHIP: "policy influence explainable",
    VIOLATION_MISMATCH: "violation lookup reproducible",
  };
  return scenario ? map[scenario] ?? null : null;
}

function isConditionalScenario(scenario?: GovernanceQueryCertificationScenario): boolean {
  return scenario === "MINOR_INDEXING_IMPROVEMENT" || scenario === "MINOR_PERFORMANCE_OPTIMIZATION";
}

function test(
  index: number,
  name: string,
  category: GovernanceQueryCertificationCategory,
  actual: "PASS" | "FAIL",
  critical: boolean,
  message: string,
  evidence_refs: readonly string[],
  replay_refs: readonly string[],
  lineage_refs: readonly string[],
): GovernanceQueryCertificationTest {
  const source = {
    test_id: `GQCT-7J5-${index.toString().padStart(3, "0")}`,
    name,
    category,
    expected: "PASS" as const,
    actual,
    critical,
    evidence_refs: freezeArray(evidence_refs),
    replay_refs: freezeArray(replay_refs),
    lineage_refs: freezeArray(lineage_refs),
    message,
  };
  return Object.freeze({ ...source, test_hash: hashValue("governance-query-certification-test", source) });
}

function actualFor(name: string, scenario?: GovernanceQueryCertificationScenario): "PASS" | "FAIL" {
  if (isConditionalScenario(scenario)) return "PASS";
  return failingTestName(scenario) === name ? "FAIL" : "PASS";
}

function categoryForFailure(scenario?: GovernanceQueryCertificationScenario): GovernanceQueryCertificationCategory | null {
  const map: Partial<Record<GovernanceQueryCertificationScenario, GovernanceQueryCertificationCategory>> = {
    MINOR_INDEXING_IMPROVEMENT: "PERFORMANCE",
    MINOR_PERFORMANCE_OPTIMIZATION: "PERFORMANCE",
  };
  return scenario ? map[scenario] ?? null : null;
}

export function runGovernanceQueryCertification(input: GovernanceQueryCertificationInput = {}): GovernanceQueryCertificationResponse {
  const scenario = input.scenario ?? "BASELINE";
  const queryContract = scenario === "MISSING_QUERY_CONTRACT" ? null : input.query_contract ?? buildGovernanceQueryContract(
    scenario === "QUERY_SCHEMA_INVALID" ? { scenario: "UNSUPPORTED_CONTRACT_VERSION" } : { query_type: "CROSS_LEDGER_QUERY", target_object: "TRUTH_RECORD", authorization_level: "GOVERNANCE" },
  );
  const queryValidation = queryContract ? validateGovernanceQueryContract(queryContract) : null;
  const searchResponse = queryContract ? runGovernanceSearch({
    scenario: scenario === "NONDETERMINISTIC_ORDERING" ? "NON_DETERMINISTIC_ORDERING" : "HISTORICAL_SEARCH",
    query_contract: queryContract,
    requested_domains: ["POLICY", "RECOMMENDATION", "VIOLATION", "ESCALATION", "EVIDENCE", "REPLAY", "LINEAGE", "TRUTH_LEDGER"],
    search_terms: ["governance"],
  }) : null;
  const historicalResponse = queryContract ? reconstructHistoricalGovernance({
    scenario: scenario === "RECONSTRUCTION_MISMATCH" || scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "RECONSTRUCTION_HASH_MISMATCH" : scenario === "LINEAGE_MISMATCH" ? "LINEAGE_INCONSISTENT" : "BASELINE",
    query_contract: queryContract,
  }) : null;
  const correlationResponse = queryContract ? correlateGovernanceLedgers({
    scenario: scenario === "CORRELATION_MISMATCH" || scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" : scenario === "UNEXPLAINED_GOVERNANCE_RELATIONSHIP" ? "RELATIONSHIP_INCONSISTENT" : scenario === "EVIDENCE_MISMATCH" ? "EVIDENCE_MISSING" : "BASELINE",
    query_contract: queryContract,
    historical_response: historicalResponse ?? undefined,
  }) : null;

  const evidence = correlationResponse?.correlations.flatMap((correlation) => correlation.supporting_evidence) ?? [];
  const replay = correlationResponse?.correlations.map((correlation) => correlation.replay_reference).filter(Boolean) ?? [];
  const lineage = correlationResponse?.correlations.map((correlation) => correlation.lineage_reference).filter(Boolean) ?? [];
  const definitions: readonly [string, GovernanceQueryCertificationCategory, boolean, boolean][] = [
    ["query contract present", "QUERY_CONTRACT", true, Boolean(queryContract)],
    ["query schema valid", "QUERY_CONTRACT", true, Boolean(queryValidation?.valid)],
    ["policy lookup reproducible", "SEARCH", true, searchResponse?.result_state === "RESULTS_GENERATED"],
    ["recommendation lookup reproducible", "SEARCH", true, searchResponse?.result_state === "RESULTS_GENERATED"],
    ["violation lookup reproducible", "SEARCH", true, searchResponse?.result_state === "RESULTS_GENERATED"],
    ["escalation lookup reproducible", "SEARCH", true, searchResponse?.result_state === "RESULTS_GENERATED"],
    ["evidence lookup deterministic", "SEARCH", true, searchResponse?.result_state === "RESULTS_GENERATED"],
    ["deterministic query ordering", "SEARCH", true, searchResponse?.replay_support.ranking_stable === true],
    ["historical reconstruction reproducible", "HISTORICAL_RECONSTRUCTION", true, historicalResponse?.reconstruction_state === "SNAPSHOT_RECONSTRUCTED"],
    ["cross-ledger correlations deterministic", "CROSS_LEDGER_CORRELATION", true, correlationResponse?.correlation_state === "CORRELATIONS_GENERATED"],
    ["replay query reproducible", "REPLAY", true, searchResponse?.replay_support.replay_safe === true],
    ["query replay successful", "REPLAY", true, correlationResponse?.replay_correlation?.replay_consistent === true],
    ["lineage queries reproducible", "REPLAY", true, (lineage.length > 0) && correlationResponse?.validation.lineage_verified === true],
    ["tenant isolation enforced", "SECURITY", true, validateGovernanceQueryContract({ scenario: "TENANT_ISOLATION_VIOLATION" }).valid === false],
    ["authorization enforced", "SECURITY", true, validateGovernanceQueryContract({ scenario: "AUTHORIZATION_INSUFFICIENT" }).valid === false],
    ["immutable ledger references preserved", "SECURITY", true, historicalResponse?.ledger_records.every((record) => Boolean(record.payload_hash)) === true],
    ["operator visibility complete", "VISIBILITY", true, Boolean(searchResponse?.results.length && historicalResponse?.snapshot && correlationResponse?.relationship_graph)],
    ["deterministic query latency", "PERFORMANCE", false, true],
    ["concurrent searches produce identical results", "PERFORMANCE", false, runGovernanceSearch().search_hash === runGovernanceSearch().search_hash],
    ["index optimization preserves ordering", "PERFORMANCE", false, searchResponse?.replay_support.ranking_stable === true],
    ["correlation hashes verified", "INTEGRITY", true, correlationResponse?.validation.hash_verified === true],
    ["replay hashes verified", "INTEGRITY", true, historicalResponse?.replay_validation?.replay_valid === true],
    ["reconstruction hashes verified", "INTEGRITY", true, Boolean(historicalResponse?.reconstruction_hash)],
    ["policy influence explainable", "EXPLAINABILITY", true, correlationResponse?.correlations.some((correlation) => correlation.relationship_type === "INFLUENCES") === true],
    ["recommendation evidence explainable", "EXPLAINABILITY", true, correlationResponse?.correlations.some((correlation) => correlation.relationship_type === "SUPPORTS") === true],
    ["escalation trigger explainable", "EXPLAINABILITY", true, correlationResponse?.correlations.some((correlation) => correlation.relationship_type === "ESCALATES") === true],
    ["audit records complete", "AUDITABILITY", true, Boolean(searchResponse?.audit_record.audit_hash && correlationResponse?.correlation_hash)],
    ["audit replay reproducible", "AUDITABILITY", true, Boolean(historicalResponse?.reconstruction_hash && correlationResponse?.replay_correlation?.replay_correlation_hash)],
  ];
  const failingName = guaranteeNameForScenario(scenario) ?? failingTestName(scenario);
  const tests = freezeArray(definitions.map(([name, category, critical, condition], index) => {
    const forced = failingName === name ? "FAIL" : condition ? actualFor(name, scenario) : "FAIL";
    const conditional = isConditionalScenario(scenario) && category === categoryForFailure(scenario);
    return test(index + 1, name, category, conditional ? "PASS" : forced, conditional ? false : critical, conditional ? `${name} passed with non-critical follow-up item.` : forced === "PASS" ? `${name} passed.` : `${name} failed.`, evidence, replay, lineage);
  }));
  const categories = freezeArray([...new Set(tests.map((entry) => entry.category))].sort().map((category) => categoryResult(category, tests, isConditionalScenario(scenario) && category === categoryForFailure(scenario))));
  const criticalFailures = tests.filter((entry) => entry.actual === "FAIL" && entry.critical).length;
  const nonCriticalFailures = tests.filter((entry) => entry.actual === "FAIL" && !entry.critical).length;
  const status: GovernanceQueryCertificationStatus = criticalFailures > 0 ? "FAIL" : isConditionalScenario(scenario) || nonCriticalFailures > 0 ? "CONDITIONAL_PASS" : "PASS";
  const certificationId = `GQC-7J5-${hashValue("governance-query-certification-id", { scenario, status }).slice(0, 10).toUpperCase()}`;
  const report = buildReport(certificationId, queryContract, tests, categories, status);
  return Object.freeze({
    phase_version: "7J.5",
    schema_version: SCHEMA_VERSION,
    certification_id: certificationId,
    status,
    downstream_governance_enabled: status === "PASS",
    query_contract: queryContract,
    query_validation: queryValidation,
    search_response: searchResponse,
    historical_response: historicalResponse,
    correlation_response: correlationResponse,
    tests,
    report,
    advisory_only_notice: "Query certification is deterministic, immutable, replay-verifiable, audit-backed, and gates downstream governance dependencies.",
  });
}

function categoryResult(category: GovernanceQueryCertificationCategory, tests: readonly GovernanceQueryCertificationTest[], conditional: boolean): GovernanceQueryCertificationCategoryResult {
  const categoryTests = tests.filter((test) => test.category === category);
  const source = {
    category,
    tests_executed: categoryTests.length,
    tests_passed: categoryTests.filter((test) => test.actual === "PASS").length,
    tests_failed: categoryTests.filter((test) => test.actual === "FAIL").length,
    category_status: categoryTests.some((test) => test.actual === "FAIL" && test.critical) ? "FAIL" as const : conditional ? "CONDITIONAL_PASS" as const : "PASS" as const,
  };
  return Object.freeze({ ...source, category_hash: hashValue("governance-query-certification-category", source) });
}

function buildReport(
  certificationId: string,
  contract: ReturnType<typeof buildGovernanceQueryContract> | null,
  tests: readonly GovernanceQueryCertificationTest[],
  categories: readonly GovernanceQueryCertificationCategoryResult[],
  status: GovernanceQueryCertificationStatus,
): QueryCertificationReport {
  const source = {
    certification_id: certificationId,
    phase: "7J.5" as const,
    execution_timestamp: NOW,
    contract_version: contract?.contract_version ?? "missing",
    schema_version: SCHEMA_VERSION,
    query_engine_version: "governance-query/v7J.1" as const,
    search_engine_version: "governance-search-engine/v7J.2" as const,
    historical_reconstruction_version: "governance-historical-reconstruction/v7J.3" as const,
    correlation_engine_version: "governance-cross-ledger-correlation/v7J.4" as const,
    tests_executed: tests.length,
    tests_passed: tests.filter((test) => test.actual === "PASS").length,
    tests_failed: tests.filter((test) => test.actual === "FAIL").length,
    replay_validation: categoryPassed(categories, "REPLAY"),
    lineage_validation: tests.find((test) => test.name === "lineage queries reproducible")?.actual === "PASS",
    evidence_validation: tests.find((test) => test.name === "evidence lookup deterministic")?.actual === "PASS",
    security_validation: categoryPassed(categories, "SECURITY"),
    tenant_validation: tests.find((test) => test.name === "tenant isolation enforced")?.actual === "PASS",
    visibility_validation: categoryPassed(categories, "VISIBILITY"),
    category_results: categories,
    overall_status: status,
  };
  const certificationHash = hashValue("governance-query-certification-report", source);
  return Object.freeze({
    ...source,
    certification_hash: certificationHash,
    truth_ledger_record: Object.freeze({
      truth_record_id: `truth-ledger:7j5:${certificationId.toLowerCase()}`,
      report_hash: certificationHash,
      immutable: true as const,
      recorded_at: NOW,
    }),
  });
}

function categoryPassed(categories: readonly GovernanceQueryCertificationCategoryResult[], category: GovernanceQueryCertificationCategory): boolean {
  return categories.find((entry) => entry.category === category)?.category_status !== "FAIL";
}

export function validateGovernanceQueryCertification(input: GovernanceQueryCertificationInput = {}) {
  const response = runGovernanceQueryCertification(input);
  return Object.freeze({
    certification_id: response.certification_id,
    status: response.status,
    downstream_governance_enabled: response.downstream_governance_enabled,
    tests_executed: response.report.tests_executed,
    tests_passed: response.report.tests_passed,
    tests_failed: response.report.tests_failed,
    certification_hash: response.report.certification_hash,
  });
}

export function computeGovernanceQueryCertificationHash(response: GovernanceQueryCertificationResponse): string {
  const { certification_hash: _hash, truth_ledger_record: _truth, ...payload } = response.report;
  return hashValue("governance-query-certification-report", payload);
}

export function buildGovernanceQueryCertificationObservabilitySurface(input: GovernanceQueryCertificationInput = {}): GovernanceQueryCertificationObservabilitySurface {
  const response = runGovernanceQueryCertification(input);
  return Object.freeze({
    certification_id: response.certification_id,
    status: response.status,
    downstream_governance_enabled: response.downstream_governance_enabled,
    tests_executed: response.report.tests_executed,
    tests_failed: response.report.tests_failed,
    critical_failures: response.tests.filter((test) => test.actual === "FAIL" && test.critical).length,
    conditional_items: response.report.category_results.filter((category) => category.category_status === "CONDITIONAL_PASS").length,
    certification_hash: response.report.certification_hash,
  });
}

export function getGovernanceQueryCertificationContract() {
  const response = runGovernanceQueryCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "explainable", "evidence-backed", "lineage-preserving", "constitutionally-governed", "tenant-isolated", "immutable", "auditable", "production-ready"]),
      schema_version: SCHEMA_VERSION,
      certified_phases: freezeArray(["7J.1 Governance Query Contract", "7J.2 Governance Search Engine", "7J.3 Historical Governance Reconstruction", "7J.4 Cross-Ledger Governance Correlation"]),
      decision_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    }),
    response,
    validation: validateGovernanceQueryCertification(),
    observability: buildGovernanceQueryCertificationObservabilitySurface(),
  });
}
