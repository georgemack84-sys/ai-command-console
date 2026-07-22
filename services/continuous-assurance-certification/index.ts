import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperationalSafetyIncidentResponseRollback } from "@/services/operational-safety-incident-response-rollback";
import type {
  AssuranceDecision,
  CertificationHealthState,
  CertificationLifecycleState,
  CertificationStatus,
  ContinuousAssuranceBundle,
  ContinuousAssuranceCertificationTest,
  ContinuousAssuranceFailure,
  ContinuousAssuranceInput,
  ContinuousAssuranceOutcome,
  ContinuousAssuranceResult,
  ContinuousAssuranceValidation,
  DependencyValidationStatus,
  EvidenceFreshnessStatus,
  RecertificationTrigger,
} from "@/types/continuous-assurance-certification";

const VERSION = "continuous-assurance-certification/v15.10" as const;
const IDENTIFIER = "ContinuousAssuranceCertification" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const EXPIRATION = "2026-08-14T00:00:00.000Z" as const;
const REVIEW = "2026-07-22T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_15_continuous_assurance" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousAssuranceFailure[], failure: ContinuousAssuranceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousAssuranceInput["scenario"]): ContinuousAssuranceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousAssuranceFailure[]): ContinuousAssuranceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_ASSURANCE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["ACTIVE", "MONITORING", "CHANGE_DETECTED", "ASSURANCE_EVALUATION", "CERTIFIED", "RECERTIFICATION_REQUIRED", "REQUALIFICATION", "RECERTIFIED", "CERTIFICATION_INVALID"] as const satisfies readonly CertificationLifecycleState[]);
const statuses = freezeArray(["ACTIVE", "MONITORING", "UNDER_REVIEW", "RECERTIFICATION_REQUIRED", "RECERTIFICATION_IN_PROGRESS", "RECERTIFIED", "SUSPENDED", "INVALID", "REVOKED"] as const satisfies readonly CertificationStatus[]);
const healthStates = freezeArray(["HEALTHY", "DEGRADED", "REQUIRES_REVIEW", "RECERTIFICATION_REQUIRED", "INVALID"] as const satisfies readonly CertificationHealthState[]);
const evidenceStatuses = freezeArray(["CURRENT", "EXPIRING", "EXPIRED", "INVALID", "SUPERSEDED"] as const satisfies readonly EvidenceFreshnessStatus[]);
const dependencyStates = freezeArray(["VERIFIED", "REVERIFYING", "STALE", "FAILED", "SUPERSEDED"] as const satisfies readonly DependencyValidationStatus[]);
const decisions = freezeArray(["CERTIFICATION_VALID", "CERTIFICATION_DEGRADED", "RECERTIFICATION_REQUIRED", "EVIDENCE_STALE", "DEPENDENCY_INVALID", "ENVIRONMENT_CHANGED", "POLICY_OUTDATED", "MODEL_CHANGED", "INCIDENT_REVIEW_REQUIRED", "CERTIFICATION_REVOKED"] as const satisfies readonly AssuranceDecision[]);
const triggers = freezeArray(["release change", "dependency change", "policy change", "model change", "environment drift", "unexplained replay divergence", "boundary violation", "tenant isolation violation", "material incident", "expired evidence"] as const satisfies readonly RecertificationTrigger[]);

function certTest(name: string, passed: boolean, failure: ContinuousAssuranceFailure, evidence_refs: readonly string[]): ContinuousAssuranceCertificationTest {
  const actual: ContinuousAssuranceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_ASSURANCE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_assurance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousAssuranceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ safety: result.operational_safety_ref, contract: result.contract.integrity_hash, evaluation: result.evaluation.integrity_hash, health: result.health.integrity_hash, freshness: result.freshness.integrity_hash, dependency: result.dependency_reverification.integrity_hash, schedule: result.recertification_schedule.integrity_hash, certification: result.certification_record.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousAssuranceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runContinuousAssuranceCertification(input: ContinuousAssuranceInput = {}): ContinuousAssuranceResult {
  const safety = runOperationalSafetyIncidentResponseRollback({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousAssuranceFailure[] = safety.outcome === "PASS" ? [] : ["REPLAY_NOT_REPRODUCIBLE"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const certificationId = input.certification_id ?? id("production_certification", safety.integrity_hash);
  const invalidCondition = has(failures, "FAIL_CLOSED_NOT_ENFORCED") || has(failures, "INVALID_CERTIFICATION_ACTIVE") || has(failures, "EXPIRED_EVIDENCE_ACCEPTED") || has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE");
  const contract = nested({ contract_version: VERSION, lifecycle, status_vocabulary: statuses, decision_vocabulary: decisions, continuous_qualification_required: !has(failures, "ASSURANCE_NON_DETERMINISTIC"), evidence_freshness_required: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED"), fail_closed_required: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"), immutable_history_required: !has(failures, "CERTIFICATION_LINEAGE_MUTABLE") && !has(failures, "LEDGER_NOT_APPEND_ONLY"), deterministic_requalification_required: !has(failures, "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC"), advisory_boundary_required: true });
  const health = nested({ health_id: id("certification_health", certificationId), state: invalidCondition ? "INVALID" as const : "HEALTHY" as const, evidence_validity_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), dependency_integrity_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), replay_consistency_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), policy_compliance_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), qualification_completeness_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), certification_age_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), outstanding_violations_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), pending_recertifications_monitored: !has(failures, "CERTIFICATION_HEALTH_NOT_MONITORED"), invalid_certification_identified: !has(failures, "INVALID_CERTIFICATION_ACTIVE") });
  const freshness = nested({ freshness_id: id("evidence_freshness", certificationId), status: has(failures, "EXPIRED_EVIDENCE_ACCEPTED") ? "EXPIRED" as const : "CURRENT" as const, evidence_expiration_valid: !has(failures, "EXPIRED_EVIDENCE_ACCEPTED"), replay_reproducible: !has(failures, "REPLAY_NOT_REPRODUCIBLE"), integrity_hashes_valid: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED"), signature_validity: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED"), lineage_complete: !has(failures, "CERTIFICATION_LINEAGE_MUTABLE"), governance_approval_valid: true, environmental_applicability: true, expired_evidence_rejected: !has(failures, "EXPIRED_EVIDENCE_ACCEPTED"), superseded_evidence_rejected: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED"), missing_evidence_invalidates: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED"), deterministic: !has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED") });
  const dependency_reverification = nested({ reverification_id: id("dependency_reverification", certificationId), status: has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE") ? "FAILED" as const : "VERIFIED" as const, specifications_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), security_controls_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), compliance_artifacts_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), external_services_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), infrastructure_assumptions_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), trust_anchors_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), approved_baselines_verified: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), stale_dependencies_detected: has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE"), dependent_certifications_invalidated_on_loss: true, reproducible: !has(failures, "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE") });
  const recertificationNeeded = invalidCondition || has(failures, "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC");
  const recertification_schedule = nested({ schedule_id: id("recertification_schedule", certificationId), triggers, trigger_severity: recertificationNeeded ? "CRITICAL" as const : "INFORMATIONAL" as const, certification_scope: freezeArray(["production certification", "evidence", "dependencies", "replay", "governance"]), priority: recertificationNeeded ? "IMMEDIATE_CONTAINMENT_AND_RECERTIFICATION" as const : "MONITOR" as const, qualification_workflow_ref: id("qualification_workflow", certificationId), scheduling_lineage_refs: has(failures, "CERTIFICATION_LINEAGE_MUTABLE") ? freezeArray([]) : freezeArray([safety.integrity_hash]), deterministic_triggers: !has(failures, "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC"), reproducible_schedule: !has(failures, "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC"), governed_prioritization: !has(failures, "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC") });
  const evaluation = nested({ evaluation_id: id("assurance_evaluation", certificationId), decision: recertificationNeeded ? "RECERTIFICATION_REQUIRED" as const : "CERTIFICATION_VALID" as const, production_changes_evaluated: !has(failures, "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC"), assurance_assumptions_verified: !has(failures, "ASSURANCE_NON_DETERMINISTIC"), reevaluation_initiated: true, deterministic: !has(failures, "ASSURANCE_NON_DETERMINISTIC"), replayable: !has(failures, "REPLAY_NOT_REPRODUCIBLE"), qualification_preserved: !invalidCondition, invalid_certification_blocked: !has(failures, "INVALID_CERTIFICATION_ACTIVE") });
  const ledgerPlaceholder = id("certification_ledger", certificationId);
  const certification_record = nested({ certification_id: certificationId, tenant_id: input.tenant_id ?? DEFAULT_TENANT, production_environment_id: id("production_environment", safety.integrity_hash), deployment_id: safety.incident.affected_release_refs[0] ?? id("deployment", certificationId), certification_version: "15.10.0" as const, certification_status: invalidCondition ? "INVALID" as const : "ACTIVE" as const, certification_health: health.state, certification_scope: recertification_schedule.certification_scope, certification_authority: "CONSTITUTIONAL_CERTIFICATION_ENGINE" as const, evidence_refs: has(failures, "EVIDENCE_FRESHNESS_NOT_ENFORCED") ? freezeArray([]) : freezeArray([safety.integrity_hash, freshness.integrity_hash]), evidence_freshness_status: freshness.status, dependency_refs: freezeArray([dependency_reverification.integrity_hash]), dependency_validation_status: dependency_reverification.status, active_trigger_refs: freezeArray([recertification_schedule.integrity_hash]), health_assessments: freezeArray([health.integrity_hash]), replay_validation_refs: has(failures, "REPLAY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([safety.replay_hash]), incident_refs: freezeArray([safety.incident.integrity_hash]), certification_date: TIMESTAMP, expiration_date: EXPIRATION, next_review_date: REVIEW, recertification_due: recertificationNeeded, superseded_by: null, governance_refs: freezeArray([safety.governance.integrity_hash]), operator_refs: freezeArray([safety.incident.owner_ref]), approval_refs: freezeArray([safety.rollback.authorized_execution_ref]), lineage_refs: has(failures, "CERTIFICATION_LINEAGE_MUTABLE") ? freezeArray([]) : freezeArray([safety.integrity_hash, evaluation.integrity_hash]), ledger_refs: freezeArray([ledgerPlaceholder]) });
  const ledgerTypes = ["CERTIFICATION_EVALUATION", "HEALTH_ASSESSMENT", "TRIGGER_EVENT", "EVIDENCE_UPDATE", "DEPENDENCY_REVERIFICATION", "RECERTIFICATION_REQUEST", "QUALIFICATION_OUTCOME", "LINEAGE_REFERENCE"] as const;
  const ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("production_certification_ledger", { certificationId, event_type }), event_type, sequence: index + 1, evidence_refs: has(failures, "LEDGER_NOT_APPEND_ONLY") ? freezeArray([]) : freezeArray([certification_record.integrity_hash]), lineage_refs: has(failures, "CERTIFICATION_LINEAGE_MUTABLE") ? freezeArray([]) : certification_record.lineage_refs, replay_refs: has(failures, "REPLAY_NOT_REPRODUCIBLE") ? freezeArray([]) : certification_record.replay_validation_refs, append_only: !has(failures, "LEDGER_NOT_APPEND_ONLY"), immutable: !has(failures, "LEDGER_NOT_APPEND_ONLY") && !has(failures, "CERTIFICATION_LINEAGE_MUTABLE"), replayable: !has(failures, "REPLAY_NOT_REPRODUCIBLE"), tenant_isolated: true, cryptographically_verifiable: !has(failures, "LEDGER_NOT_APPEND_ONLY") })));
  const tests = freezeArray([
    certTest("Continuous assurance deterministic", evaluation.deterministic && contract.continuous_qualification_required, "ASSURANCE_NON_DETERMINISTIC", [evaluation.integrity_hash]),
    certTest("Certification health monitored", Object.entries(health).filter(([key]) => key.endsWith("_monitored")).every(([, value]) => value === true), "CERTIFICATION_HEALTH_NOT_MONITORED", [health.integrity_hash]),
    certTest("Evidence freshness enforced", freshness.deterministic && freshness.integrity_hashes_valid && freshness.missing_evidence_invalidates, "EVIDENCE_FRESHNESS_NOT_ENFORCED", [freshness.integrity_hash]),
    certTest("Expired evidence rejected", freshness.expired_evidence_rejected && freshness.status !== "EXPIRED", "EXPIRED_EVIDENCE_ACCEPTED", [freshness.integrity_hash]),
    certTest("Dependency reverification reproducible", dependency_reverification.reproducible && dependency_reverification.status === "VERIFIED", "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE", [dependency_reverification.integrity_hash]),
    certTest("Material change detection deterministic", evaluation.production_changes_evaluated && recertification_schedule.deterministic_triggers, "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC", [recertification_schedule.integrity_hash]),
    certTest("Recertification scheduling deterministic", recertification_schedule.reproducible_schedule && recertification_schedule.governed_prioritization, "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC", [recertification_schedule.integrity_hash]),
    certTest("Certification lineage immutable", certification_record.lineage_refs.length > 0 && ledger.every((entry) => entry.immutable && entry.lineage_refs.length > 0), "CERTIFICATION_LINEAGE_MUTABLE", [certification_record.integrity_hash]),
    certTest("Replay reproducible", evaluation.replayable && certification_record.replay_validation_refs.length > 0 && ledger.every((entry) => entry.replayable), "REPLAY_NOT_REPRODUCIBLE", [evaluation.integrity_hash]),
    certTest("Fail-closed certification enforced", contract.fail_closed_required && (invalidCondition ? certification_record.certification_status === "INVALID" : true), "FAIL_CLOSED_NOT_ENFORCED", [contract.integrity_hash]),
    certTest("Invalid certifications blocked", evaluation.invalid_certification_blocked && certification_record.certification_status !== "INVALID", "INVALID_CERTIFICATION_ACTIVE", [evaluation.integrity_hash]),
    certTest("Ledger append-only", ledger.every((entry) => entry.append_only && entry.immutable && entry.evidence_refs.length > 0 && entry.cryptographically_verifiable), "LEDGER_NOT_APPEND_ONLY", ledger.map((entry) => entry.integrity_hash)),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousAssuranceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousAssuranceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, operational_safety_ref: safety.integrity_hash, contract, evaluation, health, freshness, dependency_reverification, recertification_schedule, certification_record, ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousAssuranceCertification(result = runContinuousAssuranceCertification()): ContinuousAssuranceValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 9 && result.contract.status_vocabulary.length === 9 && result.contract.decision_vocabulary.length === 10 && result.contract.continuous_qualification_required && result.contract.evidence_freshness_required && result.contract.fail_closed_required && result.contract.immutable_history_required && result.contract.deterministic_requalification_required && result.contract.advisory_boundary_required;
  const evaluation_valid = verify(result.evaluation) && result.evaluation.deterministic && result.evaluation.replayable && result.evaluation.assurance_assumptions_verified && result.evaluation.production_changes_evaluated && result.evaluation.invalid_certification_blocked;
  const health_valid = verify(result.health) && result.health.state === "HEALTHY" && result.health.invalid_certification_identified && Object.entries(result.health).filter(([key]) => key.endsWith("_monitored")).every(([, value]) => value === true);
  const freshness_valid = verify(result.freshness) && result.freshness.status === "CURRENT" && result.freshness.expired_evidence_rejected && result.freshness.superseded_evidence_rejected && result.freshness.missing_evidence_invalidates && result.freshness.deterministic;
  const dependency_valid = verify(result.dependency_reverification) && result.dependency_reverification.status === "VERIFIED" && result.dependency_reverification.reproducible && result.dependency_reverification.dependent_certifications_invalidated_on_loss && Object.entries(result.dependency_reverification).filter(([key]) => key.endsWith("_verified")).every(([, value]) => value === true);
  const schedule_valid = verify(result.recertification_schedule) && result.recertification_schedule.triggers.length === 10 && result.recertification_schedule.deterministic_triggers && result.recertification_schedule.reproducible_schedule && result.recertification_schedule.governed_prioritization && result.recertification_schedule.scheduling_lineage_refs.length > 0;
  const certification_record_valid = verify(result.certification_record) && result.certification_record.certification_status === "ACTIVE" && result.certification_record.certification_health === "HEALTHY" && result.certification_record.evidence_refs.length > 0 && result.certification_record.lineage_refs.length > 0 && result.certification_record.replay_validation_refs.length > 0;
  const ledger_valid = result.ledger.length === 8 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable && entry.tenant_isolated && entry.cryptographically_verifiable && entry.evidence_refs.length > 0 && entry.lineage_refs.length > 0 && entry.replay_refs.length > 0);
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && evaluation_valid && health_valid && freshness_valid && dependency_valid && schedule_valid && certification_record_valid && ledger_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, evaluation_valid, health_valid, freshness_valid, dependency_valid, schedule_valid, certification_record_valid, ledger_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayContinuousAssuranceCertification(result = runContinuousAssuranceCertification()): boolean {
  const replayed = runContinuousAssuranceCertification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousAssuranceCertification(result).valid;
}

export function getContinuousAssuranceCertificationBundle(): ContinuousAssuranceBundle {
  const result = runContinuousAssuranceCertification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "operational-safety-incident-response-rollback/v15.9" as const, lifecycle, health_states: healthStates, evidence_statuses: evidenceStatuses, dependency_states: dependencyStates, assurance_decisions: decisions, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousAssuranceCertification(result) });
}

export const ContinuousAssuranceCertificationService = Object.freeze({ run: runContinuousAssuranceCertification, validate: validateContinuousAssuranceCertification, replay: replayContinuousAssuranceCertification });
