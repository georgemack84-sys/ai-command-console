import { describe, expect, it } from "vitest";

import { getWaveFiveTasksCommitmentsBundle, replayWaveFiveTasksCommitments, runWaveFiveTasksCommitments, validateWaveFiveTasksCommitments } from "@/services/wave-five-tasks-commitments";
import type { WaveFiveTasksCommitmentsFailure } from "@/types/wave-five-tasks-commitments";

const conditionalFailures = ["TASK_REGISTRY_MISSING", "TASK_APIS_UNCERTIFIED", "TASK_OWNERSHIP_MISSING", "COMMITMENT_REGISTRY_MISSING", "COMMITMENT_OWNERSHIP_INVALID", "COMMITMENT_HISTORY_INCOMPLETE", "PLANNING_ENGINE_MISSING", "PLAN_VALIDATION_MISSING", "TASK_LIFECYCLE_MISSING", "TASK_HISTORY_INCOMPLETE", "PRIORITY_ENGINE_MISSING", "CONFLICT_DETECTION_MISSING", "WEEKLY_REVIEW_MISSING", "CARRY_FORWARD_INVALID", "HISTORICAL_REVIEWS_MISSING", "DEPENDENCY_GRAPH_MISSING", "READINESS_NOT_VALIDATED", "CRITICAL_PATH_MISSING", "CROSS_APPLICATION_INTEGRATION_MISSING", "INTEGRATION_CONTRACTS_UNCERTIFIED", "AUDIT_TRAIL_MISSING"] as const satisfies readonly WaveFiveTasksCommitmentsFailure[];
const notQualifiedFailures = ["W5_CALENDAR_TIME_INVALID", "TASK_IDENTITIES_NONDETERMINISTIC", "TASK_RELATIONSHIPS_INVALID", "COMMITMENTS_NOT_INDEPENDENT", "COMMITMENT_LIFECYCLE_NONDETERMINISTIC", "PLANS_NONREPRODUCIBLE", "PLAN_DEPENDENCIES_INVALID", "CAPACITY_NOT_RESPECTED", "TASK_STATE_TRANSITIONS_INVALID", "TASK_REPLAY_DIVERGED", "PRIORITIES_NONREPRODUCIBLE", "SCHEDULING_NONDETERMINISTIC", "CAPACITY_NOT_ENFORCED", "REVIEWS_NONREPRODUCIBLE", "CIRCULAR_DEPENDENCIES_ALLOWED", "SYNCHRONIZATION_INVALID", "EVIDENCE_MUTABLE", "TASK_LINEAGE_INCOMPLETE", "COMMITMENT_LINEAGE_INCOMPLETE", "GOVERNANCE_BYPASS_DETECTED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveTasksCommitmentsFailure[];

describe("Wave 5.5 Tasks and Commitments", () => {
  it("publishes the tasks and commitments doctrine", () => {
    const bundle = getWaveFiveTasksCommitmentsBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-tasks-commitments/w5.5", commitments_are_first_class: true, tasks_require_deterministic_lifecycle: true, planning_must_be_replayable: true, evidence_lineage_required: true, tenant_isolation_required: true, governance_required: true, qualification_gate: "W5.5 Tasks and Commitments Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the Wave 5 calendar and knowledge stack", () => {
    const first = runWaveFiveTasksCommitments({ seed: "deterministic" });
    const second = runWaveFiveTasksCommitments({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2"]);
    expect(first.provides).toEqual(["task-registry", "commitment-registry", "planning-engine", "plan-generator", "priority-engine", "scheduling-engine", "lifecycle-engine", "work-queue", "dependency-graph", "weekly-review", "audit-service", "evidence-registry"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveTasksCommitments(first).valid).toBe(true);
    expect(replayWaveFiveTasksCommitments()).toBe(true);
  });

  it("registers tasks and independently tracks commitments", () => {
    const result = runWaveFiveTasksCommitments();

    expect(result.tasks).toMatchObject({ task_identity: true, task_registry: true, task_metadata: true, task_categories: true, task_templates: true, task_relationships: true, parent_child_tasks: true, dependency_tracking: true, task_tags: true, task_ownership: true, identities_deterministic: true, relationships_validated: true, registry_operational: true, apis_certified: true });
    expect(result.commitments).toMatchObject({ commitment_registry: true, personal_commitments: true, organizational_commitments: true, delegated_commitments: true, commitment_lifecycle: true, due_date_management: true, commitment_priorities: true, commitment_status: true, commitment_ownership: true, commitment_history: true, independently_managed: true, lifecycle_deterministic: true, ownership_validated: true, history_complete: true });
    expect(runWaveFiveTasksCommitments({ scenario: "TASK_IDENTITIES_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveTasksCommitments({ scenario: "COMMITMENTS_NOT_INDEPENDENT" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("turns goals into deterministic plans and replayable task lifecycles", () => {
    const result = runWaveFiveTasksCommitments();

    expect(result.planning).toMatchObject({ goal_breakdown: true, task_generation: true, milestone_planning: true, dependency_planning: true, work_sequencing: true, priority_calculation: true, capacity_planning: true, time_estimation: true, plan_optimization: true, plan_validation: true, plans_reproducible: true, dependencies_validated: true, capacity_respected: true, deterministic: true });
    expect(result.lifecycle).toMatchObject({ task_creation: true, assignment: true, scheduling: true, progress_tracking: true, status_changes: true, blocked_states: true, waiting_states: true, completion_processing: true, cancellation: true, archiving: true, deterministic: true, transitions_validated: true, history_complete: true, replay_identical: true });
    expect(runWaveFiveTasksCommitments({ scenario: "PLANS_NONREPRODUCIBLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveTasksCommitments({ scenario: "TASK_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("validates priorities, schedules, weekly reviews, and dependency integrity", () => {
    const result = runWaveFiveTasksCommitments();

    expect(result.prioritization_scheduling).toMatchObject({ priority_engine: true, importance_scoring: true, urgency_scoring: true, deadline_evaluation: true, capacity_allocation: true, daily_planning: true, weekly_planning: true, work_queue: true, scheduling_rules: true, conflict_detection: true, priorities_reproducible: true, scheduling_deterministic: true, conflicts_detected: true, capacity_enforced: true });
    expect(result.weekly_review).toMatchObject({ weekly_dashboard: true, completed_tasks: true, outstanding_commitments: true, deferred_work: true, carry_forward: true, wins: true, lessons_learned: true, planning_review: true, capacity_review: true, goal_alignment_review: true, reviews_reproducible: true, reports_generated: true, carry_forward_validated: true, historical_reviews_retained: true });
    expect(result.dependencies).toMatchObject({ dependency_graph: true, blocking_relationships: true, sequential_tasks: true, parallel_tasks: true, milestone_dependencies: true, critical_path: true, automatic_readiness: true, dependency_validation: true, circular_dependency_detection: true, graph_complete: true, circular_dependencies_prevented: true, readiness_validated: true, critical_path_generated: true });
    expect(runWaveFiveTasksCommitments({ scenario: "CAPACITY_NOT_ENFORCED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveTasksCommitments({ scenario: "CIRCULAR_DEPENDENCIES_ALLOWED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("integrates across applications and preserves immutable governance lineage", () => {
    const result = runWaveFiveTasksCommitments();

    expect(result.integration_governance).toMatchObject({ calendar_integration: true, context_integration: true, knowledge_integration: true, notification_integration: true, collaboration_integration: true, cross_application_events: true, integration_contracts: true, audit_trail: true, evidence_capture: true, task_lineage: true, commitment_lineage: true, change_history: true, policy_enforcement: true, permissions: true, replay_support: true, reporting: true, tenant_isolation: true, evidence_immutable: true, governance_operational: true, synchronization_validated: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, every_task_registered: true, every_commitment_tracked: true, planning_deterministic: true, lifecycle_replayable_auditable_governed: true, weekly_review_actionable: true, dependencies_priorities_schedules_validated: true, cross_application_integrations_operational: true, lineage_audit_governance_complete: true, constitutional_replay_evidence_tenant_isolation_satisfied: true });
    expect(runWaveFiveTasksCommitments({ scenario: "SYNCHRONIZATION_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveTasksCommitments({ scenario: "EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveTasksCommitments({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveTasksCommitments({ scenario: failure });
    const validation = validateWaveFiveTasksCommitments(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveTasksCommitments({ scenario: failure });
    const validation = validateWaveFiveTasksCommitments(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveTasksCommitments({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveTasksCommitments({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveTasksCommitments({ scenario: "TASKS_COMMITMENTS_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveTasksCommitments(notQualified).valid).toBe(false);
  });
});
