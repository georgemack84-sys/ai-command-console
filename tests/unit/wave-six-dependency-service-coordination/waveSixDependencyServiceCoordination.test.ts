import { describe, expect, it } from "vitest";

import { getWaveSixDependencyServiceCoordinationBundle, replayWaveSixDependencyServiceCoordination, runWaveSixDependencyServiceCoordination, validateWaveSixDependencyServiceCoordination } from "@/services/wave-six-dependency-service-coordination";
import type { WaveSixDependencyServiceCoordinationFailure } from "@/types/wave-six-dependency-service-coordination";

const conditionalFailures = ["DEPENDENCY_REGISTRY_MISSING", "SERVICE_RELATIONSHIP_CATALOG_MISSING", "PROVIDER_AVAILABILITY_MONITOR_MISSING", "PROVIDER_STATUS_REGISTRY_MISSING", "DEPENDENCY_OBSERVATION_ENGINE_MISSING", "PROVIDER_TRANSITIONS_NOT_TRACKED", "DEPENDENCY_LATENCY_MISSING", "ORCHESTRATION_READINESS_ENGINE_MISSING", "DEPENDENCY_COORDINATION_ENGINE_MISSING", "OPERATIONAL_READINESS_ASSESSMENT_MISSING", "READINESS_REPORT_INCOMPLETE", "PROVIDER_RESPONSIVENESS_MISSING", "DEPENDENCY_FAILURE_ANALYSIS_MISSING", "READINESS_EVIDENCE_MISSING"] as const satisfies readonly WaveSixDependencyServiceCoordinationFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "DEPENDENCY_GRAPH_NONDETERMINISTIC", "UNMANAGED_DEPENDENCY_DISCOVERED", "MISSING_HEALTH_INFORMATION_ASSUMED_AVAILABLE", "UNKNOWN_DEPENDENCY_NOT_FAIL_CLOSED", "FAILURE_PROPAGATION_INVALID", "RECOVERY_DETECTION_INVALID", "READINESS_NONDETERMINISTIC", "REQUIRED_DEPENDENCY_UNAVAILABLE_READY", "GOVERNANCE_SERVICE_UNAVAILABLE_READY", "TRUST_SERVICE_UNAVAILABLE_READY", "MISSION_SERVICE_UNAVAILABLE_READY", "SERVICE_LIFECYCLE_MODIFIED", "DEPENDENCY_SEQUENCING_INVALID", "READINESS_PROPAGATION_INVALID", "DEPENDENCY_CONSISTENCY_INVALID", "MISSING_DEPENDENCY_NOT_DETECTED", "VERSION_INCOMPATIBILITY_NOT_DETECTED", "CIRCULAR_DEPENDENCY_NOT_DETECTED", "DEPENDENCY_CASCADE_NOT_DETECTED", "IMPACT_ASSESSMENT_NONDETERMINISTIC", "READINESS_EVIDENCE_MUTABLE", "DEPENDENCY_LINEAGE_INCOMPLETE", "REPLAY_DIVERGED", "W6_1_BYPASSES_READINESS_INTELLIGENCE", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixDependencyServiceCoordinationFailure[];

describe("Wave 6.2 Dependency and Service Coordination", () => {
  it("publishes the dependency coordination doctrine", () => {
    const bundle = getWaveSixDependencyServiceCoordinationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-dependency-service-coordination/w6.2", observes_never_executes: true, registry_driven_discovery_required: true, deterministic_readiness_required: true, fail_closed_unknown_state_required: true, immutable_dependency_evidence_required: true, service_lifecycle_modification_prohibited: true, w6_1_consumes_readiness_decisions: true, qualification_gate: "W6.2 Dependency and Service Coordination Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W6.1 operational orchestration", () => {
    const first = runWaveSixDependencyServiceCoordination({ seed: "deterministic" });
    const second = runWaveSixDependencyServiceCoordination({ seed: "deterministic" });

    expect(first.operational_orchestration_ref).toBe("wave-six-operational-orchestration/w6.1");
    expect(first.provides).toEqual(["dependency-registry", "dependency-observation-engine", "provider-availability-monitor", "orchestration-readiness-engine", "dependency-coordination-engine", "dependency-failure-analyzer", "operational-readiness-service", "dependency-evidence-repository"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixDependencyServiceCoordination(first).valid).toBe(true);
    expect(replayWaveSixDependencyServiceCoordination()).toBe(true);
  });

  it("builds a registry-driven deterministic dependency graph", () => {
    const result = runWaveSixDependencyServiceCoordination();

    expect(result.dependency_registry.states).toEqual(["REGISTERED", "AVAILABLE", "DEGRADED", "UNAVAILABLE", "WAITING", "FAILED", "UNKNOWN"]);
    expect(result.dependency_registry).toMatchObject({ dependency_identities: true, service_relationships: true, consumer_provider_mappings: true, runtime_dependency_graph: true, version_awareness: true, required_optional_classification: true, dependency_metadata: true, cci_service_registry_source: true, unmanaged_dependencies_blocked: true, graph_deterministic: true });
    expect(runWaveSixDependencyServiceCoordination({ scenario: "UNMANAGED_DEPENDENCY_DISCOVERED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("monitors provider availability and fails closed for missing or unknown health", () => {
    const result = runWaveSixDependencyServiceCoordination();

    expect(result.provider_observation).toMatchObject({ availability_monitor: true, provider_status_registry: true, availability: true, connectivity: true, registration_status: true, runtime_heartbeat: true, capacity_status: true, health_endpoint_results: true, maintenance_state: true, dependency_state_tracking: true, provider_transitions: true, failure_propagation: true, recovery_detection: true, dependency_latency: true, registration_changes: true, dependency_events: true, dependency_timeline: true, observation_evidence: true, missing_health_fails_closed: true, unknown_state_not_ready: true });
    expect(runWaveSixDependencyServiceCoordination({ scenario: "MISSING_HEALTH_INFORMATION_ASSUMED_AVAILABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixDependencyServiceCoordination({ scenario: "UNKNOWN_DEPENDENCY_NOT_FAIL_CLOSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("evaluates orchestration readiness deterministically without modifying services", () => {
    const result = runWaveSixDependencyServiceCoordination();

    expect(result.readiness_coordination).toMatchObject({ readiness_engine: true, required_dependencies_available: true, required_services_healthy: true, runtime_reachable: true, governance_services_operational: true, trust_services_operational: true, mission_services_operational: true, readiness_state: "READY", deterministic_evaluation: true, dependency_coordination_engine: true, startup_ordering: true, shutdown_ordering: true, dependency_stabilization: true, recovery_coordination: true, dependency_synchronization: true, readiness_propagation: true, observes_only: true, never_starts_services: true, never_stops_services: true });
    expect(runWaveSixDependencyServiceCoordination({ scenario: "SERVICE_LIFECYCLE_MODIFIED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixDependencyServiceCoordination({ scenario: "READINESS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("produces readiness reports and deterministic failure impact analysis", () => {
    const result = runWaveSixDependencyServiceCoordination();

    expect(result.operational_readiness_failure_analysis).toMatchObject({ operational_readiness_assessment: true, service_availability: true, dependency_health: true, runtime_stability: true, provider_responsiveness: true, required_capability_availability: true, dependency_consistency: true, operational_readiness_report: true, readiness_evidence: true, readiness_timeline: true, dependency_failure_analysis: true, provider_failure: true, missing_dependency: true, dependency_timeout: true, registration_inconsistency: true, version_incompatibility: true, circular_dependency: true, dependency_cascade: true, deterministic_impact_assessment: true });
    expect(runWaveSixDependencyServiceCoordination({ scenario: "CIRCULAR_DEPENDENCY_NOT_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixDependencyServiceCoordination({ scenario: "IMPACT_ASSESSMENT_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("records immutable evidence and feeds W6.1 without direct dependency inspection", () => {
    const result = runWaveSixDependencyServiceCoordination();

    expect(result.evidence).toMatchObject({ dependency_snapshots: true, availability_snapshots: true, readiness_decisions: true, health_history: true, dependency_transitions: true, operational_evidence_lineage: true, dependency_evidence: true, availability_evidence: true, readiness_evidence: true, health_evidence: true, failure_evidence: true, recovery_evidence: true, dependency_lineage: true, operational_coordination_evidence: true, immutable: true, replayable: true, w6_1_consumes_readiness_decisions: true, w6_1_no_direct_dependency_inspection: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, dependency_registry_operational: true, runtime_dependency_graph_deterministic: true, provider_availability_monitored: true, dependency_observation_validated: true, orchestration_readiness_deterministic: true, dependency_coordination_operational: true, readiness_reports_correct: true, failure_propagation_validated: true, recovery_detection_verified: true, immutable_operational_evidence_recorded: true, replay_identical_readiness_decisions: true, w6_1_consumes_readiness_without_direct_inspection: true, operational_awareness_only: true });
    expect(runWaveSixDependencyServiceCoordination({ scenario: "W6_1_BYPASSES_READINESS_INTELLIGENCE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixDependencyServiceCoordination({ scenario: "READINESS_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixDependencyServiceCoordination({ scenario: failure });
    const validation = validateWaveSixDependencyServiceCoordination(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixDependencyServiceCoordination({ scenario: failure });
    const validation = validateWaveSixDependencyServiceCoordination(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveSixDependencyServiceCoordination({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixDependencyServiceCoordination({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixDependencyServiceCoordination({ scenario: "DEPENDENCY_SERVICE_COORDINATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixDependencyServiceCoordination(notQualified).valid).toBe(false);
  });
});
