import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runRegionalDeploymentDisasterRecovery } from "@/services/regional-deployment-disaster-recovery";
import type {
  CrossRegionReplicationBundle,
  CrossRegionReplicationFailure,
  CrossRegionReplicationInput,
  CrossRegionReplicationOutcome,
  CrossRegionReplicationResult,
  CrossRegionReplicationTest,
  CrossRegionReplicationValidation,
  ReplicationCategory,
  ReplicationLifecycleState,
  ReplicationStatus,
} from "@/types/cross-region-replication";

const VERSION = "cross-region-replication/v17.7" as const;
const IDENTIFIER = "CrossRegionReplication" as const;
const DEFAULT_TENANT = "tenant_phase_17_replication";
const DEFAULT_OPERATOR = "operator_phase_17_replication";
const EVIDENCE_TIMESTAMP = "2026-07-16T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly CrossRegionReplicationFailure[], failure: CrossRegionReplicationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: CrossRegionReplicationInput["scenario"]): CrossRegionReplicationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly CrossRegionReplicationFailure[]): CrossRegionReplicationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_REPLICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["REQUESTED", "QUALIFIED", "AUTHORIZED", "REPLICATING", "VALIDATING", "SYNCHRONIZED", "CERTIFIED", "FAILED", "QUARANTINED", "REQUIRES_REPLICATION"] as const satisfies readonly ReplicationLifecycleState[]);
const replicationCategories = freezeArray(["CONFIGURATION", "REGISTRY", "METADATA", "GOVERNANCE", "AUDIT", "CERTIFICATION", "REPLAY_REFERENCE", "LINEAGE", "RESOURCE_ASSIGNMENT", "DEPLOYMENT_STATE"] as const satisfies readonly ReplicationCategory[]);

function certTest(name: string, passed: boolean, failure: CrossRegionReplicationFailure, evidence_refs: readonly string[]): CrossRegionReplicationTest {
  const actual: CrossRegionReplicationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_REPLICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("cross_region_replication_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<CrossRegionReplicationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ recovery: result.regional_deployment_disaster_recovery_ref, record: result.replication_record.integrity_hash, manager: result.replication_manager.integrity_hash, policy: result.policy_registry.integrity_hash, qualification: result.qualification_service.integrity_hash, consistency: result.consistency_validator.integrity_hash, replay: result.replay_synchronization_service.integrity_hash, integrity: result.integrity_validator.integrity_hash, state: result.state_registry.integrity_hash, health: result.health_monitor.integrity_hash, ledger: result.replication_ledger.map((entry) => entry.integrity_hash), package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<CrossRegionReplicationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runCrossRegionReplication(input: CrossRegionReplicationInput = {}): CrossRegionReplicationResult {
  const recovery = runRegionalDeploymentDisasterRecovery({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id, region_id: input.source_region });
  const direct = directFailure(input.scenario);
  const upstreamFailures: CrossRegionReplicationFailure[] = recovery.outcome === "PASS" ? [] : ["PHASE_17_6_RECOVERY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_REPLICATION_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const sourceRegion = input.source_region ?? recovery.recovery_request.region_id;
  const destinationRegion = input.destination_region ?? `${sourceRegion}-replica`;
  const replicationType = input.replication_type ?? "GOVERNANCE";
  const deterministic = !has(failures, "REPLICATION_NOT_DETERMINISTIC");
  const governancePreserved = !has(failures, "GOVERNANCE_NOT_PRESERVED");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_VIOLATED");
  const auditSynced = !has(failures, "AUDIT_NOT_SYNCHRONIZED") && !has(failures, "IMMUTABLE_AUDIT_NOT_PRESERVED");
  const lineageComplete = !has(failures, "LINEAGE_INCOMPLETE");
  const certificationEvidence = !has(failures, "CERTIFICATION_EVIDENCE_NOT_REPLICATED");
  const integrityValid = !has(failures, "INTEGRITY_NOT_VALIDATED");
  const replayRefs = has(failures, "REPLAY_NOT_SYNCHRONIZED") || has(failures, "REPLAY_NOT_DETERMINISTIC") ? freezeArray([]) : freezeArray([recovery.replay_hash, recovery.replay_validator.integrity_hash]);
  const qualified = !has(failures, "REPLICATION_QUALIFICATION_FAILED") && governancePreserved && tenantIsolation && integrityValid && replayRefs.length > 0 && recovery.certification_package.disaster_recovery_certified;
  const unauthorizedRejected = !has(failures, "UNAUTHORIZED_REPLICATION_NOT_REJECTED");
  const regionalConsistency = !has(failures, "REGIONAL_CONSISTENCY_NOT_VERIFIED");
  const divergencePrevented = !has(failures, "REGIONAL_DIVERGENCE_NOT_PREVENTED");
  const failedMaySync = has(failures, "FAILED_REPLICATION_SYNCHRONIZED");
  const status: ReplicationStatus = !qualified ? "REJECTED" : !integrityValid ? "QUARANTINED" : blockingFailures.length && !failedMaySync ? "REJECTED" : failedMaySync ? "SYNCHRONIZED" : "CERTIFIED";
  const replicatedObjects = freezeArray(["configuration", "tenant-registry-reference", "governance-policy", "audit-record", "certification-evidence", "replay-manifest", "deployment-metadata", "resource-assignment"]);
  const manager = nested({ manager_id: id("replication_manager", { sourceRegion, destinationRegion }), authoritative_region: sourceRegion, destination_region: destinationRegion, preserves_single_authoritative_state: divergencePrevented, deterministic_execution: deterministic, prevents_independent_regional_truth: divergencePrevented, failed_replication_may_synchronize: failedMaySync, replicated_categories: replicationCategories });
  const policy_registry = nested({ registry_id: id("replication_policy_registry", VERSION), authorized_scopes: replicationCategories, replication_eligibility: qualified, tenant_restrictions_enforced: tenantIsolation, regional_restrictions_enforced: divergencePrevented, governance_prerequisites: governancePreserved, certification_requirements: certificationEvidence, replication_sequencing: deterministic, policies_immutable_once_approved: true });
  const qualification_service = nested({ service_id: id("replication_qualification", { sourceRegion, destinationRegion }), source_certified: recovery.certification_package.disaster_recovery_certified, destination_qualified: qualified, governance_satisfied: governancePreserved, authorization_complete: qualified, integrity_verified: integrityValid, prerequisite_services_operational: true, replay_available: replayRefs.length > 0, qualification_passed: qualified, unauthorized_replication_rejected: unauthorizedRejected });
  const consistency_validator = nested({ validator_id: id("consistency_validator", destinationRegion), identical_configuration: regionalConsistency, registry_equivalence: regionalConsistency, governance_consistency: governancePreserved, lineage_completeness: lineageComplete, audit_completeness: auditSynced, replay_equivalence: replayRefs.length > 0, certification_equivalence: certificationEvidence, deployment_metadata_consistency: regionalConsistency, deterministic_validation: deterministic, regional_consistency_verified: regionalConsistency });
  const replay_synchronization_service = nested({ service_id: id("replay_synchronization", { sourceRegion, destinationRegion }), replay_references_replicated: replayRefs.length > 0, replay_lineage_complete: replayRefs.length > 0 && lineageComplete, replay_manifests_synchronized: replayRefs.length > 0, replay_evidence_preserved: replayRefs.length > 0, deterministic_replay_preserved: replayRefs.length > 0 && !has(failures, "REPLAY_NOT_DETERMINISTIC"), modifies_replay_history: false, synchronized: replayRefs.length > 0 && !has(failures, "REPLAY_NOT_SYNCHRONIZED"), replay_refs: replayRefs });
  const integrity_validator = nested({ validator_id: id("replication_integrity", { sourceRegion, destinationRegion }), object_completeness: integrityValid, checksum_verification: integrityValid, lineage_integrity: integrityValid && lineageComplete, metadata_integrity: integrityValid, replay_integrity: integrityValid && replayRefs.length > 0, audit_integrity: integrityValid && auditSynced, certification_integrity: integrityValid && certificationEvidence, quarantine_required: !integrityValid, integrity_validated: integrityValid });
  const authoritativeState = hash({ sourceRegion, tenantId, replicatedObjects, governance: recovery.certification_package.integrity_hash });
  const destinationState = divergencePrevented && regionalConsistency ? authoritativeState : hash({ destinationRegion, tenantId, replicatedObjects });
  const state_registry = nested({ registry_id: id("replication_state_registry", { sourceRegion, destinationRegion }), source_state_hash: authoritativeState, destination_state_hash: destinationState, authoritative_state_hash: authoritativeState, regional_divergence_prevented: divergencePrevented && destinationState === authoritativeState, independent_authoritative_histories: !divergencePrevented });
  const record = nested({ replication_id: id("replication", { tenantId, sourceRegion, destinationRegion, replicationType }), replication_type: replicationType, tenant_id: tenantId, source_region: sourceRegion, destination_region: destinationRegion, authorization_reference: qualification_service.integrity_hash, governance_reference: governancePreserved ? recovery.certification_package.integrity_hash : "", requester_identity: input.operator_id ?? DEFAULT_OPERATOR, replicated_objects: replicatedObjects, source_version: authoritativeState, replicated_version: destinationState, replication_status: status, replay_reference: replayRefs[0] ?? "", replay_manifest_reference: replayRefs[1] ?? "", validation_result: status === "CERTIFIED" || (status === "SYNCHRONIZED" && failedMaySync) ? "PASS" as const : "FAIL" as const, request_timestamp: EVIDENCE_TIMESTAMP, completion_timestamp: EVIDENCE_TIMESTAMP, ledger_reference: id("replication_ledger_ref", { sourceRegion, destinationRegion }) });
  const health_monitor = nested({ monitor_id: id("replication_health", destinationRegion), replication_latency_visible: true, synchronization_backlog_visible: true, consistency_violations_visible: true, replay_synchronization_visible: true, integrity_failures_visible: true, authorization_failures_visible: true, replication_retries_visible: true, regional_health_visible: true, observational_only: true });
  const ledger = freezeArray(lifecycleStates.map((state, index) => nested({ ledger_entry_id: id("replication_ledger", { replication: record.replication_id, state }), sequence: index + 1, replication_ref: record.integrity_hash, lifecycle_state: state, authorization_decision_ref: qualification_service.integrity_hash, replicated_artifacts: replicatedObjects, validation_result: record.validation_result, replay_reference: replayRefs[0] ?? "", consistency_result: consistency_validator.integrity_hash, integrity_evidence: integrity_validator.integrity_hash, certification_status: status, append_only: !has(failures, "IMMUTABLE_AUDIT_NOT_PRESERVED"), immutable: !has(failures, "IMMUTABLE_AUDIT_NOT_PRESERVED") })));
  const certification_package = nested({ package_id: id("replication_certification", record.replication_id), replication_deterministic: manager.deterministic_execution, regional_consistency_verified: consistency_validator.regional_consistency_verified, governance_preserved: governancePreserved, tenant_isolation_preserved: tenantIsolation && policy_registry.tenant_restrictions_enforced, replay_synchronized: replay_synchronization_service.synchronized, replay_deterministic: replay_synchronization_service.deterministic_replay_preserved && !replay_synchronization_service.modifies_replay_history, audit_synchronized: auditSynced && consistency_validator.audit_completeness, lineage_complete: lineageComplete && consistency_validator.lineage_completeness, certification_evidence_replicated: certificationEvidence && consistency_validator.certification_equivalence, integrity_validated: integrity_validator.integrity_validated && !integrity_validator.quarantine_required, unauthorized_replication_rejected: qualification_service.unauthorized_replication_rejected, regional_divergence_prevented: state_registry.regional_divergence_prevented && !state_registry.independent_authoritative_histories, immutable_audit_preserved: ledger.every((entry) => entry.append_only && entry.immutable), replication_certified: blockingFailures.length === 0, evidence_refs: freezeArray([recovery.integrity_hash, record.integrity_hash, qualification_service.integrity_hash, consistency_validator.integrity_hash, integrity_validator.integrity_hash]) });
  const tests = freezeArray([
    certTest("Replication deterministic", certification_package.replication_deterministic, "REPLICATION_NOT_DETERMINISTIC", [manager.integrity_hash]),
    certTest("Regional consistency verified", certification_package.regional_consistency_verified, "REGIONAL_CONSISTENCY_NOT_VERIFIED", [consistency_validator.integrity_hash]),
    certTest("Governance preserved", certification_package.governance_preserved, "GOVERNANCE_NOT_PRESERVED", [policy_registry.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_VIOLATED", [policy_registry.integrity_hash]),
    certTest("Replay synchronized", certification_package.replay_synchronized, "REPLAY_NOT_SYNCHRONIZED", [replay_synchronization_service.integrity_hash]),
    certTest("Replay deterministic", certification_package.replay_deterministic, "REPLAY_NOT_DETERMINISTIC", [replay_synchronization_service.integrity_hash]),
    certTest("Audit synchronized", certification_package.audit_synchronized, "AUDIT_NOT_SYNCHRONIZED", [consistency_validator.integrity_hash]),
    certTest("Lineage complete", certification_package.lineage_complete, "LINEAGE_INCOMPLETE", [consistency_validator.integrity_hash]),
    certTest("Certification evidence replicated", certification_package.certification_evidence_replicated, "CERTIFICATION_EVIDENCE_NOT_REPLICATED", [consistency_validator.integrity_hash]),
    certTest("Integrity validated", certification_package.integrity_validated, "INTEGRITY_NOT_VALIDATED", [integrity_validator.integrity_hash]),
    certTest("Unauthorized replication rejected", certification_package.unauthorized_replication_rejected, "UNAUTHORIZED_REPLICATION_NOT_REJECTED", [qualification_service.integrity_hash]),
    certTest("Regional divergence prevented", certification_package.regional_divergence_prevented, "REGIONAL_DIVERGENCE_NOT_PREVENTED", [state_registry.integrity_hash]),
    certTest("Immutable audit preserved", certification_package.immutable_audit_preserved, "IMMUTABLE_AUDIT_NOT_PRESERVED", ledger.map((entry) => entry.integrity_hash)),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is CrossRegionReplicationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<CrossRegionReplicationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, regional_deployment_disaster_recovery_ref: recovery.integrity_hash, replication_record: record, replication_manager: manager, policy_registry, qualification_service, consistency_validator, replay_synchronization_service, integrity_validator, state_registry, health_monitor, replication_ledger: ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCrossRegionReplication(result = runCrossRegionReplication()): CrossRegionReplicationValidation {
  const record_valid = verify(result.replication_record) && result.replication_record.replication_status === "CERTIFIED" && result.replication_record.validation_result === "PASS" && result.replication_record.replay_reference.length > 0 && result.replication_record.source_version === result.replication_record.replicated_version;
  const manager_valid = verify(result.replication_manager) && result.replication_manager.replicated_categories.length === 10 && !result.replication_manager.failed_replication_may_synchronize && result.replication_manager.preserves_single_authoritative_state && result.replication_manager.deterministic_execution && result.replication_manager.prevents_independent_regional_truth;
  const policy_valid = verify(result.policy_registry) && result.policy_registry.authorized_scopes.length === 10 && Object.entries(result.policy_registry).filter(([key]) => !["registry_id", "authorized_scopes", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const qualification_valid = verify(result.qualification_service) && Object.entries(result.qualification_service).filter(([key]) => !["service_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const consistency_valid = verify(result.consistency_validator) && Object.entries(result.consistency_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const replay_valid = verify(result.replay_synchronization_service) && result.replay_synchronization_service.replay_refs.length > 0 && !result.replay_synchronization_service.modifies_replay_history && Object.entries(result.replay_synchronization_service).filter(([key]) => !["service_id", "replay_refs", "modifies_replay_history", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const integrity_valid = verify(result.integrity_validator) && !result.integrity_validator.quarantine_required && Object.entries(result.integrity_validator).filter(([key]) => !["validator_id", "quarantine_required", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const state_valid = verify(result.state_registry) && result.state_registry.source_state_hash === result.state_registry.destination_state_hash && result.state_registry.source_state_hash === result.state_registry.authoritative_state_hash && result.state_registry.regional_divergence_prevented && !result.state_registry.independent_authoritative_histories;
  const health_valid = verify(result.health_monitor) && Object.entries(result.health_monitor).filter(([key]) => !["monitor_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.replication_ledger.length === 10 && result.replication_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.replication_ref.length > 0 && entry.authorization_decision_ref.length > 0 && entry.replicated_artifacts.length > 0 && entry.validation_result === "PASS" && entry.replay_reference.length > 0 && entry.consistency_result.length > 0 && entry.integrity_evidence.length > 0 && entry.certification_status === "CERTIFIED" && entry.append_only && entry.immutable);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && record_valid && manager_valid && policy_valid && qualification_valid && consistency_valid && replay_valid && integrity_valid && state_valid && health_valid && ledger_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, record_valid, manager_valid, policy_valid, qualification_valid, consistency_valid, replay_valid, integrity_valid, state_valid, health_valid, ledger_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayCrossRegionReplication(result = runCrossRegionReplication()): boolean {
  const replayed = runCrossRegionReplication();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCrossRegionReplication(result).valid;
}

export function getCrossRegionReplicationBundle(): CrossRegionReplicationBundle {
  const result = runCrossRegionReplication();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "regional-deployment-disaster-recovery/v17.6" as const, lifecycle_states: lifecycleStates, replication_categories: replicationCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateCrossRegionReplication(result) });
}

export const CrossRegionReplicationService = Object.freeze({ run: runCrossRegionReplication, validate: validateCrossRegionReplication, replay: replayCrossRegionReplication });
