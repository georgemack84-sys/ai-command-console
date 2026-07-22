import { describe, expect, it, vi } from "vitest";
import {
  buildMultiDomainObservabilitySurface,
  computeMultiDomainRepositoryHash,
  getMultiDomainPredictionEngineContract,
  replayMultiDomainPrediction,
  runMultiDomainPrediction,
  validateMultiDomainPrediction,
} from "@/services/multi-domain-prediction-engine";
import type { MultiDomainFailure, MultiDomainScenario } from "@/types/multi-domain-prediction-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.8 Multi-Domain Prediction Engine", () => {
  it("defines the advisory-only multi-domain prediction doctrine", () => {
    const contract = getMultiDomainPredictionEngineContract();

    expect(contract.doctrine.engine_version).toBe("multi-domain-prediction-engine/v8ALT.3.8");
    expect(contract.doctrine.principles).toContain("cross-domain-determinism");
    expect(contract.doctrine.principles).toContain("explainable-intelligence-correlation");
    expect(contract.doctrine.intelligence_domains).toEqual(["EXECUTION", "ORCHESTRATION", "RUNTIME_ASSURANCE", "RECOVERY", "INTEGRITY", "REPLAY", "GOVERNANCE", "MISSION_HEALTH"]);
    expect(contract.validation.valid).toBe(true);
  });

  it("correlates every intelligence domain deterministically", () => {
    const repository = runMultiDomainPrediction();
    const validation = validateMultiDomainPrediction(repository);

    expect(repository.domain_health_profiles.length).toBe(8);
    expect(repository.domain_health_profiles.map((item) => item.domain)).toContain("EXECUTION");
    expect(repository.domain_health_profiles.map((item) => item.domain)).toContain("MISSION_HEALTH");
    expect(repository.unified_predictions[0].correlated_domains.length).toBe(8);
    expect(validation.valid).toBe(true);
  });

  it("reproduces dependency graphs, cascades, unified predictions, weights, confidence, and explanations", () => {
    const first = runMultiDomainPrediction();
    const second = runMultiDomainPrediction();

    expect(first.repository_hash).toBe(second.repository_hash);
    expect(first.correlation_matrix).toEqual(second.correlation_matrix);
    expect(first.dependency_graphs).toEqual(second.dependency_graphs);
    expect(first.cascade_analyses).toEqual(second.cascade_analyses);
    expect(first.unified_predictions.map((item) => item.prediction_hash)).toEqual(second.unified_predictions.map((item) => item.prediction_hash));
    expect(first.unified_predictions[0].explanation.length).toBeGreaterThanOrEqual(4);
  });

  it("builds deterministic dependency and cascading risk analysis", () => {
    const prediction = runMultiDomainPrediction().unified_predictions[0];

    expect(prediction.dependency_graph.length).toBe(8);
    expect(prediction.dependency_graph.every((item) => item.rationale && item.dependency_hash)).toBe(true);
    expect(prediction.cascade_analysis.length).toBe(3);
    expect(prediction.cascade_analysis.every((item) => item.cascade_path.length >= 3 && item.containment_recommendations.length > 0)).toBe(true);
  });

  it("preserves confidence, governance, constitutional, lineage, replay, recommendation, mitigation, and integrity data", () => {
    const repository = runMultiDomainPrediction();
    const prediction = repository.unified_predictions[0];

    expect(prediction.overall_confidence).toBeGreaterThan(0);
    expect(prediction.overall_reliability).toBeGreaterThan(0);
    expect(prediction.governance_validation).toBe("PASS");
    expect(prediction.constitutional_validation).toBe("PASS");
    expect(repository.lineage_references.length).toBe(1);
    expect(repository.replay_references.length).toBe(1);
    expect(prediction.recommendations.length).toBeGreaterThan(0);
    expect(prediction.mitigation_options.length).toBeGreaterThan(0);
    expect(repository.integrity_hashes.length).toBe(1);
  });

  it("replays and hashes multi-domain correlations deterministically", () => {
    const repository = runMultiDomainPrediction();
    const replay = replayMultiDomainPrediction(repository);

    expect(repository.repository_hash).toBe(computeMultiDomainRepositoryHash(repository));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(repository.repository_hash);
  });

  it("enforces advisory-only behavior", () => {
    const repository = runMultiDomainPrediction();
    const prediction = repository.unified_predictions[0];
    const validation = validateMultiDomainPrediction(repository);

    expect(prediction.advisory_only).toBe(true);
    expect(prediction.execution_initiated).toBe(false);
    expect(prediction.recovery_performed).toBe(false);
    expect(prediction.governance_modified).toBe(false);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["AUTONOMOUS_INTERVENTION_ATTEMPT", "AUTONOMOUS_INTERVENTION_DETECTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPT", "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"],
    ["HIDDEN_DOMAIN_CORRELATION", "HIDDEN_DOMAIN_CORRELATION_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["CROSS_TENANT_CORRELATION", "CROSS_TENANT_CORRELATION_DETECTED"],
  ] as readonly [MultiDomainScenario, MultiDomainFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = runMultiDomainPrediction({ scenario });
    const validation = validateMultiDomainPrediction(repository);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible multi-domain diagnostics", () => {
    const surface = buildMultiDomainObservabilitySurface(runMultiDomainPrediction());

    expect(surface.domain_count).toBe(8);
    expect(surface.dependency_count).toBe(8);
    expect(surface.cascade_count).toBe(3);
    expect(surface.unified_prediction_count).toBe(1);
    expect(surface.highest_correlation_level).toMatch(/NONE|LOW|MODERATE|HIGH|CRITICAL|SYSTEMIC/);
    expect(surface.advisory_only).toBe(true);
  });
});
