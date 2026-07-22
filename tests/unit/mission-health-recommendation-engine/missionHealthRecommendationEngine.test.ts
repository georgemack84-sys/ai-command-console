import { describe, expect, it, vi } from "vitest";
import {
  buildMissionHealthRecommendationObservabilitySurface,
  getMissionHealthRecommendationEngineContract,
  recommendMissionHealth,
  replayMissionHealthRecommendations,
  validateMissionHealthRecommendations,
} from "@/services/mission-health-recommendation-engine";
import type { MissionHealthRecommendationFailure, MissionHealthRecommendationScenario } from "@/types/mission-health-recommendation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.7 Mission Health Recommendation Engine", () => {
  it("defines the advisory-only recommendation doctrine", () => {
    const contract = getMissionHealthRecommendationEngineContract();

    expect(contract.doctrine.engine_version).toBe("mission-health-recommendation-engine/v8ALT.4.7");
    expect(contract.doctrine.principles).toContain("deterministic-recommendation-selection");
    expect(contract.doctrine.principles).toContain("operator-approval-required");
    expect(contract.doctrine.principles).toContain("no-execution-authority");
    expect(contract.validation.valid).toBe(true);
  });

  it("generates a deterministic recommendation set", () => {
    const set = recommendMissionHealth();
    const validation = validateMissionHealthRecommendations(set);

    expect(set.set_state).toBe("OPERATOR_REVIEW");
    expect(set.recommendations.length).toBeGreaterThanOrEqual(5);
    expect(set.recommendations.map((item) => item.priority)).toEqual([...set.recommendations.map((item) => item.priority)].sort((a, b) => ({ LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4, CRITICAL: 5 }[b] - { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4, CRITICAL: 5 }[a])));
    expect(validation.valid).toBe(true);
  });

  it("includes evidence-backed operator, subsystem, replay, integrity, and monitoring recommendations", () => {
    const types = recommendMissionHealth().recommendations.map((item) => item.recommendation_type);

    expect(types).toContain("OPERATOR_REVIEW");
    expect(types).toContain("SUBSYSTEM_INSPECTION");
    expect(types).toContain("REPLAY_VALIDATION");
    expect(types).toContain("INTEGRITY_VERIFICATION");
    expect(types).toContain("PREDICTIVE_MONITORING");
  });

  it("keeps pause and recovery recommendations advisory when risk warrants them", () => {
    const set = recommendMissionHealth();

    expect(set.recommendations.every((item) => item.operator_required)).toBe(true);
    expect(set.recommendations.every((item) => item.governance_validation.execution_authority_granted === false)).toBe(true);
    expect(set.recommendations.every((item) => item.governance_validation.recovery_authority_granted === false)).toBe(true);
    expect(set.recommendations.every((item) => !item.action_executed && !item.execution_controlled && !item.autonomous_intervention_performed)).toBe(true);
  });

  it("links evidence, lineage, replay, integrity, and governance validation", () => {
    const set = recommendMissionHealth();

    expect(set.recommendations.every((item) => item.supporting_evidence.length > 0)).toBe(true);
    expect(set.recommendations.every((item) => item.supporting_evidence.every((ev) => ev.lineage_reference && ev.replay_reference && ev.integrity_hash))).toBe(true);
    expect(set.recommendations.every((item) => item.lineage_reference && item.replay_reference && item.integrity_hash)).toBe(true);
    expect(set.recommendations.every((item) => item.governance_validation.governance_validated)).toBe(true);
  });

  it("replays recommendation sets deterministically", () => {
    const first = recommendMissionHealth();
    const second = recommendMissionHealth();
    const replay = replayMissionHealthRecommendations(first);

    expect(first.recommendation_set_hash).toBe(second.recommendation_set_hash);
    expect(first.recommendations.map((item) => item.recommendation_hash)).toEqual(second.recommendations.map((item) => item.recommendation_hash));
    expect(replay.deterministic).toBe(true);
  });

  it.each([
    ["MISSING_HEALTH_EXPLANATION", "HEALTH_EXPLANATION_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["UNSUPPORTED_RECOMMENDATION", "UNSUPPORTED_RECOMMENDATION"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["INSUFFICIENT_CONFIDENCE", "CONFIDENCE_INSUFFICIENT"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_INVALID"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_INVALID"],
    ["OPERATOR_APPROVAL_BYPASS_ATTEMPT", "OPERATOR_APPROVAL_BYPASSED"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [MissionHealthRecommendationScenario, MissionHealthRecommendationFailure][])("rejects %s", (scenario, failure) => {
    const set = recommendMissionHealth({ scenario });
    const validation = validateMissionHealthRecommendations(set);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(set.set_state).toBe("REJECTED");
  });

  it("exposes operator-visible recommendation diagnostics", () => {
    const surface = buildMissionHealthRecommendationObservabilitySurface(recommendMissionHealth());

    expect(surface.recommendation_set_id).toBeTruthy();
    expect(surface.recommendation_count).toBeGreaterThan(0);
    expect(surface.operator_required).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
