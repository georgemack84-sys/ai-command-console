import { describe, expect, it } from "vitest";
import {
  computePatternReplayHash,
  getPatternReplayExplainabilityFoundation,
  replayPatternExplainability,
  verifyPatternReplayExplainability,
} from "@/services/pattern-replay-explainability";
import type { PatternReplayFailure, PatternReplayScenario } from "@/types/pattern-replay-explainability";

describe("Mission Control Phase 10.4.8 Pattern Replay & Explainability", () => {
  it("publishes the pattern replay explainability foundation", () => {
    const foundation = getPatternReplayExplainabilityFoundation();

    expect(foundation.pattern_replay_explainability_version).toBe("pattern-replay-explainability/v1");
    expect(foundation.api_surface.replay_pattern).toBe("POST /pattern-replay-explainability/replay");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("reconstructs pattern replay deterministically", () => {
    const first = replayPatternExplainability();
    const second = replayPatternExplainability();

    expect(first.replay_records[0].replay_id).toBe(second.replay_records[0].replay_id);
    expect(first.replay_records[0].reconstructed_ledger_sequence).toBe(second.replay_records[0].reconstructed_ledger_sequence);
    expect(first.replay_records[0].reconstructed_ledger_hash).toBe(second.replay_records[0].reconstructed_ledger_hash);
  });

  it("reconstructs pattern identity, evidence, recurrence, scoring, governance, and ledger sequence", () => {
    const result = replayPatternExplainability();
    const record = result.replay_records[0];

    expect(record.reconstructed_pattern_refs.length).toBeGreaterThan(0);
    expect(record.reconstructed_evidence_refs.length).toBeGreaterThan(0);
    expect(record.reconstructed_recurrence_refs.length).toBeGreaterThan(0);
    expect(record.reconstructed_scoring_refs.length).toBeGreaterThan(0);
    expect(record.reconstructed_governance_refs.length).toBeGreaterThan(0);
    expect(record.reconstructed_ledger_sequence).toBe(1);
    expect(record.replay_status).toBe("REPLAY_PASS");
  });

  it("generates complete deterministic explanations for every replay stage", () => {
    const result = replayPatternExplainability();
    const explanation = result.explainability_artifacts[0];

    expect(explanation.complete).toBe(true);
    expect(explanation.opaque).toBe(false);
    expect(explanation.why_detected).toContain("detected");
    expect(explanation.why_validated).toContain("Validation");
    expect(explanation.why_scored).toContain("Scoring");
    expect(explanation.why_governance_reviewed).toContain("Governance");
    expect(explanation.why_replay_succeeded).toContain("REPLAY_PASS");
    expect(explanation.why_integrity_verified).toContain("Ledger hash");
  });

  it("builds deterministic historical timelines and evidence navigation maps", () => {
    const result = replayPatternExplainability();
    const sequences = result.timeline_events.map((event) => event.sequence);
    const evidenceMap = result.evidence_navigation_maps[0];

    expect(sequences).toEqual([1, 2, 3, 4, 5, 6]);
    expect(evidenceMap.integrity_verified).toBe(true);
    expect(evidenceMap.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(evidenceMap.replay_evidence_refs.length).toBeGreaterThan(0);
  });

  it("compares replay output with the original ledger state", () => {
    const result = replayPatternExplainability();
    const comparison = result.comparisons[0];

    expect(comparison.identity_match).toBe(true);
    expect(comparison.evidence_match).toBe(true);
    expect(comparison.recurrence_match).toBe(true);
    expect(comparison.scoring_match).toBe(true);
    expect(comparison.governance_match).toBe(true);
    expect(comparison.ledger_sequence_match).toBe(true);
    expect(comparison.integrity_hash_match).toBe(true);
    expect(comparison.replay_pass).toBe(true);
  });

  it("keeps replay advisory-only, immutable, and non-mutating", () => {
    const result = replayPatternExplainability();
    const record = result.replay_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.mutates_history).toBe(false);
    expect(result.mutates_patterns).toBe(false);
    expect(result.autonomous_learning).toBe(false);
    expect(record.mutates_history).toBe(false);
    expect(record.autonomous_learning).toBe(false);
  });

  it("creates stable replay hashes and verifies replay output", () => {
    const result = replayPatternExplainability();
    const record = result.replay_records[0];

    expect(computePatternReplayHash(record)).toBe(record.integrity_hash);
    expect(verifyPatternReplayExplainability(result)).toBe(true);
  });

  it("records immutable append-only explainability registry entries", () => {
    const result = replayPatternExplainability();

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.replay_refs).toEqual(result.replay_records.map((record) => record.replay_id));
    expect(result.registry.explainability_refs).toEqual(result.explainability_artifacts.map((artifact) => artifact.explainability_id));
  });

  it.each([
    ["MISSING_LEDGER_INPUT", "LEDGER_INPUT_MISSING"],
    ["UNCERTIFIED_LEDGER_INPUT", "LEDGER_INPUT_UNCERTIFIED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_UNAVAILABLE"],
    ["RECURRENCE_MISMATCH", "RECURRENCE_MISMATCH"],
    ["SCORING_MISMATCH", "SCORING_MISMATCH"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH"],
    ["TIMELINE_INCONSISTENCY", "TIMELINE_INCONSISTENCY"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["OPAQUE_ARTIFACT", "OPAQUE_ARTIFACT_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["HISTORICAL_MUTATION", "HISTORICAL_MUTATION_DETECTED"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternReplayScenario, PatternReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const result = replayPatternExplainability({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = replayPatternExplainability({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_available).toBe(false);
  });

  it("detects replay tampering during verification", () => {
    const result = replayPatternExplainability();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(verifyPatternReplayExplainability(tampered)).toBe(false);
  });
});
