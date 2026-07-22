import { describe, expect, it } from "vitest";

import { getWaveFiveCalendarTimeBundle, replayWaveFiveCalendarTime, runWaveFiveCalendarTime, validateWaveFiveCalendarTime } from "@/services/wave-five-calendar-time";
import type { WaveFiveCalendarTimeFailure } from "@/types/wave-five-calendar-time";

const conditionalFailures = ["CALENDAR_PLATFORM_MISSING", "CALENDAR_REGISTRY_MISSING", "CALENDAR_PERMISSIONS_MISSING", "CALENDAR_APIS_UNCERTIFIED", "EVENT_SERVICE_MISSING", "EVENT_LINEAGE_INCOMPLETE", "EVENT_UPDATES_UNGOVERNED", "RECURRING_EVENTS_UNSUPPORTED", "EVENT_METADATA_INVALID", "SCHEDULING_ENGINE_MISSING", "CONSTRAINT_EVALUATION_MISSING", "SCHEDULING_RULES_MISSING", "RESERVATION_PROCESSING_MISSING", "AVAILABILITY_MODEL_MISSING", "TIMEZONE_HANDLING_MISSING", "CAPACITY_WINDOWS_MISSING", "AVAILABILITY_POLICIES_MISSING", "CONFLICT_RESOLUTION_MISSING", "AUTHORITY_RESOLUTION_MISSING", "POLICY_RESOLUTION_MISSING", "ESCALATION_RULES_MISSING", "ALTERNATIVE_SCHEDULING_MISSING", "TIME_BUDGET_MISSING", "CAPACITY_PLANNING_MISSING", "WORKLOAD_DISTRIBUTION_MISSING", "TIME_ACCOUNTING_INACCURATE", "RESOURCE_SCHEDULING_MISSING", "RESOURCE_AVAILABILITY_MISSING", "RESERVATION_POLICIES_MISSING", "COORDINATION_SERVICE_MISSING", "MULTI_ATTENDEE_SCHEDULING_MISSING", "AGENT_COORDINATION_MISSING", "SCHEDULE_NEGOTIATION_MISSING", "CALENDAR_NOTIFICATIONS_MISSING", "REMINDER_POLICIES_MISSING", "NOTIFICATION_EVIDENCE_MISSING", "ESCALATION_NOTIFICATIONS_MISSING", "TIME_ANALYTICS_MISSING", "UTILIZATION_ANALYTICS_INVALID", "CAPACITY_ANALYSIS_MISSING", "TIME_ALLOCATION_ANALYTICS_MISSING", "SCHEDULING_EVIDENCE_MISSING", "RESERVATION_HISTORY_MISSING", "GOVERNANCE_AUTHORITY_MISSING", "PRIVACY_CONTROLS_MISSING", "RETENTION_POLICIES_MISSING"] as const satisfies readonly WaveFiveCalendarTimeFailure[];
const notQualifiedFailures = ["W5_PERSONAL_KNOWLEDGE_INVALID", "CALENDAR_IDENTITY_NONDETERMINISTIC", "SCHEDULING_NONDETERMINISTIC", "AVAILABILITY_MANUALLY_INFERRED", "CONFLICT_RESOLUTION_NONDETERMINISTIC", "TIME_BUDGETS_NOT_ENFORCED", "RESOURCE_RESERVATIONS_UNGOVERNED", "DELEGATED_SCHEDULING_UNGOVERNED", "SCHEDULING_EVIDENCE_MUTABLE", "REPLAY_DECISIONS_DIVERGED", "AUDIT_LINEAGE_INCOMPLETE", "AUTHORITY_BYPASS_DETECTED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveCalendarTimeFailure[];

describe("Wave 5.4 Calendar and Time", () => {
  it("publishes the calendar and time doctrine", () => {
    const bundle = getWaveFiveCalendarTimeBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-calendar-time/w5.4", time_is_governed_resource: true, calendar_is_authoritative_source: true, availability_is_computed: true, deterministic_conflict_resolution_required: true, immutable_scheduling_lineage_required: true, tenant_isolation_required: true, qualification_gate: "W5.4 Calendar and Time Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the Wave 5 personal knowledge stack", () => {
    const first = runWaveFiveCalendarTime({ seed: "deterministic" });
    const second = runWaveFiveCalendarTime({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1", "wave-five-application-portfolio-foundation/w5.0"]);
    expect(first.provides).toEqual(["calendar", "scheduling-engine", "availability-model", "conflict-resolution-engine", "time-budget-service", "resource-scheduler", "coordination-service", "notification-service", "time-analytics-engine", "scheduling-evidence-service", "calendar-governance-service"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveCalendarTime(first).valid).toBe(true);
    expect(replayWaveFiveCalendarTime()).toBe(true);
  });

  it("operates the canonical calendar and governed event service", () => {
    const result = runWaveFiveCalendarTime();

    expect(result.calendar).toMatchObject({ calendar_registry: true, calendar_identity: true, calendar_ownership: true, calendar_lifecycle: true, calendar_permissions: true, calendar_metadata: true, calendar_apis: true, canonical_authoritative_source: true, identities_deterministic: true, apis_certified: true });
    expect(result.events).toMatchObject({ event_creation: true, event_updates: true, event_cancellation: true, recurring_events: true, event_categories: true, event_priorities: true, event_status: true, event_metadata: true, governed_updates: true, lineage_complete: true });
    expect(runWaveFiveCalendarTime({ scenario: "CALENDAR_IDENTITY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("produces deterministic schedules from computed availability", () => {
    const result = runWaveFiveCalendarTime();

    expect(result.scheduling).toMatchObject({ intelligent_scheduling: true, constraint_evaluation: true, scheduling_rules: true, scheduling_optimization: true, priority_scheduling: true, reservation_processing: true, schedule_generation: true, deterministic: true, replayable: true });
    expect(result.availability).toMatchObject({ personal_availability: true, agent_availability: true, resource_availability: true, organization_availability: true, working_hours: true, time_zones: true, capacity_windows: true, availability_policies: true, computed_not_inferred: true, consistent_across_subjects: true });
    expect(runWaveFiveCalendarTime({ scenario: "SCHEDULING_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "AVAILABILITY_MANUALLY_INFERRED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("resolves conflicts deterministically and enforces time budgets", () => {
    const result = runWaveFiveCalendarTime();

    expect(result.conflicts).toMatchObject({ conflict_detection: true, resource_conflicts: true, calendar_conflicts: true, priority_resolution: true, authority_based_resolution: true, policy_resolution: true, escalation_rules: true, alternative_scheduling: true, deterministic: true, replayable: true });
    expect(result.time_budget).toMatchObject({ time_allocation: true, time_budgets: true, capacity_planning: true, workload_distribution: true, reserved_time: true, strategic_time: true, personal_time: true, organizational_time_accounting: true, budgets_enforced: true, accounting_accurate: true });
    expect(runWaveFiveCalendarTime({ scenario: "CONFLICT_RESOLUTION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "TIME_BUDGETS_NOT_ENFORCED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("governs resources, coordination, notifications, and analytics", () => {
    const result = runWaveFiveCalendarTime();

    expect(result.resources_coordination).toMatchObject({ meeting_rooms: true, equipment: true, virtual_resources: true, runtime_reservations: true, shared_assets: true, resource_calendars: true, reservation_policies: true, multi_attendee_scheduling: true, delegated_scheduling: true, agent_coordination: true, team_scheduling: true, cross_organization_coordination: true, schedule_negotiation: true, constitutionally_managed: true });
    expect(result.notifications_analytics).toMatchObject({ event_notifications: true, reminder_policies: true, schedule_updates: true, change_notifications: true, escalation_notifications: true, missed_event_alerts: true, calendar_utilization: true, meeting_analytics: true, capacity_analysis: true, schedule_efficiency: true, time_allocation_analytics: true, trend_analysis: true, notification_evidence: true, analytics_validated: true });
    expect(runWaveFiveCalendarTime({ scenario: "RESOURCE_RESERVATIONS_UNGOVERNED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "DELEGATED_SCHEDULING_UNGOVERNED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("captures immutable scheduling evidence and enforces governance authority", () => {
    const result = runWaveFiveCalendarTime();

    expect(result.evidence_governance).toMatchObject({ event_evidence: true, schedule_decisions: true, conflict_evidence: true, availability_evidence: true, reservation_history: true, replay_records: true, calendar_policies: true, scheduling_authority: true, permission_enforcement: true, privacy_controls: true, tenant_isolation: true, compliance_rules: true, retention_policies: true, immutable_evidence: true, audit_lineage_complete: true, authority_enforced: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, canonical_calendar_operational: true, deterministic_schedules: true, availability_validated: true, conflict_resolution_replayable: true, time_budgets_enforced: true, resource_reservations_governed: true, calendar_notifications_functioning: true, time_analytics_validated: true, scheduling_evidence_complete: true, replay_identical_scheduling_decisions: true, governance_authority_enforced: true, cross_tenant_isolation_validated: true, calendar_apis_certified: true });
    expect(runWaveFiveCalendarTime({ scenario: "SCHEDULING_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "REPLAY_DECISIONS_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "AUTHORITY_BYPASS_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveCalendarTime({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveCalendarTime({ scenario: failure });
    const validation = validateWaveFiveCalendarTime(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveCalendarTime({ scenario: failure });
    const validation = validateWaveFiveCalendarTime(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveCalendarTime({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveCalendarTime({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveCalendarTime({ scenario: "CALENDAR_TIME_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveCalendarTime(notQualified).valid).toBe(false);
  });
});
