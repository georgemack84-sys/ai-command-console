import { runAdaptiveSecuritySafetyBoundaries } from "@/services/adaptive-security-safety-boundaries";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptiveSecuritySafetyBoundariesResult } from "@/types/adaptive-security-safety-boundaries";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AdaptiveArchitectureCertification,
  AdaptiveArchitectureCertificationArea,
  AdaptiveArchitectureCertificationDashboard,
  AdaptiveArchitectureCertificationGateFoundation,
  AdaptiveArchitectureCertificationGateInput,
  AdaptiveArchitectureCertificationGateResult,
  AdaptiveArchitectureCertificationReport,
  AdaptiveArchitectureCertificationState,
  AdaptiveArchitectureCertificationTest,
  AdaptiveArchitectureCertificationValidation,
  AdaptiveArchitectureFailure,
  AdaptiveArchitectureValidationState,
  AdaptiveCertificationEvidencePackage,
  AdaptiveCertificationLedgerRecord,
  AdaptiveProductionReadinessReport,
} from "@/types/adaptive-architecture-certification-gate";

const CERTIFICATION_GATE_VERSION = "adaptive-architecture-certification-gate/v1" as const;

export const ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE: readonly AdaptiveArchitectureCertificationArea[] = Object.freeze(["CONTRACT_FOUNDATION", "DOMAIN_BOUNDARY", "LEARNING_PERMISSION", "STATE_MACHINE", "AUTHORITY_GOVERNANCE", "REPLAY_TRACEABILITY", "OPERATOR_APPROVAL", "ADAPTIVE_LEDGER", "SECURITY_SAFETY", "PRODUCTION_READINESS"]);

type Scenario = NonNullable<AdaptiveArchitectureCertificationGateInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function pass(value: boolean): AdaptiveArchitectureValidationState {
  return value ? "PASS" : "FAIL";
}

function sourceForScenario(input: AdaptiveArchitectureCertificationGateInput, scenario: Scenario): AdaptiveSecuritySafetyBoundariesResult {
  if (input.security_boundaries) return input.security_boundaries;
  if (scenario === "HIDDEN_LEARNING") return runAdaptiveSecuritySafetyBoundaries({ scenario: "HIDDEN_LEARNING" });
  if (scenario === "HIDDEN_MEMORY") return runAdaptiveSecuritySafetyBoundaries({ scenario: "HIDDEN_MEMORY" });
  if (scenario === "SELF_MODIFICATION") return runAdaptiveSecuritySafetyBoundaries({ scenario: "SELF_MODIFICATION" });
  if (scenario === "UNAUTHORIZED_ADAPTATION") return runAdaptiveSecuritySafetyBoundaries({ scenario: "UNAUTHORIZED_ADAPTATION" });
  if (scenario === "REPLAY_OMISSION") return runAdaptiveSecuritySafetyBoundaries({ scenario: "MISSING_REPLAY_REFS" });
  if (scenario === "GOVERNANCE_BYPASS") return runAdaptiveSecuritySafetyBoundaries({ scenario: "GOVERNANCE_BYPASS" });
  if (scenario === "LEDGER_MUTATION") return runAdaptiveSecuritySafetyBoundaries({ scenario: "LEDGER_MODIFICATION" });
  if (scenario === "INTEGRITY_FAILURE") return runAdaptiveSecuritySafetyBoundaries({ scenario: "HASH_MISMATCH" });
  if (scenario === "TENANT_FAILURE") return runAdaptiveSecuritySafetyBoundaries({ scenario: "TENANT_VIOLATION" });
  return runAdaptiveSecuritySafetyBoundaries();
}

function visibleToRole(source: AdaptiveSecuritySafetyBoundariesResult, role: VisibilityRole): boolean {
  return source.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

const MATRIX: readonly [AdaptiveArchitectureCertificationArea, string][] = Object.freeze([
  ["CONTRACT_FOUNDATION", "Adaptive Intelligence Contract valid"],
  ["CONTRACT_FOUNDATION", "Contract schema validated"],
  ["CONTRACT_FOUNDATION", "Contract version deterministic"],
  ["DOMAIN_BOUNDARY", "Allowed adaptive domains enforced"],
  ["DOMAIN_BOUNDARY", "Restricted and prohibited domains blocked"],
  ["LEARNING_PERMISSION", "Learning Permission Registry operational"],
  ["LEARNING_PERMISSION", "Unauthorized learning rejected"],
  ["STATE_MACHINE", "Adaptation State Machine deterministic"],
  ["STATE_MACHINE", "Invalid lifecycle transitions blocked"],
  ["AUTHORITY_GOVERNANCE", "Governance binding mandatory"],
  ["AUTHORITY_GOVERNANCE", "Constitutional compliance enforced"],
  ["AUTHORITY_GOVERNANCE", "Authority expansion blocked"],
  ["AUTHORITY_GOVERNANCE", "Separation of duties enforced"],
  ["OPERATOR_APPROVAL", "Operator approval mandatory"],
  ["OPERATOR_APPROVAL", "Multi-level approval workflow validated"],
  ["REPLAY_TRACEABILITY", "Replay binding required"],
  ["REPLAY_TRACEABILITY", "Replay metadata complete"],
  ["REPLAY_TRACEABILITY", "Replay reconstruction deterministic"],
  ["REPLAY_TRACEABILITY", "Lineage reconstruction complete"],
  ["ADAPTIVE_LEDGER", "Adaptive Intelligence Ledger append-only"],
  ["ADAPTIVE_LEDGER", "Ledger replay reconstruction verified"],
  ["ADAPTIVE_LEDGER", "Integrity hashes reproducible"],
  ["ADAPTIVE_LEDGER", "Tenant isolation preserved"],
  ["SECURITY_SAFETY", "Hidden learning detected"],
  ["SECURITY_SAFETY", "Hidden memory detected"],
  ["SECURITY_SAFETY", "Self-modification prevented"],
  ["SECURITY_SAFETY", "Authority escalation prevented"],
  ["SECURITY_SAFETY", "Governance bypass rejected"],
  ["SECURITY_SAFETY", "Replay omission rejected"],
  ["SECURITY_SAFETY", "Unauthorized behavioral mutation rejected"],
  ["SECURITY_SAFETY", "Security policy registry enforced"],
  ["SECURITY_SAFETY", "Adaptive safety boundaries enforced"],
  ["PRODUCTION_READINESS", "Certification evidence complete"],
  ["PRODUCTION_READINESS", "Certification replay verified"],
  ["PRODUCTION_READINESS", "Contract certification report generated"],
]);

function failedAreas(scenario: Scenario): readonly AdaptiveArchitectureCertificationArea[] {
  if (["DOCUMENTATION_DEFICIENCY", "REPORTING_DEFICIENCY", "DASHBOARD_DEFICIENCY", "VISUALIZATION_DEFICIENCY"].includes(scenario)) return freezeArray([]);
  if (["REPLAY_DIVERGED", "REPLAY_OMISSION", "DETERMINISTIC_FAILURE"].includes(scenario)) return freezeArray(["REPLAY_TRACEABILITY"]);
  if (["GOVERNANCE_OMITTED", "GOVERNANCE_BYPASS"].includes(scenario)) return freezeArray(["AUTHORITY_GOVERNANCE"]);
  if (scenario === "CONSTITUTIONAL_WEAKENED") return freezeArray(["AUTHORITY_GOVERNANCE"]);
  if (scenario === "AUTHORITY_EXPANDED") return freezeArray(["AUTHORITY_GOVERNANCE"]);
  if (scenario === "OPERATOR_BYPASS") return freezeArray(["OPERATOR_APPROVAL"]);
  if (scenario === "TENANT_FAILURE") return freezeArray(["DOMAIN_BOUNDARY", "ADAPTIVE_LEDGER"]);
  if (["HIDDEN_LEARNING", "HIDDEN_MEMORY", "SELF_MODIFICATION", "UNAUTHORIZED_ADAPTATION"].includes(scenario)) return freezeArray(["SECURITY_SAFETY"]);
  if (scenario === "LEDGER_MUTATION") return freezeArray(["ADAPTIVE_LEDGER"]);
  if (["EVIDENCE_INCONSISTENT", "EVIDENCE_TAMPERING", "INTEGRITY_FAILURE", "CERTIFICATION_FORGERY", "UNCERTIFIED_DEPLOYMENT", "PARTIAL_CERTIFICATION", "HIDDEN_ARCHITECTURAL_CHANGE", "UNAUTHORIZED_PRODUCTION_PROMOTION", "FAIL_OPEN"].includes(scenario)) return freezeArray(["PRODUCTION_READINESS"]);
  if (scenario === "MANDATORY_TEST_FAILED") return freezeArray(["CONTRACT_FOUNDATION"]);
  if (scenario === "ADVISORY_ONLY_VIOLATION") return freezeArray(["CONTRACT_FOUNDATION", "OPERATOR_APPROVAL"]);
  return freezeArray([]);
}

function buildTests(source: AdaptiveSecuritySafetyBoundariesResult, scenario: Scenario): readonly AdaptiveArchitectureCertificationTest[] {
  const areas = failedAreas(scenario);
  return freezeArray(MATRIX.map(([area, description], index) => {
    const actual = pass(source.validation.validation_status === "VALID" && !areas.includes(area));
    const base: Omit<AdaptiveArchitectureCertificationTest, "integrity_hash"> = {
      test_id: `adaptive_architecture_test_${String(index + 1).padStart(3, "0")}`,
      area,
      description,
      expected: "PASS",
      actual,
      mandatory: true,
      evidence_refs: freezeArray([source.certification_report.report_id, source.safety_replay.replay_id, source.adaptive_ledger.certification_report.report_id]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function collectFailures(input: {
  source: AdaptiveSecuritySafetyBoundariesResult;
  tests: readonly AdaptiveArchitectureCertificationTest[];
  evidence: AdaptiveCertificationEvidencePackage | undefined;
  readiness: AdaptiveProductionReadinessReport | undefined;
  ledger: readonly AdaptiveCertificationLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveArchitectureFailure[] {
  const failures: AdaptiveArchitectureFailure[] = [];
  if (input.tests.some((test) => test.mandatory && test.actual !== "PASS") || input.scenario === "MANDATORY_TEST_FAILED") failures.push("MANDATORY_TEST_FAILED");
  if (input.scenario === "REPLAY_DIVERGED" || input.scenario === "DETERMINISTIC_FAILURE") failures.push(input.scenario === "DETERMINISTIC_FAILURE" ? "DETERMINISTIC_FAILURE" : "REPLAY_DIVERGED");
  if (input.scenario === "GOVERNANCE_OMITTED") failures.push("GOVERNANCE_OMITTED");
  if (input.scenario === "CONSTITUTIONAL_WEAKENED") failures.push("CONSTITUTIONAL_PROTECTION_WEAKENED");
  if (input.scenario === "AUTHORITY_EXPANDED") failures.push("AUTHORITY_EXPANDED");
  if (input.scenario === "ADVISORY_ONLY_VIOLATION") failures.push("ADVISORY_ONLY_VIOLATED");
  if (input.scenario === "OPERATOR_BYPASS") failures.push("OPERATOR_APPROVAL_BYPASSED");
  if (!input.source.validation.tenant_isolated || input.scenario === "TENANT_FAILURE") failures.push("TENANT_ISOLATION_COMPROMISED");
  if (input.scenario === "HIDDEN_LEARNING" || input.source.validation.failures.includes("HIDDEN_LEARNING_DETECTED")) failures.push("HIDDEN_LEARNING_DETECTED");
  if (input.scenario === "HIDDEN_MEMORY" || input.source.validation.failures.includes("HIDDEN_MEMORY_DETECTED")) failures.push("HIDDEN_MEMORY_DETECTED");
  if (input.scenario === "SELF_MODIFICATION" || input.source.validation.failures.includes("SELF_MODIFICATION_DETECTED")) failures.push("SELF_MODIFICATION_DETECTED");
  if (input.scenario === "UNAUTHORIZED_ADAPTATION" || input.source.validation.failures.includes("UNAUTHORIZED_ADAPTATION_DETECTED")) failures.push("UNAUTHORIZED_ADAPTATION_DETECTED");
  if (input.scenario === "REPLAY_OMISSION" || input.source.validation.failures.includes("REPLAY_REFERENCES_MISSING")) failures.push("REPLAY_OMISSION");
  if (input.scenario === "GOVERNANCE_BYPASS" || input.source.validation.failures.includes("GOVERNANCE_BYPASS_DETECTED")) failures.push("GOVERNANCE_BYPASS");
  if (input.scenario === "LEDGER_MUTATION" || input.source.validation.failures.includes("IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED")) failures.push("IMMUTABLE_LEDGER_MUTATION");
  if (input.scenario === "EVIDENCE_INCONSISTENT") failures.push("CERTIFICATION_EVIDENCE_INCONSISTENT");
  if (input.scenario === "INTEGRITY_FAILURE" || input.source.validation.failures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (input.scenario === "UNCERTIFIED_DEPLOYMENT") failures.push("UNCERTIFIED_ADAPTIVE_DEPLOYMENT");
  if (input.scenario === "PARTIAL_CERTIFICATION") failures.push("PARTIAL_CERTIFICATION_ATTEMPTED");
  if (input.scenario === "CERTIFICATION_FORGERY") failures.push("CERTIFICATION_FORGERY");
  if (input.scenario === "HIDDEN_ARCHITECTURAL_CHANGE") failures.push("HIDDEN_ARCHITECTURAL_CHANGE");
  if (input.scenario === "UNAUTHORIZED_PRODUCTION_PROMOTION") failures.push("UNAUTHORIZED_PRODUCTION_PROMOTION");
  if (input.scenario === "EVIDENCE_TAMPERING") failures.push("EVIDENCE_TAMPERING");
  if (input.scenario === "DOCUMENTATION_DEFICIENCY") failures.push("DOCUMENTATION_DEFICIENCY");
  if (input.scenario === "REPORTING_DEFICIENCY") failures.push("REPORTING_DEFICIENCY");
  if (input.scenario === "DASHBOARD_DEFICIENCY") failures.push("DASHBOARD_DEFICIENCY");
  if (input.scenario === "VISUALIZATION_DEFICIENCY") failures.push("VISUALIZATION_DEFICIENCY");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("CERTIFICATION_EVIDENCE_INCONSISTENT");
  if (input.evidence && (!input.evidence.immutable || !input.evidence.evidence_refs.length)) failures.push("CERTIFICATION_EVIDENCE_INCONSISTENT");
  if (input.readiness && !input.readiness.production_ready && !failures.some((failure) => ["DOCUMENTATION_DEFICIENCY", "REPORTING_DEFICIENCY", "DASHBOARD_DEFICIENCY", "VISUALIZATION_DEFICIENCY"].includes(failure))) failures.push("MANDATORY_TEST_FAILED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_CERTIFICATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function decisionFor(failures: readonly AdaptiveArchitectureFailure[]): AdaptiveArchitectureCertificationState {
  if (!failures.length) return "PASS";
  const conditional = ["DOCUMENTATION_DEFICIENCY", "REPORTING_DEFICIENCY", "DASHBOARD_DEFICIENCY", "VISUALIZATION_DEFICIENCY"];
  return failures.every((failure) => conditional.includes(failure)) ? "CONDITIONAL_PASS" : "FAIL";
}

function buildEvidence(source: AdaptiveSecuritySafetyBoundariesResult, scenario: Scenario): AdaptiveCertificationEvidencePackage {
  const refs = scenario === "EVIDENCE_INCONSISTENT" || scenario === "EVIDENCE_TAMPERING" ? freezeArray([]) : freezeArray([
    source.certification_report.report_id,
    source.adaptive_ledger.certification_report.report_id,
    source.adaptive_ledger.approval_framework.certification_report.report_id,
    source.adaptive_ledger.approval_framework.replay_traceability.certification_report.report_id,
  ]);
  const base: Omit<AdaptiveCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "adaptive_architecture_evidence_package",
    architectural_compliance_report: "evidence:architectural-compliance",
    replay_verification_report: "evidence:replay-verification",
    governance_compliance_report: "evidence:governance-compliance",
    constitutional_compliance_report: "evidence:constitutional-compliance",
    authority_validation_report: "evidence:authority-validation",
    operator_approval_validation_report: "evidence:operator-approval-validation",
    security_validation_report: "evidence:security-validation",
    ledger_integrity_report: "evidence:ledger-integrity",
    production_readiness_report: "evidence:production-readiness",
    immutable: scenario !== "EVIDENCE_TAMPERING",
    evidence_refs: refs,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "EVIDENCE_TAMPERING") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.evidence_package_id }) });
  return built;
}

function buildReadiness(source: AdaptiveSecuritySafetyBoundariesResult, tests: readonly AdaptiveArchitectureCertificationTest[], evidence: AdaptiveCertificationEvidencePackage, failures: readonly AdaptiveArchitectureFailure[]): AdaptiveProductionReadinessReport {
  const base: Omit<AdaptiveProductionReadinessReport, "integrity_hash"> = {
    report_id: "adaptive_architecture_production_readiness",
    all_components_certified: source.certification_report.certification_decision === "PASS",
    mandatory_validations_passed: tests.every((test) => test.actual === "PASS"),
    deterministic_replay_verified: source.safety_replay.replay_result === "PASS" && !failures.includes("REPLAY_DIVERGED") && !failures.includes("DETERMINISTIC_FAILURE"),
    governance_controls_active: source.boundary_enforcement.governance_approval_exists && !failures.includes("GOVERNANCE_OMITTED"),
    constitutional_protections_enforced: !failures.includes("CONSTITUTIONAL_PROTECTION_WEAKENED"),
    authority_boundaries_immutable: source.boundary_enforcement.authority_unchanged && !failures.includes("AUTHORITY_EXPANDED"),
    operator_approval_mandatory: source.adaptive_ledger.approval_framework.human_approval_required && !failures.includes("OPERATOR_APPROVAL_BYPASSED"),
    security_protections_operational: source.validation.validation_status === "VALID",
    rollback_verified: source.adaptive_ledger.certification_report.replay_complete,
    certification_evidence_complete: evidence.immutable && evidence.evidence_refs.length > 0,
    production_ready: false,
  };
  const {
    production_ready: _productionReady,
    ...readinessChecks
  } = base;
  const ready = { ...base, production_ready: Object.values(readinessChecks).every((value) => typeof value !== "boolean" || value) };
  return Object.freeze({ ...ready, integrity_hash: hashWithoutIntegrity(ready) });
}

function buildCertification(source: AdaptiveSecuritySafetyBoundariesResult, tests: readonly AdaptiveArchitectureCertificationTest[], failures: readonly AdaptiveArchitectureFailure[], state: AdaptiveArchitectureCertificationState): AdaptiveArchitectureCertification {
  const c = source.adaptive_ledger.records[0];
  const passed = tests.filter((test) => test.actual === "PASS").map((test) => test.test_id);
  const failed = tests.filter((test) => test.actual === "FAIL").map((test) => test.test_id);
  const base: Omit<AdaptiveArchitectureCertification, "integrity_hash"> = {
    certification_id: "adaptive_architecture_certification_001",
    certification_version: "10.0.10",
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    architecture_version: "phase-10.0",
    certification_scope: ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE,
    certification_tests: tests.map((test) => test.test_id),
    passed_tests: freezeArray(passed),
    failed_tests: freezeArray(failed),
    replay_validation: pass(!failures.includes("REPLAY_DIVERGED") && !failures.includes("REPLAY_OMISSION") && !failures.includes("DETERMINISTIC_FAILURE")),
    governance_validation: pass(!failures.includes("GOVERNANCE_OMITTED") && !failures.includes("GOVERNANCE_BYPASS")),
    constitutional_validation: pass(!failures.includes("CONSTITUTIONAL_PROTECTION_WEAKENED")),
    authority_validation: pass(!failures.includes("AUTHORITY_EXPANDED")),
    operator_validation: pass(!failures.includes("OPERATOR_APPROVAL_BYPASSED")),
    security_validation: pass(source.validation.validation_status === "VALID" && !failures.some((failure) => ["HIDDEN_LEARNING_DETECTED", "HIDDEN_MEMORY_DETECTED", "SELF_MODIFICATION_DETECTED", "UNAUTHORIZED_ADAPTATION_DETECTED"].includes(failure))),
    final_certification_state: state,
    certification_report_ref: "adaptive_architecture_certification_report",
    replay_refs: source.security_record.replay_refs,
    certified_by: "mission-control-certification-gate",
    certification_timestamp: "2026-07-05T10:01:40.000Z",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(certification: AdaptiveArchitectureCertification, evidence: AdaptiveCertificationEvidencePackage, scenario: Scenario): readonly AdaptiveCertificationLedgerRecord[] {
  const base: Omit<AdaptiveCertificationLedgerRecord, "integrity_hash"> = {
    record_id: "adaptive_certification_ledger_001",
    certification_id: certification.certification_id,
    architecture_version: certification.architecture_version,
    certification_state: certification.final_certification_state,
    passed_tests: certification.passed_tests,
    failed_tests: certification.failed_tests,
    governance_refs: freezeArray(["governance:adaptive-architecture", ...evidence.evidence_refs]),
    replay_refs: certification.replay_refs,
    evidence_refs: evidence.evidence_refs,
    certification_report_ref: certification.certification_report_ref,
    timestamp: certification.certification_timestamp,
    sequence_number: 1,
    append_only: (scenario === "EVIDENCE_TAMPERING" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildReport(source: AdaptiveSecuritySafetyBoundariesResult, readiness: AdaptiveProductionReadinessReport, failures: readonly AdaptiveArchitectureFailure[], state: AdaptiveArchitectureCertificationState): AdaptiveArchitectureCertificationReport {
  const has = (failure: AdaptiveArchitectureFailure) => failures.includes(failure);
  const base: Omit<AdaptiveArchitectureCertificationReport, "integrity_hash"> = {
    report_id: "adaptive_architecture_certification_report",
    tenant_id: source.adaptive_ledger.records[0].tenant_id,
    scope: ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE,
    deterministic_architecture_verified: !has("DETERMINISTIC_FAILURE"),
    constitutional_compliance_verified: !has("CONSTITUTIONAL_PROTECTION_WEAKENED"),
    governance_enforcement_verified: !has("GOVERNANCE_OMITTED") && !has("GOVERNANCE_BYPASS"),
    authority_boundaries_verified: !has("AUTHORITY_EXPANDED"),
    advisory_only_verified: !has("ADVISORY_ONLY_VIOLATED"),
    replay_traceability_verified: !has("REPLAY_DIVERGED") && !has("REPLAY_OMISSION"),
    operator_supremacy_verified: !has("OPERATOR_APPROVAL_BYPASSED"),
    adaptive_security_verified: source.validation.validation_status === "VALID",
    immutable_auditability_verified: !has("IMMUTABLE_LEDGER_MUTATION") && !has("EVIDENCE_TAMPERING"),
    production_readiness_verified: readiness.production_ready,
    failure_analysis: failures,
    certification_decision: state,
    phase_10_1_authorized: state === "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboard(certification: AdaptiveArchitectureCertification, readiness: AdaptiveProductionReadinessReport): AdaptiveArchitectureCertificationDashboard {
  const total = certification.certification_tests.length;
  const base: Omit<AdaptiveArchitectureCertificationDashboard, "integrity_hash"> = {
    dashboard_id: "adaptive_architecture_certification_dashboard",
    certification_progress: total === 0 ? 0 : certification.passed_tests.length / total,
    certification_outcome: certification.final_certification_state,
    passed_tests: certification.passed_tests.length,
    failed_tests: certification.failed_tests.length,
    replay_verification_status: certification.replay_validation,
    governance_compliance: certification.governance_validation,
    constitutional_compliance: certification.constitutional_validation,
    authority_validation: certification.authority_validation,
    security_validation: certification.security_validation,
    production_readiness: pass(readiness.production_ready),
    certification_history: freezeArray([certification.certification_id]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly AdaptiveArchitectureFailure[], state: AdaptiveArchitectureCertificationState): AdaptiveArchitectureCertificationValidation {
  const has = (failure: AdaptiveArchitectureFailure) => failures.includes(failure);
  const base: Omit<AdaptiveArchitectureCertificationValidation, "integrity_hash"> = {
    validation_id: "adaptive_architecture_certification_validation",
    validation_status: state === "PASS" ? "VALID" : "BLOCKED",
    all_mandatory_tests_passed: !has("MANDATORY_TEST_FAILED"),
    replay_deterministic: !has("REPLAY_DIVERGED") && !has("REPLAY_OMISSION") && !has("DETERMINISTIC_FAILURE"),
    governance_enforced: !has("GOVERNANCE_OMITTED") && !has("GOVERNANCE_BYPASS"),
    constitutional_protections_enforced: !has("CONSTITUTIONAL_PROTECTION_WEAKENED"),
    authority_expansion_impossible: !has("AUTHORITY_EXPANDED"),
    advisory_only: !has("ADVISORY_ONLY_VIOLATED"),
    operator_approval_mandatory: !has("OPERATOR_APPROVAL_BYPASSED"),
    tenant_isolated: !has("TENANT_ISOLATION_COMPROMISED"),
    hidden_learning_absent: !has("HIDDEN_LEARNING_DETECTED"),
    hidden_memory_absent: !has("HIDDEN_MEMORY_DETECTED"),
    self_modification_absent: !has("SELF_MODIFICATION_DETECTED"),
    immutable_ledgers_preserved: !has("IMMUTABLE_LEDGER_MUTATION"),
    evidence_consistent: !has("CERTIFICATION_EVIDENCE_INCONSISTENT") && !has("EVIDENCE_TAMPERING"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED") && !has("CERTIFICATION_FORGERY"),
    production_promotion_authorized: state === "PASS",
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveArchitectureCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification: result.certification,
    tests: result.certification_tests,
    evidence: result.evidence_package,
    readiness: result.production_readiness_report,
    ledger: result.certification_ledger,
    report: result.certification_report,
    validation: result.validation,
  });
}

export function runAdaptiveArchitectureCertificationGate(input: AdaptiveArchitectureCertificationGateInput = {}): AdaptiveArchitectureCertificationGateResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const security_boundaries = sourceForScenario(input, scenario);
  const certification_tests = buildTests(security_boundaries, scenario);
  const evidence_package = buildEvidence(security_boundaries, scenario);
  const preliminaryFailures = collectFailures({ source: security_boundaries, tests: certification_tests, evidence: evidence_package, readiness: undefined, ledger: [], role, scenario });
  const preliminaryState = decisionFor(preliminaryFailures);
  const preliminaryReadiness = buildReadiness(security_boundaries, certification_tests, evidence_package, preliminaryFailures);
  const failures = collectFailures({ source: security_boundaries, tests: certification_tests, evidence: evidence_package, readiness: preliminaryReadiness, ledger: [], role, scenario });
  const finalState = decisionFor(failures);
  const production_readiness_report = buildReadiness(security_boundaries, certification_tests, evidence_package, failures);
  const certification = buildCertification(security_boundaries, certification_tests, failures, finalState === preliminaryState ? finalState : decisionFor(failures));
  const certification_ledger = buildLedger(certification, evidence_package, scenario);
  const ledgerFailures = collectFailures({ source: security_boundaries, tests: certification_tests, evidence: evidence_package, readiness: production_readiness_report, ledger: certification_ledger, role, scenario });
  const certificationState = decisionFor(ledgerFailures);
  const finalCertification = buildCertification(security_boundaries, certification_tests, ledgerFailures, certificationState);
  const certification_report = buildReport(security_boundaries, production_readiness_report, ledgerFailures, certificationState);
  const validation = buildValidation(ledgerFailures, certificationState);
  const dashboard = buildDashboard(finalCertification, production_readiness_report);
  const base: Omit<AdaptiveArchitectureCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    certification_gate_version: CERTIFICATION_GATE_VERSION,
    security_boundaries,
    certification: finalCertification,
    certification_tests,
    evidence_package,
    production_readiness_report,
    certification_ledger,
    dashboard,
    certification_report,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    fail_closed: true,
    phase_10_1_authorized: certificationState === "PASS",
    permits_uncertified_deployment: false,
    permits_partial_certification: false,
    permits_execution: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveArchitectureCertificationGate(result: AdaptiveArchitectureCertificationGateResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveArchitectureCertificationHash(record: Omit<AdaptiveArchitectureCertification, "integrity_hash"> | AdaptiveArchitectureCertification): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveArchitectureCertificationGateFoundation(): AdaptiveArchitectureCertificationGateFoundation {
  return Object.freeze({
    certification_gate_version: CERTIFICATION_GATE_VERSION,
    scope: ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE,
    result: runAdaptiveArchitectureCertificationGate(),
  });
}

export const AdaptiveArchitectureCertificationGate = Object.freeze({
  run: runAdaptiveArchitectureCertificationGate,
  replay: replayAdaptiveArchitectureCertificationGate,
});
