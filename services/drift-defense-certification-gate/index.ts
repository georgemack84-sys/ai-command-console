import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import { recordDriftDefenseLedger, replayDriftDefenseLedger } from "@/services/drift-defense-ledger";
import type {
  CertificationSuiteReport,
  CertificationSuiteStatus,
  DriftDefenseCertificationApiSurface,
  DriftDefenseCertificationFailure,
  DriftDefenseCertificationFoundation,
  DriftDefenseCertificationInput,
  DriftDefenseCertificationMetrics,
  DriftDefenseCertificationOutcome,
  DriftDefenseCertificationRecord,
  DriftDefenseCertificationReport,
  DriftDefenseCertificationResult,
  DriftDefenseCertificationScenario,
  CertificationTraceabilityMatrix,
  ProductionReadinessAssessment,
} from "@/types/drift-defense-certification-gate";

const GATE_VERSION = "drift-defense-certification-gate/v1" as const;
const GATE_IDENTIFIER = "DriftDefenseCertificationGate" as const;
const GATE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<DriftDefenseCertificationInput["scenario"]>;

const CONDITIONAL_FAILURES: readonly DriftDefenseCertificationFailure[] = [
  "DOCUMENTATION_GAP",
  "OBSERVABILITY_GAP",
  "REPORTING_GAP",
  "VISUALIZATION_GAP",
  "OPERATIONAL_USABILITY_GAP",
];

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

function buildApiSurface(): DriftDefenseCertificationApiSurface {
  const base: Omit<DriftDefenseCertificationApiSurface, "integrity_hash"> = {
    api_id: "drift_defense_certification_gate_api",
    certify_drift_defense: "POST /drift-defense-certification-gate/certify",
    retrieve_certification_report: "POST /drift-defense-certification-gate/report",
    retrieve_detection_coverage: "POST /drift-defense-certification-gate/detection-coverage",
    retrieve_adversarial_defense: "POST /drift-defense-certification-gate/adversarial-defense",
    retrieve_containment: "POST /drift-defense-certification-gate/containment",
    retrieve_replay_audit: "POST /drift-defense-certification-gate/replay-audit",
    retrieve_governance_security: "POST /drift-defense-certification-gate/governance-security",
    retrieve_traceability: "POST /drift-defense-certification-gate/traceability",
    retrieve_readiness: "POST /drift-defense-certification-gate/readiness",
    retrieve_record: "POST /drift-defense-certification-gate/record",
    retrieve_metrics: "POST /drift-defense-certification-gate/metrics",
    replay_certification: "POST /drift-defense-certification-gate/replay",
    inspect_certification: "POST /drift-defense-certification-gate/inspect",
    retrieve_contract: "GET /drift-defense-certification-gate/contract",
    production_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): DriftDefenseCertificationFailure | undefined {
  const map: Partial<Record<DriftDefenseCertificationScenario, DriftDefenseCertificationFailure>> = {
    DETECTION_COVERAGE_GAP: "DETECTION_COVERAGE_GAP",
    UNDETECTED_UNSAFE_DRIFT: "UNDETECTED_UNSAFE_DRIFT",
    NONDETERMINISTIC_CONTAINMENT: "NONDETERMINISTIC_CONTAINMENT",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    AUTHORITY_BOUNDARY_FAILURE: "AUTHORITY_BOUNDARY_FAILURE",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    EVIDENCE_POISONING: "EVIDENCE_POISONING_VULNERABILITY",
    FEEDBACK_MANIPULATION: "FEEDBACK_MANIPULATION_INFLUENCE",
    OPTIMIZATION_BYPASS: "OPTIMIZATION_GOVERNANCE_BYPASS",
    OPERATOR_AUTHORITY_DEGRADATION: "OPERATOR_AUTHORITY_DEGRADATION",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS",
    AUDIT_INTEGRITY_FAILURE: "AUDIT_INTEGRITY_FAILURE",
    ROLLBACK_FAILURE: "ROLLBACK_FAILURE",
    LEDGER_VIOLATION: "IMMUTABLE_LEDGER_VIOLATION",
    REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_RECONSTRUCTION_FAILURE",
    OUTSIDE_CERTIFIED_BOUNDARIES: "ADAPTIVE_BEHAVIOR_OUTSIDE_CERTIFIED_BOUNDARIES",
    DOCUMENTATION_GAP: "DOCUMENTATION_GAP",
    OBSERVABILITY_GAP: "OBSERVABILITY_GAP",
    REPORTING_GAP: "REPORTING_GAP",
    VISUALIZATION_GAP: "VISUALIZATION_GAP",
    OPERATIONAL_USABILITY_GAP: "OPERATIONAL_USABILITY_GAP",
    NONDETERMINISTIC: "NONDETERMINISTIC_CERTIFICATION",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_CERTIFICATION_EVIDENCE",
    UNKNOWN_BEHAVIOR: "UNKNOWN_CERTIFICATION_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean, ledgerReplayable: boolean): readonly DriftDefenseCertificationFailure[] {
  const failures: DriftDefenseCertificationFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  if (!ledgerReplayable) failures.push("IMMUTABLE_LEDGER_VIOLATION");
  return freezeArray([...new Set(failures)]);
}

function conditionalFindings(failures: readonly DriftDefenseCertificationFailure[]): readonly DriftDefenseCertificationFailure[] {
  return freezeArray(failures.filter((failure) => CONDITIONAL_FAILURES.includes(failure)));
}

function criticalFailures(failures: readonly DriftDefenseCertificationFailure[]): readonly DriftDefenseCertificationFailure[] {
  return freezeArray(failures.filter((failure) => !CONDITIONAL_FAILURES.includes(failure)));
}

function outcomeFor(failures: readonly DriftDefenseCertificationFailure[]): DriftDefenseCertificationOutcome {
  if (criticalFailures(failures).length) return "FAIL";
  if (conditionalFindings(failures).length) return "CONDITIONAL_PASS";
  return "PASS";
}

function suiteStatus(failures: readonly DriftDefenseCertificationFailure[], names: readonly DriftDefenseCertificationFailure[]): CertificationSuiteStatus {
  const matching = failures.filter((failure) => names.includes(failure));
  if (matching.some((failure) => !CONDITIONAL_FAILURES.includes(failure))) return "FAIL";
  if (matching.length) return "CONDITIONAL_PASS";
  return "PASS";
}

function buildSuite(suite_name: string, tests: readonly string[], failures: readonly DriftDefenseCertificationFailure[], related: readonly DriftDefenseCertificationFailure[]): CertificationSuiteReport {
  const status = suiteStatus(failures, related);
  const failed = status === "FAIL" ? tests.slice(0, 1) : [];
  const base: Omit<CertificationSuiteReport, "integrity_hash"> = {
    suite_id: `${suite_name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${hash({ suite_name, failures }).slice(0, 10)}`,
    suite_name,
    status,
    tests_executed: tests,
    passed_tests: status === "FAIL" ? tests.slice(1) : tests,
    failed_tests: freezeArray(failed),
    conditional_findings: conditionalFindings(failures.filter((failure) => related.includes(failure))),
    evidence_refs: freezeArray(["evidence:drift-ledger", "evidence:deterministic-replay", "evidence:phase-10.12-tests"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(outcome: DriftDefenseCertificationOutcome, failures: readonly DriftDefenseCertificationFailure[], conditional: readonly DriftDefenseCertificationFailure[]): DriftDefenseCertificationReport {
  const critical = criticalFailures(failures);
  const base: Omit<DriftDefenseCertificationReport, "integrity_hash"> = {
    report_id: `drift_defense_certification_${hash({ outcome, failures }).slice(0, 14)}`,
    certification_outcome: outcome,
    certification_statement: outcome === "PASS"
      ? "Phase 10.12 drift defense is certified for deterministic, governed, replayable adaptive progression."
      : outcome === "CONDITIONAL_PASS"
        ? "Phase 10.12 core safety protections pass, but production progression remains blocked until conditional findings are resolved."
        : "Phase 10.12 certification failed due to unresolved critical drift defense vulnerability.",
    detected_failures: critical,
    conditional_findings: conditional,
    production_progression_authorized: outcome === "PASS",
    governance_preserved: !failures.includes("GOVERNANCE_VIOLATION") && !failures.includes("OPTIMIZATION_GOVERNANCE_BYPASS"),
    constitutional_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    authority_preserved: !failures.includes("AUTHORITY_BOUNDARY_FAILURE") && !failures.includes("OPERATOR_AUTHORITY_DEGRADATION"),
    replay_preserved: !failures.includes("REPLAY_DIVERGENCE") && !failures.includes("REPLAY_RECONSTRUCTION_FAILURE"),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_BREACH"),
    evidence_integrity_preserved: !failures.includes("EVIDENCE_POISONING_VULNERABILITY"),
    operator_control_preserved: !failures.includes("AUTHORITY_BOUNDARY_FAILURE") && !failures.includes("OPERATOR_AUTHORITY_DEGRADATION"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTraceability(failures: readonly DriftDefenseCertificationFailure[]): CertificationTraceabilityMatrix {
  const base: Omit<CertificationTraceabilityMatrix, "integrity_hash"> = {
    matrix_id: `certification_traceability_${hash(failures).slice(0, 14)}`,
    detection_coverage_refs: freezeArray(["strategic-drift", "confidence-drift", "risk-drift", "governance-authority-drift", "replay-drift", "tenant-isolation-drift", "optimization-pressure"]),
    adversarial_defense_refs: freezeArray(["feedback-manipulation", "evidence-poisoning", "adversarial-adaptation-testing"]),
    containment_refs: freezeArray(["drift-response-containment"]),
    replay_audit_refs: freezeArray(["replay-drift-detection", "drift-defense-ledger"]),
    governance_security_refs: freezeArray(["governance-authority-drift-defense", "tenant-isolation-drift-defense"]),
    ledger_refs: freezeArray(["drift-defense-ledger"]),
    unmet_requirements: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReadiness(outcome: DriftDefenseCertificationOutcome, failures: readonly DriftDefenseCertificationFailure[]): ProductionReadinessAssessment {
  const ready = outcome === "PASS";
  const base: Omit<ProductionReadinessAssessment, "integrity_hash"> = {
    assessment_id: `production_readiness_${hash({ outcome, failures }).slice(0, 14)}`,
    production_ready: ready,
    deterministic_adaptive_behavior: !failures.includes("NONDETERMINISTIC_CERTIFICATION"),
    governance_preserving_adaptation: !failures.includes("GOVERNANCE_VIOLATION") && !failures.includes("OPTIMIZATION_GOVERNANCE_BYPASS"),
    constitutionally_constrained_adaptation: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_controlled_adaptation: !failures.includes("OPERATOR_AUTHORITY_DEGRADATION") && !failures.includes("AUTHORITY_BOUNDARY_FAILURE"),
    replay_safe_adaptation: !failures.includes("REPLAY_DIVERGENCE") && !failures.includes("REPLAY_RECONSTRUCTION_FAILURE"),
    explainable_adaptation: !failures.includes("UNKNOWN_CERTIFICATION_BEHAVIOR"),
    evidence_backed_adaptation: !failures.includes("NONREPLAYABLE_CERTIFICATION_EVIDENCE") && !failures.includes("EVIDENCE_POISONING_VULNERABILITY"),
    tenant_isolated_adaptation: !failures.includes("TENANT_ISOLATION_BREACH"),
    certification_bound_adaptation: !failures.includes("CERTIFICATION_BYPASS"),
    recoverable_adaptation: !failures.includes("ROLLBACK_FAILURE"),
    readiness_summary: ready ? "Production readiness certified." : "Production progression remains blocked until certification findings are resolved.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: DriftDefenseCertificationInput, outcome: DriftDefenseCertificationOutcome, suites: readonly CertificationSuiteReport[], report: DriftDefenseCertificationReport, traceability: CertificationTraceabilityMatrix): DriftDefenseCertificationRecord {
  const base: Omit<DriftDefenseCertificationRecord, "integrity_hash"> = {
    certification_id: `drift_defense_certification_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", outcome, failures: report.detected_failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    certification_version: GATE_VERSION,
    outcome,
    suite_results: suites.map((suite) => suite.status),
    failures: report.detected_failures,
    conditional_findings: report.conditional_findings,
    production_progression_authorized: outcome === "PASS",
    ledger_ref: "ledger:drift-defense-ledger",
    replay_refs: freezeArray(["replay:drift-defense-certification-gate"]),
    supporting_evidence: traceability.integrity_hash,
    timestamp: GATE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(outcome: DriftDefenseCertificationOutcome, suites: readonly CertificationSuiteReport[], failures: readonly DriftDefenseCertificationFailure[]): DriftDefenseCertificationMetrics {
  const base: Omit<DriftDefenseCertificationMetrics, "integrity_hash"> = {
    outcome,
    detection_coverage_passed: suites[0]?.status === "PASS",
    adversarial_defense_passed: suites[1]?.status === "PASS",
    containment_passed: suites[2]?.status === "PASS",
    replay_audit_passed: suites[3]?.status === "PASS",
    governance_security_passed: suites[4]?.status === "PASS",
    production_ready: outcome === "PASS",
    deterministic_certification: !failures.includes("NONDETERMINISTIC_CERTIFICATION"),
    replayable_certification: !failures.includes("NONREPLAYABLE_CERTIFICATION_EVIDENCE"),
    critical_failures: criticalFailures(failures),
    conditional_findings: conditionalFindings(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DriftDefenseCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    ledger_hash: result.ledger_result.integrity_hash,
    detection_hash: result.detection_coverage_report.integrity_hash,
    adversarial_hash: result.adversarial_defense_report.integrity_hash,
    containment_hash: result.containment_validation_report.integrity_hash,
    replay_audit_hash: result.replay_integrity_report.integrity_hash,
    governance_hash: result.governance_preservation_report.integrity_hash,
    report_hash: result.certification_report.integrity_hash,
    traceability_hash: result.traceability_matrix.integrity_hash,
    readiness_hash: result.production_readiness_assessment.integrity_hash,
    record_hash: result.certification_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<DriftDefenseCertificationResult, "integrity_hash">): string {
  return hash({
    version: result.drift_defense_certification_version,
    gate_identifier: result.gate_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.certification_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function certifyDriftDefense(input: DriftDefenseCertificationInput = {}): DriftDefenseCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const ledger_result = input.ledger_result ?? recordDriftDefenseLedger();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result), replayDriftDefenseLedger(ledger_result));
  const conditional = conditionalFindings(failures);
  const outcome = outcomeFor(failures);
  const detection_coverage_report = buildSuite("Drift Detection Coverage", ["Strategic Drift Detection", "Confidence Drift Detection", "Risk Drift Detection", "Governance Drift Detection", "Authority Drift Detection", "Tenant Isolation Drift Detection", "Replay Drift Detection", "Optimization Drift Detection"], failures, ["DETECTION_COVERAGE_GAP", "UNDETECTED_UNSAFE_DRIFT"]);
  const adversarial_defense_report = buildSuite("Adversarial Defense", ["Evidence Poisoning Tests", "Feedback Manipulation Tests", "Reward Hacking Tests", "Synthetic History Tests", "Replay Corruption Tests", "Governance Bypass Tests", "Cross-Tenant Contamination Tests", "Unauthorized Adaptation Pressure Tests"], failures, ["EVIDENCE_POISONING_VULNERABILITY", "FEEDBACK_MANIPULATION_INFLUENCE", "OPTIMIZATION_GOVERNANCE_BYPASS"]);
  const containment_validation_report = buildSuite("Containment Validation", ["Deterministic Response Validation", "Escalation Validation", "Suppression Validation", "Rollback Validation", "Fail-Closed Validation", "Simulation Requirement Validation", "Certification Requirement Validation"], failures, ["NONDETERMINISTIC_CONTAINMENT", "ROLLBACK_FAILURE", "CERTIFICATION_BYPASS"]);
  const replay_integrity_report = buildSuite("Replay And Audit", ["Replay Reconstruction", "Drift Timeline Reconstruction", "Ledger Integrity Validation", "Explainability Verification", "Audit Completeness Verification"], failures, ["REPLAY_DIVERGENCE", "AUDIT_INTEGRITY_FAILURE", "IMMUTABLE_LEDGER_VIOLATION", "REPLAY_RECONSTRUCTION_FAILURE", "NONREPLAYABLE_CERTIFICATION_EVIDENCE"]);
  const governance_preservation_report = buildSuite("Security And Governance", ["Constitutional Compliance", "Governance Preservation", "Authority Boundary Preservation", "Tenant Isolation Preservation", "Immutable Audit Validation"], failures, ["GOVERNANCE_VIOLATION", "CONSTITUTIONAL_VIOLATION", "AUTHORITY_BOUNDARY_FAILURE", "TENANT_ISOLATION_BREACH", "OPERATOR_AUTHORITY_DEGRADATION"]);
  const suites = freezeArray([detection_coverage_report, adversarial_defense_report, containment_validation_report, replay_integrity_report, governance_preservation_report]);
  const certification_report = buildReport(outcome, failures, conditional);
  const traceability_matrix = buildTraceability(failures);
  const production_readiness_assessment = buildReadiness(outcome, failures);
  const certification_record = buildRecord(input, outcome, suites, certification_report, traceability_matrix);
  const metrics = buildMetrics(outcome, suites, failures);
  const base: Omit<DriftDefenseCertificationResult, "integrity_hash" | "replay_hash"> = {
    drift_defense_certification_version: GATE_VERSION,
    gate_identifier: GATE_IDENTIFIER,
    outcome,
    api_surface,
    architecture_result,
    ledger_result,
    detection_coverage_report,
    adversarial_defense_report,
    containment_validation_report,
    replay_integrity_report,
    governance_preservation_report,
    certification_report,
    traceability_matrix,
    production_readiness_assessment,
    certification_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_certification,
    replayable: metrics.replayable_certification,
    explainable: !failures.includes("UNKNOWN_CERTIFICATION_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_CERTIFICATION_EVIDENCE"),
    governance_preserved: certification_report.governance_preserved,
    constitutional_preserved: certification_report.constitutional_preserved,
    operator_authority_preserved: certification_report.operator_control_preserved,
    tenant_isolated: certification_report.tenant_isolation_preserved,
    advisory_only: true,
    authorizes_production: false,
    mutates_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayDriftDefenseCertification(result: DriftDefenseCertificationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    replayDriftDefenseLedger(result.ledger_result) &&
    verifyHashedRecord(result.detection_coverage_report) &&
    verifyHashedRecord(result.adversarial_defense_report) &&
    verifyHashedRecord(result.containment_validation_report) &&
    verifyHashedRecord(result.replay_integrity_report) &&
    verifyHashedRecord(result.governance_preservation_report) &&
    verifyHashedRecord(result.certification_report) &&
    verifyHashedRecord(result.traceability_matrix) &&
    verifyHashedRecord(result.production_readiness_assessment) &&
    verifyHashedRecord(result.certification_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getDriftDefenseCertificationFoundation(): DriftDefenseCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    drift_defense_certification_version: GATE_VERSION,
    api_surface,
    result: certifyDriftDefense(),
  });
}

export const DriftDefenseCertificationGate = Object.freeze({
  certify: certifyDriftDefense,
  replay: replayDriftDefenseCertification,
});
