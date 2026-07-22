import { describe, expect, it } from "vitest";

import { getWaveFiveProvingGroundBundle, replayWaveFiveProvingGround, runWaveFiveProvingGround, validateWaveFiveProvingGround } from "@/services/wave-five-proprium-proving-ground";
import type { WaveFiveProvingGroundFailure } from "@/types/wave-five-proprium-proving-ground";

const conditionalFailures = ["SANDBOX_RUNTIME_MISSING", "RUNTIME_LIFECYCLE_INVALID", "DISPOSABLE_RUNTIME_MISSING", "SYNTHETIC_DATA_ENGINE_MISSING", "SEEDED_RANDOMNESS_MISSING", "SCALE_CONFIGURATION_MISSING", "SIMULATION_ENGINE_MISSING", "ACCELERATED_TIME_INVALID", "BRANCHING_SCENARIOS_MISSING", "SCENARIO_COMPARISON_MISSING", "FAILURE_INJECTION_MISSING", "RESILIENCE_EVIDENCE_MISSING", "RECOVERY_EVIDENCE_MISSING", "FAILURE_LINEAGE_MISSING", "REPLAY_VALIDATION_MISSING", "BEHAVIORAL_VALIDATION_MISSING", "EVIDENCE_VERIFICATION_MISSING", "PROMOTION_EVIDENCE_MISSING", "SCENARIO_REGISTRY_MISSING", "VALIDATION_DASHBOARD_MISSING"] as const satisfies readonly WaveFiveProvingGroundFailure[];
const notQualifiedFailures = ["P6_PROVING_PROGRAM_INVALID", "W5_APEX_INVALID", "SANDBOX_ISOLATION_INVALID", "SANDBOX_EXECUTION_NONDETERMINISTIC", "SYNTHETIC_DATA_NONREPRODUCIBLE", "SYNTHETIC_DATA_PRIVACY_BREACH", "SIMULATION_NONREPEATABLE", "FAILURE_INJECTION_UNCONTROLLED", "REPLAY_ENGINE_DUPLICATED", "REPLAY_DIVERGENCE_UNEXPLAINED", "PROMOTION_EVIDENCE_MUTABLE", "PROMOTION_RECOMMENDATION_NOT_ADVISORY", "DEPLOYMENT_ORCHESTRATION_ASSUMED", "RELEASE_ROUTING_ASSUMED", "PRODUCTION_ROUTING_ASSUMED", "PBG_RESPONSIBILITY_ASSUMED", "TEST_LINEAGE_INCOMPLETE", "IMMUTABLE_VALIDATION_EVIDENCE_MISSING", "TESTING_OWNERSHIP_NOT_AUTHORITATIVE", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveProvingGroundFailure[];

describe("Wave 5.14 Proprium Proving Ground", () => {
  it("publishes the Proprium Proving Ground doctrine", () => {
    const bundle = getWaveFiveProvingGroundBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-proprium-proving-ground/w5.14", owns_proprium_testing: true, deterministic_validation_required: true, synthetic_data_privacy_required: true, replay_validation_consumes_existing_platform: true, promotion_evidence_advisory_only: true, pbg_ownership_prohibited: true, deployment_orchestration_prohibited: true, immutable_validation_evidence_required: true, qualification_gate: "W5.14 Proprium Proving Ground Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Program 6 proving qualification plus W5 APEX", () => {
    const first = runWaveFiveProvingGround({ seed: "deterministic" });
    const second = runWaveFiveProvingGround({ seed: "deterministic" });

    expect(first.proving_program_ref).toBe("proving-program-qualification/v6.18");
    expect(first.upstream_refs).toEqual(["proving-program-qualification/v6.18", "wave-five-apex/w5.13", "wave-five-aurora/w5.12", "wave-five-learning-stevn/w5.11", "wave-five-writing-publisher-os/w5.10", "wave-five-research/w5.9", "wave-five-health/w5.8", "wave-five-finance/w5.7", "wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1"]);
    expect(first.provides).toEqual(["sandboxed-runtime", "synthetic-data-engine", "simulation-engine", "failure-injection-framework", "replay-validation-service", "promotion-evidence-service", "scenario-registry", "validation-dashboard"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveProvingGround(first).valid).toBe(true);
    expect(replayWaveFiveProvingGround()).toBe(true);
  });

  it("executes isolated deterministic disposable sandboxes", () => {
    const result = runWaveFiveProvingGround();

    expect(result.sandbox).toMatchObject({ application_validation: true, capability_testing: true, integration_testing: true, workflow_execution: true, runtime_verification: true, policy_validation: true, tenant_isolation: true, deterministic_execution: true, repeatable_environments: true, disposable_runtimes: true, environment_provisioning: true, runtime_lifecycle: true, cleanup: true, execution_metadata: true });
    expect(runWaveFiveProvingGround({ scenario: "SANDBOX_EXECUTION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("generates privacy-preserving synthetic data and repeatable simulations", () => {
    const result = runWaveFiveProvingGround();

    expect(result.synthetic_simulation).toMatchObject({ synthetic_users: true, synthetic_organizations: true, synthetic_missions: true, synthetic_projects: true, synthetic_calendars: true, synthetic_financial_data: true, synthetic_health_data: true, synthetic_knowledge: true, synthetic_communication: true, synthetic_activity_streams: true, privacy_preserving_generation: true, deterministic_datasets: true, configurable_scale: true, repeatable_generation: true, seeded_randomness: true, user_behavior: true, workflow_execution: true, mission_progression: true, scheduling: true, planning: true, collaboration: true, approvals: true, governance_events: true, trust_decisions: true, application_interactions: true, deterministic_simulation: true, accelerated_time: true, branching_scenarios: true, scenario_comparison: true });
    expect(runWaveFiveProvingGround({ scenario: "SYNTHETIC_DATA_PRIVACY_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "SIMULATION_NONREPEATABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("controls failure injection and consumes existing replay services", () => {
    const result = runWaveFiveProvingGround();

    expect(result.failure_replay).toMatchObject({ service_failures: true, timeout_conditions: true, degraded_dependencies: true, messaging_failures: true, storage_failures: true, authentication_failures: true, authorization_failures: true, network_interruption: true, policy_violations: true, invalid_inputs: true, resource_exhaustion: true, controlled_injection: true, resilience_evidence: true, recovery_evidence: true, failure_lineage: true, replay_verification: true, replay_comparison: true, divergence_detection: true, behavioral_validation: true, workflow_validation: true, mission_validation: true, evidence_verification: true, consumes_existing_replay: true, no_new_replay_engine: true });
    expect(runWaveFiveProvingGround({ scenario: "FAILURE_INJECTION_UNCONTROLLED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "REPLAY_ENGINE_DUPLICATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "REPLAY_DIVERGENCE_UNEXPLAINED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("produces immutable advisory promotion evidence without PBG or deployment ownership", () => {
    const result = runWaveFiveProvingGround();

    expect(result.promotion_evidence).toMatchObject({ functional_validation: true, regression_validation: true, governance_validation: true, constitutional_validation: true, replay_validation: true, performance_validation: true, resilience_validation: true, security_validation: true, dependency_validation: true, evidence_aggregation: true, readiness_scoring: true, validation_summaries: true, promotion_packages: true, immutable_evidence: true, traceable: true, advisory_only: true, no_deployment_orchestration: true, no_release_routing: true, no_production_routing: true, no_pbg_ownership: true });
    expect(runWaveFiveProvingGround({ scenario: "PROMOTION_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "PBG_RESPONSIBILITY_ASSUMED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "DEPLOYMENT_ORCHESTRATION_ASSUMED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("owns testing lineage, scenario registry, dashboard, and validation evidence", () => {
    const result = runWaveFiveProvingGround();

    expect(result.registry_dashboard).toMatchObject({ sandbox_environment_model: true, simulation_scenario_model: true, failure_injection_event_model: true, promotion_evidence_package_model: true, scenario_registry: true, validation_dashboard: true, promotion_readiness_reports: true, validation_reports: true, replay_validation_reports: true, simulation_reports: true, failure_reports: true, complete_testing_lineage: true, immutable_validation_evidence: true, testing_authority_owned: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, p6_proving_ready: true, apex_ready: true, sandboxed_runtimes_deterministic: true, synthetic_datasets_reproducible_private: true, simulations_repeatable: true, failure_injection_validates_resilience: true, replay_validation_confirms_determinism: true, promotion_evidence_complete_immutable_traceable: true, every_test_linked_to_lineage: true, testing_ownership_authoritative: true, no_pbg_responsibility_assumed: true, promotion_recommendations_advisory: true });
    expect(runWaveFiveProvingGround({ scenario: "TEST_LINEAGE_INCOMPLETE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveProvingGround({ scenario: "TESTING_OWNERSHIP_NOT_AUTHORITATIVE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveProvingGround({ scenario: failure });
    const validation = validateWaveFiveProvingGround(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveProvingGround({ scenario: failure });
    const validation = validateWaveFiveProvingGround(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveProvingGround({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveProvingGround({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveProvingGround({ scenario: "PROVING_GROUND_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveProvingGround(notQualified).valid).toBe(false);
  });
});
