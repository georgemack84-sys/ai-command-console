import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runStorageCore, validateStorageCore } from "@/services/storage-core";
import type { MessagingCoreBundle, MessagingCoreDecision, MessagingCoreFailure, MessagingCoreInput, MessagingCoreResult, MessagingCoreScenario, MessagingCoreValidation } from "@/types/messaging-core";

const VERSION = "messaging-core/w1.3a" as const;
const IDENTIFIER = "MessagingCore" as const;
let identityBaseline: ReturnType<typeof runIdentityCore> | undefined;
let storageBaseline: ReturnType<typeof runStorageCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly MessagingCoreFailure[], failure: MessagingCoreFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: MessagingCoreScenario): MessagingCoreFailure | undefined { return scenario === "BASELINE" || scenario === "ACTIVE_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly MessagingCoreFailure[], scenario: MessagingCoreScenario): MessagingCoreDecision {
  if (has(failures, "W1_1A_IDENTITY_CORE_INVALID") || has(failures, "W1_2A_STORAGE_CORE_INVALID") || has(failures, "COMMAND_ORDERING_NON_DETERMINISTIC") || has(failures, "EVENT_IMMUTABILITY_VIOLATED") || has(failures, "EVENT_ORDERING_NON_DETERMINISTIC") || has(failures, "EVENT_REPLAY_INCOMPATIBLE") || has(failures, "TENANT_ISOLATION_VIOLATED") || has(failures, "NAMESPACE_SEPARATION_VIOLATED") || has(failures, "CROSS_TENANT_MESSAGE_ALLOWED") || has(failures, "AUTHORIZED_ROUTING_FAILED") || has(failures, "TRANSPORT_ENCRYPTION_MISSING") || has(failures, "MESSAGING_AUDIT_NOT_IMMUTABLE")) return "FAIL_CLOSED";
  if (has(failures, "CORE_ACTIVATION_FAILED")) return "NOT_ACTIVE";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_ACTIVE";
  if (scenario === "ACTIVE_WITH_OBSERVATIONS") return "ACTIVE_WITH_OBSERVATIONS";
  return "CORE_ACTIVATED";
}
function resultReplayHash(result: Omit<MessagingCoreResult, "replay_hash" | "integrity_hash">): string { return hash({ architecture: result.architecture.integrity_hash, infrastructure: result.infrastructure.integrity_hash, command: result.command_transport.integrity_hash, event: result.event_transport.integrity_hash, tenant: result.tenant_messaging.integrity_hash, retry: result.retry_services.integrity_hash, dlq: result.dead_letter_queue.integrity_hash, persistence: result.persistence.integrity_hash, security: result.security.integrity_hash, observability: result.observability.integrity_hash, audit: result.audit_evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<MessagingCoreResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runMessagingCore(input: MessagingCoreInput = {}): MessagingCoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<MessagingCoreFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityCore();
  storageBaseline ??= runStorageCore();
  const identityInvalid = !validateIdentityCore(identityBaseline).valid || has(scenarioFailures, "W1_1A_IDENTITY_CORE_INVALID");
  const storageInvalid = !validateStorageCore(storageBaseline).valid || has(scenarioFailures, "W1_2A_STORAGE_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(identityInvalid ? ["W1_1A_IDENTITY_CORE_INVALID" as const] : []), ...(storageInvalid ? ["W1_2A_STORAGE_CORE_INVALID" as const] : [])])]);
  const dependenciesOk = !identityInvalid && !storageInvalid;
  const architectureOk = !has(failures, "MESSAGING_ARCHITECTURE_MISSING") && !has(failures, "MESSAGING_TOPOLOGY_INVALID") && !has(failures, "DELIVERY_SEMANTICS_INVALID");
  const infrastructureOk = !has(failures, "MESSAGE_INFRASTRUCTURE_MISSING") && !has(failures, "MESSAGE_BROKER_UNAVAILABLE") && !has(failures, "MESSAGING_CLUSTER_UNHEALTHY");
  const commandOk = !has(failures, "COMMAND_TRANSPORT_MISSING") && !has(failures, "COMMAND_ORDERING_NON_DETERMINISTIC") && !has(failures, "COMMAND_DELIVERY_UNRELIABLE") && !has(failures, "COMMAND_PROCESSING_NOT_IDEMPOTENT") && !has(failures, "COMMAND_AUTHORIZATION_MISSING");
  const eventOk = !has(failures, "EVENT_TRANSPORT_MISSING") && !has(failures, "EVENT_IMMUTABILITY_VIOLATED") && !has(failures, "EVENT_ORDERING_NON_DETERMINISTIC") && !has(failures, "EVENT_REPLAY_INCOMPATIBLE");
  const tenantOk = !has(failures, "TENANT_AWARE_MESSAGING_MISSING") && !has(failures, "TENANT_ISOLATION_VIOLATED") && !has(failures, "NAMESPACE_SEPARATION_VIOLATED") && !has(failures, "CROSS_TENANT_MESSAGE_ALLOWED");
  const retryOk = !has(failures, "RETRY_SERVICES_MISSING") && !has(failures, "RETRY_POLICY_INVALID") && !has(failures, "RETRY_LIMITS_MISSING") && !has(failures, "FAILURE_ESCALATION_MISSING");
  const dlqOk = !has(failures, "DLQ_MISSING") && !has(failures, "FAILED_MESSAGE_CAPTURE_FAILED") && !has(failures, "DLQ_RECOVERY_WORKFLOW_MISSING") && !has(failures, "ADMINISTRATIVE_REPLAY_UNCONTROLLED");
  const persistenceOk = !has(failures, "MESSAGE_PERSISTENCE_MISSING") && !has(failures, "PERSISTENT_QUEUES_UNAVAILABLE") && !has(failures, "MESSAGE_LINEAGE_MISSING") && !has(failures, "TRANSACTION_METADATA_MISSING");
  const securityOk = !has(failures, "MESSAGING_SECURITY_MISSING") && !has(failures, "AUTHENTICATED_CONNECTIONS_FAILED") && !has(failures, "AUTHORIZED_ROUTING_FAILED") && !has(failures, "TRANSPORT_ENCRYPTION_MISSING") && !has(failures, "IDENTITY_VALIDATION_FAILED");
  const observabilityOk = !has(failures, "OBSERVABILITY_MISSING") && !has(failures, "QUEUE_METRICS_MISSING") && !has(failures, "DELIVERY_METRICS_MISSING") && !has(failures, "RETRY_METRICS_MISSING") && !has(failures, "LATENCY_METRICS_MISSING") && !has(failures, "FAILURE_METRICS_MISSING");
  const auditOk = !has(failures, "MESSAGING_AUDIT_MISSING") && !has(failures, "DELIVERY_EVIDENCE_MISSING") && !has(failures, "RETRY_EVIDENCE_MISSING") && !has(failures, "FAILURE_EVIDENCE_MISSING") && !has(failures, "TRANSPORT_LINEAGE_MISSING") && !has(failures, "MESSAGING_AUDIT_NOT_IMMUTABLE");
  const qualificationOk = !has(failures, "MESSAGING_QUALIFICATION_FAILED") && !has(failures, "CORE_ACTIVATION_FAILED");
  const decision = decisionFor(failures, scenario);
  const architecture = nested({ architecture_id: architectureOk ? `architecture:w1.3a:messaging:${input.seed ?? "canonical"}` : "", transport_model: architectureOk, routing_model: architectureOk, delivery_semantics: architectureOk, reliability_model: architectureOk, topology_defined: architectureOk });
  const infrastructure = nested({ infrastructure_id: infrastructureOk ? "infrastructure:w1.3a:messaging" : "", message_broker: infrastructureOk, messaging_cluster: infrastructureOk, transport_services: infrastructureOk, broker_configuration: infrastructureOk, services_healthy: infrastructureOk });
  const command_transport = nested({ bus_id: commandOk ? "bus:w1.3a:commands" : "", command_queues: commandOk ? freezeArray(["queue:platform", "queue:tenant", "queue:namespace"]) : freezeArray<string>([]), delivery_acknowledgement: commandOk, command_routing: commandOk, ordered_delivery: commandOk, guaranteed_processing: commandOk, idempotent_handling: commandOk, authorization_integration: commandOk });
  const event_transport = nested({ bus_id: eventOk ? "bus:w1.3a:events" : "", event_topics: eventOk ? freezeArray(["topic:identity", "topic:storage", "topic:governance", "topic:audit"]) : freezeArray<string>([]), publishers: eventOk, subscribers: eventOk, immutable_events: eventOk, publish_subscribe_model: eventOk, ordered_publication: eventOk, replay_compatible: eventOk });
  const tenant_messaging = nested({ routing_id: tenantOk ? "routing:w1.3a:tenant-aware" : "", tenant_routing: tenantOk, namespace_routing: tenantOk, isolation_policies: tenantOk, transport_boundaries: tenantOk, authorization_enforcement: tenantOk, cross_tenant_prevention: tenantOk });
  const retry_services = nested({ engine_id: retryOk ? "engine:w1.3a:retry" : "", retry_policies: retryOk, exponential_backoff: retryOk, retry_scheduler: retryOk, automatic_retry: retryOk, configurable_policies: retryOk, retry_limits: retryOk, failure_escalation: retryOk });
  const dead_letter_queue = nested({ queue_id: dlqOk ? "queue:w1.3a:dead-letter" : "", failure_registry: dlqOk, recovery_workflow: dlqOk, dlq_monitoring: dlqOk, failed_message_capture: dlqOk, root_cause_analysis: dlqOk, administrative_replay: dlqOk });
  const persistence = nested({ persistence_id: persistenceOk ? "persistence:w1.3a:messages" : "", persistent_queues: persistenceOk, message_storage: persistenceOk, transaction_metadata: persistenceOk, message_lineage: persistenceOk, replay_storage: persistenceOk, audit_storage: persistenceOk });
  const security = nested({ security_id: securityOk ? "security:w1.3a:messaging" : "", authenticated_connections: securityOk, authorized_routing: securityOk, transport_encryption: securityOk, identity_validation: securityOk, credential_validation: securityOk });
  const observability = nested({ monitoring_id: observabilityOk ? "monitoring:w1.3a:messaging" : "", queue_metrics: observabilityOk, delivery_metrics: observabilityOk, retry_metrics: observabilityOk, latency_metrics: observabilityOk, failure_metrics: observabilityOk, health_monitoring: observabilityOk });
  const audit_evidence = nested({ ledger_id: auditOk ? "ledger:w1.3a:messaging-audit" : "", records: auditOk ? freezeArray(["audit:delivery", "audit:retry", "audit:failure", "audit:lineage", "audit:security"]) : freezeArray<string>([]), delivery_evidence: auditOk, retry_evidence: auditOk, failure_evidence: auditOk, transport_lineage: auditOk, immutable: auditOk });
  const qualification = nested({ report_id: qualificationOk ? "report:w1.3a:messaging-qualification" : "", command_delivery_verified: qualificationOk && commandOk, event_delivery_verified: qualificationOk && eventOk, ordering_deterministic: qualificationOk && commandOk && eventOk, retry_validated: qualificationOk && retryOk, dlq_validated: qualificationOk && dlqOk, tenant_isolation_verified: qualificationOk && tenantOk, identity_enforcement_verified: qualificationOk && securityOk, durable_persistence_verified: qualificationOk && persistenceOk, monitoring_operational: qualificationOk && observabilityOk, audit_evidence_complete: qualificationOk && auditOk, activation_recommendation: qualificationOk && dependenciesOk });
  const readiness = nested({ readiness_id: "W1.3A-MESSAGING-CORE-READINESS-001", decision, phase_ready: decision === "CORE_ACTIVATED" || decision === "ACTIVE_WITH_OBSERVATIONS", dependencies_ready: dependenciesOk, architecture_ready: architectureOk, infrastructure_ready: infrastructureOk, command_ready: commandOk, event_ready: eventOk, tenant_messaging_ready: tenantOk, retry_ready: retryOk, dlq_ready: dlqOk, persistence_ready: persistenceOk, security_ready: securityOk, observability_ready: observabilityOk, audit_ready: auditOk, qualification_ready: qualification.activation_recommendation, failures });
  const base: Omit<MessagingCoreResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_core_ref: "identity-core/w1.1a", storage_core_ref: "storage-core/w1.2a", architecture, infrastructure, command_transport, event_transport, tenant_messaging, retry_services, dead_letter_queue, persistence, security, observability, audit_evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMessagingCore(result?: MessagingCoreResult): MessagingCoreValidation {
  if (!result) return nested({ valid: false, decision: "NOT_ACTIVE" as const, replay_hash_valid: false, integrity_hash_valid: false, architecture_valid: false, infrastructure_valid: false, command_valid: false, event_valid: false, tenant_valid: false, retry_valid: false, dlq_valid: false, persistence_valid: false, security_valid: false, observability_valid: false, audit_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["MESSAGING_ARCHITECTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const architecture_valid = verifyHashed(result.architecture) && result.architecture.transport_model && result.architecture.routing_model && result.architecture.delivery_semantics;
  const infrastructure_valid = verifyHashed(result.infrastructure) && result.infrastructure.message_broker && result.infrastructure.messaging_cluster && result.infrastructure.services_healthy;
  const command_valid = verifyHashed(result.command_transport) && result.command_transport.command_queues.length >= 3 && result.command_transport.ordered_delivery && result.command_transport.guaranteed_processing && result.command_transport.idempotent_handling;
  const event_valid = verifyHashed(result.event_transport) && result.event_transport.event_topics.length >= 4 && result.event_transport.immutable_events && result.event_transport.ordered_publication && result.event_transport.replay_compatible;
  const tenant_valid = verifyHashed(result.tenant_messaging) && result.tenant_messaging.tenant_routing && result.tenant_messaging.namespace_routing && result.tenant_messaging.authorization_enforcement && result.tenant_messaging.cross_tenant_prevention;
  const retry_valid = verifyHashed(result.retry_services) && result.retry_services.exponential_backoff && result.retry_services.retry_limits && result.retry_services.failure_escalation;
  const dlq_valid = verifyHashed(result.dead_letter_queue) && result.dead_letter_queue.failed_message_capture && result.dead_letter_queue.recovery_workflow && result.dead_letter_queue.administrative_replay;
  const persistence_valid = verifyHashed(result.persistence) && result.persistence.persistent_queues && result.persistence.message_storage && result.persistence.message_lineage && result.persistence.audit_storage;
  const security_valid = verifyHashed(result.security) && result.security.authenticated_connections && result.security.authorized_routing && result.security.transport_encryption && result.security.identity_validation;
  const observability_valid = verifyHashed(result.observability) && result.observability.queue_metrics && result.observability.delivery_metrics && result.observability.retry_metrics && result.observability.health_monitoring;
  const audit_valid = verifyHashed(result.audit_evidence) && result.audit_evidence.records.length >= 5 && result.audit_evidence.delivery_evidence && result.audit_evidence.transport_lineage && result.audit_evidence.immutable;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.command_delivery_verified && result.qualification.event_delivery_verified && result.qualification.ordering_deterministic && result.qualification.activation_recommendation;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && architecture_valid && infrastructure_valid && command_valid && event_valid && tenant_valid && retry_valid && dlq_valid && persistence_valid && security_valid && observability_valid && audit_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, architecture_valid, infrastructure_valid, command_valid, event_valid, tenant_valid, retry_valid, dlq_valid, persistence_valid, security_valid, observability_valid, audit_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayMessagingCore(result = runMessagingCore()): boolean { const scenario = result.readiness.decision === "ACTIVE_WITH_OBSERVATIONS" ? { scenario: "ACTIVE_WITH_OBSERVATIONS" as const } : {}; const replayed = runMessagingCore(scenario); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMessagingCore(result).valid; }
export function getMessagingCoreBundle(): MessagingCoreBundle { const result = runMessagingCore(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_command_transport: true, owns_event_transport: true, owns_retry_services: true, owns_dead_letter_queue: true, owns_tenant_aware_messaging: true, owns_message_persistence: true, owns_transport_monitoring: true, owns_messaging_audit: true }), result, validation: validateMessagingCore(result) }); }
export const MessagingCoreService = Object.freeze({ run: runMessagingCore, validate: validateMessagingCore, replay: replayMessagingCore });
