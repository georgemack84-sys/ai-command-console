import { describe, expect, it, vi } from "vitest";
import {
  certifyRuntimeConfidence,
  computeRuntimeConfidenceRecordHash,
  evaluateRuntimeConfidence,
  getRuntimeConfidenceEvaluationEngineContract,
  publishRuntimeConfidence,
  replayRuntimeConfidence,
  validateRuntimeConfidence,
} from "@/services/runtime-confidence-evaluation-engine";
import type { RuntimeConfidenceFailure, RuntimeConfidenceScenario } from "@/types/runtime-confidence-evaluation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1B Runtime Confidence Evaluation Engine", () => {
  it("defines governed weights, lifecycle, components, and advisory-only doctrine", () => {
    const contract = getRuntimeConfidenceEvaluationEngineContract();

    expect(contract.doctrine.engine_version).toBe("runtime-confidence-evaluation-engine/v8ALT.1B");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.lifecycle).toEqual(["COLLECT_TELEMETRY", "VALIDATE_INPUTS", "CALCULATE_SUBSYSTEM_CONFIDENCE", "NORMALIZE_SCORES", "WEIGHTED_AGGREGATION", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "STORE_RESULTS", "PUBLISH_CONFIDENCE"]);
    expect(contract.doctrine.components).toEqual(["EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "CONSTITUTIONAL"]);
    expect(contract.doctrine.weights.EXECUTION).toBe(0.25);
    expect(Object.values(contract.doctrine.weights).reduce((sum, item) => sum + item, 0)).toBeCloseTo(1);
    expect(contract.doctrine.advisory_only).toBe(true);
  });

  it("evaluates certified baseline confidence with normalized deterministic scores", () => {
    const record = evaluateRuntimeConfidence();
    const validation = validateRuntimeConfidence(record);
    const certification = certifyRuntimeConfidence(record);

    expect(record.engine_version).toBe("runtime-confidence-evaluation-engine/v8ALT.1B");
    expect(record.overall_confidence).toBeGreaterThanOrEqual(90);
    expect(record.confidence_level).toBe("VERY_HIGH");
    expect(record.weighted_scores.length).toBe(7);
    expect(record.confidence_factors.length).toBe(28);
    expect(record.weighted_scores.every((item) => item.score >= 0 && item.score <= 100)).toBe(true);
    expect(record.evidence.length).toBeGreaterThan(0);
    expect(record.history[0]?.append_only).toBe(true);
    expect(record.confidence_explanation.supporting_evidence.length).toBeGreaterThan(0);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_runtime_health_engine).toBe(true);
  });

  it.each([
    ["MISSING_TELEMETRY", "MISSING_TELEMETRY"],
    ["CORRUPTED_OBSERVATION", "CORRUPTED_OBSERVATION"],
    ["INVALID_CONFIDENCE_VALUE", "INVALID_CONFIDENCE_VALUE"],
    ["STALE_RUNTIME_DATA", "STALE_RUNTIME_DATA"],
    ["RAPID_DEGRADATION", "RAPID_CONFIDENCE_DEGRADATION"],
    ["CONFIDENCE_OSCILLATION", "CONFIDENCE_OSCILLATION"],
    ["UNSTABLE_SCORING", "UNSTABLE_SCORING"],
    ["INCONSISTENT_WEIGHTING", "INCONSISTENT_WEIGHTING"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE"],
    ["GOVERNANCE_UNCERTAINTY", "GOVERNANCE_UNCERTAINTY"],
    ["CONSTITUTIONAL_UNCERTAINTY", "CONSTITUTIONAL_UNCERTAINTY"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [RuntimeConfidenceScenario, RuntimeConfidenceFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const record = evaluateRuntimeConfidence({ scenario });
      const validation = validateRuntimeConfidence(record);
      const certification = certifyRuntimeConfidence(record);

      expect(validation.valid).toBe(false);
      expect(validation.validation_state).toBe("FAIL");
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.ready_for_runtime_health_engine).toBe(false);
    },
  );

  it("records confidence degradation, velocity, and replayable explanations", () => {
    const record = evaluateRuntimeConfidence({ scenario: "RAPID_DEGRADATION" });

    expect(record.trend).toBe("DECLINING");
    expect(record.trend_velocity).toBeLessThan(0);
    expect(record.degradation_detected).toBe(true);
    expect(record.confidence_explanation.detected_risks).toContain("RAPID_CONFIDENCE_DEGRADATION");
    expect(record.confidence_explanation.trend_interpretation).toContain("degradation");
    expect(record.history[0]?.trend_snapshot).toBe("DECLINING");
  });

  it("replays confidence records with identical hashes and explanations", () => {
    const first = evaluateRuntimeConfidence();
    const second = evaluateRuntimeConfidence();
    const replay = replayRuntimeConfidence(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(first.record_hash).toBe(computeRuntimeConfidenceRecordHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_explanation_hash).toBe(first.confidence_explanation.explanation_hash);
    expect(replay.replay_failures).toEqual([]);
  });

  it("publishes operator confidence without granting execution authority", () => {
    const surface = publishRuntimeConfidence(evaluateRuntimeConfidence({ scenario: "GOVERNANCE_UNCERTAINTY" }));

    expect(surface.overall_confidence).toBeLessThan(90);
    expect(surface.risks).toContain("GOVERNANCE_UNCERTAINTY");
    expect(surface.weighted_scores.some((item) => item.component === "GOVERNANCE" && item.score < 60)).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });

  it("keeps baseline evaluation advisory-only", () => {
    const record = evaluateRuntimeConfidence();

    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.execution_modified).toBe(false);
    expect(record.governance_modified).toBe(false);
    expect(validateRuntimeConfidence(record).advisory_only).toBe(true);
  });
});
