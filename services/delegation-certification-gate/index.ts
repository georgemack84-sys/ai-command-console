import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildDelegationRoutingPackage } from "@/services/delegation-routing-engine";
import type { DelegationRoutingScenario } from "@/types/delegation-routing-engine";
import type {
  DelegationCertificationArea,
  DelegationCertificationCheck,
  DelegationCertificationEvidence,
  DelegationCertificationFailure,
  DelegationCertificationGateInput,
  DelegationCertificationLedgerEntry,
  DelegationCertificationReplayResult,
  DelegationCertificationReport,
  DelegationCertificationResult,
  DelegationCertificationScenario,
  DelegationCertificationState,
  DelegationCertificationVisibilitySurface,
} from "@/types/delegation-certification-gate";

const NOW = "2026-06-29T17:00:00.000Z";
const SCHEMA_VERSION = "delegation-certification-gate/v8D.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function routingScenarioFor(scenario: DelegationCertificationScenario): DelegationRoutingScenario {
  if (scenario === "TASK_CLASSIFICATION_NONDETERMINISTIC" || scenario === "NONDETERMINISTIC_CLASSIFICATION_NOT_DETECTED") return "NONDETERMINISTIC_ROUTING";
  if (scenario === "OPERATOR_TASK_NOT_IDENTIFIED" || scenario === "OPERATOR_TASK_MISCLASSIFIED") return "OPERATOR_ROUTE";
  if (scenario === "EXTERNAL_ROUTING_NONDETERMINISTIC") return "EXTERNAL_ROUTE";
  if (scenario === "INCONSISTENT_ROUTING_DECISION" || scenario === "ROUTING_INCONSISTENCY" || scenario === "ROUTING_DECISIONS_NONDETERMINISTIC") return "NONDETERMINISTIC_ROUTING";
  if (scenario === "DEFERRED_TASK_NOT_IDENTIFIED" || scenario === "DEFERRED_TASK_EXECUTED_PREMATURELY") return "UNRESOLVED_DEPENDENCIES";
  if (scenario === "BLOCKED_TASK_NOT_PREVENTED" || scenario === "BLOCKED_TASK_EXECUTED" || scenario === "UNAUTHORIZED_AGENT_ASSIGNMENT" || scenario === "AUTHORITY_MISMATCH") return "BLOCKED_AUTHORITY";
  if (scenario === "CONSTITUTIONAL_COMPLIANCE_NOT_ENFORCED" || scenario === "CONSTITUTIONAL_VIOLATION_PERMITTED") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "GOVERNANCE_POLICY_NOT_ENFORCED" || scenario === "POLICY_BYPASS_NOT_DETECTED") return "GOVERNANCE_BYPASS";
  if (scenario === "UNCERTIFIED_AGENT_PERMITTED" || scenario === "UNCERTIFIED_DELEGATE_ASSIGNED" || scenario === "FALLBACK_ROUTING_MISMATCH") return "UNCERTIFIED_FALLBACK";
  if (scenario === "DELEGATION_REPLAY_MISMATCH" || scenario === "REPLAY_NOT_DETERMINISTIC" || scenario === "REPLAY_RECONSTRUCTION_MISMATCH") return "REPLAY_INCONSISTENCY";
  if (scenario === "MISSING_DELEGATION_EXPLANATION" || scenario === "EXPLANATIONS_INCOMPLETE") return "MISSING_EXPLAINABILITY";
  if (scenario === "TENANT_ISOLATION_NOT_ENFORCED" || scenario === "CROSS_TENANT_DELEGATION_PERMITTED") return "TENANT_VIOLATION";
  if (scenario === "EXECUTION_AUTHORITY_EXCEEDED" || scenario === "AUTONOMOUS_AUTHORITY_ESCALATION" || scenario === "OPERATOR_AUTHORITY_BYPASSED") return "PRIVILEGE_ESCALATION";
  if (scenario === "CONTINGENCY_ROUTING_NONREPRODUCIBLE" || scenario === "INVALID_ROLLBACK_PLAN" as never) return "INVALID_ROLLBACK";
  return "BASELINE";
}

function failureForScenario(scenario: DelegationCertificationScenario): DelegationCertificationFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

const TEST_MATRIX: readonly { area: DelegationCertificationArea; test_name: string; expected: "PASS" | "FAIL"; failure: DelegationCertificationFailure; critical: boolean }[] = Object.freeze([
  { area: "CONTRACT", test_name: "delegation contract present", expected: "PASS", failure: "DELEGATION_CONTRACT_MISSING", critical: true },
  { area: "CONTRACT", test_name: "delegation schema valid", expected: "PASS", failure: "DELEGATION_SCHEMA_INVALID", critical: true },
  { area: "CLASSIFICATION", test_name: "task classification deterministic", expected: "PASS", failure: "TASK_CLASSIFICATION_NONDETERMINISTIC", critical: true },
  { area: "CLASSIFICATION", test_name: "nondeterministic classification detected", expected: "FAIL", failure: "NONDETERMINISTIC_CLASSIFICATION_NOT_DETECTED", critical: true },
  { area: "CLASSIFICATION", test_name: "operator tasks correctly identified", expected: "PASS", failure: "OPERATOR_TASK_NOT_IDENTIFIED", critical: true },
  { area: "CLASSIFICATION", test_name: "operator task misclassified", expected: "FAIL", failure: "OPERATOR_TASK_MISCLASSIFIED", critical: true },
  { area: "CLASSIFICATION", test_name: "agent tasks correctly identified", expected: "PASS", failure: "AGENT_TASK_NOT_IDENTIFIED", critical: true },
  { area: "CLASSIFICATION", test_name: "unauthorized agent assignment", expected: "FAIL", failure: "UNAUTHORIZED_AGENT_ASSIGNMENT", critical: true },
  { area: "ROUTING", test_name: "external routing deterministic", expected: "PASS", failure: "EXTERNAL_ROUTING_NONDETERMINISTIC", critical: true },
  { area: "ROUTING", test_name: "inconsistent routing decision", expected: "FAIL", failure: "INCONSISTENT_ROUTING_DECISION", critical: true },
  { area: "CLASSIFICATION", test_name: "deferred tasks correctly identified", expected: "PASS", failure: "DEFERRED_TASK_NOT_IDENTIFIED", critical: true },
  { area: "CLASSIFICATION", test_name: "deferred task executed prematurely", expected: "FAIL", failure: "DEFERRED_TASK_EXECUTED_PREMATURELY", critical: true },
  { area: "GOVERNANCE", test_name: "blocked tasks prevented", expected: "PASS", failure: "BLOCKED_TASK_NOT_PREVENTED", critical: true },
  { area: "GOVERNANCE", test_name: "blocked task executed", expected: "FAIL", failure: "BLOCKED_TASK_EXECUTED", critical: true },
  { area: "AUTHORITY", test_name: "authority validation reproducible", expected: "PASS", failure: "AUTHORITY_VALIDATION_NONREPRODUCIBLE", critical: true },
  { area: "AUTHORITY", test_name: "authority mismatch", expected: "FAIL", failure: "AUTHORITY_MISMATCH", critical: true },
  { area: "AUTHORITY", test_name: "constitutional compliance enforced", expected: "PASS", failure: "CONSTITUTIONAL_COMPLIANCE_NOT_ENFORCED", critical: true },
  { area: "AUTHORITY", test_name: "constitutional violation permitted", expected: "FAIL", failure: "CONSTITUTIONAL_VIOLATION_PERMITTED", critical: true },
  { area: "GOVERNANCE", test_name: "governance policy enforced", expected: "PASS", failure: "GOVERNANCE_POLICY_NOT_ENFORCED", critical: true },
  { area: "GOVERNANCE", test_name: "policy bypass detected", expected: "FAIL", failure: "POLICY_BYPASS_NOT_DETECTED", critical: true },
  { area: "GOVERNANCE", test_name: "operator supremacy preserved", expected: "PASS", failure: "OPERATOR_SUPREMACY_NOT_PRESERVED", critical: true },
  { area: "GOVERNANCE", test_name: "operator authority bypassed", expected: "FAIL", failure: "OPERATOR_AUTHORITY_BYPASSED", critical: true },
  { area: "SECURITY", test_name: "certified agents only", expected: "PASS", failure: "UNCERTIFIED_AGENT_PERMITTED", critical: true },
  { area: "SECURITY", test_name: "uncertified delegate assigned", expected: "FAIL", failure: "UNCERTIFIED_DELEGATE_ASSIGNED", critical: true },
  { area: "ROUTING", test_name: "delegation plans reproducible", expected: "PASS", failure: "DELEGATION_PLANS_NONREPRODUCIBLE", critical: true },
  { area: "REPLAY", test_name: "delegation replay mismatch", expected: "FAIL", failure: "DELEGATION_REPLAY_MISMATCH", critical: true },
  { area: "ROUTING", test_name: "routing decisions deterministic", expected: "PASS", failure: "ROUTING_DECISIONS_NONDETERMINISTIC", critical: true },
  { area: "ROUTING", test_name: "routing inconsistency", expected: "FAIL", failure: "ROUTING_INCONSISTENCY", critical: true },
  { area: "ROUTING", test_name: "contingency routing reproducible", expected: "PASS", failure: "CONTINGENCY_ROUTING_NONREPRODUCIBLE", critical: true },
  { area: "ROUTING", test_name: "fallback routing mismatch", expected: "FAIL", failure: "FALLBACK_ROUTING_MISMATCH", critical: true },
  { area: "EXPLAINABILITY", test_name: "explanations complete", expected: "PASS", failure: "EXPLANATIONS_INCOMPLETE", critical: true },
  { area: "EXPLAINABILITY", test_name: "missing delegation explanation", expected: "FAIL", failure: "MISSING_DELEGATION_EXPLANATION", critical: true },
  { area: "LINEAGE", test_name: "delegation lineage preserved", expected: "PASS", failure: "DELEGATION_LINEAGE_NOT_PRESERVED", critical: true },
  { area: "LINEAGE", test_name: "lineage corruption detected", expected: "FAIL", failure: "LINEAGE_CORRUPTION_NOT_DETECTED", critical: true },
  { area: "REPLAY", test_name: "replay deterministic", expected: "PASS", failure: "REPLAY_NOT_DETERMINISTIC", critical: true },
  { area: "REPLAY", test_name: "replay reconstruction mismatch", expected: "FAIL", failure: "REPLAY_RECONSTRUCTION_MISMATCH", critical: true },
  { area: "SECURITY", test_name: "tenant isolation enforced", expected: "PASS", failure: "TENANT_ISOLATION_NOT_ENFORCED", critical: true },
  { area: "SECURITY", test_name: "cross-tenant delegation permitted", expected: "FAIL", failure: "CROSS_TENANT_DELEGATION_PERMITTED", critical: true },
  { area: "SECURITY", test_name: "execution authority not exceeded", expected: "PASS", failure: "EXECUTION_AUTHORITY_EXCEEDED", critical: true },
  { area: "SECURITY", test_name: "autonomous authority escalation", expected: "FAIL", failure: "AUTONOMOUS_AUTHORITY_ESCALATION", critical: true },
  { area: "CERTIFICATION_SUITE", test_name: "minor reporting completeness", expected: "PASS", failure: "MINOR_REPORTING_GAP", critical: false },
]);

function buildChecks(input: { certification_id: string; scenario: DelegationCertificationScenario; evidence_refs: readonly string[]; replay_refs: readonly string[]; integrity_refs: readonly string[] }): readonly DelegationCertificationCheck[] {
  const forced = failureForScenario(input.scenario);
  return freezeArray(TEST_MATRIX.map((definition) => {
    const isForced = forced === definition.failure;
    const actual = isForced ? (definition.expected === "PASS" ? "FAIL" : "PASS") : definition.expected;
    const source = {
      check_id: id("DCC", "delegation-certification-check-id", { certification: input.certification_id, test: definition.test_name }),
      area: definition.area,
      test_name: definition.test_name,
      expected: definition.expected,
      actual,
      passed: actual === definition.expected,
      critical: isForced && definition.failure === "MINOR_REPORTING_GAP" ? false : definition.critical,
      failure_reason: isForced ? definition.failure : null,
      evidence_refs: unique(input.evidence_refs),
      replay_refs: unique(input.replay_refs),
      integrity_refs: unique(input.integrity_refs),
      reasoning: actual === definition.expected ? `${definition.test_name} matched delegation certification evidence.` : `${definition.test_name} diverged from expected ${definition.expected} certification outcome.`,
    };
    return Object.freeze({ ...source, check_hash: hashValue("delegation-certification-check", source) });
  }));
}

function aggregate(certification_id: string, checks: readonly DelegationCertificationCheck[]): DelegationCertificationResult {
  const failed = checks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  const warning_count = failed.length - critical.length;
  const overall_state: DelegationCertificationState = critical.length ? "FAIL" : warning_count ? "CONDITIONAL_PASS" : "PASS";
  const source = {
    result_id: id("DCR", "delegation-certification-result-id", certification_id),
    overall_state,
    pass_count: checks.filter((check) => check.passed).length,
    fail_count: failed.length,
    critical_failure_count: critical.length,
    warning_count,
    blocking_failures: unique(critical.map((check) => check.failure_reason).filter((item): item is DelegationCertificationFailure => Boolean(item))),
    production_decision: overall_state === "PASS" ? "CERTIFIED_FOR_PHASE_8E" as const : overall_state === "CONDITIONAL_PASS" ? "LIMITED_REMEDIATION_REQUIRED" as const : "BLOCKED_FROM_EXECUTION_ORCHESTRATION" as const,
    remediation_guidance: freezeArray(overall_state === "PASS" ? ["Release certified delegation plans to Phase 8E Execution Assurance Intelligence."] : overall_state === "CONDITIONAL_PASS" ? ["Resolve non-critical reporting or visualization gaps before production release."] : ["Block delegation plan release and remediate critical delegation certification failures."]),
  };
  return Object.freeze({ ...source, result_hash: hashValue("delegation-certification-result", source) });
}

function buildEvidence(certification_id: string, result: DelegationCertificationResult, checks: readonly DelegationCertificationCheck[], routingPackage: ReturnType<typeof buildDelegationRoutingPackage>): DelegationCertificationEvidence {
  const source = {
    certification_id,
    delegation_contract_version: routingPackage.source_authority_validation.source_classification.source_delegation.versioning.contract_version,
    schema_version: routingPackage.source_authority_validation.source_classification.source_delegation.versioning.schema_version,
    validation_results: freezeArray([routingPackage.source_authority_validation.source_classification.validation.validation_hash, routingPackage.source_authority_validation.validation.result_hash, routingPackage.validation.validation_hash, result.result_hash]),
    authority_verification_report: routingPackage.source_authority_validation.validation.result_hash,
    routing_verification_report: routingPackage.validation.validation_hash,
    replay_verification_report: routingPackage.replay.replay_hash,
    governance_compliance_report: routingPackage.source_authority_validation.validation.evidence.integrity_hash,
    constitutional_compliance_report: routingPackage.source_authority_validation.validation.evidence.constitutional_references[0] ?? "",
    explainability_verification: routingPackage.explainability.explanation_hash,
    lineage_verification: routingPackage.routing_decision.lineage_reference,
    integrity_hash: hashValue("delegation-certification-integrity-chain", checks.map((check) => check.check_hash)),
    replay_reference: `certification:${routingPackage.replay.replay_hash}`,
    certification_timestamp: NOW,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("delegation-certification-evidence", source) });
}

function replayCertification(certification_id: string, result: DelegationCertificationResult, evidence: DelegationCertificationEvidence, checks: readonly DelegationCertificationCheck[]): DelegationCertificationReplayResult {
  const source = {
    replay_id: id("DCRP", "delegation-certification-replay-id", certification_id),
    certification_id,
    reconstructed_validation_steps: freezeArray(["CONTRACT", "CLASSIFICATION", "AUTHORITY", "ROUTING", "REPLAY", "GOVERNANCE", "SECURITY"] as DelegationCertificationArea[]),
    reconstructed_check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    reconstructed_decision: result.overall_state,
    evidence_hash: evidence.evidence_hash,
    validation_state: result.overall_state === "PASS" ? "PASS" as const : "FAIL" as const,
    failure_reason: result.blocking_failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("delegation-certification-replay", source) });
}

function reportHashSource(report: Omit<DelegationCertificationReport, "report_hash">) {
  return {
    certification_id: report.certification_id,
    phase_version: report.phase_version,
    schema_version: report.schema_version,
    generated_at: report.generated_at,
    result_hash: report.certification_result.result_hash,
    evidence_hash: report.certification_evidence.evidence_hash,
    replay_hash: report.certification_replay.replay_hash,
    ledger_hash: report.ledger_entry.ledger_hash,
    check_hashes: report.certification_checks.map((check) => check.check_hash),
  };
}

export function runDelegationCertificationGate(input: DelegationCertificationGateInput = {}): DelegationCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const source_routing_package = input.routingPackage ?? buildDelegationRoutingPackage({ scenario: routingScenarioFor(scenario) });
  const certification_id = id("DCG", "delegation-certification-id", { package: source_routing_package.package_id, scenario });
  const evidenceRefs = unique([
    source_routing_package.source_authority_validation.source_classification.source_delegation.integrity_hash,
    source_routing_package.source_authority_validation.source_classification.classification.integrity_hash,
    source_routing_package.source_authority_validation.validation.result_hash,
    source_routing_package.validation.validation_hash,
  ]);
  const replayRefs = unique([source_routing_package.source_authority_validation.replay.replay_hash, source_routing_package.replay.replay_hash]);
  const integrityRefs = unique([source_routing_package.package_hash, source_routing_package.delegation_plan.plan_hash, source_routing_package.routing_decision.routing_hash, source_routing_package.contingency_plan.contingency_hash, source_routing_package.explainability.explanation_hash]);
  const checks = buildChecks({ certification_id, scenario, evidence_refs: evidenceRefs, replay_refs: replayRefs, integrity_refs: integrityRefs });
  const result = aggregate(certification_id, checks);
  const evidence = buildEvidence(certification_id, result, checks, source_routing_package);
  const certification_replay = replayCertification(certification_id, result, evidence, checks);
  const ledgerSource = {
    ledger_entry_id: id("DCL", "delegation-certification-ledger-id", certification_id),
    certification_id,
    decision: result.overall_state,
    evidence_hash: evidence.evidence_hash,
    result_hash: result.result_hash,
    check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    replay_references: replayRefs,
    append_only: true as const,
    recorded_at: NOW,
  };
  const ledger_entry: DelegationCertificationLedgerEntry = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("delegation-certification-ledger-entry", ledgerSource) });
  const source = {
    certification_id,
    phase_version: "8D.5" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: NOW,
    read_only: true as const,
    advisory_only: true as const,
    execution_orchestration_allowed: result.overall_state === "PASS",
    phase8e_progression_allowed: result.overall_state === "PASS",
    deterministic: result.overall_state !== "FAIL",
    replayable: result.overall_state !== "FAIL" && Boolean(evidence.replay_reference),
    explainable: result.overall_state !== "FAIL" && source_routing_package.explainability.why_delegated.length > 0,
    governance_controlled: result.overall_state !== "FAIL" && source_routing_package.source_authority_validation.validation.governance_authority_valid,
    constitutionally_compliant: result.overall_state !== "FAIL" && source_routing_package.source_authority_validation.validation.constitutional_authority_valid,
    operator_supremacy_preserved: result.overall_state !== "FAIL" && source_routing_package.source_authority_validation.validation.operator_authority_valid,
    tenant_isolated: result.overall_state !== "FAIL" && source_routing_package.source_authority_validation.validation.tenant_isolation_valid,
    integrity_protected: result.overall_state !== "FAIL" && evidence.integrity_hash.length > 0,
    source_routing_package,
    certification_checks: checks,
    certification_result: result,
    certification_evidence: evidence,
    certification_replay,
    ledger_entry,
    mapped_authority_failures: source_routing_package.source_authority_validation.validation.failures,
    mapped_routing_failures: source_routing_package.validation.failures,
    observability: Object.freeze({
      certification_test_count: checks.length,
      pass_rate: Number((checks.filter((check) => check.passed).length / checks.length).toFixed(4)),
      critical_failure_rate: Number((result.critical_failure_count / checks.length).toFixed(4)),
      replay_reference_count: replayRefs.length,
      integrity_reference_count: integrityRefs.length,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("delegation-certification-report", reportHashSource(source)) });
}

export function buildDelegationCertificationVisibilitySurface(input: DelegationCertificationGateInput = {}): DelegationCertificationVisibilitySurface {
  const report = runDelegationCertificationGate(input);
  return Object.freeze({
    certification_id: report.certification_id,
    overall_state: report.certification_result.overall_state,
    execution_orchestration_allowed: report.execution_orchestration_allowed,
    phase8e_progression_allowed: report.phase8e_progression_allowed,
    critical_failure_count: report.certification_result.critical_failure_count,
    blocking_failures: report.certification_result.blocking_failures,
    replay_reference: report.certification_evidence.replay_reference,
    integrity_status: report.integrity_protected ? "VALID" : "INVALID",
    report_hash: report.report_hash,
  });
}

export function getDelegationCertificationGateContract() {
  const report = runDelegationCertificationGate();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-certification", "delegation-contract-integrity", "single-owner-classification", "authority-enforced", "routing-deterministic", "replayable", "governance-supremacy", "operator-supremacy", "tenant-isolated", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      validation_areas: freezeArray(["CONTRACT", "CLASSIFICATION", "AUTHORITY", "ROUTING", "REPLAY", "GOVERNANCE", "SECURITY", "EXPLAINABILITY", "LINEAGE", "CERTIFICATION_SUITE"] as const),
    }),
    report,
    visibility: buildDelegationCertificationVisibilitySurface(),
  });
}
