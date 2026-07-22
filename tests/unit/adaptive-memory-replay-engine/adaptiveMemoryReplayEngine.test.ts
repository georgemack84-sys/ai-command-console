import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemoryReplayEngine,
  getAdaptiveMemoryReplayEngine,
  replayAdaptiveMemoryReplayEngine,
} from "@/services/adaptive-memory-replay-engine";
import type {
  AdaptiveMemoryReplayFailure,
  AdaptiveMemoryReplayScenario,
  ReplayValidationOutcome,
  ReplayValidator,
} from "@/types/adaptive-memory-replay-engine";

describe("Mission Control Phase 10.13I Adaptive Memory Replay Engine", () => {
  const validators: readonly ReplayValidator[] = [
    "MEMORY_RETRIEVAL",
    "LINEAGE_RECOVERY",
    "MISSION_RECONSTRUCTION",
    "EVIDENCE_RECONSTRUCTION",
    "GOVERNANCE_RECONSTRUCTION",
    "SIMULATION_RECONSTRUCTION",
    "OUTCOME_RECONSTRUCTION",
    "CERTIFICATION_RECONSTRUCTION",
    "TENANT_ISOLATION_VALIDATION",
    "INTEGRITY_VERIFICATION",
  ];

  const outcomes: readonly ReplayValidationOutcome[] = [
    "VALID",
    "REPLAY_DIVERGENCE",
    "INCOMPLETE_LINEAGE",
    "INTEGRITY_FAILURE",
  ];

  it("publishes the authoritative adaptive memory replay contract", () => {
    const engine = getAdaptiveMemoryReplayEngine();

    expect(engine.adaptive_memory_replay_version).toBe("adaptive-memory-replay-engine/v1");
    expect(engine.supported_validators).toEqual(validators);
    expect(engine.supported_outcomes).toEqual(outcomes);
    expect(engine.api_surface.establish_engine).toBe("POST /adaptive-memory-replay-engine/establish");
    expect(engine.api_surface.retrieve_contract).toBe("GET /adaptive-memory-replay-engine/contract");
    expect(engine.api_surface.production_mutation_supported).toBe(false);
    expect(engine.api_surface.historical_optimization_supported).toBe(false);
    expect(engine.api_surface.tenant_bypass_supported).toBe(false);
    expect(engine.result.engine_identifier).toBe("AdaptiveMemoryReplayEngine");
    expect(engine.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic replay records, ledger, metrics, and integrity", () => {
    const first = establishAdaptiveMemoryReplayEngine();
    const second = establishAdaptiveMemoryReplayEngine();

    expect(first.replay_records.map((record) => record.integrity_hash)).toEqual(second.replay_records.map((record) => record.integrity_hash));
    expect(first.replay_ledger.map((entry) => entry.integrity_hash)).toEqual(second.replay_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemoryReplayEngine(first)).toBe(true);
  });

  it("reconstructs complete memory lifecycle records", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.replay_records).toHaveLength(10);
    expect(result.replay_records.every((record) => record.replay_status === "VALID")).toBe(true);
    expect(result.replay_records.every((record) => record.replay_scope === "COMPLETE_MEMORY_LIFECYCLE")).toBe(true);
    expect(result.replay_records.every((record) => record.evidence_refs.length > 0)).toBe(true);
    expect(result.replay_records.every((record) => record.recommendation_refs.length === 2)).toBe(true);
    expect(result.replay_records.every((record) => record.governance_refs.length > 0)).toBe(true);
    expect(result.replay_records.every((record) => record.simulation_refs.length === 2)).toBe(true);
    expect(result.replay_records.every((record) => record.outcome_refs.length === 2)).toBe(true);
    expect(result.replay_records.every((record) => record.certification_refs.length === 2)).toBe(true);
    expect(result.replay_records.every((record) => record.lineage_refs.length >= 6)).toBe(true);
  });

  it("keeps replay advisory-only and historically faithful", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.contract.replay_before_trust).toBe(true);
    expect(result.contract.historical_fidelity).toBe(true);
    expect(result.contract.evidence_centric_replay).toBe(true);
    expect(result.contract.governance_preservation).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.historical_fidelity_preserved).toBe(true);
    expect(result.evidence_provenance_preserved).toBe(true);
  });

  it("reconstructs missions in deterministic order", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.replay_records.every((record) => record.reconstructed_mission.advisory_only)).toBe(true);
    expect(result.replay_records.every((record) => record.reconstructed_mission.reconstruction_order[0] === "memory_retrieval")).toBe(true);
    expect(result.replay_records.every((record) => record.reconstructed_mission.reconstruction_order.at(-1) === "replay_validation")).toBe(true);
    expect(result.replay_records.every((record) => record.reconstructed_mission.tenant_id === record.tenant_id)).toBe(true);
  });

  it("validates every replay step", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.replay_records.every((record) => record.validators)).toBe(true);
    expect(result.replay_records.every((record) => record.validators.map((validator) => validator.validator).join(",") === validators.join(","))).toBe(true);
    expect(result.replay_records.every((record) => record.validators.every((validator) => validator.valid))).toBe(true);
    expect(result.replay_records.every((record) => record.validators.every((validator) => validator.outcome === "VALID"))).toBe(true);
  });

  it("records append-only immutable replay ledger events", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.replay_ledger).toHaveLength(110);
    expect(result.replay_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.replay_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.replay_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.replay_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.replay_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.replay_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("publishes replay observability metrics", () => {
    const metrics = establishAdaptiveMemoryReplayEngine().metrics;

    expect(metrics.replay_requests).toBe(10);
    expect(metrics.replay_duration_ms).toBe(8);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.replay_failures).toBe(0);
    expect(metrics.replay_divergence_events).toBe(0);
    expect(metrics.lineage_completeness).toBe(1);
    expect(metrics.reconstruction_latency_ms).toBe(5);
    expect(metrics.integrity_failures).toBe(0);
    expect(metrics.authorization_failures).toBe(0);
    expect(metrics.replay_validation_accuracy).toBe(1);
  });

  it.each([
    ["TENANT_ISOLATION_UNAVAILABLE", "TENANT_ISOLATION_UNAVAILABLE", "REPLAY_DIVERGENCE"],
    ["NONDETERMINISTIC_REPLAY", "REPLAY_NONDETERMINISTIC", "INTEGRITY_FAILURE"],
    ["REPLAY_DIVERGENCE", "HISTORICAL_RECONSTRUCTION_DIVERGED", "REPLAY_DIVERGENCE"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE", "INCOMPLETE_LINEAGE"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING", "INCOMPLETE_LINEAGE"],
    ["ALTERED_GOVERNANCE", "GOVERNANCE_HISTORY_ALTERED", "REPLAY_DIVERGENCE"],
    ["SIMULATION_FAILURE", "SIMULATION_RECONSTRUCTION_FAILED", "REPLAY_DIVERGENCE"],
    ["OUTCOME_MISMATCH", "OUTCOME_INCONSISTENT", "REPLAY_DIVERGENCE"],
    ["CERTIFICATION_MISMATCH", "CERTIFICATION_MISMATCH", "REPLAY_DIVERGENCE"],
    ["INTEGRITY_FAILURE", "REPLAY_INTEGRITY_COMPROMISED", "INTEGRITY_FAILURE"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED", "REPLAY_DIVERGENCE"],
    ["VALIDATION_BYPASS", "REPLAY_VALIDATION_BYPASSED", "REPLAY_DIVERGENCE"],
  ] as const)(
    "rejects unsafe replay condition %s",
    (scenario: AdaptiveMemoryReplayScenario, failure: AdaptiveMemoryReplayFailure, outcome: ReplayValidationOutcome) => {
      const result = establishAdaptiveMemoryReplayEngine({ scenario });

      expect(result.status).toBe("REJECTED");
      expect(result.failures).toContain(failure);
      expect(result.replay_records.every((record) => record.replay_status === outcome)).toBe(true);
      expect(result.metrics.replay_success_rate).toBe(0);
      expect(replayAdaptiveMemoryReplayEngine(result)).toBe(true);
    },
  );

  it("detects missing evidence and lineage as incomplete lineage outcomes", () => {
    const evidence = establishAdaptiveMemoryReplayEngine({ scenario: "MISSING_EVIDENCE" });
    const lineage = establishAdaptiveMemoryReplayEngine({ scenario: "INCOMPLETE_LINEAGE" });

    expect(evidence.evidence_provenance_preserved).toBe(false);
    expect(evidence.replay_records.every((record) => record.evidence_refs.length === 0)).toBe(true);
    expect(evidence.metrics.lineage_completeness).toBe(0.4);
    expect(lineage.evidence_provenance_preserved).toBe(false);
    expect(lineage.replay_records.every((record) => record.lineage_refs.length === 1)).toBe(true);
  });

  it("preserves tenant isolation during replay", () => {
    const result = establishAdaptiveMemoryReplayEngine();

    expect(result.contract.tenant_isolation_required).toBe(true);
    expect(result.tenant_isolation_enforced).toBe(true);
    expect(result.replay_records.every((record) => record.tenant_id === record.reconstructed_mission.tenant_id)).toBe(true);
  });

  it("detects nested replay record tampering", () => {
    const result = establishAdaptiveMemoryReplayEngine();
    const tampered = {
      ...result,
      replay_records: [
        {
          ...result.replay_records[0],
          tenant_id: "tenant-other",
        },
        ...result.replay_records.slice(1),
      ],
    };

    expect(replayAdaptiveMemoryReplayEngine(tampered)).toBe(false);
  });
});
