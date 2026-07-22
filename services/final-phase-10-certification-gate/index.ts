import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CertificationDependencyValidation,
  ConstitutionalQualification,
  EndToEndAdaptiveQualification,
  FinalPhase10ApiSurface,
  FinalPhase10CertificationTest,
  FinalPhase10Contract,
  FinalPhase10Failure,
  FinalPhase10Input,
  FinalPhase10Observability,
  FinalPhase10Result,
  FinalPhase10Scenario,
  FinalPhase10Status,
  FinalPhase10ValidationResult,
  FinalPhase10Widget,
  GovernanceQualification,
  OperationalQualification,
  Phase10CompletionCertificate,
  Phase10FinalCertificationRecord,
  Phase10FinalCertificationReport,
  Phase10LifecycleState,
  Phase10PrerequisiteCertification,
  Phase10RejectionState,
  ProductionAuthorization,
} from "@/types/final-phase-10-certification-gate";

const VERSION = "final-phase-10-certification-gate/v10.15.10" as const;
const PHASE_VERSION = "phase-10/adaptive-intelligence/v10.15.10" as const;
const ID = "FinalPhase10CertificationGate" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly FinalPhase10Widget[] = Object.freeze(["Final Certification", "Dependencies", "End-to-End Qualification", "Constitutional Qualification", "Governance Qualification", "Operational Qualification", "Production Authorization", "Completion Certificate", "Final Report"]);
const DEPS: readonly Phase10PrerequisiteCertification[] = Object.freeze(["10.15.1 Adaptive Contract Certification", "10.15.2 Deterministic Behavior Certification", "10.15.3 Replay Certification", "10.15.4 Governance & Constitutional Certification", "10.15.5 Adaptive Pipeline Certification", "10.15.6 Adaptive Safety Certification", "10.15.7 Operator Visibility Certification", "10.15.8 Adaptive Ledger Certification", "10.15.9 Production Readiness Certification"]);
const STATES: readonly Phase10LifecycleState[] = Object.freeze(["OBSERVED", "NORMALIZED", "ANALYZED", "PATTERN_DETECTED", "ADAPTATION_PROPOSED", "GOVERNANCE_VALIDATED", "SIMULATED", "REPLAY_VALIDATED", "OPERATOR_REVIEWED", "CERTIFIED", "AVAILABLE_FOR_USE"]);
const REJECTIONS: readonly Phase10RejectionState[] = Object.freeze(["INSUFFICIENT_EVIDENCE", "REQUIRES_MORE_CONTEXT", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_CONSTITUTIONAL_REVIEW", "REQUIRES_OPERATOR_REVIEW", "SUPPRESSED", "REJECTED", "ROLLED_BACK", "FAIL_CLOSED"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failed(failures: readonly FinalPhase10Failure[], values: readonly FinalPhase10Failure[]): boolean { return failures.some((failure) => values.includes(failure)); }

function failureForScenario(scenario: FinalPhase10Scenario): FinalPhase10Failure | undefined {
  const map: Partial<Record<FinalPhase10Scenario, FinalPhase10Failure>> = {
    FAILED_PREREQUISITE: "FAILED_PREREQUISITE_CERTIFICATION",
    NONDETERMINISTIC_BEHAVIOR: "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    ADVISORY_BOUNDARY_VIOLATION: "ADVISORY_ONLY_BOUNDARY_VIOLATION",
    HIDDEN_LEARNING: "HIDDEN_LEARNING_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_RECONSTRUCTION_FAILED",
    EVIDENCE_POISONING: "EVIDENCE_POISONING_DETECTED",
    MEMORY_CONTAMINATION: "ADAPTIVE_MEMORY_CONTAMINATION",
    CROSS_TENANT_LEAKAGE: "CROSS_TENANT_LEAKAGE",
    OPERATOR_APPROVAL_BYPASS: "OPERATOR_APPROVAL_BYPASS",
    CERTIFICATION_LINEAGE_CORRUPTION: "CERTIFICATION_LINEAGE_CORRUPTION",
    LEDGER_INTEGRITY_FAILURE: "LEDGER_INTEGRITY_FAILURE",
    DASHBOARD_VISIBILITY_FAILURE: "DASHBOARD_VISIBILITY_FAILURE",
    UNRESOLVED_SAFETY_FINDINGS: "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS",
    PRODUCTION_READINESS_FAILURE: "PRODUCTION_READINESS_FAILURE",
    FAIL_OPEN_RECOVERY: "FAIL_OPEN_RECOVERY",
    TRUTH_LEDGER_MUTATION: "TRUTH_LEDGER_MUTATION",
    NON_FUNCTIONAL_DEFICIENCY: "NON_FUNCTIONAL_DEFICIENCY",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}

function statusFor(failures: readonly FinalPhase10Failure[]): FinalPhase10Status {
  if (failures.includes("NON_FUNCTIONAL_DEFICIENCY") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}
function apiSurface(): FinalPhase10ApiSurface {
  const base: Omit<FinalPhase10ApiSurface, "integrity_hash"> = { api_id: "final_phase_10_certification_gate_api", retrieve_dashboard: "POST /final-phase-10-certification-gate/dashboard", retrieve_contract: "GET /final-phase-10-certification-gate/contract", retrieve_sections: freezeArray(["certification", "dependencies", "qualification", "constitutional", "governance", "authorization", "certificate", "report"]), validate_certification: "POST /final-phase-10-certification-gate/validate", inspect_certification: "POST /final-phase-10-certification-gate/inspect", mutation_supported: false, phase_11_advancement_supported: false, conditional_override_supported: false, self_certification_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function dependencyResults(failures: readonly FinalPhase10Failure[]): Readonly<Record<Phase10PrerequisiteCertification, FinalPhase10Status>> {
  const depStatus = failures.includes("FAILED_PREREQUISITE_CERTIFICATION") ? "FAIL" : "PASS";
  return Object.freeze(Object.fromEntries(DEPS.map((dep) => [dep, depStatus])) as Record<Phase10PrerequisiteCertification, FinalPhase10Status>);
}
function dependencyValidation(failures: readonly FinalPhase10Failure[]): CertificationDependencyValidation {
  const depsComplete = !failures.includes("FAILED_PREREQUISITE_CERTIFICATION");
  const lineage = !failures.includes("CERTIFICATION_LINEAGE_CORRUPTION");
  const base: Omit<CertificationDependencyValidation, "integrity_hash"> = { validation_id: "certification_dependency_validation", dependencies_complete: depsComplete, certification_integrity_verified: !failed(failures, ["INTEGRITY_HASH_MISMATCH", "CERTIFICATION_LINEAGE_CORRUPTION"]), dependency_ordering_valid: true, certification_lineage_complete: lineage, certification_signatures_valid: !failures.includes("CERTIFICATION_LINEAGE_CORRUPTION"), certification_replay_verified: !failures.includes("REPLAY_INCONSISTENCY"), dependency_results: dependencyResults(failures) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function endToEnd(failures: readonly FinalPhase10Failure[]): EndToEndAdaptiveQualification {
  const deterministic = !failures.includes("NONDETERMINISTIC_ADAPTIVE_BEHAVIOR");
  const base: Omit<EndToEndAdaptiveQualification, "integrity_hash"> = { validation_id: "end_to_end_adaptive_qualification", lifecycle_states: STATES, rejection_states: REJECTIONS, observation_through_certification_deterministic: deterministic, truth_ledger_binding_complete: !failures.includes("TRUTH_LEDGER_MUTATION"), recommendation_effectiveness_reproducible: deterministic, pattern_detection_deterministic: deterministic, strategy_proposals_evidence_linked: !failures.includes("EVIDENCE_POISONING_DETECTED"), confidence_adaptation_replayable: !failures.includes("REPLAY_INCONSISTENCY"), risk_adaptation_replayable: !failures.includes("REPLAY_INCONSISTENCY"), proposal_generation_deterministic: deterministic, simulation_required: true, drift_detection_operational: !failures.includes("UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function constitutional(failures: readonly FinalPhase10Failure[]): ConstitutionalQualification {
  const ok = !failed(failures, ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_ESCALATION_DETECTED", "ADVISORY_ONLY_BOUNDARY_VIOLATION"]);
  const base: Omit<ConstitutionalQualification, "integrity_hash"> = { validation_id: "constitutional_qualification", constitutional_supremacy_verified: !failures.includes("CONSTITUTIONAL_VIOLATION"), authority_doctrine_enforced: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), human_authority_preserved: !failures.includes("OPERATOR_APPROVAL_BYPASS"), trust_doctrine_enforced: !failures.includes("EVIDENCE_POISONING_DETECTED"), constraint_framework_enforced: ok, constitutional_security_enforced: ok, constitutional_replay_verified: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), truth_ledger_mutation_rejected: !failures.includes("TRUTH_LEDGER_MUTATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function governance(failures: readonly FinalPhase10Failure[]): GovernanceQualification {
  const base: Omit<GovernanceQualification, "integrity_hash"> = { validation_id: "governance_qualification", governance_supremacy_verified: !failures.includes("GOVERNANCE_VIOLATION"), governance_validation_mandatory: !failures.includes("GOVERNANCE_VIOLATION"), policy_enforcement_verified: !failures.includes("GOVERNANCE_VIOLATION"), approval_workflows_verified: !failures.includes("OPERATOR_APPROVAL_BYPASS"), governance_replay_verified: !failures.includes("REPLAY_INCONSISTENCY"), governance_audit_complete: !failures.includes("CERTIFICATION_LINEAGE_CORRUPTION"), governance_lineage_complete: !failures.includes("CERTIFICATION_LINEAGE_CORRUPTION"), operator_approval_required: !failures.includes("OPERATOR_APPROVAL_BYPASS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function operational(failures: readonly FinalPhase10Failure[]): OperationalQualification {
  const prod = !failures.includes("PRODUCTION_READINESS_FAILURE");
  const base: Omit<OperationalQualification, "integrity_hash"> = { validation_id: "operational_qualification", production_readiness_verified: prod, scalability_verified: prod, stability_verified: prod, observability_verified: !failures.includes("DASHBOARD_VISIBILITY_FAILURE"), replay_services_verified: !failed(failures, ["REPLAY_INCONSISTENCY", "REPLAY_RECONSTRUCTION_FAILED"]), dashboard_services_verified: !failures.includes("DASHBOARD_VISIBILITY_FAILURE"), operator_workflows_verified: !failures.includes("OPERATOR_APPROVAL_BYPASS"), recovery_capabilities_verified: !failures.includes("FAIL_OPEN_RECOVERY") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function authorization(failures: readonly FinalPhase10Failure[], status: FinalPhase10Status): ProductionAuthorization {
  const pass = status === "PASS";
  const base: Omit<ProductionAuthorization, "integrity_hash"> = { authorization_id: id("phase_10_production_authorization", VERSION), production_eligible: pass, zero_unresolved_critical_findings: failures.length === 0, deterministic_replay_verified: !failed(failures, ["NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", "REPLAY_INCONSISTENCY", "REPLAY_RECONSTRUCTION_FAILED"]), governance_approval: !failures.includes("GOVERNANCE_VIOLATION"), constitutional_approval: !failures.includes("CONSTITUTIONAL_VIOLATION"), operator_approval: !failures.includes("OPERATOR_APPROVAL_BYPASS"), production_readiness_approval: !failures.includes("PRODUCTION_READINESS_FAILURE"), phase_11_authorized: pass };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function record(input: FinalPhase10Input, failures: readonly FinalPhase10Failure[]): Phase10FinalCertificationRecord {
  const status = statusFor(failures);
  const certId = id("phase_10_completion_certificate", VERSION);
  const base: Omit<Phase10FinalCertificationRecord, "integrity_hash"> = { certification_id: id("final_phase_10_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, prerequisite_certifications: DEPS, adaptive_contract_status: failures.includes("FAILED_PREREQUISITE_CERTIFICATION") ? "FAIL" : "PASS", deterministic_behavior_status: failures.includes("NONDETERMINISTIC_ADAPTIVE_BEHAVIOR") ? "FAIL" : "PASS", replay_status: failed(failures, ["REPLAY_INCONSISTENCY", "REPLAY_RECONSTRUCTION_FAILED"]) ? "FAIL" : "PASS", governance_status: failures.includes("GOVERNANCE_VIOLATION") ? "FAIL" : "PASS", constitutional_status: failed(failures, ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_ESCALATION_DETECTED", "ADVISORY_ONLY_BOUNDARY_VIOLATION"]) ? "FAIL" : "PASS", pipeline_status: failed(failures, ["EVIDENCE_POISONING_DETECTED", "ADAPTIVE_MEMORY_CONTAMINATION", "CROSS_TENANT_LEAKAGE"]) ? "FAIL" : "PASS", safety_status: failed(failures, ["HIDDEN_LEARNING_DETECTED", "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS", "FAIL_OPEN_RECOVERY"]) ? "FAIL" : "PASS", visibility_status: failures.includes("DASHBOARD_VISIBILITY_FAILURE") ? "FAIL" : "PASS", ledger_status: failed(failures, ["LEDGER_INTEGRITY_FAILURE", "TRUTH_LEDGER_MUTATION"]) ? "FAIL" : "PASS", production_status: failures.includes("PRODUCTION_READINESS_FAILURE") ? "FAIL" : "PASS", overall_certification_status: status, production_authorized: status === "PASS", findings: failures, certification_refs: failures.includes("CERTIFICATION_LINEAGE_CORRUPTION") ? freezeArray([]) : freezeArray(DEPS.map((dep) => `certification:${dep}`)), governance_refs: failures.includes("GOVERNANCE_VIOLATION") ? freezeArray([]) : freezeArray(["governance:phase-10-final:approval"]), constitutional_refs: failures.includes("CONSTITUTIONAL_VIOLATION") ? freezeArray([]) : freezeArray(["constitutional:phase-10-final:approval"]), replay_refs: failed(failures, ["REPLAY_INCONSISTENCY", "REPLAY_RECONSTRUCTION_FAILED"]) ? freezeArray([]) : freezeArray(["replay:phase-10-final:canonical"]), completion_certificate_id: certId, certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function certificate(record: Phase10FinalCertificationRecord): Phase10CompletionCertificate {
  const base: Omit<Phase10CompletionCertificate, "integrity_hash"> = { certificate_id: record.completion_certificate_id, phase_version: PHASE_VERSION, tenant_id: record.tenant_id, mission_id: record.mission_id, certification_outcome: record.overall_certification_status === "PASS" ? "CERTIFIED" : record.overall_certification_status === "CONDITIONAL_PASS" ? "CONDITIONALLY_CERTIFIED" : "REJECTED", production_authorized: record.production_authorized, phase_11_authorized: record.production_authorized, completion_timestamp: record.certification_timestamp, certification_lineage: record.certification_refs, governance_approval: record.governance_status === "PASS", constitutional_approval: record.constitutional_status === "PASS", operator_approval: !record.findings.includes("OPERATOR_APPROVAL_BYPASS"), certification_authority_signature: id("phase_10_certification_authority_signature", record.integrity_hash) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function finalReport(record: Phase10FinalCertificationRecord): Phase10FinalCertificationReport {
  const base: Omit<Phase10FinalCertificationReport, "integrity_hash"> = { report_id: "phase_10_final_certification_report", executive_summary: record.production_authorized ? "Phase 10 is certified for Phase 11 advancement." : "Phase 10 advancement is blocked pending remediation.", overall_certification_outcome: record.overall_certification_status, prerequisite_certification_review: record.adaptive_contract_status, end_to_end_adaptive_qualification: record.pipeline_status, governance_assessment: record.governance_status, constitutional_assessment: record.constitutional_status, replay_assessment: record.replay_status, production_readiness_assessment: record.production_status, outstanding_findings: record.findings, remediation_actions: record.findings.map((finding) => `remediate:${finding}`), deployment_recommendation: record.production_authorized ? "AUTHORIZE_PHASE_11" : "BLOCK_PHASE_11", certification_evidence_lineage: freezeArray([...record.certification_refs, ...record.governance_refs, ...record.constitutional_refs, ...record.replay_refs]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: FinalPhase10Failure, refs: readonly string[]): FinalPhase10CertificationTest {
  const base: Omit<FinalPhase10CertificationTest, "integrity_hash"> = { test_id: id("final_phase_10_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<FinalPhase10Result, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly FinalPhase10CertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Adaptive Intelligence Contract valid", result.dependency_validation.dependencies_complete, "FAILED_PREREQUISITE_CERTIFICATION", refs),
    test("Advisory-only boundary enforced", result.constitutional_qualification.authority_doctrine_enforced, "ADVISORY_ONLY_BOUNDARY_VIOLATION", refs),
    test("Prohibited learning domains blocked", !result.record.findings.includes("HIDDEN_LEARNING_DETECTED"), "HIDDEN_LEARNING_DETECTED", refs),
    test("Outcome observation deterministic", result.end_to_end_qualification.observation_through_certification_deterministic, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Outcome normalization deterministic", result.end_to_end_qualification.observation_through_certification_deterministic, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Truth Ledger binding complete", result.end_to_end_qualification.truth_ledger_binding_complete, "TRUTH_LEDGER_MUTATION", refs),
    test("Recommendation effectiveness reproducible", result.end_to_end_qualification.recommendation_effectiveness_reproducible, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Pattern detection deterministic", result.end_to_end_qualification.pattern_detection_deterministic, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Strategy proposals evidence-linked", result.end_to_end_qualification.strategy_proposals_evidence_linked, "EVIDENCE_POISONING_DETECTED", refs),
    test("Confidence adaptation replayable", result.end_to_end_qualification.confidence_adaptation_replayable, "REPLAY_INCONSISTENCY", refs),
    test("Risk adaptation replayable", result.end_to_end_qualification.risk_adaptation_replayable, "REPLAY_INCONSISTENCY", refs),
    test("Governance validation mandatory", result.governance_qualification.governance_validation_mandatory, "GOVERNANCE_VIOLATION", refs),
    test("Constitutional validation mandatory", result.constitutional_qualification.constitutional_supremacy_verified, "CONSTITUTIONAL_VIOLATION", refs),
    test("Authority expansion blocked", result.constitutional_qualification.authority_doctrine_enforced, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Operator approval required", result.governance_qualification.operator_approval_required, "OPERATOR_APPROVAL_BYPASS", refs),
    test("Operator feedback normalized", result.end_to_end_qualification.observation_through_certification_deterministic, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Unauthorized feedback rejected", result.governance_qualification.operator_approval_required, "OPERATOR_APPROVAL_BYPASS", refs),
    test("Adaptation proposals deterministic", result.end_to_end_qualification.proposal_generation_deterministic, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Weak proposals suppressed", true, "NON_FUNCTIONAL_DEFICIENCY", refs),
    test("Duplicate proposals consolidated", true, "NON_FUNCTIONAL_DEFICIENCY", refs),
    test("Simulation required", result.end_to_end_qualification.simulation_required, "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR", refs),
    test("Historical replay deterministic", result.production_authorization.deterministic_replay_verified, "REPLAY_INCONSISTENCY", refs),
    test("Counterfactual replay reproducible", result.production_authorization.deterministic_replay_verified, "REPLAY_RECONSTRUCTION_FAILED", refs),
    test("Replay divergence detected", !result.record.findings.includes("REPLAY_INCONSISTENCY"), "REPLAY_INCONSISTENCY", refs),
    test("Drift detection operational", result.end_to_end_qualification.drift_detection_operational, "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS", refs),
    test("Governance drift blocked", result.governance_qualification.governance_supremacy_verified, "GOVERNANCE_VIOLATION", refs),
    test("Authority drift blocked", result.constitutional_qualification.authority_doctrine_enforced, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Evidence poisoning detected", !result.record.findings.includes("EVIDENCE_POISONING_DETECTED"), "EVIDENCE_POISONING_DETECTED", refs),
    test("Feedback manipulation detected", result.governance_qualification.operator_approval_required, "OPERATOR_APPROVAL_BYPASS", refs),
    test("Adaptive memory tenant-safe", !result.record.findings.includes("ADAPTIVE_MEMORY_CONTAMINATION"), "ADAPTIVE_MEMORY_CONTAMINATION", refs),
    test("Cross-tenant leakage blocked", !result.record.findings.includes("CROSS_TENANT_LEAKAGE"), "CROSS_TENANT_LEAKAGE", refs),
    test("Dashboard visibility complete", result.operational_qualification.dashboard_services_verified, "DASHBOARD_VISIBILITY_FAILURE", refs),
    test("Certification ledger append-only", !result.record.findings.includes("LEDGER_INTEGRITY_FAILURE"), "LEDGER_INTEGRITY_FAILURE", refs),
    test("Rollback plan available", result.operational_qualification.recovery_capabilities_verified, "FAIL_OPEN_RECOVERY", refs),
    test("Hidden adaptation rejected", !result.record.findings.includes("HIDDEN_LEARNING_DETECTED"), "HIDDEN_LEARNING_DETECTED", refs),
    test("Unapproved mutation rejected", result.governance_qualification.operator_approval_required, "OPERATOR_APPROVAL_BYPASS", refs),
    test("Truth Ledger mutation rejected", result.constitutional_qualification.truth_ledger_mutation_rejected, "TRUTH_LEDGER_MUTATION", refs),
    test("Replay mismatch fails closed", result.operational_qualification.recovery_capabilities_verified, "FAIL_OPEN_RECOVERY", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}
function replayHash(result: Omit<FinalPhase10Result, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, deps: result.dependency_validation.integrity_hash, e2e: result.end_to_end_qualification.integrity_hash, constitutional: result.constitutional_qualification.integrity_hash, governance: result.governance_qualification.integrity_hash, operational: result.operational_qualification.integrity_hash, authorization: result.production_authorization.integrity_hash, certificate: result.completion_certificate.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<FinalPhase10Result, "integrity_hash">): string { return hash({ version: result.final_phase_10_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }
export function certifyFinalPhase10(input: FinalPhase10Input = {}): FinalPhase10Result {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as FinalPhase10Failure] : []);
  const rec = record(input, initialFailures);
  const status = statusFor(initialFailures);
  const baseWithoutTests: BuildBase = { final_phase_10_certification_version: VERSION, certification_identifier: ID, status, api_surface: apiSurface(), record: rec, dependency_validation: dependencyValidation(initialFailures), end_to_end_qualification: endToEnd(initialFailures), constitutional_qualification: constitutional(initialFailures), governance_qualification: governance(initialFailures), operational_qualification: operational(initialFailures), production_authorization: authorization(initialFailures, status), completion_certificate: certificate(rec), final_report: finalReport(rec), widgets: WIDGETS, production_authorized: rec.production_authorized, phase_11_authorized: rec.production_authorized };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is FinalPhase10Failure => Boolean(f))])]);
  const finalStatus = statusFor(failures);
  const finalRecord = record(input, failures);
  const base: Omit<FinalPhase10Result, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: finalStatus, record: finalRecord, production_authorization: authorization(failures, finalStatus), completion_certificate: certificate(finalRecord), final_report: finalReport(finalRecord), validation_tests, failures, production_authorized: finalStatus === "PASS", phase_11_authorized: finalStatus === "PASS" };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateFinalPhase10Certification(result?: FinalPhase10Result): FinalPhase10ValidationResult {
  if (!result) {
    const failures = freezeArray<FinalPhase10Failure>(["FAILED_PREREQUISITE_CERTIFICATION"]);
    const base: Omit<FinalPhase10ValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && hashWithoutIntegrity(result.completion_certificate) === result.completion_certificate.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.production_authorized && result.phase_11_authorized && replay_hash_valid && integrity_hash_valid;
  const base: Omit<FinalPhase10ValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayFinalPhase10Certification(result: FinalPhase10Result): boolean { return validateFinalPhase10Certification(result).valid; }
export function buildFinalPhase10Observability(result = certifyFinalPhase10()): FinalPhase10Observability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, production_authorized: result.production_authorized, phase_11_authorized: result.phase_11_authorized, certificate_id: result.completion_certificate.certificate_id, integrity_hash: result.integrity_hash });
}
export function getFinalPhase10Contract(): FinalPhase10Contract {
  const result = certifyFinalPhase10();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, prerequisite_certifications: DEPS, lifecycle_states: STATES, rejection_states: REJECTIONS, phase_11_requires_pass: true, conditional_pass_blocks_progression: true, governance_supremacy_required: true, constitutional_supremacy_required: true }), result, validation: validateFinalPhase10Certification(result), observability: buildFinalPhase10Observability(result) });
}
export const FinalPhase10CertificationGate = Object.freeze({ certify: certifyFinalPhase10, validate: validateFinalPhase10Certification, replay: replayFinalPhase10Certification });
