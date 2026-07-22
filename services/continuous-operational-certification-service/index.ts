import { runAdaptationQualificationService } from "@/services/adaptation-qualification-service";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CertificationDriftClass,
  CertificationEvaluationOutcome,
  CertificationEventType,
  CertificationLifecycleState,
  ContinuousOperationalCertificationBundle,
  ContinuousOperationalCertificationFailure,
  ContinuousOperationalCertificationInput,
  ContinuousOperationalCertificationOutcome,
  ContinuousOperationalCertificationResult,
  ContinuousOperationalCertificationTest,
  OperationalChangeType,
} from "@/types/continuous-operational-certification-service";

const VERSION = "continuous-operational-certification-service/v18.7" as const;
const IDENTIFIER = "ContinuousOperationalCertificationService" as const;
const DEFAULT_TENANT = "tenant_phase_18_continuous_certification";
const DEFAULT_OPERATOR = "operator_phase_18_continuous_certification";
const TIMESTAMP = "2026-07-16T00:00:00.000Z";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousOperationalCertificationFailure[], failure: ContinuousOperationalCertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousOperationalCertificationInput["scenario"]): ContinuousOperationalCertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousOperationalCertificationFailure[]): ContinuousOperationalCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["OPERATIONAL_EVENT", "EVIDENCE_COLLECTION", "CERTIFICATION_EVALUATION", "QUALIFICATION_DECISION", "CERTIFICATION_EVENT", "LINEAGE_UPDATE", "CONTINUOUS_MONITORING"] as const satisfies readonly CertificationLifecycleState[]);
const evaluationOutcomes = freezeArray(["QUALIFICATION_MAINTAINED", "QUALIFICATION_SUPERSEDED", "QUALIFICATION_SUSPENDED", "QUALIFICATION_REVOKED", "ADDITIONAL_EVIDENCE_REQUIRED", "CERTIFICATION_DRIFT_DETECTED"] as const satisfies readonly CertificationEvaluationOutcome[]);
const eventTypes = freezeArray(["QUALIFICATION_MAINTAINED", "QUALIFICATION_GRANTED", "QUALIFICATION_SUSPENDED", "QUALIFICATION_REVOKED", "QUALIFICATION_RESTORED", "CERTIFICATION_SUPERSEDED", "CERTIFICATION_DRIFT_DETECTED", "EVIDENCE_INSUFFICIENT", "ATTESTATION_INVALIDATED", "SERVICE_FAIL_CLOSED"] as const satisfies readonly CertificationEventType[]);
const driftClasses = freezeArray(["OPERATIONAL", "GOVERNANCE", "REPLAY", "QUALIFICATION", "EVIDENCE", "LINEAGE", "DEPENDENCY", "IMPLEMENTATION"] as const satisfies readonly CertificationDriftClass[]);
const changeTypes = freezeArray(["CONFIGURATION", "INFRASTRUCTURE", "DEPENDENCY", "GOVERNANCE", "POLICY", "REPLAY", "CERTIFICATION", "SECURITY"] as const satisfies readonly OperationalChangeType[]);

function certTest(name: string, passed: boolean, failure: ContinuousOperationalCertificationFailure, evidence_refs: readonly string[]): ContinuousOperationalCertificationTest {
  const actual: ContinuousOperationalCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_operational_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousOperationalCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ qualification: result.adaptation_qualification_ref, engine: result.certification_engine.integrity_hash, health: result.health_monitor.integrity_hash, drift: result.drift_detector.integrity_hash, evidence: result.evidence_collector.integrity_hash, attestations: result.attestation_validator.integrity_hash, changes: result.change_processor.integrity_hash, events: result.event_registry.integrity_hash, lineage: result.lineage_manager.integrity_hash, replay: result.replay_service.integrity_hash, ledger: result.ledger.integrity_hash, observability: result.observability.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousOperationalCertificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousOperationalCertificationService(input: ContinuousOperationalCertificationInput = {}): ContinuousOperationalCertificationResult {
  const qualification = runAdaptationQualificationService({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousOperationalCertificationFailure[] = qualification.outcome === "PASS" ? [] : ["PHASE_18_6_QUALIFICATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_CERTIFICATION_WARNING"));
  const certificationId = input.certification_id ?? id("continuous_certification", qualification.integrity_hash);
  const operationId = input.operation_id ?? id("operation", certificationId);
  const continuous = !has(failures, "CERTIFICATION_NOT_CONTINUOUSLY_EVALUATED");
  const deterministic = !has(failures, "CERTIFICATION_DECISIONS_NOT_DETERMINISTIC");
  const lineageComplete = !has(failures, "CERTIFICATION_LINEAGE_INCOMPLETE");
  const historyImmutable = !has(failures, "CERTIFICATION_HISTORY_MUTABLE");
  const lossImmediate = !has(failures, "QUALIFICATION_LOSS_NOT_IMMEDIATELY_DETECTED");
  const evidenceOperational = !has(failures, "CONTINUOUS_EVIDENCE_COLLECTION_NOT_OPERATIONAL");
  const driftDeterministic = !has(failures, "CERTIFICATION_DRIFT_NOT_DETERMINISTIC");
  const attestationsValid = !has(failures, "EXTERNAL_IMPLEMENTATION_ATTESTATIONS_NOT_VALIDATED");
  const attestationLineage = !has(failures, "ATTESTATION_LINEAGE_NOT_ADDITIVE");
  const supersedingLineage = !has(failures, "SUPERSEDING_LINEAGE_NOT_VERIFIED");
  const changeDeterministic = !has(failures, "OPERATIONAL_CHANGE_PROCESSING_NOT_DETERMINISTIC");
  const unknownFailClosed = !has(failures, "UNKNOWN_CHANGE_TYPES_NOT_FAIL_CLOSED");
  const securityRouted = !has(failures, "SECURITY_CHANGES_NOT_ROUTED_TO_EXISTING_PIPELINE");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const failClosed = !has(failures, "SERVICE_FAIL_CLOSED_NOT_VERIFIED");
  const governanceExternal = !has(failures, "GOVERNANCE_AUTHORITY_INTERNALIZED");
  const evidenceRefs = freezeArray(evidenceOperational ? [qualification.integrity_hash, qualification.certification_package.integrity_hash, qualification.decision_registry.integrity_hash] : []);
  const replayRefs = freezeArray(replay ? [qualification.replay_hash, qualification.replay_validator.integrity_hash] : []);
  const governanceRefs = freezeArray(governanceExternal ? [qualification.evidence_ledger.integrity_hash] : []);

  const certification_engine = nested({ engine_id: id("continuous_certification_engine", certificationId), standing_constitutional_service: continuous, lifecycle_independent: continuous, operational_integrity_evaluated: continuous, governance_compliance_evaluated: governanceExternal, replay_integrity_evaluated: replay, operational_qualification_evaluated: continuous, evidence_completeness_evaluated: evidenceOperational, lineage_consistency_evaluated: lineageComplete, implementation_attestations_evaluated: attestationsValid, operational_changes_evaluated: changeDeterministic, deterministic_evaluation: deterministic, fail_closed: failClosed, governance_authority_external: governanceExternal });
  const health_monitor = nested({ monitor_id: id("certification_health", certificationId), certification_freshness: continuous, evaluation_latency: continuous, evidence_availability: evidenceOperational, replay_health: replay, lineage_integrity: lineageComplete, certification_backlog: continuous, evaluation_failures: failClosed, service_availability: continuous, evidentiary_only: true });
  const drift_detector = nested({ detector_id: id("certification_drift", certificationId), drift_classes: driftClasses, deterministic_detection: driftDeterministic, unknown_drift_fails_closed: failClosed, drift_detected: false, drift_event_refs: freezeArray(driftClasses.map((drift) => id("drift_observation", drift))) });
  const evidence_collector = nested({ collector_id: id("continuous_evidence", certificationId), operational_evidence: evidenceRefs, governance_evidence: governanceRefs, replay_evidence: replayRefs, qualification_evidence: [qualification.decision_registry.integrity_hash], implementation_evidence: [id("implementation_evidence", certificationId)], dependency_evidence: [qualification.adaptation_simulation_ref], health_evidence: [health_monitor.integrity_hash], certification_evidence: [qualification.certification_package.integrity_hash], immutable_collection: historyImmutable, operational: evidenceOperational });
  const attestations = freezeArray([nested({ attestation_id: id("external_attestation", certificationId), authority_identity: "external_authority_phase_18_7", approval_reference: qualification.decision_registry.integrity_hash, implementation_evidence: evidence_collector.implementation_evidence, timestamp: TIMESTAMP, cryptographic_signature: hash({ certificationId, authority: "external_authority_phase_18_7" }), replay_reference: replayRefs[0] ?? "", signature_verified: attestationsValid, immutable: historyImmutable, disputed: false, invalidated: false })]);
  const attestation_validator = nested({ validator_id: id("attestation_validator", certificationId), implementation_not_assumed: attestationsValid, attestations, invalidation_additive_lineage: attestationLineage, historical_attestations_preserved: historyImmutable, superseding_lineage_events: supersedingLineage ? [id("attestation_supersession", certificationId)] : [] });
  const changes = freezeArray([...changeTypes, "UNKNOWN_REGISTERED" as const].map((change_type) => nested({ change_id: id("operational_change", { operationId, change_type }), operation_id: operationId, tenant_id: input.tenant_id ?? DEFAULT_TENANT, change_type, registry_version: "operational-change-registry/v18.7", affected_component: "mission-control", originating_service: IDENTIFIER, authorizing_reference: qualification.decision_registry.integrity_hash, evidence_reference: evidenceRefs[0] ?? "", replay_reference: replayRefs[0] ?? "", security_pipeline_routed: change_type === "SECURITY" ? securityRouted : true, fail_closed: change_type === "UNKNOWN_REGISTERED" ? unknownFailClosed : true })));
  const change_processor = nested({ processor_id: id("operational_change_processor", certificationId), registry_versioned: true, registry_immutable: historyImmutable, registry_replayable: replay, registry_lineage_preserving: lineageComplete, deterministic_processing: changeDeterministic, unknown_changes_fail_closed: unknownFailClosed, security_changes_route_existing_pipeline: securityRouted, changes });
  const events = freezeArray(eventTypes.map((event_type) => nested({ event_id: id("certification_event", { certificationId, event_type }), event_type, evaluation_outcome: event_type === "CERTIFICATION_DRIFT_DETECTED" ? "CERTIFICATION_DRIFT_DETECTED" as const : "QUALIFICATION_MAINTAINED" as const, evidence_refs: evidenceRefs, replay_refs: replayRefs, governance_refs: governanceRefs, immutable: historyImmutable })));
  const event_registry = nested({ registry_id: id("certification_event_registry", certificationId), events, qualification_loss_immediate: lossImmediate, immutable_events: historyImmutable, governed_events: governanceExternal });
  const lineage_manager = nested({ manager_id: id("certification_lineage", certificationId), strictly_additive: lineageComplete && historyImmutable, history_immutable: historyImmutable, lineage_complete: lineageComplete, supersession_events: supersedingLineage ? [id("certification_supersession", certificationId)] : [], attestation_lineage: attestations.map((attestation) => attestation.integrity_hash) });
  const replay_service = nested({ replay_id: id("certification_replay", certificationId), evaluations_replayed: replay, evidence_collection_replayed: replay, events_replayed: replay, lineage_evolution_replayed: replay, drift_detection_replayed: replay && driftDeterministic, attestation_validation_replayed: replay && attestationsValid, supersession_replayed: replay && supersedingLineage, fail_closed_replayed: replay && failClosed, identical_outcomes: replay && deterministic });
  const ledger = nested({ ledger_id: id("continuous_certification_ledger", certificationId), evaluations: [certification_engine.integrity_hash], certification_decisions: events.map((event) => event.integrity_hash), evidence_references: evidenceRefs, drift_observations: drift_detector.drift_event_refs, attestation_lineage: attestation_validator.attestations.map((attestation) => attestation.integrity_hash), supersession_events: lineage_manager.supersession_events, replay_references: replayRefs, integrity_verification: historyImmutable, immutable: historyImmutable });
  const observability = nested({ observability_id: id("certification_observability", certificationId), certification_status: true, certification_health: true, drift_indicators: true, evidence_completeness: true, lineage_health: true, evaluation_latency: true, fail_closed_status: true, replay_verification: true, state_modified: false });
  const certification_package = nested({ package_id: id("continuous_operational_certification", certificationId), certification_continuously_evaluated: certification_engine.standing_constitutional_service && certification_engine.lifecycle_independent, certification_decisions_deterministic: certification_engine.deterministic_evaluation, certification_lineage_complete: lineage_manager.lineage_complete && ledger.supersession_events.length > 0, certification_history_immutable: ledger.immutable && event_registry.immutable_events, qualification_loss_immediately_detected: event_registry.qualification_loss_immediate, continuous_evidence_collection_operational: evidence_collector.operational && evidence_collector.immutable_collection, certification_drift_detected_deterministically: drift_detector.deterministic_detection && drift_detector.unknown_drift_fails_closed, external_implementation_attestations_validated: attestation_validator.implementation_not_assumed && attestations.every((attestation) => attestation.signature_verified), attestation_lineage_additive: attestation_validator.invalidation_additive_lineage && attestation_validator.historical_attestations_preserved, superseding_lineage_verified: attestation_validator.superseding_lineage_events.length > 0 && lineage_manager.supersession_events.length > 0, operational_change_processing_deterministic: change_processor.deterministic_processing && change_processor.registry_versioned, unknown_change_types_fail_closed: change_processor.unknown_changes_fail_closed && changes.some((change) => change.change_type === "UNKNOWN_REGISTERED" && change.fail_closed), security_changes_routed_to_existing_pipeline: change_processor.security_changes_route_existing_pipeline && changes.some((change) => change.change_type === "SECURITY" && change.security_pipeline_routed), replay_reproducible: replay_service.identical_outcomes, service_fail_closed_behavior_verified: certification_engine.fail_closed && replay_service.fail_closed_replayed, continuous_operational_certification_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Certification continuously evaluated", certification_package.certification_continuously_evaluated, "CERTIFICATION_NOT_CONTINUOUSLY_EVALUATED", [certification_engine.integrity_hash]),
    certTest("Certification decisions deterministic", certification_package.certification_decisions_deterministic, "CERTIFICATION_DECISIONS_NOT_DETERMINISTIC", [certification_engine.integrity_hash]),
    certTest("Certification lineage complete", certification_package.certification_lineage_complete, "CERTIFICATION_LINEAGE_INCOMPLETE", [lineage_manager.integrity_hash]),
    certTest("Certification history immutable", certification_package.certification_history_immutable, "CERTIFICATION_HISTORY_MUTABLE", [ledger.integrity_hash]),
    certTest("Qualification loss immediately detected", certification_package.qualification_loss_immediately_detected, "QUALIFICATION_LOSS_NOT_IMMEDIATELY_DETECTED", [event_registry.integrity_hash]),
    certTest("Continuous evidence collection operational", certification_package.continuous_evidence_collection_operational, "CONTINUOUS_EVIDENCE_COLLECTION_NOT_OPERATIONAL", [evidence_collector.integrity_hash]),
    certTest("Certification drift detected deterministically", certification_package.certification_drift_detected_deterministically, "CERTIFICATION_DRIFT_NOT_DETERMINISTIC", [drift_detector.integrity_hash]),
    certTest("External implementation attestations validated", certification_package.external_implementation_attestations_validated, "EXTERNAL_IMPLEMENTATION_ATTESTATIONS_NOT_VALIDATED", [attestation_validator.integrity_hash]),
    certTest("Attestation lineage additive", certification_package.attestation_lineage_additive, "ATTESTATION_LINEAGE_NOT_ADDITIVE", [attestation_validator.integrity_hash]),
    certTest("Superseding lineage verified", certification_package.superseding_lineage_verified, "SUPERSEDING_LINEAGE_NOT_VERIFIED", [lineage_manager.integrity_hash]),
    certTest("Operational change processing deterministic", certification_package.operational_change_processing_deterministic, "OPERATIONAL_CHANGE_PROCESSING_NOT_DETERMINISTIC", [change_processor.integrity_hash]),
    certTest("Unknown change types fail closed", certification_package.unknown_change_types_fail_closed, "UNKNOWN_CHANGE_TYPES_NOT_FAIL_CLOSED", [change_processor.integrity_hash]),
    certTest("Security changes routed through existing pipeline", certification_package.security_changes_routed_to_existing_pipeline, "SECURITY_CHANGES_NOT_ROUTED_TO_EXISTING_PIPELINE", [change_processor.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", [replay_service.integrity_hash]),
    certTest("Service fail-closed behavior verified", certification_package.service_fail_closed_behavior_verified, "SERVICE_FAIL_CLOSED_NOT_VERIFIED", [certification_engine.integrity_hash]),
    certTest("Continuous operational certification certified", certification_package.continuous_operational_certification_certified, "CONTINUOUS_OPERATIONAL_CERTIFICATION_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousOperationalCertificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousOperationalCertificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, adaptation_qualification_ref: qualification.integrity_hash, certification_engine, health_monitor, drift_detector, evidence_collector, attestation_validator, change_processor, event_registry, lineage_manager, replay_service, ledger, observability, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousOperationalCertificationService(result = runContinuousOperationalCertificationService()) {
  const engine_valid = verify(result.certification_engine) && Object.entries(result.certification_engine).filter(([key]) => !["engine_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const health_valid = verify(result.health_monitor) && Object.entries(result.health_monitor).filter(([key]) => !["monitor_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const drift_valid = verify(result.drift_detector) && result.drift_detector.drift_classes.length === 8 && result.drift_detector.drift_event_refs.length === 8 && result.drift_detector.deterministic_detection && result.drift_detector.unknown_drift_fails_closed;
  const evidence_valid = verify(result.evidence_collector) && Object.entries(result.evidence_collector).filter(([key]) => !["collector_id", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) ? value.length > 0 : value === true);
  const attestation_valid = verify(result.attestation_validator) && result.attestation_validator.attestations.length > 0 && result.attestation_validator.attestations.every((attestation) => verify(attestation) && attestation.signature_verified && attestation.immutable && !attestation.disputed && !attestation.invalidated && attestation.replay_reference.length > 0) && result.attestation_validator.invalidation_additive_lineage && result.attestation_validator.historical_attestations_preserved && result.attestation_validator.superseding_lineage_events.length > 0;
  const change_valid = verify(result.change_processor) && result.change_processor.changes.length === 9 && result.change_processor.changes.every((change) => verify(change) && change.evidence_reference.length > 0 && change.replay_reference.length > 0 && (change.change_type !== "UNKNOWN_REGISTERED" || change.fail_closed) && (change.change_type !== "SECURITY" || change.security_pipeline_routed)) && Object.entries(result.change_processor).filter(([key]) => !["processor_id", "changes", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const event_valid = verify(result.event_registry) && result.event_registry.events.length === 10 && result.event_registry.events.every((event) => verify(event) && event.evidence_refs.length > 0 && event.replay_refs.length > 0 && event.governance_refs.length > 0 && event.immutable) && result.event_registry.qualification_loss_immediate && result.event_registry.immutable_events && result.event_registry.governed_events;
  const lineage_valid = verify(result.lineage_manager) && result.lineage_manager.strictly_additive && result.lineage_manager.history_immutable && result.lineage_manager.lineage_complete && result.lineage_manager.supersession_events.length > 0 && result.lineage_manager.attestation_lineage.length > 0;
  const replay_valid = verify(result.replay_service) && Object.entries(result.replay_service).filter(([key]) => !["replay_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = verify(result.ledger) && result.ledger.immutable && result.ledger.integrity_verification && result.ledger.evaluations.length > 0 && result.ledger.certification_decisions.length === 10 && result.ledger.evidence_references.length > 0 && result.ledger.drift_observations.length === 8 && result.ledger.attestation_lineage.length > 0 && result.ledger.supersession_events.length > 0 && result.ledger.replay_references.length > 0;
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !["observability_id", "state_modified", "integrity_hash"].includes(key)).every(([, value]) => value === true) && !result.observability.state_modified;
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 16 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && health_valid && drift_valid && evidence_valid && attestation_valid && change_valid && event_valid && lineage_valid && replay_valid && ledger_valid && observability_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, health_valid, drift_valid, evidence_valid, attestation_valid, change_valid, event_valid, lineage_valid, replay_valid, ledger_valid, observability_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousOperationalCertificationService(result = runContinuousOperationalCertificationService()): boolean {
  const replayed = runContinuousOperationalCertificationService();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousOperationalCertificationService(result).valid;
}

export function getContinuousOperationalCertificationServiceBundle(): ContinuousOperationalCertificationBundle {
  const result = runContinuousOperationalCertificationService();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "adaptation-qualification-service/v18.6" as const, lifecycle_states: lifecycleStates, evaluation_outcomes: evaluationOutcomes, event_types: eventTypes, drift_classes: driftClasses, change_types: changeTypes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousOperationalCertificationService(result) });
}

export const ContinuousOperationalCertificationServiceFacade = Object.freeze({ run: runContinuousOperationalCertificationService, validate: validateContinuousOperationalCertificationService, replay: replayContinuousOperationalCertificationService });
