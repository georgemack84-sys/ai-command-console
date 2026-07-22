import { describe, expect, it } from "vitest";
import {
  getObservabilityTelemetryBundle,
  replayObservabilityTelemetry,
  runObservabilityTelemetry,
  validateObservabilityTelemetry,
} from "@/services/caf-observability-telemetry";
import type { ObservabilityTelemetryScenario } from "@/types/caf-observability-telemetry";

describe("Program 3 P3.10 Observability and Telemetry", () => {
  it("publishes agent observability doctrine while consuming CCI observability", () => {
    const bundle = getObservabilityTelemetryBundle();

    expect(bundle.doctrine.version).toBe("caf-observability-telemetry/v3.10");
    expect(bundle.doctrine.owns_agent_observability).toBe(true);
    expect(bundle.doctrine.consumes_cci_observability).toBe(true);
    expect(bundle.doctrine.duplicates_cci_observability).toBe(false);
    expect(bundle.doctrine.deterministic_traces_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic telemetry, traces, metrics, diagnostics, health, alerts, dashboards, and evidence", () => {
    const first = runObservabilityTelemetry();
    const second = runObservabilityTelemetry();

    expect(first.agent_identity_lifecycle_ref).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(first.runtime_orchestration_ref).toBe("caf-runtime-orchestration/v3.3");
    expect(first.memory_knowledge_ref).toBe("caf-memory-knowledge/v3.4");
    expect(first.planning_reasoning_ref).toBe("caf-planning-reasoning/v3.5");
    expect(first.collaboration_federation_ref).toBe("caf-collaboration-federation/v3.6");
    expect(first.governance_authority_policy_ref).toBe("caf-governance-authority-policy/v3.7");
    expect(first.safety_behavioral_constraints_ref).toBe("caf-safety-behavioral-constraints/v3.8");
    expect(first.human_operator_interaction_ref).toBe("caf-human-operator-interaction/v3.9");
    expect(first.telemetry_records).toHaveLength(8);
    expect(first.trace_records.every((trace) => trace.replayable && trace.duration_ms === 250)).toBe(true);
    expect(first.metric_records).toHaveLength(9);
    expect(first.diagnostic_records).toHaveLength(8);
    expect(first.health_records).toHaveLength(8);
    expect(first.alert_records.every((alert) => alert.deterministic && alert.route_ref.length > 0)).toBe(true);
    expect(first.dashboards).toHaveLength(10);
    expect(first.evidence.immutable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateObservabilityTelemetry(first).valid).toBe(true);
    expect(replayObservabilityTelemetry(first)).toBe(true);
  });

  it("certifies replay-safe operational visibility", () => {
    const result = runObservabilityTelemetry();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.consumes_cci_observability).toBe(true);
    expect(result.certification.does_not_duplicate_cci).toBe(true);
    expect(result.certification.telemetry_complete).toBe(true);
    expect(result.certification.traces_deterministic).toBe(true);
    expect(result.certification.metrics_complete).toBe(true);
    expect(result.certification.health_monitoring_complete).toBe(true);
    expect(result.certification.dashboards_complete).toBe(true);
    expect(result.certification.evidence_complete).toBe(true);
  });

  it.each([
    "P3_1_AGENT_REGISTRY_INVALID",
    "P3_3_RUNTIME_INVALID",
    "P3_4_MEMORY_INVALID",
    "P3_5_PLANNING_INVALID",
    "P3_6_COLLABORATION_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "P3_8_SAFETY_INVALID",
    "P3_9_INTERACTION_INVALID",
    "CCI_OBSERVABILITY_NOT_CONSUMED",
    "TELEMETRY_INCOMPLETE",
    "TRACE_NON_DETERMINISTIC",
    "TRACE_NOT_REPLAYABLE",
    "METRICS_INCOMPLETE",
    "DIAGNOSTICS_INCOMPLETE",
    "HEALTH_MONITORING_INCOMPLETE",
    "DASHBOARDS_INCOMPLETE",
    "ALERT_ROUTING_NON_DETERMINISTIC",
    "OPERATIONAL_EVIDENCE_MISSING",
    "REPLAY_DIVERGENCE",
    "CCI_OBSERVABILITY_DUPLICATED",
  ] as const)("fails certification for %s", (scenario: ObservabilityTelemetryScenario) => {
    const result = runObservabilityTelemetry({ scenario });
    const validation = validateObservabilityTelemetry(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runObservabilityTelemetry({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
