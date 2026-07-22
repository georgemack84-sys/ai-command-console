import { describe, expect, it } from "vitest";
import { getMessagingCoreBundle, replayMessagingCore, runMessagingCore, validateMessagingCore } from "@/services/messaging-core";
import type { MessagingCoreFailure } from "@/types/messaging-core";

const CONDITIONAL_FAILURES: readonly MessagingCoreFailure[] = [
  "MESSAGING_ARCHITECTURE_MISSING",
  "MESSAGING_TOPOLOGY_INVALID",
  "DELIVERY_SEMANTICS_INVALID",
  "MESSAGE_INFRASTRUCTURE_MISSING",
  "MESSAGE_BROKER_UNAVAILABLE",
  "MESSAGING_CLUSTER_UNHEALTHY",
  "COMMAND_TRANSPORT_MISSING",
  "COMMAND_DELIVERY_UNRELIABLE",
  "COMMAND_PROCESSING_NOT_IDEMPOTENT",
  "COMMAND_AUTHORIZATION_MISSING",
  "EVENT_TRANSPORT_MISSING",
  "TENANT_AWARE_MESSAGING_MISSING",
  "RETRY_SERVICES_MISSING",
  "RETRY_POLICY_INVALID",
  "RETRY_LIMITS_MISSING",
  "FAILURE_ESCALATION_MISSING",
  "DLQ_MISSING",
  "FAILED_MESSAGE_CAPTURE_FAILED",
  "DLQ_RECOVERY_WORKFLOW_MISSING",
  "ADMINISTRATIVE_REPLAY_UNCONTROLLED",
  "MESSAGE_PERSISTENCE_MISSING",
  "PERSISTENT_QUEUES_UNAVAILABLE",
  "MESSAGE_LINEAGE_MISSING",
  "TRANSACTION_METADATA_MISSING",
  "MESSAGING_SECURITY_MISSING",
  "AUTHENTICATED_CONNECTIONS_FAILED",
  "IDENTITY_VALIDATION_FAILED",
  "OBSERVABILITY_MISSING",
  "QUEUE_METRICS_MISSING",
  "DELIVERY_METRICS_MISSING",
  "RETRY_METRICS_MISSING",
  "LATENCY_METRICS_MISSING",
  "FAILURE_METRICS_MISSING",
  "MESSAGING_AUDIT_MISSING",
  "DELIVERY_EVIDENCE_MISSING",
  "RETRY_EVIDENCE_MISSING",
  "FAILURE_EVIDENCE_MISSING",
  "TRANSPORT_LINEAGE_MISSING",
  "MESSAGING_QUALIFICATION_FAILED",
];

const FAIL_CLOSED_FAILURES: readonly MessagingCoreFailure[] = [
  "W1_1A_IDENTITY_CORE_INVALID",
  "W1_2A_STORAGE_CORE_INVALID",
  "COMMAND_ORDERING_NON_DETERMINISTIC",
  "EVENT_IMMUTABILITY_VIOLATED",
  "EVENT_ORDERING_NON_DETERMINISTIC",
  "EVENT_REPLAY_INCOMPATIBLE",
  "TENANT_ISOLATION_VIOLATED",
  "NAMESPACE_SEPARATION_VIOLATED",
  "CROSS_TENANT_MESSAGE_ALLOWED",
  "AUTHORIZED_ROUTING_FAILED",
  "TRANSPORT_ENCRYPTION_MISSING",
  "MESSAGING_AUDIT_NOT_IMMUTABLE",
];

describe("W1.3A Messaging Core", () => {
  it("publishes messaging-core doctrine and validates baseline", () => {
    const bundle = getMessagingCoreBundle();

    expect(bundle.doctrine.version).toBe("messaging-core/w1.3a");
    expect(bundle.doctrine.owns_command_transport).toBe(true);
    expect(bundle.doctrine.owns_event_transport).toBe(true);
    expect(bundle.doctrine.owns_retry_services).toBe(true);
    expect(bundle.doctrine.owns_dead_letter_queue).toBe(true);
    expect(bundle.doctrine.owns_tenant_aware_messaging).toBe(true);
    expect(bundle.doctrine.owns_message_persistence).toBe(true);
    expect(bundle.doctrine.owns_transport_monitoring).toBe(true);
    expect(bundle.doctrine.owns_messaging_audit).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic messaging activation with identity and storage dependencies", () => {
    const first = runMessagingCore();
    const second = runMessagingCore();

    expect(first.phase_identifier).toBe("MessagingCore");
    expect(first.identity_core_ref).toBe("identity-core/w1.1a");
    expect(first.storage_core_ref).toBe("storage-core/w1.2a");
    expect(first.command_transport.command_queues).toHaveLength(3);
    expect(first.event_transport.event_topics).toHaveLength(4);
    expect(first.audit_evidence.records).toHaveLength(5);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMessagingCore(first).valid).toBe(true);
    expect(replayMessagingCore(first)).toBe(true);
  });

  it("provides ordered command transport, immutable event transport, and tenant-aware routing", () => {
    const result = runMessagingCore();

    expect(result.command_transport.ordered_delivery).toBe(true);
    expect(result.command_transport.guaranteed_processing).toBe(true);
    expect(result.command_transport.idempotent_handling).toBe(true);
    expect(result.command_transport.authorization_integration).toBe(true);
    expect(result.event_transport.immutable_events).toBe(true);
    expect(result.event_transport.ordered_publication).toBe(true);
    expect(result.event_transport.replay_compatible).toBe(true);
    expect(result.tenant_messaging.cross_tenant_prevention).toBe(true);
  });

  it("provides retry, dead-letter, persistence, security, observability, and audit evidence controls", () => {
    const result = runMessagingCore();

    expect(result.retry_services.exponential_backoff).toBe(true);
    expect(result.retry_services.retry_limits).toBe(true);
    expect(result.retry_services.failure_escalation).toBe(true);
    expect(result.dead_letter_queue.failed_message_capture).toBe(true);
    expect(result.dead_letter_queue.recovery_workflow).toBe(true);
    expect(result.dead_letter_queue.administrative_replay).toBe(true);
    expect(result.persistence.persistent_queues).toBe(true);
    expect(result.persistence.message_lineage).toBe(true);
    expect(result.persistence.audit_storage).toBe(true);
    expect(result.security.authenticated_connections).toBe(true);
    expect(result.security.authorized_routing).toBe(true);
    expect(result.security.transport_encryption).toBe(true);
    expect(result.observability.queue_metrics).toBe(true);
    expect(result.observability.delivery_metrics).toBe(true);
    expect(result.observability.retry_metrics).toBe(true);
    expect(result.audit_evidence.immutable).toBe(true);
  });

  it("qualifies messaging core activation", () => {
    const result = runMessagingCore();

    expect(result.qualification.command_delivery_verified).toBe(true);
    expect(result.qualification.event_delivery_verified).toBe(true);
    expect(result.qualification.ordering_deterministic).toBe(true);
    expect(result.qualification.retry_validated).toBe(true);
    expect(result.qualification.dlq_validated).toBe(true);
    expect(result.qualification.tenant_isolation_verified).toBe(true);
    expect(result.qualification.activation_recommendation).toBe(true);
    expect(result.readiness.decision).toBe("CORE_ACTIVATED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks messaging core conditionally active for remediable deficiency %s", (failure) => {
    const result = runMessagingCore({ scenario: failure });
    const validation = validateMessagingCore(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks messaging core not active for activation failure", () => {
    const result = runMessagingCore({ scenario: "CORE_ACTIVATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_ACTIVE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateMessagingCore(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical messaging defect %s", (failure) => {
    const result = runMessagingCore({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateMessagingCore(result).valid).toBe(false);
  });

  it("supports active with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runMessagingCore({ scenario: "ACTIVE_WITH_OBSERVATIONS" });
    const conditional = runMessagingCore({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("ACTIVE_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateMessagingCore(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
