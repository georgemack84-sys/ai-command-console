import { describe, expect, it } from "vitest";
import {
  buildPatternCandidates,
  computePatternCandidateHash,
  getPatternCandidateBuilderFoundation,
  replayPatternCandidateBuilder,
  SUPPORTED_CANDIDATE_WINDOWS,
  SUPPORTED_HISTORICAL_SOURCES,
} from "@/services/pattern-candidate-builder";
import type { PatternCandidateFailure, PatternCandidateScenario } from "@/types/pattern-candidate-builder";

describe("Mission Control Phase 10.4.2 Pattern Candidate Builder", () => {
  it("publishes the pattern candidate builder foundation", () => {
    const foundation = getPatternCandidateBuilderFoundation();

    expect(foundation.pattern_candidate_builder_version).toBe("pattern-candidate-builder/v1");
    expect(foundation.supported_windows).toEqual(SUPPORTED_CANDIDATE_WINDOWS);
    expect(foundation.supported_sources).toEqual(SUPPORTED_HISTORICAL_SOURCES);
    expect(foundation.api_surface.build_candidates).toBe("POST /pattern-candidate-builder/build");
    expect(foundation.result.validation.state).toBe("READY_FOR_VALIDATION");
  });

  it("aggregates certified historical records deterministically", () => {
    const first = buildPatternCandidates();
    const second = buildPatternCandidates();

    expect(first.aggregation.certified_only).toBe(true);
    expect(first.aggregation.normalized).toBe(true);
    expect(first.aggregation.record_refs).toEqual(second.aggregation.record_refs);
    expect(first.aggregation.ordering_key).toBe(second.aggregation.ordering_key);
  });

  it("creates deterministic windows and grouping keys", () => {
    const result = buildPatternCandidates();
    const candidate = result.candidates[0];

    expect(result.window.deterministic_boundaries).toBe(true);
    expect(result.window.replayable).toBe(true);
    expect(candidate.grouping_key).toHaveLength(24);
    expect(candidate.recurrence_window.window_id).toBe(result.window.window_id);
  });

  it("builds candidate records without validating pattern truth or actionability", () => {
    const result = buildPatternCandidates();
    const candidate = result.candidates[0];

    expect(candidate.candidate_state).toBe("READY_FOR_VALIDATION");
    expect(candidate.advisory_only).toBe(true);
    expect(candidate.validates_pattern_truth).toBe(false);
    expect(candidate.actionable).toBe(false);
    expect(result.validates_pattern_truth).toBe(false);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
  });

  it("enforces recurrence and evidence thresholds", () => {
    const result = buildPatternCandidates();
    const candidate = result.candidates[0];

    expect(candidate.recurrence_count).toBeGreaterThanOrEqual(result.contract_result.contract.minimum_recurrence_threshold);
    expect(candidate.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.validation.recurrence_threshold_met).toBe(true);
    expect(result.validation.evidence_sufficient).toBe(true);
  });

  it("generates immutable candidate identities and an append-only registry", () => {
    const result = buildPatternCandidates();
    const candidate = result.candidates[0];

    expect(computePatternCandidateHash(candidate)).toBe(candidate.integrity_hash);
    expect(candidate.immutable).toBe(true);
    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.candidate_refs).toEqual([candidate.candidate_id]);
    expect(result.registry.grouping_index[candidate.grouping_key]).toEqual([candidate.candidate_id]);
  });

  it("validates replay, governance, tenant isolation, and integrity", () => {
    const result = buildPatternCandidates();

    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.governance_preserved).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(replayPatternCandidateBuilder(result)).toBe(true);
  });

  it.each([
    ["CONTRACT_INVALID", "PATTERN_CONTRACT_INVALID"],
    ["UNCERTIFIED_HISTORY", "UNCERTIFIED_HISTORICAL_RECORDS"],
    ["INSUFFICIENT_HISTORY", "INSUFFICIENT_HISTORY"],
    ["LOW_RECURRENCE", "RECURRENCE_THRESHOLD_NOT_MET"],
    ["MISSING_EVIDENCE", "MANDATORY_EVIDENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_BOUNDARY_VIOLATED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_RESTRICTION_VIOLATED"],
    ["UNSUPPORTED_SOURCE", "UNSUPPORTED_HISTORICAL_SOURCE"],
    ["INVALID_TRANSITION", "INVALID_LIFECYCLE_TRANSITION"],
    ["IDENTITY_MUTATION", "CANDIDATE_IDENTITY_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternCandidateScenario, PatternCandidateFailure][])("fails closed for %s", (scenario, failure) => {
    const result = buildPatternCandidates({ scenario });

    expect(result.validation.valid).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.validates_pattern_truth).toBe(false);
  });

  it("keeps missing evidence pending instead of ready", () => {
    const result = buildPatternCandidates({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_sufficient).toBe(false);
  });

  it("detects candidate builder tampering during replay", () => {
    const result = buildPatternCandidates();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternCandidateBuilder(tampered)).toBe(false);
  });
});
