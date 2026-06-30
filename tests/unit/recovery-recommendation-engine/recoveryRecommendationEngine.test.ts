import { describe, expect, it, vi } from "vitest";
import {
  buildRecoveryRecommendationObservabilitySurface,
  computeRecoveryRecommendationPackageHash,
  generateRecoveryRecommendations,
  getRecoveryRecommendationEngineContract,
  replayRecoveryRecommendations,
  validateRecoveryRecommendationPackage,
} from "@/services/recovery-recommendation-engine";
import type { RecoveryRecommendationFailure, RecoveryRecommendationLevel, RecoveryRecommendationScenario } from "@/types/recovery-recommendation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.5 Recovery Recommendation Engine", () => {
  it("defines the advisory-only recovery recommendation doctrine", () => {
    const contract = getRecoveryRecommendationEngineContract();

    expect(contract.doctrine.engine_version).toBe("recovery-recommendation-engine/v8ALT.2.5");
    expect(contract.doctrine.principles).toContain("advisory-only-recommendations");
    expect(contract.doctrine.principles).toContain("operator-supremacy");
    expect(contract.doctrine.recommendation_types).toEqual(["RECOMMENDED_RECOVERY", "RECOMMENDED_ROLLBACK", "RECOMMENDED_RESTART", "ALTERNATIVE_RECOVERY", "OPERATOR_INTERVENTION_GUIDANCE"]);
    expect(contract.doctrine.recommendation_levels).toEqual(["MONITOR", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(contract.doctrine.operator_approval_required).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates a complete operator recommendation package from a passed validation package", () => {
    const pkg = generateRecoveryRecommendations();
    const validation = validateRecoveryRecommendationPackage(pkg);

    expect(pkg.recommendations.length).toBe(5);
    expect(pkg.operator_package.executive_summary).toContain("recovery recommendation");
    expect(pkg.operator_package.recommended_recovery.rank).toBe(1);
    expect(pkg.operator_package.rollback_recommendation.recommendation_type).toBe("RECOMMENDED_ROLLBACK");
    expect(pkg.operator_package.restart_recommendation.recommendation_type).toBe("RECOMMENDED_RESTART");
    expect(pkg.operator_package.operator_guidance.recommendation_type).toBe("OPERATOR_INTERVENTION_GUIDANCE");
    expect(pkg.operator_package.governance_evidence.length).toBeGreaterThan(0);
    expect(pkg.operator_package.authority_evidence.length).toBeGreaterThan(0);
    expect(pkg.ready_for_recovery_replay_engine).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["MONITOR_LEVEL", "MONITOR"],
    ["LOW_LEVEL", "LOW"],
    ["MEDIUM_LEVEL", "MEDIUM"],
    ["HIGH_LEVEL", "HIGH"],
    ["CRITICAL_LEVEL", "CRITICAL"],
  ] as readonly [RecoveryRecommendationScenario, RecoveryRecommendationLevel][])("assigns deterministic recommendation level %s", (scenario, level) => {
    const pkg = generateRecoveryRecommendations({ scenario });

    expect(pkg.operator_package.recommended_recovery.recommendation_level).toBe(level);
  });

  it("ranks recommendations deterministically and preserves identical replayable output", () => {
    const first = generateRecoveryRecommendations();
    const second = generateRecoveryRecommendations();

    expect(first.recommendations.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(first.package_hash).toBe(second.package_hash);
    expect(first.operator_package.recommended_recovery.recommendation_hash).toBe(second.operator_package.recommended_recovery.recommendation_hash);
  });

  it("produces explainable confidence, risk, and expected outcome evidence", () => {
    const pkg = generateRecoveryRecommendations();
    const rec = pkg.operator_package.recommended_recovery;

    expect(rec.explanation).toContain("governance");
    expect(rec.explanation).toContain("authority");
    expect(rec.confidence_score).toBeGreaterThan(0.65);
    expect(rec.expected_outcome.mission_recovery_likelihood).toBeGreaterThan(0.65);
    expect(rec.risk_assessment.risk_hash).toBeTruthy();
    expect(rec.expected_outcome.outcome_hash).toBeTruthy();
  });

  it.each([
    ["VALIDATION_REJECTED", "VALIDATION_NOT_PASSED"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["EXECUTION_ATTEMPT", "EXECUTION_DETECTED"],
    ["RESTART_ATTEMPT", "RESTART_DETECTED"],
    ["ROLLBACK_ATTEMPT", "ROLLBACK_DETECTED"],
    ["PLAN_MUTATION_ATTEMPT", "PLAN_MUTATION_DETECTED"],
    ["GOVERNANCE_MUTATION_ATTEMPT", "GOVERNANCE_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_MUTATION_ATTEMPT", "CONSTITUTIONAL_MUTATION_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPT", "AUTHORITY_ESCALATION_DETECTED"],
    ["APPROVAL_BYPASS", "OPERATOR_APPROVAL_INVALID"],
    ["RISK_CONCEALMENT", "RISK_CONCEALMENT_DETECTED"],
    ["CONFIDENCE_FABRICATION", "CONFIDENCE_FABRICATION_DETECTED"],
    ["ALTERNATIVE_SUPPRESSION", "ALTERNATIVE_SUPPRESSION_DETECTED"],
  ] as readonly [RecoveryRecommendationScenario, RecoveryRecommendationFailure][])("fails closed for %s", (scenario, failure) => {
    const pkg = generateRecoveryRecommendations({ scenario });
    const validation = validateRecoveryRecommendationPackage(pkg);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(pkg.ready_for_recovery_replay_engine).toBe(false);
  });

  it("preserves advisory-only boundaries and requires explicit operator approval", () => {
    const pkg = generateRecoveryRecommendations();
    const validation = validateRecoveryRecommendationPackage(pkg);

    expect(pkg.advisory_only).toBe(true);
    expect(pkg.recovery_executed).toBe(false);
    expect(pkg.restart_performed).toBe(false);
    expect(pkg.rollback_performed).toBe(false);
    expect(pkg.ledger_entry.operator_approval_status).toBe("REQUIRED");
    expect(pkg.recommendations.every((item) => item.operator_approval_required)).toBe(true);
    expect(validation.advisory_only).toBe(true);
  });

  it("records immutable recommendation ledger, replay, lineage, and integrity metadata", () => {
    const pkg = generateRecoveryRecommendations();

    expect(pkg.ledger_entry.append_only).toBe(true);
    expect(pkg.ledger_entry.recommendation_ids).toEqual(pkg.recommendations.map((item) => item.recommendation_id));
    expect(pkg.replay.replay_version).toBe("recovery-recommendation-replay/v8ALT.2.5");
    expect(pkg.recommendations.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash)).toBe(true);
    expect(pkg.operator_package.integrity_verification).toBeTruthy();
  });

  it("replays and hashes recommendation packages deterministically", () => {
    const first = generateRecoveryRecommendations();
    const second = generateRecoveryRecommendations();
    const replay = replayRecoveryRecommendations(first);

    expect(second.package_hash).toBe(first.package_hash);
    expect(first.package_hash).toBe(computeRecoveryRecommendationPackageHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.package_hash);
  });

  it("exposes operator-visible recommendation diagnostics", () => {
    const surface = buildRecoveryRecommendationObservabilitySurface(generateRecoveryRecommendations({ scenario: "HIGH_LEVEL" }));

    expect(surface.recommendation_level).toBe("HIGH");
    expect(surface.recommendation_count).toBe(5);
    expect(surface.ready_for_recovery_replay_engine).toBe(true);
    expect(surface.replay_valid).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
