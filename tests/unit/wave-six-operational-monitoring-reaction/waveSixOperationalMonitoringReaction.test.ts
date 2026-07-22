import { describe, expect, it } from "vitest";

import { getWaveSixOperationalMonitoringReactionBundle, replayWaveSixOperationalMonitoringReaction, runWaveSixOperationalMonitoringReaction, validateWaveSixOperationalMonitoringReaction } from "@/services/wave-six-operational-monitoring-reaction";
import type { WaveSixOperationalMonitoringReactionFailure } from "@/types/wave-six-operational-monitoring-reaction";

const conditionalFailures = ["OBSERVATION_SERVICE_MISSING", "ORCHESTRATION_EVENTS_NOT_OBSERVED", "DEPENDENCY_EVENTS_NOT_OBSERVED", "PROVIDER_EVENTS_NOT_OBSERVED", "LIFECYCLE_TRANSITIONS_NOT_OBSERVED", "SCHEDULING_EVENTS_NOT_OBSERVED", "TIMEOUT_EVENTS_NOT_OBSERVED", "COMPLETION_EVENTS_NOT_OBSERVED", "CORRELATION_ENGINE_MISSING", "RELATED_REQUESTS_NOT_CORRELATED", "DEPENDENCY_FAILURES_NOT_CORRELATED", "SCHEDULING_ACTIVITY_NOT_CORRELATED", "PROVIDER_RESPONSES_NOT_CORRELATED", "TIMEOUT_CHAINS_NOT_CORRELATED", "SUPERSESSION_CHAINS_NOT_CORRELATED", "STATE_RECORDING_SERVICE_MISSING", "STATE_HISTORY_INCOMPLETE", "STATE_LINEAGE_MISSING", "DISPOSITION_RECORDING_SERVICE_MISSING", "DISPOSITION_HISTORY_INCOMPLETE", "REACTION_AUTHORIZATION_ENGINE_MISSING", "AUTHORIZING_PROVIDER_MISSING", "AUTHORIZING_CONTRACT_MISSING", "CONTRACT_VERSION_MISSING", "AUTHORIZATION_RULE_MISSING", "TRIGGERING_OBSERVATION_MISSING", "REACTION_ENGINE_MISSING", "AUTHORIZED_REACTION_NOT_EVIDENCED", "DEFERRED_EXECUTION_INVALID", "OPERATOR_NOTIFICATION_INVALID", "SUSPEND_SCHEDULING_INVALID", "CANCEL_EXPIRED_REQUESTS_INVALID", "SUPERSEDE_PENDING_REQUESTS_INVALID", "AUTHORIZED_REQUEST_CREATION_INVALID", "REACTION_AUDIT_SERVICE_MISSING", "AUDIT_RECORD_MISSING", "AUTHORIZATION_EVIDENCE_MISSING", "REACTION_LINEAGE_MISSING", "OPERATIONAL_DASHBOARD_MISSING", "CORRELATION_REPORTS_MISSING", "REACTION_REGISTRY_MISSING", "REQUEST_TIMELINE_REPORTS_MISSING"] as const satisfies readonly WaveSixOperationalMonitoringReactionFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "W6_2_DEPENDENCY_COORDINATION_INVALID", "W6_3_PERSONAL_OPERATIONAL_CONTEXT_INVALID", "W6_4_OPERATIONAL_OPTIMIZATION_INVALID", "W6_5_PROVIDER_CONSUMPTION_FRAMEWORK_INVALID", "W6_6_OPERATIONAL_STATE_DISPOSITION_INVALID", "OBSERVATION_MUTABLE", "CORRELATION_NONDETERMINISTIC", "STATE_RECORDING_MUTABLE", "DISPOSITION_NOT_AUTHORITATIVE_PROVIDER", "DISPOSITION_INVENTED", "DISPOSITION_RECORDING_MUTABLE", "PROVIDER_CONTRACT_NOT_VALIDATED", "REQUEST_ELIGIBILITY_NOT_VALIDATED", "REPLAY_CONSISTENCY_NOT_VALIDATED", "UNAUTHORIZED_REACTION_EXECUTED", "AUDIT_HISTORY_MUTABLE", "AUDIT_REPLAY_DIVERGED", "AUTONOMOUS_DECISION_MADE", "PROVIDER_BUSINESS_LOGIC_OWNED", "CAF_OUTCOME_REINTERPRETED", "TRUST_STANDING_MODIFIED", "POLICY_MODIFIED", "ADVISORY_AUTHORITY_EXERCISED", "PROVIDER_CONTRACT_DEFINITION_OWNED", "PROVIDER_RETRY_LOGIC_OWNED", "CONSTITUTIONAL_AUTHORITY_EXERCISED", "DENIED_REQUEST_RETRIED", "PROVIDER_DECISION_MODIFIED", "ADVISORY_DISPOSITION_ASSIGNED", "PROVIDER_AUTHORITY_BYPASSED", "PROVIDER_EVENT_FABRICATED", "IMPLICIT_RETRY_GENERATED", "UNAUTHORIZED_REQUEST_CREATED", "MONITORING_REPLAY_DIVERGED", "CORRELATION_REPLAY_DIVERGED", "REACTION_REPLAY_DIVERGED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixOperationalMonitoringReactionFailure[];

describe("Wave 6.7 Operational Monitoring and Reaction", () => {
  it("publishes the operational monitoring and reaction doctrine", () => {
    const bundle = getWaveSixOperationalMonitoringReactionBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-operational-monitoring-reaction/w6.7", provider_authority_required: true, deterministic_monitoring_required: true, immutable_recording_required: true, reaction_authorization_required: true, unauthorized_reactions_fail_closed: true, autonomous_decisions_prohibited: true, replay_identical_monitoring_required: true, qualification_gate: "W6.7 Operational Monitoring and Reaction Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W6.1 through W6.6", () => {
    const first = runWaveSixOperationalMonitoringReaction({ seed: "deterministic" });
    const second = runWaveSixOperationalMonitoringReaction({ seed: "deterministic" });

    expect(first.operational_orchestration_ref).toBe("wave-six-operational-orchestration/w6.1");
    expect(first.dependency_coordination_ref).toBe("wave-six-dependency-service-coordination/w6.2");
    expect(first.personal_operational_context_ref).toBe("wave-six-personal-operational-context/w6.3");
    expect(first.operational_optimization_ref).toBe("wave-six-operational-optimization/w6.4");
    expect(first.provider_consumption_framework_ref).toBe("wave-six-provider-consumption-framework/w6.5");
    expect(first.operational_state_disposition_ref).toBe("wave-six-operational-state-disposition-management/w6.6");
    expect(first.provides).toEqual(["operational-dashboard", "event-correlation-reports", "reaction-audit-records", "observation-registry", "correlation-registry", "operational-reaction-registry", "operational-monitoring-evidence", "request-timeline-reports"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixOperationalMonitoringReaction(first).valid).toBe(true);
    expect(replayWaveSixOperationalMonitoringReaction()).toBe(true);
  });

  it("observes and correlates operational events deterministically", () => {
    const result = runWaveSixOperationalMonitoringReaction();

    expect(result.observation_correlation).toMatchObject({ continuous_monitoring: true, orchestration_events: true, dependency_events: true, provider_events: true, lifecycle_transitions: true, scheduling_events: true, timeout_events: true, completion_events: true, observation_records: true, observations_immutable: true, related_requests: true, dependency_failures: true, scheduling_activity: true, provider_responses: true, timeout_chains: true, supersession_chains: true, correlation_groups: true, correlation_evidence: true, deterministic_correlation: true });
    expect(result.readiness.continuous_monitoring_operational).toBe(true);
    expect(result.readiness.event_correlation_deterministic).toBe(true);
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "CORRELATION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("records immutable state and authoritative provider dispositions", () => {
    const result = runWaveSixOperationalMonitoringReaction();

    expect(result.state_disposition_recording).toMatchObject({ request_state_changes: true, timestamps: true, originating_event: true, triggering_authority: true, causal_lineage: true, immutable_state_history: true, terminal_dispositions: true, completed: true, cancelled: true, failed: true, not_authorized: true, superseded: true, expired: true, authoritative_provider_origin: true, no_invented_dispositions: true, immutable_disposition_history: true });
    expect(result.readiness.state_recording_immutable).toBe(true);
    expect(result.readiness.disposition_recording_immutable).toBe(true);
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "DISPOSITION_INVENTED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("executes only provider-authorized operational reactions", () => {
    const result = runWaveSixOperationalMonitoringReaction();

    expect(result.reaction_authorization_execution).toMatchObject({ provider_contract: true, authorized_reaction: true, dependency_status: true, request_eligibility: true, replay_consistency: true, authorizing_provider: true, authorizing_contract: true, contract_version: true, authorization_rule: true, triggering_observation: true, authorized_reaction_decision: true, deferred_execution: true, operator_notification: true, suspend_scheduling: true, cancel_expired_requests: true, supersede_pending_requests: true, create_authorized_requests: true, reaction_evidence: true, unauthorized_reactions_fail_closed: true });
    expect(result.readiness.provider_authorized_reactions_execute).toBe(true);
    expect(result.readiness.unauthorized_reactions_fail_closed).toBe(true);
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "UNAUTHORIZED_REACTION_EXECUTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "PROVIDER_CONTRACT_NOT_VALIDATED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("produces immutable replayable audit evidence and runtime reports", () => {
    const result = runWaveSixOperationalMonitoringReaction();

    expect(result.audit_evidence_reports).toMatchObject({ triggering_event: true, authorization_evidence: true, executed_reaction: true, resulting_state: true, resulting_disposition: true, replay_identifiers: true, observation_reference: true, correlation_reference: true, state_before: true, state_after: true, disposition_before: true, disposition_after: true, audit_timestamp: true, immutable_audit_history: true, reaction_lineage: true, operational_dashboard: true, event_correlation_reports: true, reaction_audit_records: true, observation_registry: true, correlation_registry: true, operational_reaction_registry: true, monitoring_evidence: true, request_timeline_reports: true, audit_replayable: true });
    expect(result.readiness.dashboards_authoritative).toBe(true);
    expect(result.readiness.audit_records_immutable_replayable).toBe(true);
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "AUDIT_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("prohibits autonomous decisions policy trust advisory retry and fabricated provider events", () => {
    const result = runWaveSixOperationalMonitoringReaction();

    expect(result.monitoring_reaction_boundary).toMatchObject({ provider_authority_required: true, deterministic_monitoring: true, immutable_recording: true, no_autonomous_operational_decisions: true, provider_business_logic_owned: false, caf_execution_outcomes_owned: false, trust_decisions_owned: false, policy_evaluation_owned: false, advisory_generation_owned: false, provider_contract_definitions_owned: false, provider_retry_logic_owned: false, constitutional_authority_owned: false, denied_requests_retried: false, caf_outcomes_reinterpreted: false, trust_standing_modified: false, policy_modified: false, advisory_dispositions_assigned: false, provider_authority_bypassed: false, provider_events_fabricated: false, implicit_retries_generated: false, unauthorized_requests_created: false });
    expect(result.readiness.provider_authorized_boundary_validated).toBe(true);
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "AUTONOMOUS_DECISION_MADE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalMonitoringReaction({ scenario: "PROVIDER_EVENT_FABRICATED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixOperationalMonitoringReaction({ scenario: failure });
    const validation = validateWaveSixOperationalMonitoringReaction(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixOperationalMonitoringReaction({ scenario: failure });
    const validation = validateWaveSixOperationalMonitoringReaction(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixOperationalMonitoringReaction({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixOperationalMonitoringReaction({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixOperationalMonitoringReaction({ scenario: "OPERATIONAL_MONITORING_REACTION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixOperationalMonitoringReaction(notQualified).valid).toBe(false);
  });
});
