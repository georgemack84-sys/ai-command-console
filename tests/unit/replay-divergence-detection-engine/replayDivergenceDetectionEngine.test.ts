import { describe, expect, it } from "vitest";
import {
  detectReplayDivergence,
  getReplayDivergenceDetectionFoundation,
  replayReplayDivergenceDetection,
} from "@/services/replay-divergence-detection-engine";
import type {
  ReplayDivergenceCategory,
  ReplayDivergenceComparisonScope,
  ReplayDivergenceFailure,
  ReplayDivergenceScenario,
} from "@/types/replay-divergence-detection-engine";

describe("Mission Control Phase 13.6 Replay Divergence Enforcement", () => {
  const expectedScopes: readonly ReplayDivergenceComparisonScope[] = [
    "REPLAY_INPUTS",
    "REPLAY_POLICIES",
    "REPLAY_MODELS",
    "REPLAY_EXECUTION_ORDERING",
    "REPLAY_OUTPUTS",
    "REPLAY_EVIDENCE",
  ];

  const expectedCategories: readonly ReplayDivergenceCategory[] = [
    "INPUT_DIVERGENCE",
    "POLICY_DIVERGENCE",
    "MODEL_DIVERGENCE",
    "ORDERING_DIVERGENCE",
    "OUTPUT_DIVERGENCE",
    "UNEXPLAINED_DIVERGENCE",
  ];

  it("publishes the versioned replay divergence contract with a closed vocabulary", () => {
    const foundation = getReplayDivergenceDetectionFoundation();

    expect(foundation.replay_divergence_detection_engine_version).toBe("replay-divergence-detection-engine/v2");
    expect(foundation.contract.contract_version).toBe("13.6.1");
    expect(foundation.contract.identity_deterministic).toBe(true);
    expect(foundation.contract.vocabulary_immutable).toBe(true);
    expect(foundation.contract.closed_classification_vocabulary).toEqual(expectedCategories);
    expect(foundation.comparison_scopes).toEqual(expectedScopes);
    expect(foundation.divergence_categories).toEqual(expectedCategories);
    expect(foundation.divergence_types).toEqual(expectedCategories);
    expect(foundation.api_surface.detect_divergence).toBe("POST /replay-divergence-detection-engine/detect");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /replay-divergence-detection-engine/contract");
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(false);
    expect(foundation.result.engine_identifier).toBe("ReplayDivergenceDetectionEngine");
  });

  it("detects divergences deterministically with stable replay hashes", () => {
    const first = detectReplayDivergence();
    const second = detectReplayDivergence();

    expect(first.comparisons.map((item) => item.integrity_hash)).toEqual(second.comparisons.map((item) => item.integrity_hash));
    expect(first.records.map((item) => item.integrity_hash)).toEqual(second.records.map((item) => item.integrity_hash));
    expect(first.evidence_registry.map((item) => item.integrity_hash)).toEqual(second.evidence_registry.map((item) => item.integrity_hash));
    expect(first.divergence_ledger.map((item) => item.integrity_hash)).toEqual(second.divergence_ledger.map((item) => item.integrity_hash));
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayReplayDivergenceDetection(first)).toBe(true);
  });

  it("compares every required replay detection scope", () => {
    const comparisons = detectReplayDivergence().comparisons;

    expect(comparisons.map((item) => item.scope)).toEqual(expectedScopes);
    expect(comparisons.find((item) => item.scope === "REPLAY_INPUTS")?.compared_fields).toContain("assessment_inputs");
    expect(comparisons.find((item) => item.scope === "REPLAY_POLICIES")?.compared_fields).toContain("certified_policy_manifest");
    expect(comparisons.find((item) => item.scope === "REPLAY_MODELS")?.compared_fields).toContain("certified_model_versions");
    expect(comparisons.find((item) => item.scope === "REPLAY_EXECUTION_ORDERING")?.compared_fields).toContain("certified_evaluation_sequence");
    expect(comparisons.find((item) => item.scope === "REPLAY_OUTPUTS")?.compared_fields).toContain("certified_outputs");
    expect(comparisons.find((item) => item.scope === "REPLAY_EVIDENCE")?.compared_fields).toContain("comparison_evidence_refs");
  });

  it("generates canonical ReplayDivergenceRecord objects for detected divergences", () => {
    const result = detectReplayDivergence({ scenario: "POLICY_DIVERGENCE" });

    expect(result.records).toHaveLength(1);
    expect(result.records.every((record) => record.replay_divergence_id.startsWith("replay_divergence_"))).toBe(true);
    expect(result.records.every((record) => record.assessment_id)).toBe(true);
    expect(result.records.every((record) => record.certification_id)).toBe(true);
    expect(result.records.every((record) => record.replay_session_id)).toBe(true);
    expect(result.records.every((record) => expectedCategories.includes(record.divergence_category))).toBe(true);
    expect(result.records.every((record) => record.expected_state)).toBe(true);
    expect(result.records.every((record) => record.observed_state)).toBe(true);
    expect(result.records.every((record) => record.affected_artifacts.length > 0)).toBe(true);
    expect(result.records.every((record) => record.affected_evidence_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.policy_manifest_ref)).toBe(true);
    expect(result.records.every((record) => record.model_version_ref)).toBe(true);
    expect(result.records.every((record) => record.ordering_manifest_ref)).toBe(true);
    expect(result.records.every((record) => record.explanation)).toBe(true);
    expect(result.records.every((record) => record.origin_ref === "phase-13.6-replay-divergence-enforcement")).toBe(true);
    expect(result.records.every((record) => record.integrity_hash)).toBe(true);
  });

  it("preserves immutable divergence evidence and append-only ledger entries", () => {
    const result = detectReplayDivergence({ scenario: "OUTPUT_DIVERGENCE" });

    expect(result.evidence_registry).toHaveLength(result.records.length);
    expect(result.evidence_registry.every((record) => record.immutable)).toBe(true);
    expect(result.evidence_registry.every((record) => record.lineage_complete)).toBe(true);
    expect(result.evidence_registry.every((record) => record.evidence_hashes.length > 0)).toBe(true);
    expect(result.divergence_ledger).toHaveLength(result.records.length);
    expect(result.divergence_ledger.every((entry) => entry.append_only && entry.immutable && entry.replayable)).toBe(true);
    expect(result.divergence_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
  });

  it("passes only when every divergence is evaluated, explained, valid, and replayable", () => {
    const result = detectReplayDivergence();

    expect(result.outcome).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.every_divergence_detected).toBe(true);
    expect(result.every_divergence_classified).toBe(true);
    expect(result.every_divergence_attributed).toBe(true);
    expect(result.every_divergence_evaluated).toBe(true);
    expect(result.replay_validation.constitutionally_valid).toBe(true);
    expect(result.unexplained_divergence_fail_closed).toBe(true);
    expect(result.authorizes_certification).toBe(true);
  });

  it("publishes constitutional validation metrics and replay reconstruction artifacts", () => {
    const result = detectReplayDivergence();

    expect(result.metrics.comparison_scopes_evaluated).toBe(6);
    expect(result.metrics.divergences_detected).toBe(0);
    expect(result.metrics.divergence_records_generated).toBe(0);
    expect(result.metrics.input_divergences).toBe(0);
    expect(result.metrics.policy_divergences).toBe(0);
    expect(result.metrics.model_divergences).toBe(0);
    expect(result.metrics.ordering_divergences).toBe(0);
    expect(result.metrics.output_divergences).toBe(0);
    expect(result.metrics.unexplained_divergences).toBe(0);
    expect(result.metrics.explainability_rate).toBe(1);
    expect(result.replay_service.reproduced_classifications).toEqual([]);
    expect(result.replay_service.reproduced_certification_behavior).toBe("PASS");
    expect(result.replay_integrity_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.simulation_validation_ledger_entry_hash).toMatch(/[a-f0-9]{64}/);
  });

  it.each([
    ["INPUT_DIVERGENCE", "INPUT_DIVERGENCE_UNEXPLAINED"],
    ["POLICY_DIVERGENCE", "POLICY_DIVERGENCE_UNEXPLAINED"],
    ["MODEL_DIVERGENCE", "MODEL_DIVERGENCE_UNEXPLAINED"],
    ["ORDERING_DIVERGENCE", "ORDERING_DIVERGENCE_UNEXPLAINED"],
    ["OUTPUT_DIVERGENCE", "OUTPUT_DIVERGENCE_UNEXPLAINED"],
    ["UNEXPLAINED_DIVERGENCE", "UNEXPLAINED_REPLAY_DIVERGENCE"],
    ["EVIDENCE_REGISTRY_INCOMPLETE", "EVIDENCE_REGISTRY_INCOMPLETE"],
    ["REPLAY_NONDETERMINISTIC", "REPLAY_NONDETERMINISTIC"],
    ["LEDGER_INTEGRITY_FAILURE", "LEDGER_INTEGRITY_FAILURE"],
  ] as const)("fails closed for %s", (scenario: ReplayDivergenceScenario, failure: ReplayDivergenceFailure) => {
    const result = detectReplayDivergence({ scenario });

    expect(result.outcome).toBe("NON_PASSING");
    expect(result.failures).toContain(failure);
    expect(result.authorizes_certification).toBe(false);
    expect(result.unexplained_divergence_fail_closed).toBe(true);
    expect(result.records.some((record) => record.divergence_status === "ENFORCED")).toBe(true);
    expect(result.replay_validation.certification_outcome).toBe("NON_PASSING");
    expect(replayReplayDivergenceDetection(result)).toBe(scenario !== "LEDGER_INTEGRITY_FAILURE");
  });

  it("detects nested replay tampering", () => {
    const result = detectReplayDivergence();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0],
          observed_state: "tampered-observed-state",
        },
        ...result.records.slice(1),
      ],
    };

    expect(replayReplayDivergenceDetection(tampered)).toBe(false);
  });
});
