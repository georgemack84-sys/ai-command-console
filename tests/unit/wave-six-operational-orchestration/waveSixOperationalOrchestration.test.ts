import { describe, expect, it } from "vitest";

import { getWaveSixOperationalOrchestrationBundle, replayWaveSixOperationalOrchestration, runWaveSixOperationalOrchestration, validateWaveSixOperationalOrchestration } from "@/services/wave-six-operational-orchestration";
import type { WaveSixOperationalOrchestrationFailure } from "@/types/wave-six-operational-orchestration";

const conditionalFailures = ["ORCHESTRATION_SCHEDULER_MISSING", "TRIGGER_ENGINE_MISSING", "RETRY_COORDINATOR_MISSING", "WORKFLOW_SCHEDULER_MISSING", "CALENDAR_SCHEDULES_INVALID", "EVENT_DRIVEN_SCHEDULING_MISSING", "BACKGROUND_COORDINATION_MISSING", "BATCH_COORDINATION_MISSING", "OPERATIONAL_QUEUE_MISSING", "SCHEDULE_REGISTRY_MISSING", "SCHEDULE_VERSIONING_MISSING", "EXECUTION_HISTORY_MISSING", "REPLAY_METADATA_MISSING", "SCHEDULING_POLICIES_MISSING", "MAINTENANCE_WINDOW_BYPASSED", "OPERATIONAL_COORDINATION_MISSING", "SCHEDULING_EVIDENCE_MISSING", "RETRY_EVIDENCE_MISSING", "CANCELLATION_EVIDENCE_MISSING", "SCHEDULER_AUDIT_MISSING"] as const satisfies readonly WaveSixOperationalOrchestrationFailure[];
const notQualifiedFailures = ["CAF_RUNTIME_ORCHESTRATION_INVALID", "W5_PLATFORM_BRIDGE_GATEWAY_INVALID", "SCHEDULER_EXECUTES_BUSINESS_LOGIC", "SCHEDULING_NONDETERMINISTIC", "RECURRING_WORKFLOWS_INVALID", "DEPENDENCY_SCHEDULING_INVALID", "BACKGROUND_EXECUTION_LOST_WORK", "WORKER_COORDINATION_INVALID", "QUEUE_OWNERSHIP_NOT_CENTRALIZED", "QUEUE_REPLAY_NONDETERMINISTIC", "QUEUE_PERSISTENCE_MISSING", "QUEUE_RECOVERY_FAILED", "SCHEDULE_REGISTRY_MUTABLE", "CONCURRENCY_POLICY_BYPASSED", "RETRY_POLICY_INVALID", "PRIORITY_RULES_INVALID", "DEPENDENCY_ORDERING_INVALID", "WORKFLOW_SEQUENCING_INVALID", "RESOURCE_COORDINATION_INVALID", "SCHEDULING_EVIDENCE_MUTABLE", "FAILURE_RECOVERY_INVALID", "REPLAY_DIVERGED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixOperationalOrchestrationFailure[];

describe("Wave 6.1 Operational Orchestration", () => {
  it("publishes the operational orchestration doctrine", () => {
    const bundle = getWaveSixOperationalOrchestrationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-operational-orchestration/w6.1", coordinates_never_executes: true, delegates_execution_to_caf: true, deterministic_scheduling_required: true, centralized_queue_ownership_required: true, immutable_scheduling_evidence_required: true, replayable_scheduling_required: true, failure_recovery_required: true, qualification_gate: "W6.1 Operational Orchestration Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes CAF runtime orchestration plus W5.15 PBG", () => {
    const first = runWaveSixOperationalOrchestration({ seed: "deterministic" });
    const second = runWaveSixOperationalOrchestration({ seed: "deterministic" });

    expect(first.caf_runtime_ref).toBe("caf-runtime-orchestration/v3.3");
    expect(first.platform_bridge_gateway_ref).toBe("wave-five-platform-bridge-gateway/w5.15");
    expect(first.provides).toEqual(["orchestration-scheduler", "workflow-scheduler", "operational-queue", "execution-schedule-registry", "schedule-api", "workflow-scheduling-api", "queue-api", "execution-api"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixOperationalOrchestration(first).valid).toBe(true);
    expect(replayWaveSixOperationalOrchestration()).toBe(true);
  });

  it("coordinates scheduling without executing business logic", () => {
    const result = runWaveSixOperationalOrchestration();

    expect(result.scheduler).toMatchObject({ schedule_execution: true, trigger_workflows: true, delay_execution: true, retry_scheduling: true, pause_schedules: true, resume_schedules: true, cancel_schedules: true, prioritize_execution: true, scheduling_engine: true, schedule_evaluator: true, trigger_engine: true, retry_coordinator: true, scheduling_policies: true, coordinates_only: true, delegates_execution_to_caf: true, deterministic: true });
    expect(runWaveSixOperationalOrchestration({ scenario: "SCHEDULER_EXECUTES_BUSINESS_LOGIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOrchestration({ scenario: "SCHEDULING_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("manages workflow scheduling, background coordination, and centralized queues", () => {
    const result = runWaveSixOperationalOrchestration();

    expect(result.workflow_background_queue).toMatchObject({ recurring_jobs: true, time_based_workflows: true, calendar_schedules: true, cron_scheduling: true, event_driven_scheduling: true, dependency_scheduling: true, workflow_schedule_manager: true, recurrence_engine: true, calendar_evaluator: true, dependency_scheduler: true, background_jobs: true, deferred_execution: true, long_running_workflows: true, batch_execution: true, queue_dispatch: true, worker_coordination: true, background_job_manager: true, worker_coordinator: true, deferred_execution_manager: true, batch_coordinator: true, queue_registration: true, queue_prioritization: true, queue_monitoring: true, queue_balancing: true, queue_replay: true, queue_persistence: true, queue_manager: true, queue_registry: true, queue_dispatcher: true, queue_recovery: true, queue_evidence: true, centralized_queue_ownership: true, deterministic_queue_replay: true, no_lost_work: true });
    expect(runWaveSixOperationalOrchestration({ scenario: "QUEUE_OWNERSHIP_NOT_CENTRALIZED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOrchestration({ scenario: "BACKGROUND_EXECUTION_LOST_WORK" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps schedule definitions immutable and scheduling policies enforced", () => {
    const result = runWaveSixOperationalOrchestration();

    expect(result.schedule_registry_policies).toMatchObject({ schedule_registration: true, versioning: true, ownership: true, metadata: true, execution_history: true, replay_metadata: true, schedule_registry: true, schedule_metadata: true, version_manager: true, schedule_history: true, immutable_definitions: true, maximum_concurrency: true, retry_limits: true, backoff_policies: true, priority_rules: true, maintenance_windows: true, pause_policies: true, scheduling_policy_engine: true, concurrency_rules: true, policies_enforced: true });
    expect(runWaveSixOperationalOrchestration({ scenario: "SCHEDULE_REGISTRY_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOrchestration({ scenario: "CONCURRENCY_POLICY_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("preserves coordination evidence, replay, and recoverability", () => {
    const result = runWaveSixOperationalOrchestration();

    expect(result.coordination_evidence).toMatchObject({ dependency_ordering: true, workflow_sequencing: true, parallel_scheduling: true, serialized_scheduling: true, resource_coordination: true, coordination_engine: true, dependency_graph: true, execution_planner: true, schedule_creation_evidence: true, schedule_modification_evidence: true, trigger_evidence: true, queue_evidence: true, retry_evidence: true, cancellation_evidence: true, execution_timeline: true, scheduler_audit_records: true, immutable_evidence: true, replayable_evidence: true, failure_recovery_verified: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, scheduler_operational: true, workflow_scheduler_deterministic: true, background_execution_coordinated: true, operational_queue_functional: true, schedule_registry_immutable: true, scheduling_policies_enforced: true, queue_replay_deterministic: true, scheduling_evidence_immutable: true, retry_behavior_validated: true, failure_recovery_verified: true, replay_identical_scheduling_decisions: true, platform_orchestration_deterministic: true, coordinates_never_executes_business_logic: true });
    expect(runWaveSixOperationalOrchestration({ scenario: "SCHEDULING_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOrchestration({ scenario: "REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixOperationalOrchestration({ scenario: failure });
    const validation = validateWaveSixOperationalOrchestration(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixOperationalOrchestration({ scenario: failure });
    const validation = validateWaveSixOperationalOrchestration(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveSixOperationalOrchestration({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixOperationalOrchestration({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixOperationalOrchestration({ scenario: "OPERATIONAL_ORCHESTRATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixOperationalOrchestration(notQualified).valid).toBe(false);
  });
});
