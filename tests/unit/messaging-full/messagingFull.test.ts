import { describe, expect, it } from "vitest";
import { getMessagingFullBundle, replayMessagingFull, runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import type { MessagingFullFailure } from "@/types/messaging-full";

const CONDITIONAL_FAILURES: readonly MessagingFullFailure[] = [
  "MESSAGING_FULL_ARCHITECTURE_MISSING",
  "CANONICAL_ENVELOPE_INVALID",
  "SERVICE_BOUNDARIES_UNAPPROVED",
  "EVENT_BUS_MISSING",
  "EVENT_CONTRACT_VALIDATION_FAILED",
  "EVENT_CONSUMER_RECOVERY_FAILED",
  "COMMAND_BUS_MISSING",
  "COMMAND_AUTHORIZATION_FAILED",
  "COMMAND_IDEMPOTENCY_MISSING",
  "WORKFLOW_QUEUE_MISSING",
  "WORKFLOW_DURABILITY_FAILED",
  "WORKER_LEASE_INVALID",
  "SCHEDULER_MISSING",
  "SCHEDULE_MISFIRE_NON_DETERMINISTIC",
  "SCHEDULE_DUPLICATE_DISPATCH",
  "NOTIFICATION_BUS_MISSING",
  "NOTIFICATION_ADAPTERS_UNREGISTERED",
  "NOTIFICATION_DEDUPLICATION_MISSING",
  "REPLAY_QUEUE_MISSING",
  "REPLAY_AUTHORIZATION_MISSING",
  "MESSAGE_LINEAGE_INCOMPLETE",
  "WORKFLOW_EVIDENCE_UNVERIFIABLE",
  "CONTRACT_ENFORCEMENT_MISSING",
  "RELIABILITY_CONTROLS_MISSING",
  "DLQ_OPERATIONS_UNCONTROLLED",
  "SECURITY_CONTROLS_MISSING",
  "OBSERVABILITY_MISSING",
  "CRITICAL_TELEMETRY_MISSING",
  "RECOVERY_PROCEDURES_UNTESTED",
  "ADMIN_CONTROLS_MISSING",
  "HIGH_RISK_ADMIN_EVIDENCE_MISSING",
  "PERFORMANCE_SCALABILITY_UNPROVEN",
];

const FAIL_CLOSED_FAILURES: readonly MessagingFullFailure[] = [
  "W1_3A_MESSAGING_CORE_INVALID",
  "W1_3A_COMPATIBILITY_BROKEN",
  "ACK_DURABLE_MESSAGE_LOSS",
  "TENANT_ISOLATION_NOT_PROVEN",
  "UNAUTHORIZED_PUBLICATION_POSSIBLE",
  "UNAUTHORIZED_SUBSCRIPTION_POSSIBLE",
  "REPLAY_SIDE_EFFECT_UNCONTROLLED",
];

describe("W1.3B Messaging Full", () => {
  it("publishes messaging-full doctrine and validates baseline", () => {
    const bundle = getMessagingFullBundle();

    expect(bundle.doctrine.version).toBe("messaging-full/w1.3b");
    expect(bundle.doctrine.owns_event_bus).toBe(true);
    expect(bundle.doctrine.owns_command_bus).toBe(true);
    expect(bundle.doctrine.owns_workflow_queue).toBe(true);
    expect(bundle.doctrine.owns_scheduler).toBe(true);
    expect(bundle.doctrine.owns_notification_bus).toBe(true);
    expect(bundle.doctrine.owns_replay_queue).toBe(true);
    expect(bundle.doctrine.owns_message_lineage).toBe(true);
    expect(bundle.doctrine.owns_workflow_evidence).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Messaging Infrastructure Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic messaging infrastructure qualification with W1.3A compatibility", () => {
    const first = runMessagingFull();
    const second = runMessagingFull();

    expect(first.phase_identifier).toBe("MessagingFull");
    expect(first.messaging_core_ref).toBe("messaging-core/w1.3a");
    expect(first.architecture.w13a_compatible).toBe(true);
    expect(first.envelope.required_fields).toContain("integrity_signature");
    expect(first.envelope.message_classes).toContain("REPLAY_MESSAGE");
    expect(first.event_bus.topics).toHaveLength(4);
    expect(first.operations.telemetry_metrics.length).toBeGreaterThanOrEqual(15);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMessagingFull(first).valid).toBe(true);
    expect(replayMessagingFull(first)).toBe(true);
  });

  it("qualifies event, command, workflow, scheduler, notification, and replay services", () => {
    const result = runMessagingFull();

    expect(result.event_bus.durable_subscriptions).toBe(true);
    expect(result.event_bus.partition_ordering).toBe(true);
    expect(result.event_bus.consumer_recovery).toBe(true);
    expect(result.command_bus.authorization).toBe(true);
    expect(result.command_bus.outcome_reporting).toBe(true);
    expect(result.command_bus.idempotency).toBe(true);
    expect(result.workflow_queue.durable_tasks).toBe(true);
    expect(result.workflow_queue.task_leases).toBe(true);
    expect(result.workflow_queue.workflow_checkpoints).toBe(true);
    expect(result.scheduler.deterministic_misfires).toBe(true);
    expect(result.scheduler.duplicate_dispatch_control).toBe(true);
    expect(result.notification_bus.registered_adapters).toBe(true);
    expect(result.notification_bus.suppression_deduplication).toBe(true);
    expect(result.replay_queue.authorization_model).toBe(true);
    expect(result.replay_queue.side_effect_suppression).toBe(true);
    expect(result.replay_queue.divergence_detection).toBe(true);
  });

  it("qualifies lineage, evidence, contracts, reliability, security, operations, and administration", () => {
    const result = runMessagingFull();

    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.queryable_lineage).toBe(true);
    expect(result.workflow_evidence.append_only).toBe(true);
    expect(result.workflow_evidence.workflow_reconstruction).toBe(true);
    expect(result.contract_governance.schema_validation).toBe(true);
    expect(result.contract_governance.production_enforcement).toBe(true);
    expect(result.reliability.dead_letter_management).toBe(true);
    expect(result.reliability.authorized_redrive).toBe(true);
    expect(result.reliability.durable_ack_safety).toBe(true);
    expect(result.security.publish_authorization).toBe(true);
    expect(result.security.subscribe_authorization).toBe(true);
    expect(result.security.tenant_isolation_validated).toBe(true);
    expect(result.operations.distributed_tracing).toBe(true);
    expect(result.operations.alerts).toBe(true);
    expect(result.administration.dual_control).toBe(true);
    expect(result.administration.operator_evidence).toBe(true);
  });

  it("passes the Messaging Infrastructure Gate", () => {
    const result = runMessagingFull();

    expect(result.qualification.functional_validation).toBe(true);
    expect(result.qualification.integration_validation).toBe(true);
    expect(result.qualification.reliability_validation).toBe(true);
    expect(result.qualification.security_validation).toBe(true);
    expect(result.qualification.performance_validation).toBe(true);
    expect(result.qualification.replay_validation).toBe(true);
    expect(result.qualification.evidence_review).toBe(true);
    expect(result.qualification.operational_readiness).toBe(true);
    expect(result.qualification.gate_decision).toBe("QUALIFIED");
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks messaging full conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runMessagingFull({ scenario: failure });
    const validation = validateMessagingFull(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks messaging full not qualified when the infrastructure gate fails", () => {
    const result = runMessagingFull({ scenario: "MESSAGING_INFRASTRUCTURE_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateMessagingFull(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical messaging infrastructure defect %s", (failure) => {
    const result = runMessagingFull({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateMessagingFull(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runMessagingFull({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runMessagingFull({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateMessagingFull(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
