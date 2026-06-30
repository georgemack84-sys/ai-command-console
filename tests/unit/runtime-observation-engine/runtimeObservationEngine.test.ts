import { describe, expect, it } from "vitest";
import {
  buildRuntimeObservationDashboardSurface,
  buildRuntimeObservationPackage,
  computeRuntimeObservationHash,
  computeSupervisionEventHash,
  getRuntimeObservationFramework,
} from "@/services/runtime-observation-engine";
import type { RuntimeObservationFailureReason, RuntimeObservationScenario } from "@/types/runtime-observation-engine";

describe("Mission Control Phase 8E.B Runtime Observation Engine", () => {
  it("publishes observation doctrine, states, categories, and severities", () => {
    const framework = getRuntimeObservationFramework();

    expect(framework.doctrine.engine_version).toBe("runtime-observation-engine/v8E.B");
    expect(framework.doctrine.principles).toContain("read-only-observation");
    expect(framework.doctrine.principles).toContain("no-hidden-observation-channels");
    expect(framework.doctrine.states).toContain("REPLAYABLE");
    expect(framework.doctrine.categories).toEqual(["EXECUTION", "GOVERNANCE", "CONFIDENCE", "HEALTH", "RECOMMENDATION"]);
    expect(framework.doctrine.severities).toEqual(["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  });

  it("builds a baseline read-only observation package", () => {
    const pkg = buildRuntimeObservationPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("runtime-observation-engine/v8E.B");
    expect(pkg.observation_state).toBe("REPLAYABLE");
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.supervision_event?.severity).toBe("INFORMATIONAL");
    expect(pkg.monitoring_timeline.ordered_events).toContain("Evidence Stored");
    expect(pkg.read_only).toBe(true);
    expect(pkg.execution_modified).toBe(false);
    expect(pkg.governance_modified).toBe(false);
    expect(pkg.authority_modified).toBe(false);
    expect(pkg.hidden_channels_used).toBe(false);
  });

  it("produces deterministic hashes, evidence, timeline, and replay", () => {
    const first = buildRuntimeObservationPackage();
    const second = buildRuntimeObservationPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeRuntimeObservationHash(first.observation)).toBe(first.observation.integrity_hash);
    expect(first.supervision_event && computeSupervisionEventHash(first.supervision_event)).toBe(first.supervision_event?.integrity_hash);
    expect(first.replay.reconstructed_lifecycle).toEqual(["EVENT_RECEIVED", "NORMALIZING", "VALIDATING", "CORRELATING", "OBSERVATION_CREATED", "EVIDENCE_GENERATED", "RECORDED", "REPLAYABLE"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["INCOMPLETE_OBSERVATION", "OBSERVATION_INCOMPLETE"],
    ["EXECUTION_UNOBSERVABLE", "EXECUTION_PROGRESS_UNOBSERVABLE"],
    ["GOVERNANCE_MISSING", "GOVERNANCE_OBSERVATION_MISSING"],
    ["CONSTITUTION_UNOBSERVABLE", "CONSTITUTIONAL_OBSERVATION_MISSING"],
    ["AUTHORITY_UNAVAILABLE", "AUTHORITY_VALIDATION_UNAVAILABLE"],
    ["CONFIDENCE_MISSING", "CONFIDENCE_METRICS_MISSING"],
    ["HEALTH_MISSING", "HEALTH_METRICS_MISSING"],
    ["RECOMMENDATION_UNAVAILABLE", "RECOMMENDATION_VALIDITY_UNAVAILABLE"],
    ["EVENT_NOT_GENERATED", "SUPERVISION_EVENT_NOT_GENERATED"],
    ["TIMELINE_INCOMPLETE", "MONITORING_TIMELINE_INCOMPLETE"],
    ["EVIDENCE_MISSING", "RUNTIME_EVIDENCE_MISSING"],
    ["NONDETERMINISTIC_OBSERVATION", "OBSERVATION_NONDETERMINISTIC"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["TRUTH_LEDGER_WRITE_FAILED", "TRUTH_LEDGER_WRITE_FAILED"],
    ["HIDDEN_OBSERVATION_CHANNEL", "HIDDEN_OBSERVATION_CHANNEL_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [RuntimeObservationScenario, RuntimeObservationFailureReason][])("rejects scenario %s", (scenario, reason) => {
    const pkg = buildRuntimeObservationPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.validation.ready_for_runtime_analysis).toBe(false);
    expect(pkg.replay.validation_state).toBe("FAIL");
  });

  it("projects dashboard visibility for critical observation failures", () => {
    const dashboard = buildRuntimeObservationDashboardSurface(buildRuntimeObservationPackage({ scenario: "HIDDEN_OBSERVATION_CHANNEL" }));

    expect(dashboard.validation_state).toBe("FAIL");
    expect(dashboard.severity).toBe("CRITICAL");
    expect(dashboard.failures).toContain("HIDDEN_OBSERVATION_CHANNEL_DETECTED");
    expect(dashboard.integrity_status).toBe("VALID");
  });
});
