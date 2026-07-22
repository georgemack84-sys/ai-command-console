import { describe, expect, it } from "vitest";

import { getWaveSixContinuousEcosystemActivationBundle, replayWaveSixContinuousEcosystemActivation, runWaveSixContinuousEcosystemActivation, validateWaveSixContinuousEcosystemActivation } from "@/services/wave-six-continuous-ecosystem-activation";
import type { WaveSixContinuousEcosystemActivationFailure } from "@/types/wave-six-continuous-ecosystem-activation";

const conditionalFailures = ["ACTIVATION_MANAGER_MISSING", "STARTUP_SEQUENCING_MISSING", "DEPENDENCY_VERIFICATION_MISSING", "READINESS_VALIDATION_MISSING", "ACTIVATION_COMPLETION_MISSING", "ACTIVATION_EVIDENCE_MISSING", "PROGRAM_1_NOT_VALIDATED", "PROGRAM_2_NOT_VALIDATED", "PROGRAM_3_NOT_VALIDATED", "PROGRAM_4_NOT_VALIDATED", "PROGRAM_5_NOT_VALIDATED", "PROGRAM_6_NOT_VALIDATED", "ECOSYSTEM_OPERATIONAL_NOT_DECLARED", "LIFECYCLE_COORDINATOR_MISSING", "STARTUP_NOT_COORDINATED", "RUNNING_STATE_MISSING", "MAINTENANCE_NOT_COORDINATED", "DEGRADED_OPERATION_NOT_COORDINATED", "SHUTDOWN_NOT_COORDINATED", "RESTART_NOT_COORDINATED", "HEALTH_AGGREGATOR_MISSING", "INFRASTRUCTURE_HEALTH_MISSING", "APPLICATION_HEALTH_MISSING", "TRUST_HEALTH_MISSING", "ORCHESTRATION_HEALTH_MISSING", "PROVING_HEALTH_MISSING", "HEALTH_TRENDS_MISSING", "STATUS_PUBLISHER_MISSING", "AUTHORITATIVE_STATE_MISSING", "ACTIVE_SERVICES_MISSING", "DEGRADED_SERVICES_MISSING", "UNAVAILABLE_SERVICES_MISSING", "OPERATIONAL_ALERTS_MISSING", "COORDINATION_SERVICE_MISSING", "SERVICE_COORDINATION_MISSING", "READINESS_SYNCHRONIZATION_MISSING", "DEPENDENCY_COORDINATION_MISSING", "CONTINUOUS_MONITOR_MISSING", "SERVICE_AVAILABILITY_NOT_MONITORED", "DEPENDENCY_CHANGES_NOT_MONITORED", "OPERATIONAL_EVENTS_NOT_MONITORED", "RECOVERY_COORDINATION_MISSING", "ECOSYSTEM_OPERATIONS_CENTER_MISSING", "CONTINUOUS_OPERATIONS_DASHBOARD_MISSING", "ECOSYSTEM_HEALTH_REPORTS_MISSING", "OPERATIONAL_STATUS_REPORTS_MISSING"] as const satisfies readonly WaveSixContinuousEcosystemActivationFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "W6_2_DEPENDENCY_COORDINATION_INVALID", "W6_3_PERSONAL_OPERATIONAL_CONTEXT_INVALID", "W6_4_OPERATIONAL_OPTIMIZATION_INVALID", "W6_5_PROVIDER_CONSUMPTION_FRAMEWORK_INVALID", "W6_6_OPERATIONAL_STATE_DISPOSITION_INVALID", "W6_7_OPERATIONAL_MONITORING_REACTION_INVALID", "PROGRAM_ACTIVATION_ORDER_INVALID", "LIFECYCLE_TRANSITION_NONDETERMINISTIC", "LIFECYCLE_EVIDENCE_MUTABLE", "HEALTH_AGGREGATION_NONDETERMINISTIC", "STATUS_PUBLICATION_NONDETERMINISTIC", "RECOVERY_VIOLATES_CONSTITUTIONAL_AUTHORITY", "RECOVERY_VIOLATES_PROVIDER_AUTHORITY", "RECOVERY_REPLAY_DIVERGED", "REPORTS_NONDETERMINISTIC", "CONSTITUTIONAL_POLICY_MODIFIED", "TRUST_DECISION_MODIFIED", "PROVIDER_CONTRACT_MODIFIED", "ORCHESTRATION_EXECUTION_ALTERED", "MISSION_CONTROL_RECOMMENDATION_EXECUTED", "PROVIDER_AUTHORITY_OVERRIDDEN", "CAF_GOVERNANCE_BYPASSED", "CONSTITUTIONAL_EVIDENCE_REINTERPRETED", "OPERATIONAL_LINEAGE_CHANGED", "AUDIT_RECORD_ALTERED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixContinuousEcosystemActivationFailure[];

describe("Wave 6.8 Continuous Ecosystem Activation", () => {
  it("publishes the continuous ecosystem activation doctrine", () => {
    const bundle = getWaveSixContinuousEcosystemActivationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-continuous-ecosystem-activation/w6.8", coordinated_visibility_not_authority_replacement: true, canonical_program_order_required: true, deterministic_startup_shutdown_required: true, continuous_health_monitoring_required: true, immutable_lifecycle_evidence_required: true, recovery_authority_boundaries_required: true, reproducible_reporting_required: true, qualification_gate: "W6.8 Continuous Ecosystem Activation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W6.1 through W6.7", () => {
    const first = runWaveSixContinuousEcosystemActivation({ seed: "deterministic" });
    const second = runWaveSixContinuousEcosystemActivation({ seed: "deterministic" });

    expect(first.upstream_refs).toContain("wave-six-operational-monitoring-reaction/w6.7");
    expect(first.upstream_refs).toContain("program-5-trust-health");
    expect(first.provides).toEqual(["ecosystem-operations-center", "continuous-operations-dashboard", "ecosystem-health-reports", "operational-status-reports", "ecosystem-activation-registry", "ecosystem-lifecycle-registry", "ecosystem-operational-state"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixContinuousEcosystemActivation(first).valid).toBe(true);
    expect(replayWaveSixContinuousEcosystemActivation()).toBe(true);
  });

  it("activates programs in canonical dependency order with replayable startup and shutdown", () => {
    const result = runWaveSixContinuousEcosystemActivation();

    expect(result.activation_manager.canonical_program_order).toEqual(["Program 1", "Program 2", "Program 3", "Program 5", "Program 4", "Program 6", "ECOSYSTEM_OPERATIONAL"]);
    expect(result.activation_manager).toMatchObject({ activation_service: true, startup_coordinator: true, activation_registry: true, startup_sequencing: true, dependency_verification: true, readiness_validation: true, activation_completion: true, activation_evidence: true, deterministic_startup: true, deterministic_shutdown: true });
    expect(result.readiness.all_programs_activated_in_canonical_order).toBe(true);
    expect(runWaveSixContinuousEcosystemActivation({ scenario: "PROGRAM_ACTIVATION_ORDER_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("coordinates readiness across all six Civitas programs", () => {
    const result = runWaveSixContinuousEcosystemActivation();

    expect(result.program_readiness).toMatchObject({ program_1_capability_registry: true, program_1_capability_status: true, program_1_dependency_registry: true, program_2_infrastructure_health: true, program_2_platform_services: true, program_2_event_infrastructure: true, program_2_registry_services: true, program_3_caf_status: true, program_3_agent_health: true, program_3_orchestration_health: true, program_4_application_status: true, program_4_mission_status: true, program_4_operational_services: true, program_5_trust_health: true, program_5_trust_services: true, program_5_constitutional_status: true, program_6_proving_status: true, program_6_qualification_status: true, program_6_validation_services: true, cross_program_dependencies_validated: true, readiness_synchronized: true });
    expect(result.readiness.cross_program_dependencies_continuously_validated).toBe(true);
  });

  it("maintains lifecycle state and ecosystem health deterministically", () => {
    const result = runWaveSixContinuousEcosystemActivation();

    expect(result.lifecycle_health_status.states).toEqual(["NOT_INITIALIZED", "INITIALIZING", "VALIDATING", "ACTIVATING", "OPERATIONAL", "DEGRADED", "MAINTENANCE", "RECOVERING", "SHUTTING_DOWN", "TERMINATED"]);
    expect(result.lifecycle_health_status).toMatchObject({ lifecycle_coordinator: true, lifecycle_registry: true, bootstrap: true, readiness_validation: true, program_activation: true, ecosystem_activation: true, continuous_operation: true, health_monitoring: true, coordinated_recovery: true, maintenance: true, shutdown: true, deterministic_transitions: true, immutable_transition_evidence: true, health_aggregator: true, infrastructure_health: true, application_health: true, trust_health: true, orchestration_health: true, proving_health: true, overall_ecosystem_health: true, health_trends: true, operational_summaries: true });
    expect(runWaveSixContinuousEcosystemActivation({ scenario: "LIFECYCLE_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("publishes authoritative status dashboards and deterministic reports", () => {
    const result = runWaveSixContinuousEcosystemActivation();

    expect(result.operations_monitoring_reporting).toMatchObject({ status_publisher: true, single_authoritative_operational_status: true, current_operational_state: true, active_services: true, degraded_services: true, unavailable_services: true, operational_alerts: true, coordination_service: true, service_coordination: true, activation_sequencing: true, dependency_coordination: true, readiness_synchronization: true, continuous_operations_monitor: true, operational_changes: true, service_availability: true, dependency_changes: true, operational_events: true, lifecycle_transitions: true, ecosystem_operations_center: true, continuous_operations_dashboard: true, ecosystem_health_reports: true, operational_status_reports: true, deterministic_reports: true });
    expect(result.readiness.operations_center_unified_visibility).toBe(true);
    expect(result.readiness.reports_reproducible).toBe(true);
    expect(runWaveSixContinuousEcosystemActivation({ scenario: "REPORTS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("coordinates recovery without replacing program authority", () => {
    const result = runWaveSixContinuousEcosystemActivation();

    expect(result.activation_recovery_boundary).toMatchObject({ recovery_coordination: true, deterministic_recovery: true, operational_status_to_mission_control: true, modifies_constitutional_policy: false, modifies_trust_decisions: false, modifies_provider_contracts: false, alters_orchestration_execution: false, executes_mission_control_recommendations: false, overrides_provider_authority: false, bypasses_caf_governance: false, reinterprets_constitutional_evidence: false, changes_operational_lineage: false, alters_audit_records: false, does_not_replace_program_authority: true });
    expect(result.readiness.recovery_authority_preserved).toBe(true);
    expect(runWaveSixContinuousEcosystemActivation({ scenario: "PROVIDER_AUTHORITY_OVERRIDDEN" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixContinuousEcosystemActivation({ scenario: "AUDIT_RECORD_ALTERED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixContinuousEcosystemActivation({ scenario: failure });
    const validation = validateWaveSixContinuousEcosystemActivation(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixContinuousEcosystemActivation({ scenario: failure });
    const validation = validateWaveSixContinuousEcosystemActivation(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixContinuousEcosystemActivation({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixContinuousEcosystemActivation({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixContinuousEcosystemActivation({ scenario: "CONTINUOUS_ECOSYSTEM_ACTIVATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixContinuousEcosystemActivation(notQualified).valid).toBe(false);
  });
});
