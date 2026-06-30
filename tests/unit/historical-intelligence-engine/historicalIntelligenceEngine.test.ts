import { describe, expect, it, vi } from "vitest";
import {
  buildHistoricalIntelligenceObservabilitySurface,
  computeHistoricalIntelligenceHash,
  getHistoricalIntelligenceEngineContract,
  replayHistoricalIntelligence,
  runHistoricalIntelligence,
  validateHistoricalIntelligence,
} from "@/services/historical-intelligence-engine";
import type { HistoricalIntelligenceFailure, HistoricalIntelligenceScenario } from "@/types/historical-intelligence-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.2 Historical Intelligence Engine", () => {
  it("defines the deterministic no-autonomous-learning doctrine", () => {
    const contract = getHistoricalIntelligenceEngineContract();

    expect(contract.doctrine.engine_version).toBe("historical-intelligence-engine/v8ALT.3.2");
    expect(contract.doctrine.principles).toContain("deterministic-analysis");
    expect(contract.doctrine.principles).toContain("no-autonomous-learning");
    expect(contract.doctrine.data_sources.length).toBe(15);
    expect(contract.doctrine.model_types).toContain("EXECUTION_FORECAST");
    expect(contract.doctrine.autonomous_learning_allowed).toBe(false);
    expect(contract.validation.valid).toBe(true);
  });

  it("collects, normalizes, analyzes, models, stores, and replays historical intelligence", () => {
    const report = runHistoricalIntelligence();
    const validation = validateHistoricalIntelligence(report);

    expect(report.pipeline_state).toBe("PUBLISHED");
    expect(report.evidence.length).toBe(15);
    expect(report.evidence.every((item) => item.normalized && item.integrity_hash)).toBe(true);
    expect(report.failure_patterns.length).toBe(4);
    expect(report.prediction_models.length).toBe(7);
    expect(report.repository.model_ids).toEqual(report.prediction_models.map((model) => model.model_id));
    expect(validation.valid).toBe(true);
  });

  it("generates deterministic trend, failure, resource, governance, and confidence profiles", () => {
    const first = runHistoricalIntelligence();
    const second = runHistoricalIntelligence();

    expect(first.trend_summary.trend_hash).toBe(second.trend_summary.trend_hash);
    expect(first.failure_patterns.map((item) => item.pattern_hash)).toEqual(second.failure_patterns.map((item) => item.pattern_hash));
    expect(first.resource_profile.profile_hash).toBe(second.resource_profile.profile_hash);
    expect(first.governance_profile.governance_hash).toBe(second.governance_profile.governance_hash);
    expect(first.confidence_profile.profile_hash).toBe(second.confidence_profile.profile_hash);
  });

  it("generates immutable versioned governance-approved prediction models with full explainability", () => {
    const report = runHistoricalIntelligence();

    expect(report.prediction_models.every((model) => model.model_version === "historical-prediction-model/v8ALT.3.2")).toBe(true);
    expect(report.prediction_models.every((model) => model.approved_by === "operator:historical-model-governance")).toBe(true);
    expect(report.prediction_models.every((model) => model.assumptions.length > 0)).toBe(true);
    expect(report.prediction_models.every((model) => model.explainability.length >= 9)).toBe(true);
  });

  it.each([
    ["MISSING_HISTORICAL_EVIDENCE", "HISTORICAL_DATA_INVALID"],
    ["NONDETERMINISTIC_NORMALIZATION", "NORMALIZATION_NONDETERMINISTIC"],
    ["MISSING_FAILURE_PATTERNS", "FAILURE_PATTERNS_MISSING"],
    ["RESOURCE_MODEL_MISMATCH", "RESOURCE_MODEL_INVALID"],
    ["GOVERNANCE_ANALYSIS_MISSING", "GOVERNANCE_ANALYSIS_INVALID"],
    ["CONFIDENCE_TREND_MISSING", "CONFIDENCE_TREND_INVALID"],
    ["MODEL_VERSION_MUTATED", "MODEL_VERSION_MUTATED"],
    ["LINEAGE_BROKEN", "LINEAGE_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["MISSING_ASSUMPTIONS", "ASSUMPTIONS_MISSING"],
    ["GOVERNANCE_INVALID", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_INVALID", "CONSTITUTIONAL_INVALID"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
    ["AUTONOMOUS_MODEL_MODIFICATION", "AUTONOMOUS_MODEL_MODIFICATION_DETECTED"],
    ["UNAUTHORIZED_MODEL_UPDATE", "UNAUTHORIZED_MODEL_UPDATE_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["CROSS_TENANT_ANALYSIS", "CROSS_TENANT_ANALYSIS_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["EXPLAINABILITY_INCOMPLETE", "EXPLAINABILITY_INCOMPLETE"],
  ] as readonly [HistoricalIntelligenceScenario, HistoricalIntelligenceFailure][])("fails closed for %s", (scenario, failure) => {
    const report = runHistoricalIntelligence({ scenario });
    const validation = validateHistoricalIntelligence(report);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("prevents autonomous learning and runtime model mutation in baseline", () => {
    const report = runHistoricalIntelligence();
    const validation = validateHistoricalIntelligence(report);

    expect(report.advisory_only).toBe(true);
    expect(report.autonomous_learning_enabled).toBe(false);
    expect(report.runtime_model_modified).toBe(false);
    expect(report.unauthorized_model_update).toBe(false);
    expect(report.cross_tenant_analysis).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("replays and hashes historical intelligence deterministically", () => {
    const first = runHistoricalIntelligence();
    const second = runHistoricalIntelligence();
    const replay = replayHistoricalIntelligence(first);

    expect(second.report_hash).toBe(first.report_hash);
    expect(first.report_hash).toBe(computeHistoricalIntelligenceHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.report_hash);
  });

  it("exposes operator-visible historical intelligence diagnostics", () => {
    const surface = buildHistoricalIntelligenceObservabilitySurface(runHistoricalIntelligence());

    expect(surface.pipeline_state).toBe("PUBLISHED");
    expect(surface.evidence_count).toBe(15);
    expect(surface.pattern_count).toBe(4);
    expect(surface.model_count).toBe(7);
    expect(surface.advisory_only).toBe(true);
  });
});
