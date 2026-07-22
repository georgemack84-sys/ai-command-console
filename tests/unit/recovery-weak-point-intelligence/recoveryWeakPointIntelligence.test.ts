import { describe, expect, it, vi } from "vitest";
import {
  analyzeRecoveryWeakPoints,
  buildRecoveryWeakPointObservabilitySurface,
  getOperationalReadiness,
  getRecoveryRecommendations,
  getRecoveryStrategies,
  getRecoveryWeakPointContract,
  getStressScores,
  getWeakPoints,
  replayRecoveryWeakPoints,
  validateRecoveryWeakPoints,
} from "@/services/recovery-weak-point-intelligence";
import type { RecoveryWeakPointFailure, RecoveryWeakPointScenario } from "@/types/recovery-weak-point-intelligence";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.6.4 Recovery & Weak-Point Intelligence", () => {
  it("defines advisory recovery intelligence doctrine", () => {
    const contract = getRecoveryWeakPointContract();

    expect(contract.doctrine.engine_version).toBe("recovery-weak-point-intelligence/v8ALT.6.4");
    expect(contract.doctrine.principles).toContain("deterministic-recovery-analysis");
    expect(contract.doctrine.principles).toContain("advisory-only-recovery");
    expect(contract.doctrine.weak_point_classifications).toContain("CERTIFICATION_BLOCKER");
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministic recovery intelligence ledgers", () => {
    const first = analyzeRecoveryWeakPoints();
    const second = analyzeRecoveryWeakPoints();

    expect(first.append_only).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.ledger_hash).toBe(second.ledger_hash);
    expect(first.recovery_analysis?.recovery_state).toBeTruthy();
    expect(validateRecoveryWeakPoints(first).valid).toBe(true);
  });

  it("produces recovery strategies, weak points, recommendations, scores, and readiness", () => {
    const strategies = getRecoveryStrategies();
    const weakPoints = getWeakPoints();
    const scores = getStressScores();
    const recommendations = getRecoveryRecommendations();
    const readiness = getOperationalReadiness();

    expect(strategies.length).toBeGreaterThan(0);
    expect(weakPoints.length).toBeGreaterThan(0);
    expect(scores?.overall_stress_score).toBeGreaterThan(0);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(readiness?.readiness_state).toBeTruthy();
  });

  it("replays recovery intelligence deterministically", () => {
    const ledger = analyzeRecoveryWeakPoints();
    const replay = replayRecoveryWeakPoints(ledger);

    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.original_hash);
  });

  it("keeps recovery intelligence advisory-only", () => {
    const ledger = analyzeRecoveryWeakPoints();

    expect(ledger.action_executed).toBe(false);
    expect(ledger.recovery_strategies.every((item) => !item.action_executed)).toBe(true);
    expect(ledger.recommended_actions.every((item) => !item.action_executed && item.operator_visible)).toBe(true);
  });

  it.each([
    ["MISSING_OBSERVATION_LEDGER", "OBSERVATION_LEDGER_MISSING"],
    ["INCOMPLETE_RECOVERY_METRICS", "RECOVERY_METRICS_INCOMPLETE"],
    ["MISSING_RECOVERY_STRATEGY", "RECOVERY_STRATEGY_MISSING"],
    ["MISSING_WEAK_POINT_ANALYSIS", "WEAK_POINT_ANALYSIS_MISSING"],
    ["NONREPRODUCIBLE_STRESS_SCORE", "STRESS_SCORE_NONREPRODUCIBLE"],
    ["MISSING_GOVERNANCE_VALIDATION", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_CONSTITUTIONAL_VALIDATION", "CONSTITUTIONAL_VALIDATION_MISSING"],
    ["MISSING_AUTHORITY_VALIDATION", "AUTHORITY_VALIDATION_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_EVIDENCE_LINEAGE", "EVIDENCE_LINEAGE_MISSING"],
    ["CROSS_TENANT_INTELLIGENCE", "CROSS_TENANT_INTELLIGENCE_DETECTED"],
    ["RECOMMENDATION_NOT_OPERATOR_VISIBLE", "RECOMMENDATION_OPERATOR_VISIBILITY_MISSING"],
    ["NON_ADVISORY_RECOVERY_ACTION", "NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED"],
    ["INTEGRITY_HASH_FAILURE", "INTEGRITY_HASH_INVALID"],
  ] as readonly [RecoveryWeakPointScenario, RecoveryWeakPointFailure][])("rejects %s", (scenario, failure) => {
    const ledger = analyzeRecoveryWeakPoints({ scenario });
    const validation = validateRecoveryWeakPoints(ledger);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes recovery intelligence observability", () => {
    const ledger = analyzeRecoveryWeakPoints();
    const surface = buildRecoveryWeakPointObservabilitySurface(ledger);

    expect(surface.analysis_id).toBe(ledger.analysis_id);
    expect(surface.weak_point_count).toBeGreaterThan(0);
    expect(surface.recommendation_count).toBeGreaterThan(0);
    expect(surface.readiness_state).not.toBe("UNKNOWN");
    expect(surface.advisory_only).toBe(true);
  });
});
