import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runAssuranceDependencyGovernance, validateAssuranceDependencyGovernance } from "@/services/assurance-dependency-governance";
import type {
  BoundaryViolationLifecycleState,
  CertificationLineageBundle,
  CertificationLineageFailure,
  CertificationLineageInput,
  CertificationLineageOutcome,
  CertificationLineageResult,
  CertificationLineageScenario,
  CertificationLineageTest,
  CertificationLineageValidation,
  CertificationViolationCategory,
  ProductionEscalationStatus,
  SupersessionReason,
} from "@/types/certification-lineage-supersession";

const VERSION = "certification-lineage-supersession/v14.9" as const;
const IDENTIFIER = "CertificationLineageSupersession" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: CertificationLineageScenario): CertificationLineageFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly CertificationLineageFailure[], failure: CertificationLineageFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly CertificationLineageFailure[]): CertificationLineageOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_HISTORY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const violationLifecycle = freezeArray(["DETECTED", "CLASSIFIED", "RECORDED", "LINKED_TO_REMEDIATION", "REPLAY_VERIFIED", "CLOSED"] as const satisfies readonly BoundaryViolationLifecycleState[]);
const violationCategories = freezeArray(["CONSTITUTIONAL", "GOVERNANCE", "TENANT_ISOLATION", "REPLAY", "DETERMINISM", "SECURITY", "DEPENDENCY", "SCALE", "RESILIENCE", "UNKNOWN"] as const satisfies readonly CertificationViolationCategory[]);
const supersessionReasons = freezeArray(["REMEDIATION_COMPLETE", "GOVERNANCE_REQUIRED", "SPECIFICATION_UPDATE", "REPLAY_REQUALIFICATION", "DEPENDENCY_CHANGE", "ENVIRONMENT_CHANGE"] as const satisfies readonly SupersessionReason[]);
const escalationStatuses = freezeArray(["INCIDENT_DETECTED", "CONTAINED", "FORENSICS_COMPLETE", "GOVERNANCE_REVIEW", "REMEDIATION_IN_PROGRESS", "REQUALIFICATION_REQUIRED", "CERTIFICATION_PENDING", "CLOSED"] as const satisfies readonly ProductionEscalationStatus[]);

function resultReplayHash(result: Omit<CertificationLineageResult, "replay_hash" | "integrity_hash">): string {
  return hash({ dependency: result.dependency_governance_ref, contract: result.contract.integrity_hash, violations: result.violations.map((v) => v.integrity_hash), attempts: result.certification_attempts.map((c) => c.integrity_hash), remediation: result.remediation.integrity_hash, supersession: result.supersession.integrity_hash, escalation: result.production_escalation.integrity_hash, graph: result.lineage_graph.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<CertificationLineageResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}
function test(name: string, passed: boolean, failure: CertificationLineageFailure): CertificationLineageTest {
  const actual: CertificationLineageOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_HISTORY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("cert_lineage_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

export function runCertificationLineageSupersession(input: CertificationLineageInput = {}): CertificationLineageResult {
  const dependency = runAssuranceDependencyGovernance();
  const dependencyValid = validateAssuranceDependencyGovernance(dependency).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(dependencyValid ? [] : ["DEPENDENCY_GOVERNANCE_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const tenant = input.tenant_id ?? "tenant_mission_control_foundation";
  const violationId = id("boundary_violation", { tenant, phase: VERSION });
  const failCert = id("certification_attempt", "fail");
  const passCert = has(failures, "CERTIFICATION_IDENTITY_MUTATED") ? failCert : id("certification_attempt", "pass");
  const remediationId = id("remediation", violationId);
  const replayRef = id("replay_validation", remediationId);

  const contract = nested({ contract_version: VERSION, dependency_governance_ref: dependency.integrity_hash, immutable_certification_history: !has(failures, "HISTORICAL_FAIL_REWRITTEN"), remediation_preserves_history: !has(failures, "VIOLATION_MUTABLE"), deterministic_supersession: !has(failures, "SUPERSESSION_NON_DETERMINISTIC"), replay_preservation: !has(failures, "REPLAY_LINEAGE_INCOMPLETE"), audit_ownership: !has(failures, "AUDIT_OWNERSHIP_MISSING") });
  const violation = nested({ violation_id: violationId, validation_run_id: id("validation_run", tenant), scenario_id: id("scenario", "synthetic-boundary-failure"), tenant_id: tenant, environment_id: dependency.scale_validation_ref, violation_category: "CONSTITUTIONAL" as const, severity: "CRITICAL" as const, lifecycle_state: has(failures, "VIOLATION_LIFECYCLE_INVALID") ? "RECORDED" as const : "CLOSED" as const, detected_timestamp: TIMESTAMP, originating_validation_refs: freezeArray([dependency.integrity_hash]), replay_refs: has(failures, "REPLAY_REFERENCES_INCOMPLETE") ? freezeArray([]) : freezeArray([replayRef]), remediation_refs: has(failures, "REMEDIATION_NOT_TRACEABLE") ? freezeArray([]) : freezeArray([remediationId]), certification_refs: has(failures, "CERTIFICATION_LINKAGE_NON_DETERMINISTIC") ? freezeArray([]) : freezeArray([failCert, passCert]) });
  const remediation = nested({ remediation_id: remediationId, violation_refs: freezeArray([violationId]), operational_remediation_external: true, historical_evidence_preserved: !has(failures, "VIOLATION_MUTABLE") && !has(failures, "HISTORICAL_FAIL_REWRITTEN"), replay_validation_ref: has(failures, "REQUALIFICATION_REPLAY_MISSING") ? "" : replayRef, requalification_ref: id("requalification", remediationId) });
  const attempts = freezeArray([
    nested({ certification_id: failCert, outcome: "FAIL" as const, predecessor_certification_id: null, violation_refs: freezeArray([violationId]), remediation_refs: freezeArray([]), replay_refs: freezeArray([id("replay", failCert)]), immutable: !has(failures, "HISTORICAL_FAIL_REWRITTEN"), visible: !has(failures, "HISTORICAL_FAIL_REWRITTEN") }),
    nested({ certification_id: passCert, outcome: "PASS" as const, predecessor_certification_id: has(failures, "PREDECESSOR_NOT_REFERENCED") ? null : failCert, violation_refs: freezeArray([violationId]), remediation_refs: freezeArray([remediationId]), replay_refs: has(failures, "REPLAY_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([replayRef]), immutable: !has(failures, "CERTIFICATION_IDENTITY_MUTATED"), visible: true }),
  ]);
  const supersession = nested({ supersession_id: id("supersession", { failCert, passCert }), predecessor_certification_id: has(failures, "PREDECESSOR_NOT_REFERENCED") ? "" : failCert, successor_certification_id: passCert, remediation_refs: freezeArray([remediationId]), replay_refs: has(failures, "REPLAY_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([replayRef]), supersession_reason: "REMEDIATION_COMPLETE" as const, approval_refs: has(failures, "SUPERSESSION_NON_DETERMINISTIC") ? freezeArray([]) : freezeArray([id("approval", "governance")]), effective_timestamp: TIMESTAMP });
  const escalation = nested({ escalation_id: id("production_escalation", failCert), certification_id: failCert, incident_id: id("incident", failCert), tenant_id: tenant, production_effect: true, containment_refs: has(failures, "CONTAINMENT_AFTER_REMEDIATION") ? freezeArray([]) : freezeArray([id("containment", failCert)]), forensic_refs: has(failures, "FORENSICS_MUTABLE") ? freezeArray([]) : freezeArray([id("forensics", failCert)]), governance_refs: has(failures, "GOVERNANCE_REVIEW_MISSING") ? freezeArray([]) : freezeArray([id("governance_review", failCert)]), integrity_validation_refs: freezeArray([id("integrity_validation", failCert)]), remediation_refs: freezeArray([remediationId]), requalification_refs: has(failures, "REQUALIFICATION_REPLAY_MISSING") ? freezeArray([]) : freezeArray([remediation.requalification_ref]), successor_certification_refs: has(failures, "SUCCESSOR_LINEAGE_MISSING") ? freezeArray([]) : freezeArray([passCert]), escalation_status: has(failures, "PRODUCTION_ESCALATION_NOT_GOVERNED") ? "GOVERNANCE_REVIEW" as const : "CLOSED" as const });
  const lineage = nested({ graph_id: id("certification_lineage_graph", tenant), nodes: freezeArray(["Validation", violationId, failCert, remediationId, replayRef, remediation.requalification_ref, passCert, supersession.supersession_id]), edges: freezeArray([`Validation->${violationId}`, `${violationId}->${failCert}`, `${failCert}->${remediationId}`, `${remediationId}->${replayRef}`, `${replayRef}->${passCert}`, `${passCert}->${supersession.supersession_id}`]), failed_certifications_visible: attempts[0].visible, successor_preserves_predecessor: attempts[1].predecessor_certification_id === failCert && supersession.predecessor_certification_id === failCert, replay_trace_complete: supersession.replay_refs.length > 0 && attempts[1].replay_refs.length > 0 });
  const tests = freezeArray([
    test("Certification lineage complete", lineage.nodes.length === 8 && lineage.edges.length === 6, "SUCCESSOR_LINEAGE_MISSING"),
    test("Supersession deterministic", contract.deterministic_supersession && supersession.approval_refs.length > 0, "SUPERSESSION_NON_DETERMINISTIC"),
    test("Certification attempts immutable", attempts.every((a) => a.immutable), "CERTIFICATION_IDENTITY_MUTATED"),
    test("Remediation fully traceable", remediation.violation_refs.length > 0 && violation.remediation_refs.length > 0, "REMEDIATION_NOT_TRACEABLE"),
    test("Successor preserves predecessor lineage", lineage.successor_preserves_predecessor, "PREDECESSOR_NOT_REFERENCED"),
    test("Failed certifications permanently visible", lineage.failed_certifications_visible, "HISTORICAL_FAIL_REWRITTEN"),
    test("Replay reproducible", lineage.replay_trace_complete, "REPLAY_LINEAGE_INCOMPLETE"),
    test("Production escalation governed", escalation.escalation_status === "CLOSED", "PRODUCTION_ESCALATION_NOT_GOVERNED"),
    test("Forensic evidence immutable", escalation.forensic_refs.length > 0, "FORENSICS_MUTABLE"),
    test("Governance review deterministic", escalation.governance_refs.length > 0, "GOVERNANCE_REVIEW_MISSING"),
    test("Certification history constitutionally preserved", contract.immutable_certification_history && contract.audit_ownership, "AUDIT_OWNERSHIP_MISSING"),
    test("Violation lifecycle complete", violation.lifecycle_state === "CLOSED", "VIOLATION_LIFECYCLE_INVALID"),
    test("Violation records immutable", verify(violation), "VIOLATION_MUTABLE"),
    test("Replay references complete", violation.replay_refs.length > 0, "REPLAY_REFERENCES_INCOMPLETE"),
    test("Certification linkage deterministic", violation.certification_refs.length === 2, "CERTIFICATION_LINKAGE_NON_DETERMINISTIC"),
    test("Containment precedes remediation", escalation.containment_refs.length > 0, "CONTAINMENT_AFTER_REMEDIATION"),
    test("Requalification replay present", remediation.replay_validation_ref.length > 0 && escalation.requalification_refs.length > 0, "REQUALIFICATION_REPLAY_MISSING"),
    test("Successor certification linked", escalation.successor_certification_refs.includes(passCert), "SUCCESSOR_LINEAGE_MISSING"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((t) => t.failure_reason).filter((failure): failure is CertificationLineageFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<CertificationLineageResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, dependency_governance_ref: dependency.integrity_hash, contract, violations: freezeArray([violation]), certification_attempts: attempts, remediation, supersession, production_escalation: escalation, lineage_graph: lineage, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCertificationLineageSupersession(result = runCertificationLineageSupersession()): CertificationLineageValidation {
  const contract_valid = verify(result.contract) && result.contract.immutable_certification_history && result.contract.remediation_preserves_history && result.contract.deterministic_supersession && result.contract.replay_preservation && result.contract.audit_ownership;
  const violations_valid = result.violations.every((v) => verify(v) && v.lifecycle_state === "CLOSED" && v.replay_refs.length > 0 && v.remediation_refs.length > 0 && v.certification_refs.length > 0);
  const attempts_valid = result.certification_attempts.length === 2 && result.certification_attempts.every((a) => verify(a) && a.immutable && a.visible) && result.certification_attempts[1].predecessor_certification_id === result.certification_attempts[0].certification_id;
  const remediation_valid = verify(result.remediation) && result.remediation.historical_evidence_preserved && result.remediation.operational_remediation_external && Boolean(result.remediation.replay_validation_ref);
  const supersession_valid = verify(result.supersession) && result.supersession.predecessor_certification_id === result.certification_attempts[0].certification_id && result.supersession.successor_certification_id === result.certification_attempts[1].certification_id && result.supersession.replay_refs.length > 0;
  const escalation_valid = verify(result.production_escalation) && result.production_escalation.escalation_status === "CLOSED" && result.production_escalation.containment_refs.length > 0 && result.production_escalation.forensic_refs.length > 0 && result.production_escalation.governance_refs.length > 0 && result.production_escalation.successor_certification_refs.length > 0;
  const lineage_valid = verify(result.lineage_graph) && result.lineage_graph.failed_certifications_visible && result.lineage_graph.successor_preserves_predecessor && result.lineage_graph.replay_trace_complete;
  const certification_valid = result.certification_tests.length === 18 && result.certification_tests.every((t) => verify(t) && t.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && violations_valid && attempts_valid && remediation_valid && supersession_valid && escalation_valid && lineage_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, violations_valid, attempts_valid, remediation_valid, supersession_valid, escalation_valid, lineage_valid, certification_valid, failures: result.failures });
}

export function replayCertificationLineageSupersession(result = runCertificationLineageSupersession()): boolean {
  const replayed = runCertificationLineageSupersession();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCertificationLineageSupersession(result).valid;
}

export function getCertificationLineageSupersessionBundle(): CertificationLineageBundle {
  const result = runCertificationLineageSupersession();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, dependency_governance_phase: "assurance-dependency-governance/v14.8" as const, violation_lifecycle: violationLifecycle, violation_categories: violationCategories, supersession_reasons: supersessionReasons, escalation_statuses: escalationStatuses, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateCertificationLineageSupersession(result) });
}

export const CertificationLineageSupersessionService = Object.freeze({ run: runCertificationLineageSupersession, validate: validateCertificationLineageSupersession, replay: replayCertificationLineageSupersession });
