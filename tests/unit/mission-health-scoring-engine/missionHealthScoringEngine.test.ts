import { describe, expect, it, vi } from "vitest";
import {
  buildMissionHealthScoringObservabilitySurface,
  getMissionHealthScoringEngineContract,
  replayMissionHealthScore,
  scoreMissionHealth,
  validateMissionHealthScore,
} from "@/services/mission-health-scoring-engine";
import type { MissionHealthScoringFailure, MissionHealthScoringScenario } from "@/types/mission-health-scoring-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.3 Mission Health Scoring Engine", () => {
  it("defines the advisory-only mission health scoring doctrine", () => {
    const contract = getMissionHealthScoringEngineContract();

    expect(contract.doctrine.engine_version).toBe("mission-health-scoring-engine/v8ALT.4.3");
    expect(contract.doctrine.principles).toContain("deterministic-scoring");
    expect(contract.doctrine.principles).toContain("certified-weighting-profile");
    expect(contract.doctrine.principles).toContain("advisory-only-behavior");
    expect(contract.validation.valid).toBe(true);
  });

  it("scores mission health from every certified subsystem", () => {
    const score = scoreMissionHealth();
    const validation = validateMissionHealthScore(score);

    expect(score.scoring_state).toBe("PUBLISHED");
    expect(score.source_collection.subsystems.length).toBe(8);
    expect(score.scoring_evidence.length).toBe(8);
    expect(score.overall_health_score).toBeGreaterThan(0);
    expect(validation.valid).toBe(true);
  });

  it("uses the certified immutable weighting profile", () => {
    const profile = scoreMissionHealth().weighting_profile;

    expect(profile.total_weight).toBe(1);
    expect(profile.weights).toEqual({
      planning: 0.15,
      orchestration: 0.15,
      delegation: 0.1,
      runtime_supervision: 0.15,
      governance: 0.15,
      replay: 0.1,
      integrity: 0.1,
      authority: 0.1,
    });
    expect(profile.immutable).toBe(true);
    expect(profile.governance_approved).toBe(true);
  });

  it("replays deterministically and reproduces score hashes", () => {
    const first = scoreMissionHealth();
    const second = scoreMissionHealth();
    const replay = replayMissionHealthScore(first);

    expect(first.score_hash).toBe(second.score_hash);
    expect(first.scoring_evidence.map((item) => item.evidence_hash)).toEqual(second.scoring_evidence.map((item) => item.evidence_hash));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.score_hash);
  });

  it("calculates confidence, readiness, stability, consistency, and degradation", () => {
    const score = scoreMissionHealth();

    expect(score.overall_confidence.overall_confidence).toBeGreaterThan(0);
    expect(score.overall_confidence.confidence_hash).toBeTruthy();
    expect(["FULLY_READY", "READY", "LIMITED", "DEGRADED", "NOT_READY"]).toContain(score.readiness);
    expect(["VERY_STABLE", "STABLE", "MODERATELY_STABLE", "UNSTABLE", "HIGHLY_UNSTABLE"]).toContain(score.stability_index);
    expect(["CONSISTENT", "MOSTLY_CONSISTENT", "PARTIALLY_CONSISTENT", "INCONSISTENT"]).toContain(score.consistency);
    expect(["NONE", "MINOR", "MODERATE", "MAJOR", "SEVERE", "CRITICAL"]).toContain(score.degradation_severity);
  });

  it("links complete evidence, lineage, replay, and integrity references", () => {
    const score = scoreMissionHealth();

    expect(score.scoring_evidence.every((item) => item.contribution > 0)).toBe(true);
    expect(score.scoring_evidence.every((item) => item.lineage_reference && item.replay_reference && item.integrity_hash)).toBe(true);
    expect(score.evidence_reference).toBeTruthy();
    expect(score.lineage_reference).toBeTruthy();
    expect(score.replay_reference).toBeTruthy();
    expect(score.integrity_hash).toBeTruthy();
  });

  it("enforces advisory-only behavior", () => {
    const score = scoreMissionHealth();
    const validation = validateMissionHealthScore(score);

    expect(score.advisory_only).toBe(true);
    expect(score.execution_initiated).toBe(false);
    expect(score.recovery_authorized).toBe(false);
    expect(score.subsystem_data_modified).toBe(false);
    expect(score.governance_modified).toBe(false);
    expect(score.constitutional_modified).toBe(false);
    expect(score.operator_authority_overridden).toBe(false);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["MISSING_SUBSYSTEM", "SUBSYSTEM_COMPLETENESS_INVALID"],
    ["DUPLICATE_SUBSYSTEM", "CERTIFIED_SUBSYSTEM_IDENTITY_INVALID"],
    ["INVALID_WEIGHT", "WEIGHTING_INTEGRITY_INVALID"],
    ["INVALID_CONFIDENCE", "CONFIDENCE_INVALID"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_INVALID"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [MissionHealthScoringScenario, MissionHealthScoringFailure][])("rejects %s", (scenario, failure) => {
    const score = scoreMissionHealth({ scenario });
    const validation = validateMissionHealthScore(score);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(score.scoring_state).toBe("REJECTED");
  });

  it("exposes operator-visible scoring diagnostics", () => {
    const surface = buildMissionHealthScoringObservabilitySurface(scoreMissionHealth());

    expect(surface.mission_health_score_id).toBeTruthy();
    expect(surface.overall_health_score).toBeGreaterThan(0);
    expect(surface.readiness).toBeTruthy();
    expect(surface.stability_index).toBeTruthy();
    expect(surface.degradation_severity).toBeTruthy();
    expect(surface.advisory_only).toBe(true);
  });
});
