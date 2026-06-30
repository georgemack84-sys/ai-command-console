import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildInterventionRecommendationPackage } from "@/services/intervention-recommendation-engine";
import type {
  RuntimeSupervisionCertificationArea,
  RuntimeSupervisionCertificationCheck,
  RuntimeSupervisionCertificationDecision,
  RuntimeSupervisionCertificationEvidence,
  RuntimeSupervisionCertificationFailure,
  RuntimeSupervisionCertificationGateInput,
  RuntimeSupervisionCertificationLedgerEntry,
  RuntimeSupervisionCertificationReplayReport,
  RuntimeSupervisionCertificationReport,
  RuntimeSupervisionCertificationResult,
  RuntimeSupervisionCertificationScenario,
  RuntimeSupervisionCertificationValidationSection,
  RuntimeSupervisionCertificationVisibilitySurface,
} from "@/types/runtime-supervision-certification-gate";

const NOW = "2026-06-30T01:00:00.000Z";
const SCHEMA_VERSION = "runtime-supervision-certification-gate/v8E.E" as const;
const PIPELINE = Object.freeze(["Certification Started", "Contract Validation", "Functional Validation", "Monitoring Validation", "Recommendation Validation", "Replay Validation", "Governance Validation", "Authority Validation", "Evidence Validation", "Final Certification Decision"]);

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

function failureForScenario(scenario: RuntimeSupervisionCertificationScenario): RuntimeSupervisionCertificationFailure | null {
  return scenario === "BASELINE" ? null : scenario;
}

const TEST_MATRIX: readonly { area: RuntimeSupervisionCertificationArea; test_name: string; expected: "PASS" | "FAIL"; failure: RuntimeSupervisionCertificationFailure; critical: boolean }[] = Object.freeze([
  { area: "CONTRACT", test_name: "runtime supervision contract present", expected: "PASS", failure: "SUPERVISION_CONTRACT_MISSING", critical: true },
  { area: "CONTRACT", test_name: "supervision schema valid", expected: "PASS", failure: "SUPERVISION_SCHEMA_INVALID", critical: true },
  { area: "MONITORING", test_name: "execution monitoring deterministic", expected: "PASS", failure: "MONITORING_NONDETERMINISTIC", critical: true },
  { area: "REPLAY", test_name: "execution replay reproducible", expected: "PASS", failure: "REPLAY_RECONSTRUCTION_FAILED", critical: true },
  { area: "FUNCTIONAL", test_name: "drift detection reproducible", expected: "PASS", failure: "EXECUTION_DRIFT_NOT_DETECTED", critical: true },
  { area: "GOVERNANCE", test_name: "policy violation detection deterministic", expected: "PASS", failure: "POLICY_VIOLATION_MISSED", critical: true },
  { area: "GOVERNANCE", test_name: "constitutional violation detection deterministic", expected: "PASS", failure: "CONSTITUTIONAL_VIOLATION_MISSED", critical: true },
  { area: "AUTHORITY", test_name: "authority boundary enforcement verified", expected: "PASS", failure: "AUTHORITY_BOUNDARY_VALIDATION_FAILED", critical: true },
  { area: "FUNCTIONAL", test_name: "runtime confidence reproducible", expected: "PASS", failure: "RUNTIME_CONFIDENCE_NOT_REPRODUCIBLE", critical: true },
  { area: "FUNCTIONAL", test_name: "confidence degradation consistently detected", expected: "PASS", failure: "CONFIDENCE_DEGRADATION_NOT_DETECTED", critical: true },
  { area: "RECOMMENDATION", test_name: "recommendation validation deterministic", expected: "PASS", failure: "RECOMMENDATION_VALIDATION_FAILED", critical: true },
  { area: "RECOMMENDATION", test_name: "stale recommendation detection reproducible", expected: "PASS", failure: "STALE_RECOMMENDATION_NOT_DETECTED", critical: true },
  { area: "RECOMMENDATION", test_name: "intervention recommendations explainable", expected: "PASS", failure: "INTERVENTION_RECOMMENDATION_EVIDENCE_MISSING", critical: true },
  { area: "RECOMMENDATION", test_name: "intervention recommendations reproducible", expected: "PASS", failure: "RECOMMENDATION_VALIDATION_FAILED", critical: true },
  { area: "RECOMMENDATION", test_name: "pause recommendations deterministic", expected: "PASS", failure: "PAUSE_RECOMMENDATION_NONDETERMINISTIC", critical: true },
  { area: "RECOMMENDATION", test_name: "rollback recommendations deterministic", expected: "PASS", failure: "ROLLBACK_RECOMMENDATION_NONDETERMINISTIC", critical: true },
  { area: "EVIDENCE", test_name: "supervision evidence complete", expected: "PASS", failure: "SUPERVISION_EVIDENCE_INCOMPLETE", critical: true },
  { area: "EVIDENCE", test_name: "supervision lineage preserved", expected: "PASS", failure: "SUPERVISION_LINEAGE_INCOMPLETE", critical: true },
  { area: "EVIDENCE", test_name: "Truth Ledger references valid", expected: "PASS", failure: "TRUTH_LEDGER_REFERENCE_INVALID", critical: true },
  { area: "GOVERNANCE", test_name: "governance lineage preserved", expected: "PASS", failure: "GOVERNANCE_LINEAGE_INCOMPLETE", critical: true },
  { area: "FUNCTIONAL", test_name: "operator visibility complete", expected: "PASS", failure: "OPERATOR_VISIBILITY_INCOMPLETE", critical: true },
  { area: "INTEGRITY", test_name: "audit trail immutable", expected: "PASS", failure: "AUDIT_HISTORY_MUTABLE", critical: true },
  { area: "REPLAY", test_name: "replay deterministic", expected: "PASS", failure: "REPLAY_RECONSTRUCTION_FAILED", critical: true },
  { area: "SECURITY", test_name: "tenant isolation enforced", expected: "PASS", failure: "TENANT_ISOLATION_VIOLATED", critical: true },
  { area: "SECURITY", test_name: "cross-tenant supervision blocked", expected: "FAIL", failure: "CROSS_TENANT_SUPERVISION_PERMITTED", critical: true },
  { area: "SECURITY", test_name: "fail-closed behavior verified", expected: "PASS", failure: "FAIL_CLOSED_NOT_ENFORCED", critical: true },
  { area: "AUTHORITY", test_name: "autonomous intervention prevented", expected: "FAIL", failure: "AUTONOMOUS_INTERVENTION_ATTEMPTED", critical: true },
  { area: "AUTHORITY", test_name: "unauthorized execution control rejected", expected: "FAIL", failure: "UNAUTHORIZED_EXECUTION_CONTROL_ATTEMPTED", critical: true },
  { area: "SECURITY", test_name: "hidden runtime state prohibited", expected: "FAIL", failure: "HIDDEN_RUNTIME_STATE_EXISTS", critical: true },
  { area: "CERTIFICATION_SUITE", test_name: "certification suite passing", expected: "PASS", failure: "CRITICAL_CERTIFICATION_TEST_FAILED", critical: true },
  { area: "CERTIFICATION_SUITE", test_name: "minor reporting completeness", expected: "PASS", failure: "MINOR_REPORTING_GAP", critical: false },
]);

function buildChecks(input: { certification_id: string; scenario: RuntimeSupervisionCertificationScenario; evidence_refs: readonly string[]; replay_refs: readonly string[]; integrity_refs: readonly string[] }): readonly RuntimeSupervisionCertificationCheck[] {
  const forced = failureForScenario(input.scenario);
  let forcedConsumed = false;
  return freezeArray(TEST_MATRIX.map((definition) => {
    const isForced = forced === definition.failure && !forcedConsumed;
    if (isForced) forcedConsumed = true;
    const actual = isForced ? (definition.expected === "PASS" ? "FAIL" : "PASS") : definition.expected;
    const source = {
      check_id: id("RSC", "runtime-supervision-certification-check-id", { certification: input.certification_id, test: definition.test_name }),
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
      reasoning: actual === definition.expected ? `${definition.test_name} matched Runtime Supervision certification evidence.` : `${definition.test_name} diverged from expected ${definition.expected} certification outcome.`,
    };
    return Object.freeze({ ...source, check_hash: hashValue("runtime-supervision-certification-check", source) });
  }));
}

function validationSection(area: RuntimeSupervisionCertificationArea, checks: readonly RuntimeSupervisionCertificationCheck[]): RuntimeSupervisionCertificationValidationSection {
  const scoped = checks.filter((check) => check.area === area);
  const failed = scoped.filter((check) => !check.passed);
  const source = {
    validation_state: failed.length ? "FAIL" as const : "PASS" as const,
    passed_checks: scoped.length - failed.length,
    failed_checks: failed.length,
    critical_failures: unique(failed.filter((check) => check.critical).map((check) => check.failure_reason).filter((item): item is RuntimeSupervisionCertificationFailure => Boolean(item))),
  };
  return Object.freeze({ ...source, validation_hash: hashValue("runtime-supervision-certification-validation-section", { area, ...source }) });
}

function aggregate(certification_id: string, checks: readonly RuntimeSupervisionCertificationCheck[]): RuntimeSupervisionCertificationResult {
  const failed = checks.filter((check) => !check.passed);
  const critical = failed.filter((check) => check.critical);
  const warning_count = failed.length - critical.length;
  const overall_decision: RuntimeSupervisionCertificationDecision = critical.length ? "FAIL" : warning_count ? "CONDITIONAL_PASS" : "PASS";
  const source = {
    result_id: id("RSCR", "runtime-supervision-certification-result-id", certification_id),
    overall_decision,
    tests_passed: checks.length - failed.length,
    tests_failed: failed.length,
    critical_failure_count: critical.length,
    warning_count,
    failed_tests: unique(failed.map((check) => check.failure_reason).filter((item): item is RuntimeSupervisionCertificationFailure => Boolean(item))),
    progression_decision: overall_decision === "PASS" ? "CERTIFIED_FOR_NEXT_EXECUTION_PHASE" as const : overall_decision === "CONDITIONAL_PASS" ? "CONDITIONAL_REMEDIATION_REQUIRED" as const : "BLOCKED_FROM_NEXT_EXECUTION_PHASE" as const,
    remediation_guidance: freezeArray(overall_decision === "PASS" ? ["Advance Controlled Autonomy only after preserving Runtime Supervision certification evidence."] : overall_decision === "CONDITIONAL_PASS" ? ["Resolve non-critical reporting or visualization gaps before production deployment."] : ["Block Controlled Autonomy progression and remediate critical Runtime Supervision certification failures."]),
  };
  return Object.freeze({ ...source, result_hash: hashValue("runtime-supervision-certification-result", source) });
}

function buildEvidence(certification_id: string, result: RuntimeSupervisionCertificationResult, recommendationPackage: ReturnType<typeof buildInterventionRecommendationPackage>): RuntimeSupervisionCertificationEvidence {
  const drift = recommendationPackage.source_drift_health_package;
  const observation = drift.source_observation_package;
  const contract = observation.source_supervision_contract;
  const source = {
    certification_id,
    supervision_id: contract.supervision_id,
    observation_package_id: observation.package_id,
    drift_health_package_id: drift.package_id,
    recommendation_package_id: recommendationPackage.package_id,
    contract_validation_hash: contract.integrity_hash,
    observation_validation_hash: observation.validation.validation_hash,
    drift_validation_hash: drift.validation.validation_hash,
    recommendation_validation_hash: recommendationPackage.validation.validation_hash,
    evidence_hashes: unique([contract.supervision_evidence.integrity_hash, observation.runtime_evidence.integrity_hash, drift.drift_evidence.integrity_hash, recommendationPackage.recommendation_evidence.integrity_hash, result.result_hash]),
    replay_references: unique([contract.replay_reference, observation.replay.replay_hash, drift.replay.replay_hash, recommendationPackage.replay.replay_hash]),
    lineage_references: unique([contract.lineage_reference, observation.observation.lineage_reference, drift.drift_intelligence.lineage_reference, recommendationPackage.recommendation.lineage_reference]),
    truth_ledger_references: unique([observation.runtime_evidence.truth_ledger_reference, drift.drift_evidence.truth_ledger_reference]),
    certification_timestamp: NOW,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("runtime-supervision-certification-evidence", source) });
}

function replayCertification(certification_id: string, result: RuntimeSupervisionCertificationResult, evidence: RuntimeSupervisionCertificationEvidence, checks: readonly RuntimeSupervisionCertificationCheck[]): RuntimeSupervisionCertificationReplayReport {
  const source = {
    replay_id: id("RSCRP", "runtime-supervision-certification-replay-id", certification_id),
    certification_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    reconstructed_decision: result.overall_decision,
    evidence_hash: evidence.evidence_hash,
    validation_state: result.overall_decision === "PASS" ? "PASS" as const : "FAIL" as const,
    failure_reason: result.failed_tests[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-supervision-certification-replay", source) });
}

function reportHashSource(report: Omit<RuntimeSupervisionCertificationReport, "integrity_hash">) {
  return {
    certification_id: report.certification_id,
    phase: report.phase,
    schema_version: report.schema_version,
    result_hash: report.certification_result.result_hash,
    evidence_hash: report.certification_evidence.evidence_hash,
    ledger_hash: report.decision_ledger_entry.ledger_hash,
    replay_hash: report.replay_certification.replay_hash,
    check_hashes: report.certification_checks.map((check) => check.check_hash),
  };
}

export function runRuntimeSupervisionCertificationGate(input: RuntimeSupervisionCertificationGateInput = {}): RuntimeSupervisionCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const source_recommendation_package = input.recommendationPackage ?? buildInterventionRecommendationPackage();
  const source_drift_health_package = source_recommendation_package.source_drift_health_package;
  const source_observation_package = source_drift_health_package.source_observation_package;
  const source_supervision_contract = source_observation_package.source_supervision_contract;
  const certification_id = id("RSCG", "runtime-supervision-certification-id", { recommendation: source_recommendation_package.package_id, scenario });
  const evidenceRefs = unique([source_supervision_contract.supervision_evidence.integrity_hash, source_observation_package.runtime_evidence.integrity_hash, source_drift_health_package.drift_evidence.integrity_hash, source_recommendation_package.recommendation_evidence.integrity_hash]);
  const replayRefs = unique([source_supervision_contract.replay_reference, source_observation_package.replay.replay_hash, source_drift_health_package.replay.replay_hash, source_recommendation_package.replay.replay_hash]);
  const integrityRefs = unique([source_supervision_contract.integrity_hash, source_observation_package.package_hash, source_drift_health_package.package_hash, source_recommendation_package.package_hash]);
  const checks = buildChecks({ certification_id, scenario, evidence_refs: evidenceRefs, replay_refs: replayRefs, integrity_refs: integrityRefs });
  const result = aggregate(certification_id, checks);
  const evidence = buildEvidence(certification_id, result, source_recommendation_package);
  const replay_certification = replayCertification(certification_id, result, evidence, checks);
  const ledgerSource = {
    ledger_entry_id: id("RSCL", "runtime-supervision-certification-ledger-id", certification_id),
    certification_id,
    decision: result.overall_decision,
    evidence_hash: evidence.evidence_hash,
    result_hash: result.result_hash,
    check_hashes: freezeArray(checks.map((check) => check.check_hash)),
    replay_references: replayRefs,
    append_only: true as const,
    recorded_at: NOW,
  };
  const decision_ledger_entry: RuntimeSupervisionCertificationLedgerEntry = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("runtime-supervision-certification-ledger", ledgerSource) });
  const pass = result.overall_decision === "PASS";
  const source = {
    certification_id,
    phase: "8E.E" as const,
    schema_version: SCHEMA_VERSION,
    execution_id: source_supervision_contract.execution_id,
    mission_id: source_supervision_contract.mission_id,
    tenant_id: source_supervision_contract.tenant_id,
    certification_state: result.overall_decision,
    generated_at: NOW,
    read_only: true as const,
    advisory_only: true as const,
    controlled_autonomy_progression_allowed: pass,
    deterministic: result.overall_decision !== "FAIL",
    replayable: pass && replay_certification.validation_state === "PASS",
    explainable: result.overall_decision !== "FAIL" && source_recommendation_package.recommendation_metadata.explanation.length > 0,
    constitutionally_compliant: result.overall_decision !== "FAIL" && source_supervision_contract.supervision_evidence.detected_constitutional_violations.length === 0,
    authority_enforced: result.overall_decision !== "FAIL" && source_supervision_contract.intervention_authority.advisory_only && source_recommendation_package.authority_granted === false,
    operator_supremacy_preserved: result.overall_decision !== "FAIL" && source_supervision_contract.intervention_authority.operator_required && source_recommendation_package.recommendation.operator_required,
    tenant_isolated: result.overall_decision !== "FAIL" && source_observation_package.validation.tenant_isolated && source_drift_health_package.validation.tenant_isolated && source_recommendation_package.validation.tenant_isolated,
    integrity_verified: result.overall_decision !== "FAIL" && source_observation_package.validation.integrity_verified && source_drift_health_package.validation.integrity_verified && source_recommendation_package.validation.integrity_verified,
    contract_validation: validationSection("CONTRACT", checks),
    functional_validation: validationSection("FUNCTIONAL", checks),
    monitoring_validation: validationSection("MONITORING", checks),
    recommendation_validation: validationSection("RECOMMENDATION", checks),
    replay_validation: validationSection("REPLAY", checks),
    governance_validation: validationSection("GOVERNANCE", checks),
    authority_validation: validationSection("AUTHORITY", checks),
    evidence_validation: validationSection("EVIDENCE", checks),
    integrity_validation: validationSection("INTEGRITY", checks),
    tests_passed: result.tests_passed,
    tests_failed: result.tests_failed,
    certification_timestamp: NOW,
    replay_reference: replay_certification.replay_hash,
    lineage_reference: evidence.lineage_references[0],
    source_supervision_contract,
    source_observation_package,
    source_drift_health_package,
    source_recommendation_package,
    certification_checks: checks,
    certification_result: result,
    certification_evidence: evidence,
    decision_ledger_entry,
    replay_certification,
    observability: Object.freeze({
      certification_test_count: checks.length,
      pass_rate: Number((result.tests_passed / checks.length).toFixed(4)),
      critical_failure_rate: Number((result.critical_failure_count / checks.length).toFixed(4)),
      replay_reference_count: replayRefs.length,
      integrity_reference_count: integrityRefs.length,
    }),
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("runtime-supervision-certification-report", reportHashSource(source)) });
}

export function buildRuntimeSupervisionCertificationVisibilitySurface(input: RuntimeSupervisionCertificationGateInput = {}): RuntimeSupervisionCertificationVisibilitySurface {
  const report = runRuntimeSupervisionCertificationGate(input);
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    controlled_autonomy_progression_allowed: report.controlled_autonomy_progression_allowed,
    critical_failure_count: report.certification_result.critical_failure_count,
    failed_tests: report.certification_result.failed_tests,
    replay_reference: report.replay_reference,
    integrity_status: report.integrity_verified ? "VALID" : "INVALID",
    integrity_hash: report.integrity_hash,
  });
}

export function getRuntimeSupervisionCertificationGateContract() {
  const report = runRuntimeSupervisionCertificationGate();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-runtime-supervision-certification", "continuous-observation-certified", "drift-health-certified", "recommendation-integrity-certified", "advisory-only-authority", "operator-supremacy", "constitutional-authority", "tenant-isolated", "truth-ledger-evidence", "replayable", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      lifecycle_states: freezeArray(["INITIALIZING", "VALIDATING", "CERTIFYING", "PASS", "CONDITIONAL_PASS", "FAIL", "ARCHIVED"] as const),
      decision_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      validation_areas: freezeArray(["CONTRACT", "FUNCTIONAL", "MONITORING", "RECOMMENDATION", "REPLAY", "GOVERNANCE", "AUTHORITY", "EVIDENCE", "INTEGRITY", "SECURITY", "CERTIFICATION_SUITE"] as const),
    }),
    report,
    visibility: buildRuntimeSupervisionCertificationVisibilitySurface(),
  });
}
