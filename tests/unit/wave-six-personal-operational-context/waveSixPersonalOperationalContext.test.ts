import { describe, expect, it } from "vitest";

import { getWaveSixPersonalOperationalContextBundle, replayWaveSixPersonalOperationalContext, runWaveSixPersonalOperationalContext, validateWaveSixPersonalOperationalContext } from "@/services/wave-six-personal-operational-context";
import type { WaveSixPersonalOperationalContextFailure } from "@/types/wave-six-personal-operational-context";

const conditionalFailures = ["CONTEXT_MANAGER_MISSING", "CONTEXT_EXPIRATION_MISSING", "CONTEXT_UPDATES_INVALID", "GOAL_MANAGER_MISSING", "GOAL_DEPENDENCIES_INVALID", "PROJECT_MANAGER_MISSING", "PROJECT_MILESTONES_MISSING", "ROUTINE_ENGINE_MISSING", "ROUTINE_TRACKING_MISSING", "SCHEDULE_SERVICE_MISSING", "PRIORITY_ENGINE_MISSING", "PRIORITY_EXPIRATION_MISSING", "WORKING_CONTEXT_MISSING", "RECENT_ACTIVITY_MISSING", "WORKING_CONTEXT_EXPIRATION_MISSING", "SNAPSHOT_SERVICE_MISSING", "CONTEXT_HISTORY_MISSING", "CONTEXT_VERSIONING_MISSING", "CHANGE_EVIDENCE_MISSING"] as const satisfies readonly WaveSixPersonalOperationalContextFailure[];
const notQualifiedFailures = ["W6_2_DEPENDENCY_COORDINATION_INVALID", "W5_UNIFIED_PERSONAL_CONTEXT_INVALID", "CONTEXT_ASSEMBLY_NONDETERMINISTIC", "HIDDEN_AI_MEMORY_USED", "GOAL_LIFECYCLE_INVALID", "GOAL_PRIORITIES_NONDETERMINISTIC", "PROJECT_LIFECYCLE_INVALID", "PROJECT_DEPENDENCIES_INVALID", "ROUTINE_SCHEDULING_INVALID", "HABIT_PROGRESS_INVALID", "CALENDAR_INTEGRATION_INVALID", "AVAILABILITY_INVALID", "TIME_BLOCKING_NONDETERMINISTIC", "PRIORITY_RANKING_NONDETERMINISTIC", "TEMPORARY_OVERRIDE_INVALID", "SESSION_CONTEXT_INVALID", "SNAPSHOT_MUTABLE", "SNAPSHOT_REPLAY_DIVERGED", "SESSION_RESTORE_DIVERGED", "HISTORICAL_RECONSTRUCTION_FAILED", "OPERATIONAL_HISTORY_OVERWRITTEN", "CONSTITUTIONAL_POLICY_STORED", "AUTHORITY_DECISION_MADE", "TRUST_STANDING_MAINTAINED", "RESTRICTION_EVALUATION_PERFORMED", "IDENTITY_OWNERSHIP_ASSUMED", "LONG_TERM_MEMORY_OWNERSHIP_ASSUMED", "PCC_SEPARATION_BREACH", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixPersonalOperationalContextFailure[];

describe("Wave 6.3 Personal Operational Context", () => {
  it("publishes the personal operational context doctrine", () => {
    const bundle = getWaveSixPersonalOperationalContextBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-personal-operational-context/w6.3", operational_not_constitutional: true, mutable_runtime_context_authoritative: true, deterministic_context_assembly_required: true, hidden_ai_memory_prohibited: true, immutable_snapshots_required: true, complete_history_required: true, pcc_boundary_required: true, qualification_gate: "W6.3 Personal Operational Context Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes dependency coordination plus unified personal context", () => {
    const first = runWaveSixPersonalOperationalContext({ seed: "deterministic" });
    const second = runWaveSixPersonalOperationalContext({ seed: "deterministic" });

    expect(first.dependency_coordination_ref).toBe("wave-six-dependency-service-coordination/w6.2");
    expect(first.unified_personal_context_ref).toBe("wave-five-unified-personal-context/w5.2");
    expect(first.upstream_refs).toContain("calendar-integrations");
    expect(first.upstream_refs).toContain("aurora-orchestration");
    expect(first.provides).toEqual(["personal-operational-context", "context-snapshot-registry", "context-history", "current-priorities", "active-project-state", "runtime-context-for-aurora"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixPersonalOperationalContext(first).valid).toBe(true);
    expect(replayWaveSixPersonalOperationalContext()).toBe(true);
  });

  it("assembles mutable runtime context without hidden AI memory", () => {
    const result = runWaveSixPersonalOperationalContext();

    expect(result.context_manager).toMatchObject({ runtime_context: true, context_assembly: true, context_expiration: true, context_updates: true, current_work_ref: true, today_plan_ref: true, recent_changes_ref: true, aurora_session_context: true, deterministic_assembly: true, no_hidden_ai_memory: true, mutable_operational_state: true });
    expect(runWaveSixPersonalOperationalContext({ scenario: "HIDDEN_AI_MEMORY_USED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixPersonalOperationalContext({ scenario: "CONTEXT_ASSEMBLY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("manages active goals and projects as operational state", () => {
    const result = runWaveSixPersonalOperationalContext();

    expect(result.goals_projects).toMatchObject({ goal_registry: true, goal_lifecycle: true, goal_status: true, goal_priorities: true, goal_dependencies: true, goal_manager: true, goal_timeline: true, project_registry: true, project_status: true, milestones: true, deadlines: true, project_dependencies: true, project_dashboard: true, deterministic_updates: true });
    expect(result.readiness.goals_projects_routines_schedules_priorities_managed).toBe(true);
    expect(runWaveSixPersonalOperationalContext({ scenario: "GOAL_PRIORITIES_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixPersonalOperationalContext({ scenario: "PROJECT_DEPENDENCIES_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("coordinates routines schedules and temporary priorities deterministically", () => {
    const result = runWaveSixPersonalOperationalContext();

    expect(result.routines_schedules_priorities).toMatchObject({ routine_registry: true, routine_scheduling: true, routine_tracking: true, habit_progress: true, daily_routines: true, weekly_routines: true, monthly_routines: true, schedule_registry: true, calendar_integration: true, availability: true, time_blocking: true, operational_schedule: true, priority_registry: true, priority_ranking: true, priority_expiration: true, temporary_overrides: true, active_priority_queue: true, deterministic_ranking: true });
    expect(runWaveSixPersonalOperationalContext({ scenario: "TIME_BLOCKING_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixPersonalOperationalContext({ scenario: "TEMPORARY_OVERRIDE_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("records immutable snapshots and complete no-overwrite context history", () => {
    const result = runWaveSixPersonalOperationalContext();

    expect(result.working_snapshot_history).toMatchObject({ working_memory: true, session_context: true, recent_activity: true, current_objective: true, focus_session: true, recent_decisions: true, working_context_store: true, working_context_expiration: true, context_snapshot_service: true, immutable_snapshots: true, replay_support: true, session_recovery: true, historical_reconstruction: true, context_history: true, previous_state: true, new_state: true, change_type: true, timestamps: true, source: true, change_evidence: true, versioning: true, no_overwrite_history: true });
    expect(result.readiness.snapshots_replayable).toBe(true);
    expect(result.readiness.complete_history_preserved).toBe(true);
    expect(runWaveSixPersonalOperationalContext({ scenario: "SNAPSHOT_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixPersonalOperationalContext({ scenario: "OPERATIONAL_HISTORY_OVERWRITTEN" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps PCC authority identity restrictions and long-term memory outside POC", () => {
    const result = runWaveSixPersonalOperationalContext();

    expect(result.constitutional_boundary).toMatchObject({ owns_active_goals: true, owns_active_projects: true, owns_personal_routines: true, owns_schedules: true, owns_temporary_priorities: true, owns_working_context: true, owns_constitutional_policy: false, owns_authority: false, owns_standing: false, owns_restrictions: false, owns_identity: false, owns_long_term_memory: false, pcc_separation_verified: true, operational_not_constitutional: true });
    expect(result.readiness.no_constitutional_policy_stored).toBe(true);
    expect(result.readiness.no_authority_decisions_made).toBe(true);
    expect(result.readiness.no_trust_standing_maintained).toBe(true);
    expect(result.readiness.no_restriction_evaluation_performed).toBe(true);
    expect(result.readiness.pcc_separation_validated).toBe(true);
    expect(runWaveSixPersonalOperationalContext({ scenario: "AUTHORITY_DECISION_MADE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixPersonalOperationalContext({ scenario: "LONG_TERM_MEMORY_OWNERSHIP_ASSUMED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixPersonalOperationalContext({ scenario: failure });
    const validation = validateWaveSixPersonalOperationalContext(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixPersonalOperationalContext({ scenario: failure });
    const validation = validateWaveSixPersonalOperationalContext(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixPersonalOperationalContext({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixPersonalOperationalContext({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixPersonalOperationalContext({ scenario: "PERSONAL_OPERATIONAL_CONTEXT_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixPersonalOperationalContext(notQualified).valid).toBe(false);
  });
});
