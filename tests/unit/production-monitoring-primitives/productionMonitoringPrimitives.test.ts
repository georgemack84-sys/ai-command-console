import { describe, expect, it } from "vitest";

import { getProductionMonitoringPrimitivesBundle, replayProductionMonitoringPrimitives, runProductionMonitoringPrimitives, validateProductionMonitoringPrimitives } from "@/services/production-monitoring-primitives";
import type { ProductionMonitoringFailure } from "@/types/production-monitoring-primitives";

const conditionalFailures = ["OPERATIONAL_STATE_COLLECTOR_MISSING", "OPERATIONAL_REGISTRY_MISSING", "HEALTH_EVALUATION_ENGINE_MISSING", "HEALTH_REGISTRY_MISSING", "DEPENDENCY_HEALTH_MISSING", "AVAILABILITY_STATUS_MISSING", "DEGRADATION_DETECTION_MISSING", "RESOURCE_METRICS_COLLECTOR_MISSING", "CAPACITY_METRICS_MISSING", "EVENT_CORRELATION_ENGINE_MISSING", "TIMELINE_ENGINE_MISSING", "MONITORING_EVIDENCE_MISSING", "MONITORING_CONTRACTS_MISSING", "MONITORING_APIS_UNSTABLE"] as const satisfies readonly ProductionMonitoringFailure[];
const failClosedFailures = ["MC_6_DIGITAL_TWIN_INVALID", "MC_7_SIMULATION_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "PRODUCTION_TELEMETRY_MISSING", "NON_PRODUCTION_TELEMETRY_USED", "STATE_TRANSITIONS_NOT_DETERMINISTIC", "RESOURCE_METRICS_INCOMPLETE", "TENANT_RESOURCE_ISOLATION_MISSING", "CORRELATION_GRAPH_MISSING", "CAUSAL_MAPPING_INCOMPLETE", "CROSS_SERVICE_CORRELATION_INACCURATE", "EVIDENCE_LINEAGE_INCOMPLETE", "INTEGRITY_VERIFICATION_MISSING", "REPLAY_COMPATIBILITY_MISSING", "DOWNSTREAM_CONSUMPTION_FAILED", "OPERATIONAL_MUTATION_ATTEMPTED", "MISSION_INTELLIGENCE_GENERATED", "SYNTHETIC_MONITORING_SUBSTITUTED", "INFRASTRUCTURE_COUPLING_DETECTED", "GOVERNANCE_BYPASS_ATTEMPTED"] as const satisfies readonly ProductionMonitoringFailure[];

describe("Production Monitoring Primitives MC-13A", () => {
  it("publishes the MC-13A production monitoring doctrine", () => {
    const bundle = getProductionMonitoringPrimitivesBundle();

    expect(bundle.doctrine).toMatchObject({ version: "production-monitoring-primitives/mc-13a", authoritative_operational_telemetry_layer: true, production_only_inputs: true, observational_only: true, no_platform_mutation_authority: true, no_mission_intelligence_generation: true, qualification_gate: "Production Monitoring Primitive Qualification Gate" });
    expect(bundle.doctrine.downstream_consumers).toEqual(["digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"]);
    expect(bundle.result.readiness.decision).toBe("PRODUCTION_MONITORING_PRIMITIVES_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to production telemetry sources plus MC-6/7/8 consumers", () => {
    const first = runProductionMonitoringPrimitives({ seed: "deterministic" });
    const second = runProductionMonitoringPrimitives({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["cci-event-history/production", "cci-observability-platform/production", "caf-runtime-events/production", "platform-health-services/production", "infrastructure-metrics/production", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionMonitoringPrimitives(first).valid).toBe(true);
    expect(replayProductionMonitoringPrimitives()).toBe(true);
  });

  it("uses only qualified production telemetry and rejects synthetic substitution", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.sources).toMatchObject({ production_only: true, cci_event_history: true, cci_observability_platform: true, caf_runtime_events: true, platform_health_services: true, infrastructure_metrics: true, no_synthetic_substitution: true });
    expect(runProductionMonitoringPrimitives({ scenario: "SYNTHETIC_MONITORING_SUBSTITUTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runProductionMonitoringPrimitives({ scenario: "NON_PRODUCTION_TELEMETRY_USED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("collects operational state and canonical health deterministically", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.operational.entities).toEqual(["SERVICE", "MISSION", "RUNTIME", "AGENT", "INFRASTRUCTURE", "DEPENDENCY", "TENANT"]);
    expect(result.operational).toMatchObject({ service_status: true, mission_execution_state: true, runtime_activity: true, platform_utilization: true, operational_anomalies: true, state_transitions: true, deterministic_collection: true });
    expect(result.health.statuses).toEqual(["HEALTHY", "DEGRADED", "WARNING", "FAILED", "RECOVERING"]);
    expect(result.health).toMatchObject({ service_health: true, runtime_health: true, agent_health: true, infrastructure_health: true, dependency_health: true, availability_status: true, degradation_detection: true });
  });

  it("captures deterministic resource metrics with tenant isolation", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.resources).toMatchObject({ cpu_utilization: true, memory_utilization: true, storage_utilization: true, network_utilization: true, queue_depth: true, thread_utilization: true, runtime_capacity: true, tenant_resource_isolation: true, deterministic_metrics: true });
    expect(result.readiness.tenant_isolation_preserved).toBe(true);
  });

  it("builds event correlation graph and deterministic timeline", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.correlation).toMatchObject({ cross_service_correlation: true, timeline_correlation: true, dependency_correlation: true, mission_correlation: true, runtime_correlation: true, infrastructure_correlation: true, causal_relationship_mapping: true, deterministic_timeline: true });
  });

  it("produces immutable replay-compatible monitoring evidence", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.evidence.collection_timestamp).toBe("2026-07-20T00:00:00.000Z");
    expect(result.evidence).toMatchObject({ observation_source: true, immutable_evidence_identifier: true, correlation_identifier: true, collection_method: true, integrity_verification: true, replay_compatible: true, lineage_complete: true });
  });

  it("publishes stable downstream contracts without infrastructure coupling", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.contracts.downstream_contracts).toEqual(["digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"]);
    expect(result.contracts).toMatchObject({ monitoring_primitive_service: true, operational_monitoring_api: true, health_monitoring_api: true, resource_monitoring_api: true, event_correlation_api: true, evidence_api: true, stable: true });
    expect(result.readiness).toMatchObject({ digital_twin_consumption_ready: true, simulation_consumption_ready: true, risk_assessment_consumption_ready: true });
  });

  it("preserves observational-only governance boundaries", () => {
    const result = runProductionMonitoringPrimitives();

    expect(result.readiness).toMatchObject({ deterministic_monitoring: true, production_only_inputs: true, observational_only: true, no_mission_intelligence: true, no_state_mutation: true, qualification_ready: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runProductionMonitoringPrimitives({ scenario: failure });
    const validation = validateProductionMonitoringPrimitives(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runProductionMonitoringPrimitives({ scenario: failure });
    const validation = validateProductionMonitoringPrimitives(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runProductionMonitoringPrimitives({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runProductionMonitoringPrimitives({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runProductionMonitoringPrimitives({ scenario: "MONITORING_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateProductionMonitoringPrimitives(notQualified).valid).toBe(false);
  });
});
