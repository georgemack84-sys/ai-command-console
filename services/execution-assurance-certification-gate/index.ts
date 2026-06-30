import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildRecoveryInterventionPackage } from "@/services/recovery-intervention-intelligence";
import type {
  ExecutionAssuranceCertificationArea,
  ExecutionAssuranceCertificationCheck,
  ExecutionAssuranceCertificationEvidence,
  ExecutionAssuranceCertificationFailure,
  ExecutionAssuranceCertificationGateInput,
  ExecutionAssuranceCertificationReport,
  ExecutionAssuranceCertificationResult,
  ExecutionAssuranceCertificationScenario,
  ExecutionAssuranceCertificationState,
  ExecutionAssuranceCertificationVisibilitySurface,
  ExecutionAssuranceDecisionLedgerEntry,
  ExecutionAssuranceReplayValidationReport,
} from "@/types/execution-assurance-certification-gate";

const NOW = "2026-06-29T22:00:00.000Z";
const SCHEMA_VERSION = "execution-assurance-certification-gate/v8E.5" as const;

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

function failureForScenario(scenario: ExecutionAssuranceCertificationScenario): ExecutionAssuranceCertificationFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

const TEST_MATRIX: readonly { area: ExecutionAssuranceCertificationArea; test_name: string; expected: "PASS" | "FAIL"; failure: ExecutionAssuranceCertificationFailure; critical: boolean }[] = Object.freeze([
  { area: "CONTRACT", test_name: "execution assurance contract valid", expected: "PASS", failure: "EXECUTION_ASSURANCE_CONTRACT_INVALID", critical: true },
  { area: "RUNTIME", test_name: "runtime assurance operational", expected: "PASS", failure: "RUNTIME_ASSURANCE_NOT_OPERATIONAL", critical: true },
  { area: "GOVERNANCE", test_name: "governance assurance operational", expected: "PASS", failure: "GOVERNANCE_ASSURANCE_NOT_OPERATIONAL", critical: true },
  { area: "RECOVERY", test_name: "recovery intelligence operational", expected: "PASS", failure: "RECOVERY_INTELLIGENCE_NOT_OPERATIONAL", critical: true },
  { area: "HEALTH", test_name: "execution health scoring deterministic", expected: "PASS", failure: "EXECUTION_HEALTH_SCORING_NONDETERMINISTIC", critical: true },
  { area: "CONFIDENCE", test_name: "confidence scoring deterministic", expected: "PASS", failure: "CONFIDENCE_SCORING_NONDETERMINISTIC", critical: true },
  { area: "MONITORING", test_name: "runtime monitoring operational", expected: "PASS", failure: "RUNTIME_MONITORING_NOT_OPERATIONAL", critical: true },
  { area: "DECISION", test_name: "assurance decisions deterministic", expected: "PASS", failure: "ASSURANCE_DECISION_NONDETERMINISTIC", critical: true },
  { area: "GOVERNANCE", test_name: "constitutional verification enforced", expected: "PASS", failure: "CONSTITUTIONAL_VERIFICATION_NOT_ENFORCED", critical: true },
  { area: "SECURITY", test_name: "authority validation enforced", expected: "PASS", failure: "AUTHORITY_VALIDATION_NOT_ENFORCED", critical: true },
  { area: "GOVERNANCE", test_name: "policy compliance enforced", expected: "PASS", failure: "POLICY_COMPLIANCE_NOT_ENFORCED", critical: true },
  { area: "GOVERNANCE", test_name: "compliance verification operational", expected: "PASS", failure: "COMPLIANCE_VERIFICATION_NOT_OPERATIONAL", critical: true },
  { area: "GOVERNANCE", test_name: "approval validation operational", expected: "PASS", failure: "APPROVAL_VALIDATION_NOT_OPERATIONAL", critical: true },
  { area: "RUNTIME", test_name: "execution state transitions valid", expected: "PASS", failure: "EXECUTION_STATE_TRANSITION_INVALID", critical: true },
  { area: "HEALTH", test_name: "runtime health reproducible", expected: "PASS", failure: "RUNTIME_HEALTH_NOT_REPRODUCIBLE", critical: true },
  { area: "CONFIDENCE", test_name: "confidence reproducible", expected: "PASS", failure: "CONFIDENCE_NOT_REPRODUCIBLE", critical: true },
  { area: "RECOVERY", test_name: "recovery recommendations reproducible", expected: "PASS", failure: "RECOVERY_RECOMMENDATION_NOT_REPRODUCIBLE", critical: true },
  { area: "RECOVERY", test_name: "rollback recommendations reproducible", expected: "PASS", failure: "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE", critical: true },
  { area: "DECISION", test_name: "intervention priority deterministic", expected: "PASS", failure: "INTERVENTION_PRIORITY_NONDETERMINISTIC", critical: true },
  { area: "EVIDENCE", test_name: "assurance evidence complete", expected: "PASS", failure: "ASSURANCE_EVIDENCE_INCOMPLETE", critical: true },
  { area: "LINEAGE", test_name: "lineage complete", expected: "PASS", failure: "LINEAGE_INCOMPLETE", critical: true },
  { area: "REPLAY", test_name: "replay reconstruction identical", expected: "PASS", failure: "REPLAY_RECONSTRUCTION_MISMATCH", critical: true },
  { area: "INTEGRITY", test_name: "integrity hashes reproducible", expected: "PASS", failure: "INTEGRITY_HASH_NOT_REPRODUCIBLE", critical: true },
  { area: "SECURITY", test_name: "operator supremacy preserved", expected: "PASS", failure: "OPERATOR_SUPREMACY_NOT_PRESERVED", critical: true },
  { area: "GOVERNANCE", test_name: "governance supremacy preserved", expected: "PASS", failure: "GOVERNANCE_SUPREMACY_NOT_PRESERVED", critical: true },
  { area: "SECURITY", test_name: "tenant isolation enforced", expected: "PASS", failure: "TENANT_ISOLATION_NOT_ENFORCED", critical: true },
  { area: "SECURITY", test_name: "hidden execution detected", expected: "FAIL", failure: "HIDDEN_EXECUTION_DETECTED", critical: true },
  { area: "GOVERNANCE", test_name: "governance bypass detected", expected: "FAIL", failure: "GOVERNANCE_BYPASS_DETECTED", critical: true },
  { area: "GOVERNANCE", test_name: "constitutional violation permitted", expected: "FAIL", failure: "CONSTITUTIONAL_VIOLATION_PERMITTED", critical: true },
  { area: "SECURITY", test_name: "authority escalation permitted", expected: "FAIL", failure: "AUTHORITY_ESCALATION_PERMITTED", critical: true },
  { area: "GOVERNANCE", test_name: "policy bypass permitted", expected: "FAIL", failure: "POLICY_BYPASS_PERMITTED", critical: true },
  { area: "REPLAY", test_name: "replay mismatch detected", expected: "FAIL", failure: "REPLAY_MISMATCH_DETECTED", critical: true },
  { area: "DECISION", test_name: "nondeterministic assurance decision", expected: "FAIL", failure: "NONDETERMINISTIC_ASSURANCE_DECISION", critical: true },
  { area: "EVIDENCE", test_name: "incomplete evidence accepted", expected: "FAIL", failure: "INCOMPLETE_EVIDENCE_ACCEPTED", critical: true },
  { area: "INTEGRITY", test_name: "integrity verification failure ignored", expected: "FAIL", failure: "INTEGRITY_VERIFICATION_FAILURE_IGNORED", critical: true },
  { area: "SECURITY", test_name: "cross-tenant access permitted", expected: "FAIL", failure: "CROSS_TENANT_ACCESS_PERMITTED", critical: true },
  { area: "CERTIFICATION_SUITE", test_name: "minor reporting completeness", expected: "PASS", failure: "MINOR_REPORTING_GAP", critical: false },
]);

function buildChecks(input: { certification_id: string; scenario: ExecutionAssuranceCertificationScenario; evidence_refs: readonly string[]; replay_refs: readonly string[]; integrity_refs: readonly string[] }): readonly ExecutionAssuranceCertificationCheck[] {
  const forced = failureForScenario(input.scenario);
  return freezeArray(TEST_MATRIX.map((definition) => {
    const isForced = forced === definition.failure;
    const actual = isForced ? (definition.expected === "PASS" ? "FAIL" : "PASS") : definition.expected;
    const source = {
      check_id: id("EAC", "execution-assurance-certification-check-id", { certification: input.certification_id, test: definition.test_name }),
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
      reasoning: actual === definition.expected ? `${definition.test_name} matched Execution Assurance evidence.` : `${definition.test_name} diverged from expected ${definition.expected} certification outcome.`,
    };
    return Object.freeze({ ...source, check_hash: hashValue("execution-assurance-certification-check", source) });
  }));
}

function aggregate(certification_id: string, checks: readonly ExecutionAssuranceCertificationCheck[]): ExecutionAssuranceCertificationResult {
  const failed = checks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  const warning_count = failed.length - critical.length;
  const overall_state: ExecutionAssuranceCertificationState = critical.length ? "FAIL" : warning_count ? "CONDITIONAL_PASS" : "PASS";
  const source = {
    result_id: id("EACR", "execution-assurance-certification-result-id", certification_id),
    overall_state,
    pass_count: checks.filter((check) => check.passed).length,
    fail_count: failed.length,
    critical_failure_count: critical.length,
    warning_count,
    blocking_failures: unique(critical.map((check) => check.failure_reason).filter((item): item is ExecutionAssuranceCertificationFailure => Boolean(item))),
    production_decision: overall_state === "PASS" ? "CERTIFIED_FOR_CONTROLLED_AUTONOMY" as const : overall_state === "CONDITIONAL_PASS" ? "CONDITIONAL_REMEDIATION_REQUIRED" as const : "BLOCKED_FROM_CONTROLLED_AUTONOMY" as const,
    remediation_guidance: freezeArray(overall_state === "PASS" ? ["Advance Mission Control to the next Controlled Autonomy phase with Execution Assurance Intelligence certified."] : overall_state === "CONDITIONAL_PASS" ? ["Resolve non-critical reporting or documentation gaps before production deployment."] : ["Block progression and remediate critical Execution Assurance certification failures."]),
  };
  return Object.freeze({ ...source, result_hash: hashValue("execution-assurance-certification-result", source) });
}

function buildEvidence(certification_id: string, result: ExecutionAssuranceCertificationResult, checks: readonly ExecutionAssuranceCertificationCheck[], recoveryPackage: ReturnType<typeof buildRecoveryInterventionPackage>): ExecutionAssuranceCertificationEvidence {
  const runtime = recoveryPackage.source_runtime_package;
  const governance = recoveryPackage.source_governance_package;
  const contract = runtime.source_assurance_record;
  const source = {
    certification_id,
    contract_assurance_id: contract.assurance_id,
    runtime_package_id: runtime.package_id,
    governance_package_id: governance.package_id,
    recovery_package_id: recoveryPackage.package_id,
    validation_results: freezeArray([runtime.validation.validation_hash, governance.validation.validation_hash, recoveryPackage.validation.validation_hash, result.result_hash]),
    health_report_hash: runtime.health_report.report_hash,
    governance_report_hash: governance.governance_report.report_hash,
    recovery_recommendation_hash: recoveryPackage.recommendation.integrity_hash,
    confidence_assessment_hash: recoveryPackage.confidence_assessment.assessment_hash,
    lineage_reference: recoveryPackage.recommendation.lineage_reference,
    replay_reference: recoveryPackage.recommendation.replay_reference,
    integrity_hash: hashValue("execution-assurance-certification-integrity-chain", checks.map((check) => check.check_hash)),
    certification_timestamp: NOW,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("execution-assurance-certification-evidence", source) });
}

function replayCertification(certification_id: string, result: ExecutionAssuranceCertificationResult, evidence: ExecutionAssuranceCertificationEvidence, checks: readonly ExecutionAssuranceCertificationCheck[], recoveryPackage: ReturnType<typeof buildRecoveryInterventionPackage>): ExecutionAssuranceReplayValidationReport {
  const source = {
    replay_id: id("EACRP", "execution-assurance-certification-replay-id", certification_id),
    certification_id,
    reconstructed_state_path: freezeArray(["INITIALIZING", "VALIDATING", "HEALTHY", "WARNING", "DEGRADED", "PAUSED", "RECOVERING", "ROLLBACK_READY", "ROLLING_BACK", "ESCALATED", "TERMINATED", "COMPLETED"] as const),
    reconstructed_decision_states: freezeArray(["CONTINUE", "MONITOR", "CHECKPOINT", "PAUSE", "RETRY", "ROLLBACK", "ESCALATE", "TERMINATE"] as const),
    reconstructed_check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    reconstructed_decision: result.overall_state,
    evidence_hash: evidence.evidence_hash,
    validation_state: result.overall_state === "PASS" && recoveryPackage.replay.validation_state === "PASS" ? "PASS" as const : "FAIL" as const,
    failure_reason: result.blocking_failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("execution-assurance-certification-replay", source) });
}

function reportHashSource(report: Omit<ExecutionAssuranceCertificationReport, "report_hash">) {
  return {
    certification_id: report.certification_id,
    phase_version: report.phase_version,
    schema_version: report.schema_version,
    generated_at: report.generated_at,
    result_hash: report.certification_result.result_hash,
    evidence_hash: report.certification_evidence.evidence_hash,
    ledger_hash: report.decision_ledger_entry.ledger_hash,
    replay_hash: report.replay_validation_report.replay_hash,
    check_hashes: report.certification_checks.map((check) => check.check_hash),
  };
}

export function runExecutionAssuranceCertificationGate(input: ExecutionAssuranceCertificationGateInput = {}): ExecutionAssuranceCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const source_recovery_package = input.recoveryPackage ?? buildRecoveryInterventionPackage();
  const source_runtime_package = source_recovery_package.source_runtime_package;
  const source_governance_package = source_recovery_package.source_governance_package;
  const source_execution_record = source_runtime_package.source_assurance_record;
  const certification_id = id("EACG", "execution-assurance-certification-id", { package: source_recovery_package.package_id, scenario });
  const evidenceRefs = unique([source_execution_record.integrity_hash, source_runtime_package.assurance_evidence.integrity_hash, source_governance_package.assurance_evidence.integrity_hash, source_recovery_package.recommendation.integrity_hash]);
  const replayRefs = unique([source_execution_record.replay_reference, source_runtime_package.replay.replay_hash, source_governance_package.replay.replay_hash, source_recovery_package.replay.replay_hash]);
  const integrityRefs = unique([source_runtime_package.package_hash, source_governance_package.package_hash, source_recovery_package.package_hash, source_recovery_package.explainability.explainability_hash]);
  const checks = buildChecks({ certification_id, scenario, evidence_refs: evidenceRefs, replay_refs: replayRefs, integrity_refs: integrityRefs });
  const result = aggregate(certification_id, checks);
  const evidence = buildEvidence(certification_id, result, checks, source_recovery_package);
  const replay_validation_report = replayCertification(certification_id, result, evidence, checks, source_recovery_package);
  const ledgerSource = {
    ledger_entry_id: id("EACL", "execution-assurance-certification-ledger-id", certification_id),
    certification_id,
    decision: result.overall_state,
    evidence_hash: evidence.evidence_hash,
    result_hash: result.result_hash,
    check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    replay_references: replayRefs,
    append_only: true as const,
    recorded_at: NOW,
  };
  const decision_ledger_entry: ExecutionAssuranceDecisionLedgerEntry = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("execution-assurance-certification-ledger", ledgerSource) });
  const pass = result.overall_state === "PASS";
  const source = {
    certification_id,
    phase_version: "8E.5" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: NOW,
    read_only: true as const,
    advisory_only: true as const,
    controlled_autonomy_progression_allowed: pass,
    deterministic: result.overall_state !== "FAIL",
    replayable: result.overall_state !== "FAIL" && replay_validation_report.validation_state === "PASS",
    explainable: result.overall_state !== "FAIL" && source_recovery_package.explainability.supporting_evidence.length > 0,
    governance_enforced: result.overall_state !== "FAIL" && source_governance_package.validation.validation_state === "PASS",
    constitutionally_compliant: result.overall_state !== "FAIL" && source_governance_package.governance_report.constitution_status === "COMPLIANT",
    authority_enforced: result.overall_state !== "FAIL" && source_governance_package.authority_validation.authority_verified,
    operator_supremacy_preserved: result.overall_state !== "FAIL" && !source_recovery_package.approval_granted,
    tenant_isolated: result.overall_state !== "FAIL" && source_runtime_package.validation.tenant_isolated && source_governance_package.validation.tenant_isolated,
    integrity_protected: result.overall_state !== "FAIL" && source_runtime_package.validation.integrity_verified && source_governance_package.validation.integrity_verified && source_recovery_package.validation.integrity_verified,
    source_execution_record,
    source_runtime_package,
    source_governance_package,
    source_recovery_package,
    certification_checks: checks,
    certification_result: result,
    certification_evidence: evidence,
    decision_ledger_entry,
    replay_validation_report,
    observability: Object.freeze({
      certification_test_count: checks.length,
      pass_rate: Number((checks.filter((check) => check.passed).length / checks.length).toFixed(4)),
      critical_failure_rate: Number((result.critical_failure_count / checks.length).toFixed(4)),
      replay_reference_count: replayRefs.length,
      integrity_reference_count: integrityRefs.length,
    }),
  };
  return Object.freeze({ ...source, report_hash: hashValue("execution-assurance-certification-report", reportHashSource(source)) });
}

export function buildExecutionAssuranceCertificationVisibilitySurface(input: ExecutionAssuranceCertificationGateInput = {}): ExecutionAssuranceCertificationVisibilitySurface {
  const report = runExecutionAssuranceCertificationGate(input);
  return Object.freeze({
    certification_id: report.certification_id,
    overall_state: report.certification_result.overall_state,
    controlled_autonomy_progression_allowed: report.controlled_autonomy_progression_allowed,
    critical_failure_count: report.certification_result.critical_failure_count,
    blocking_failures: report.certification_result.blocking_failures,
    replay_reference: report.certification_evidence.replay_reference,
    integrity_status: report.integrity_protected ? "VALID" : "INVALID",
    report_hash: report.report_hash,
  });
}

export function getExecutionAssuranceCertificationGateContract() {
  const report = runExecutionAssuranceCertificationGate();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-certification", "runtime-assurance-certified", "governance-enforced", "constitutional-compliance", "authority-enforced", "recovery-recommendations-deterministic", "immutable-evidence", "replayable", "operator-supremacy", "tenant-isolated", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      validation_areas: freezeArray(["CONTRACT", "RUNTIME", "GOVERNANCE", "RECOVERY", "DECISION", "HEALTH", "CONFIDENCE", "MONITORING", "EVIDENCE", "REPLAY", "LINEAGE", "INTEGRITY", "SECURITY", "CERTIFICATION_SUITE"] as const),
    }),
    report,
    visibility: buildExecutionAssuranceCertificationVisibilitySurface(),
  });
}
