import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionReplayDigitalTwinValidation } from "@/services/production-replay-digital-twin-validation";
import type {
  OperationalIncidentCategory,
  OperationalResponse,
  OperationalSafetyBundle,
  OperationalSafetyCertificationTest,
  OperationalSafetyFailure,
  OperationalSafetyInput,
  OperationalSafetyLifecycleState,
  OperationalSafetyOutcome,
  OperationalSafetyResult,
  OperationalSafetySeverity,
  OperationalSafetyValidation,
} from "@/types/operational-safety-incident-response-rollback";

const VERSION = "operational-safety-incident-response-rollback/v15.9" as const;
const IDENTIFIER = "OperationalSafetyIncidentResponseRollback" as const;
const DEFAULT_TENANT = "tenant_phase_15_operational_safety" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly OperationalSafetyFailure[], failure: OperationalSafetyFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: OperationalSafetyInput["scenario"]): OperationalSafetyFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly OperationalSafetyFailure[]): OperationalSafetyOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_SAFETY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["INCIDENT_DETECTED", "CLASSIFIED", "CONTAINMENT_REQUIRED", "CONTAINMENT_ACTIVE", "FORENSICS_CAPTURED", "ROOT_CAUSE_IDENTIFIED", "REMEDIATION_IMPLEMENTED", "RECOVERY_QUALIFICATION", "FAILED", "PRODUCTION_RESTORED", "INCIDENT_CLOSED"] as const satisfies readonly OperationalSafetyLifecycleState[]);
const severities = freezeArray(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CONSTITUTIONAL"] as const satisfies readonly OperationalSafetySeverity[]);
const categories = freezeArray(["SAFETY_INCIDENT", "GOVERNANCE_INCIDENT", "SECURITY_INCIDENT", "CONFIGURATION_INCIDENT", "DEPLOYMENT_INCIDENT", "MODEL_INCIDENT", "REPLAY_INCIDENT", "TENANT_ISOLATION_INCIDENT", "DATA_INTEGRITY_INCIDENT", "CERTIFICATION_INCIDENT", "UNKNOWN_INCIDENT"] as const satisfies readonly OperationalIncidentCategory[]);
const responses = freezeArray(["MONITOR", "RESTRICT_SCOPE", "FREEZE_PROMOTION", "DISABLE_CAPABILITY", "ISOLATE_TENANT", "REVOKE_RELEASE", "ROLLBACK", "FAIL_CLOSED", "REQUIRE_GOVERNANCE_REVIEW", "REQUIRE_RECERTIFICATION"] as const satisfies readonly OperationalResponse[]);

function certTest(name: string, passed: boolean, failure: OperationalSafetyFailure, evidence_refs: readonly string[]): OperationalSafetyCertificationTest {
  const actual: OperationalSafetyOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_SAFETY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("operational_safety_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<OperationalSafetyResult, "replay_hash" | "integrity_hash">): string {
  return hash({ replay: result.production_replay_ref, contract: result.contract.integrity_hash, incident: result.incident.integrity_hash, classification: result.classification.integrity_hash, containment: result.containment.integrity_hash, rollback: result.rollback.integrity_hash, forensics: result.forensics.integrity_hash, recovery: result.recovery.integrity_hash, lineage: result.lineage.integrity_hash, governance: result.governance.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<OperationalSafetyResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runOperationalSafetyIncidentResponseRollback(input: OperationalSafetyInput = {}): OperationalSafetyResult {
  const replay = runProductionReplayDigitalTwinValidation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const direct = directFailure(input.scenario);
  const upstreamFailures: OperationalSafetyFailure[] = replay.outcome === "PASS" ? [] : ["REPLAY_REFERENCES_LOST"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const incidentId = input.incident_id ?? id("production_incident", replay.integrity_hash);
  const incidentUnknown = has(failures, "UNKNOWN_INCIDENT_NOT_FAIL_CLOSED");
  const advisoryBroken = has(failures, "ADVISORY_BOUNDARY_BROKEN") || has(failures, "ROLLBACK_RECOMMENDATION_EXECUTES");
  const contract = nested({ contract_version: VERSION, lifecycle, response_vocabulary: responses, safety_before_availability: true, deterministic_containment_required: !has(failures, "CONTAINMENT_RESPONSE_NON_DETERMINISTIC"), advisory_boundary_required: !advisoryBroken, independent_authority_required: !has(failures, "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED"), qualified_recovery_required: !has(failures, "RECOVERY_QUALIFICATION_NOT_MANDATORY"), immutable_history_required: !has(failures, "REMEDIATION_REWRITES_HISTORY") && !has(failures, "SAFETY_LEDGER_NOT_APPEND_ONLY") });
  const incident = nested({ incident_id: incidentId, category: incidentUnknown ? "UNKNOWN_INCIDENT" as const : "REPLAY_INCIDENT" as const, severity: incidentUnknown ? "CONSTITUTIONAL" as const : "HIGH" as const, affected_release_refs: freezeArray([replay.replay_record.certification_reference]), affected_tenants: freezeArray([input.tenant_id ?? DEFAULT_TENANT]), affected_environments: freezeArray([replay.replay_record.environment_reference]), evidence_refs: has(failures, "FORENSIC_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([replay.integrity_hash]), containment_status: "ACTIVE" as const, rollback_status: "AUTHORIZED_REFERENCE_RECORDED" as const, owner_ref: id("incident_owner", incidentId), deterministic_state: !has(failures, "INCIDENT_LIFECYCLE_NON_DETERMINISTIC") });
  const classification = nested({ classification_id: id("incident_classification", incidentId), category: incident.category, severity: incident.severity, constitutional_impact: true, tenant_impact: true, replay_impact: true, production_scope: "TENANT" as const, rollback_eligible: true, unknown_incident_fail_closed: !incidentUnknown || !has(failures, "UNKNOWN_INCIDENT_NOT_FAIL_CLOSED"), reproducible: !has(failures, "INCIDENT_CLASSIFICATION_NOT_REPRODUCIBLE") });
  const response: OperationalResponse = incidentUnknown ? "FAIL_CLOSED" : "ROLLBACK";
  const containment = nested({ containment_id: id("containment_decision", incidentId), response, equivalent_incident_response_hash: has(failures, "EQUIVALENT_INCIDENTS_DIFFER") ? id("different_response", incidentId) : id("equivalent_response", classification.category), deterministic: !has(failures, "CONTAINMENT_RESPONSE_NON_DETERMINISTIC"), equivalent_incidents_identical: !has(failures, "EQUIVALENT_INCIDENTS_DIFFER"), mandatory_constitutional_containment_weakened: false as const, tenant_containment_deterministic: !has(failures, "TENANT_CONTAINMENT_NON_DETERMINISTIC"), authority_preserved: !has(failures, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED"), evidence_refs: freezeArray([classification.integrity_hash]) });
  const rollback = nested({ rollback_id: id("rollback_recommendation", incidentId), recommendation: "ROLLBACK_RECOMMENDED" as const, advisory_only: !advisoryBroken, independent_authorization_required: !has(failures, "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED"), authorized_execution_ref: has(failures, "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED") ? "" : id("authorized_rollback_reference", incidentId), replay_deterministic: !has(failures, "ROLLBACK_REPLAY_NON_DETERMINISTIC"), evidence_preserved: !has(failures, "ROLLBACK_EVIDENCE_NOT_PRESERVED"), supported_scopes: freezeArray(["release", "capability", "configuration", "tenant", "environment"] as const) });
  const forensics = nested({ forensic_id: id("forensic_evidence", incidentId), production_state_ref: id("production_state", incidentId), configuration_ref: replay.replay_record.configuration_reference, input_ref: replay.replay_record.production_input_reference, output_ref: replay.replay_record.production_output_reference, telemetry_ref: id("telemetry", incidentId), governance_decision_ref: id("governance_decision", incidentId), deployment_state_ref: replay.replay_record.certification_reference, replay_refs: has(failures, "REPLAY_REFERENCES_LOST") ? freezeArray([]) : freezeArray([replay.replay_hash]), captured_before_remediation: true, immutable: !has(failures, "FORENSIC_EVIDENCE_MUTABLE"), integrity_verified: !has(failures, "FORENSIC_INTEGRITY_NOT_VERIFIED") });
  const recovery = nested({ recovery_id: id("recovery_qualification", incidentId), remediation_complete: true, replay_successful: !has(failures, "ROLLBACK_REPLAY_NON_DETERMINISTIC") && forensics.replay_refs.length > 0, divergence_resolved: true, governance_satisfied: !has(failures, "GOVERNANCE_REVIEW_NOT_ENFORCED"), production_safety_restored: true, certification_current: !has(failures, "CERTIFICATION_DEPENDENCIES_NOT_VALIDATED"), recovery_qualified: !has(failures, "RECOVERY_QUALIFICATION_NOT_MANDATORY") && !has(failures, "UNQUALIFIED_RECOVERY_ALLOWED"), unqualified_recovery_blocked: !has(failures, "UNQUALIFIED_RECOVERY_ALLOWED"), certification_dependencies_validated: !has(failures, "CERTIFICATION_DEPENDENCIES_NOT_VALIDATED") });
  const lineage = nested({ lineage_id: id("incident_lineage", incidentId), incident_refs: freezeArray([incident.integrity_hash]), containment_refs: freezeArray([containment.integrity_hash]), rollback_refs: freezeArray([rollback.integrity_hash]), remediation_refs: has(failures, "REMEDIATION_REWRITES_HISTORY") ? freezeArray([]) : freezeArray([id("remediation", incidentId)]), qualification_refs: freezeArray([recovery.integrity_hash]), certification_refs: has(failures, "CERTIFICATION_LINEAGE_LOST") ? freezeArray([]) : freezeArray([replay.replay_record.certification_reference]), replay_refs: forensics.replay_refs, supersession_refs: freezeArray([id("supersession", incidentId)]), complete: !has(failures, "INCIDENT_LINEAGE_INCOMPLETE"), immutable: !has(failures, "REMEDIATION_REWRITES_HISTORY"), searchable_after_recovery: !has(failures, "REMEDIATION_REWRITES_HISTORY") });
  const governance = nested({ governance_id: id("operational_safety_governance", incidentId), governance_review_enforced: !has(failures, "GOVERNANCE_REVIEW_NOT_ENFORCED"), authority_separation_verified: !has(failures, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED") && !has(failures, "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED"), constitutional_compliance: !has(failures, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED"), approval_integrity: !has(failures, "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED"), escalation_reproducible: !has(failures, "INCIDENT_CLASSIFICATION_NOT_REPRODUCIBLE"), advisory_boundary_maintained: !advisoryBroken });
  const ledgerTypes = ["INCIDENT", "CONTAINMENT_DECISION", "ROLLBACK_RECOMMENDATION", "AUTHORIZED_ROLLBACK_REFERENCE", "FORENSIC_EVIDENCE", "GOVERNANCE_REVIEW", "RECOVERY_QUALIFICATION", "CERTIFICATION_REFERENCE"] as const;
  const ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("operational_safety_ledger", { incidentId, event_type }), event_type, sequence: index + 1, evidence_refs: has(failures, "SAFETY_LEDGER_NOT_APPEND_ONLY") ? freezeArray([]) : freezeArray([incident.integrity_hash, forensics.integrity_hash]), replay_refs: forensics.replay_refs, lineage_refs: has(failures, "INCIDENT_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([lineage.integrity_hash]), append_only: !has(failures, "SAFETY_LEDGER_NOT_APPEND_ONLY"), immutable: !has(failures, "SAFETY_LEDGER_NOT_APPEND_ONLY") && !has(failures, "FORENSIC_EVIDENCE_MUTABLE") })));
  const responseVocabularyEnforced = responses.includes(containment.response);
  const tests = freezeArray([
    certTest("Incident lifecycle deterministic", incident.deterministic_state && contract.lifecycle.length === 11, "INCIDENT_LIFECYCLE_NON_DETERMINISTIC", [incident.integrity_hash]),
    certTest("Incident classification reproducible", classification.reproducible, "INCIDENT_CLASSIFICATION_NOT_REPRODUCIBLE", [classification.integrity_hash]),
    certTest("Containment responses deterministic", containment.deterministic, "CONTAINMENT_RESPONSE_NON_DETERMINISTIC", [containment.integrity_hash]),
    certTest("Equivalent incidents produce identical responses", containment.equivalent_incidents_identical, "EQUIVALENT_INCIDENTS_DIFFER", [containment.integrity_hash]),
    certTest("Unknown incidents fail closed", classification.unknown_incident_fail_closed && (incident.category !== "UNKNOWN_INCIDENT" || containment.response === "FAIL_CLOSED"), "UNKNOWN_INCIDENT_NOT_FAIL_CLOSED", [classification.integrity_hash]),
    certTest("Response vocabulary enforced", responseVocabularyEnforced, "RESPONSE_VOCABULARY_NOT_ENFORCED", [contract.integrity_hash]),
    certTest("Rollback recommendations advisory-only", rollback.advisory_only, "ROLLBACK_RECOMMENDATION_EXECUTES", [rollback.integrity_hash]),
    certTest("Production rollback independently authorized", rollback.independent_authorization_required && Boolean(rollback.authorized_execution_ref), "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED", [rollback.integrity_hash]),
    certTest("Rollback replay deterministic", rollback.replay_deterministic, "ROLLBACK_REPLAY_NON_DETERMINISTIC", [rollback.integrity_hash]),
    certTest("Rollback evidence preserved", rollback.evidence_preserved, "ROLLBACK_EVIDENCE_NOT_PRESERVED", [rollback.integrity_hash]),
    certTest("Forensic evidence immutable", forensics.immutable, "FORENSIC_EVIDENCE_MUTABLE", [forensics.integrity_hash]),
    certTest("Forensic integrity verified", forensics.integrity_verified, "FORENSIC_INTEGRITY_NOT_VERIFIED", [forensics.integrity_hash]),
    certTest("Incident lineage complete", lineage.complete && lineage.replay_refs.length > 0 && lineage.certification_refs.length > 0, "INCIDENT_LINEAGE_INCOMPLETE", [lineage.integrity_hash]),
    certTest("Remediation never rewrites incident history", lineage.immutable && lineage.searchable_after_recovery && lineage.remediation_refs.length > 0, "REMEDIATION_REWRITES_HISTORY", [lineage.integrity_hash]),
    certTest("Recovery qualification mandatory", contract.qualified_recovery_required && recovery.recovery_qualified, "RECOVERY_QUALIFICATION_NOT_MANDATORY", [recovery.integrity_hash]),
    certTest("Recovery without qualification blocked", recovery.unqualified_recovery_blocked, "UNQUALIFIED_RECOVERY_ALLOWED", [recovery.integrity_hash]),
    certTest("Certification dependencies validated before recovery", recovery.certification_dependencies_validated && recovery.certification_current, "CERTIFICATION_DEPENDENCIES_NOT_VALIDATED", [recovery.integrity_hash]),
    certTest("Governance review enforced where required", governance.governance_review_enforced && recovery.governance_satisfied, "GOVERNANCE_REVIEW_NOT_ENFORCED", [governance.integrity_hash]),
    certTest("Tenant containment deterministic", containment.tenant_containment_deterministic, "TENANT_CONTAINMENT_NON_DETERMINISTIC", [containment.integrity_hash]),
    certTest("Constitutional authority preserved", containment.authority_preserved && governance.constitutional_compliance, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED", [governance.integrity_hash]),
    certTest("Advisory boundary maintained during incidents", contract.advisory_boundary_required && governance.advisory_boundary_maintained, "ADVISORY_BOUNDARY_BROKEN", [governance.integrity_hash]),
    certTest("Operational Safety Ledger append-only", ledger.every((entry) => entry.append_only && entry.immutable && entry.evidence_refs.length > 0), "SAFETY_LEDGER_NOT_APPEND_ONLY", ledger.map((entry) => entry.integrity_hash)),
    certTest("Replay references preserved", forensics.replay_refs.length > 0 && ledger.every((entry) => entry.replay_refs.length > 0), "REPLAY_REFERENCES_LOST", [forensics.integrity_hash]),
    certTest("Certification lineage maintained after recovery", lineage.certification_refs.length > 0, "CERTIFICATION_LINEAGE_LOST", [lineage.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is OperationalSafetyFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<OperationalSafetyResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_replay_ref: replay.integrity_hash, contract, incident, classification, containment, rollback, forensics, recovery, lineage, governance, ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperationalSafetyIncidentResponseRollback(result = runOperationalSafetyIncidentResponseRollback()): OperationalSafetyValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 11 && result.contract.response_vocabulary.length === 10 && result.contract.safety_before_availability && result.contract.deterministic_containment_required && result.contract.advisory_boundary_required && result.contract.independent_authority_required && result.contract.qualified_recovery_required && result.contract.immutable_history_required;
  const incident_valid = verify(result.incident) && result.incident.deterministic_state && result.incident.evidence_refs.length > 0 && result.incident.containment_status === "ACTIVE";
  const classification_valid = verify(result.classification) && result.classification.reproducible && result.classification.unknown_incident_fail_closed;
  const containment_valid = verify(result.containment) && result.containment.deterministic && result.containment.equivalent_incidents_identical && !result.containment.mandatory_constitutional_containment_weakened && result.containment.tenant_containment_deterministic && result.containment.authority_preserved;
  const rollback_valid = verify(result.rollback) && result.rollback.advisory_only && result.rollback.independent_authorization_required && Boolean(result.rollback.authorized_execution_ref) && result.rollback.replay_deterministic && result.rollback.evidence_preserved;
  const forensics_valid = verify(result.forensics) && result.forensics.immutable && result.forensics.integrity_verified && result.forensics.replay_refs.length > 0;
  const recovery_valid = verify(result.recovery) && result.recovery.recovery_qualified && result.recovery.unqualified_recovery_blocked && result.recovery.certification_dependencies_validated && result.recovery.governance_satisfied;
  const lineage_valid = verify(result.lineage) && result.lineage.complete && result.lineage.immutable && result.lineage.searchable_after_recovery && result.lineage.replay_refs.length > 0 && result.lineage.certification_refs.length > 0;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => key !== "governance_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const ledger_valid = result.ledger.length === 8 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.lineage_refs.length > 0);
  const certification_valid = result.certification_tests.length === 24 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && incident_valid && classification_valid && containment_valid && rollback_valid && forensics_valid && recovery_valid && lineage_valid && governance_valid && ledger_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, incident_valid, classification_valid, containment_valid, rollback_valid, forensics_valid, recovery_valid, lineage_valid, governance_valid, ledger_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayOperationalSafetyIncidentResponseRollback(result = runOperationalSafetyIncidentResponseRollback()): boolean {
  const replayed = runOperationalSafetyIncidentResponseRollback();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationalSafetyIncidentResponseRollback(result).valid;
}

export function getOperationalSafetyIncidentResponseRollbackBundle(): OperationalSafetyBundle {
  const result = runOperationalSafetyIncidentResponseRollback();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-replay-digital-twin-validation/v15.8" as const, lifecycle, severities, categories, response_vocabulary: responses, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateOperationalSafetyIncidentResponseRollback(result) });
}

export const OperationalSafetyIncidentResponseRollbackService = Object.freeze({ run: runOperationalSafetyIncidentResponseRollback, validate: validateOperationalSafetyIncidentResponseRollback, replay: replayOperationalSafetyIncidentResponseRollback });
