import { describe, expect, it, vi } from "vitest";
import {
  buildMissionHealthObservabilitySurface,
  createMissionHealth,
  getMissionHealthContract,
  replayMissionHealth,
  validateMissionHealth,
} from "@/services/mission-health-contract";
import type { MissionHealthFailure, MissionHealthScenario } from "@/types/mission-health-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.1 Mission Health Contract", () => {
  it("defines the canonical mission health doctrine and registry", () => {
    const contract = getMissionHealthContract();

    expect(contract.doctrine.contract_version).toBe("mission-health-contract/v8ALT.4.1");
    expect(contract.doctrine.principles).toContain("deterministic-health-scoring");
    expect(contract.doctrine.subsystem_registry.length).toBe(8);
    expect(contract.doctrine.subsystem_registry.map((item) => item.subsystem_name)).toEqual([
      "Planning Intelligence",
      "Execution Orchestration",
      "Task Delegation",
      "Runtime Supervision",
      "Governance Intelligence",
      "Replay Intelligence",
      "Integrity Intelligence",
      "Authority Intelligence",
    ]);
    expect(contract.validation.valid).toBe(true);
  });

  it("uses deterministic immutable scoring weights totaling exactly 100 percent", () => {
    const registry = getMissionHealthContract().doctrine.subsystem_registry;

    expect(registry.reduce((sum, item) => sum + item.weight, 0)).toBe(1);
    expect(registry.map((item) => item.weight)).toEqual([0.15, 0.15, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1]);
  });

  it("creates a complete mission health record", () => {
    const health = createMissionHealth();
    const validation = validateMissionHealth(health);

    expect(health.status).toBe("PUBLISHED");
    expect(health.subsystem_scores.length).toBe(8);
    expect(health.evidence.length).toBe(8);
    expect(health.timeline.length).toBe(1);
    expect(health.overall_health_score).toBeGreaterThan(0);
    expect(validation.valid).toBe(true);
  });

  it("reproduces health scores, confidence, trends, timelines, evidence, lineage, replay, and integrity deterministically", () => {
    const first = createMissionHealth();
    const second = createMissionHealth();
    const replay = replayMissionHealth(first);

    expect(first.record_hash).toBe(second.record_hash);
    expect(first.overall_health_score).toBe(second.overall_health_score);
    expect(first.confidence_model.confidence_hash).toBe(second.confidence_model.confidence_hash);
    expect(first.trend_summary.trend_hash).toBe(second.trend_summary.trend_hash);
    expect(first.timeline[0].snapshot_hash).toBe(second.timeline[0].snapshot_hash);
    expect(replay.deterministic).toBe(true);
  });

  it("enforces governance, constitutional, tenant isolation, and advisory-only behavior", () => {
    const health = createMissionHealth();
    const validation = validateMissionHealth(health);

    expect(health.tenant_id).toBe("tenant:autonomy:primary");
    expect(health.advisory_only).toBe(true);
    expect(health.recovery_executed).toBe(false);
    expect(health.execution_modified).toBe(false);
    expect(health.governance_modified).toBe(false);
    expect(health.constitutional_modified).toBe(false);
    expect(validation.governance_valid).toBe(true);
    expect(validation.constitutional_valid).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["MISSING_SUBSYSTEM", "SUBSYSTEM_REGISTRATION_INVALID"],
    ["DUPLICATE_SUBSYSTEM", "SUBSYSTEM_REGISTRATION_INVALID"],
    ["INVALID_HEALTH_SCORE", "REQUIRED_HEALTH_METRICS_MISSING"],
    ["INVALID_CONFIDENCE", "CONFIDENCE_INVALID"],
    ["INCONSISTENT_AGGREGATION", "AGGREGATION_INCONSISTENT"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [MissionHealthScenario, MissionHealthFailure][])("rejects %s", (scenario, failure) => {
    const health = createMissionHealth({ scenario });
    const validation = validateMissionHealth(health);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible mission health diagnostics", () => {
    const surface = buildMissionHealthObservabilitySurface(createMissionHealth());

    expect(surface.subsystem_count).toBe(8);
    expect(surface.health_score).toBeGreaterThan(0);
    expect(surface.confidence).toBeGreaterThan(0);
    expect(surface.trend_state).toMatch(/IMPROVING|STABLE|FLUCTUATING|DEGRADING|RAPID_DECLINE|RECOVERING|UNKNOWN/);
    expect(surface.advisory_only).toBe(true);
  });
});
