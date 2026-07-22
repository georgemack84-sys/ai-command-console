import { describe, expect, it } from "vitest";
import {
  ALLOWED_PATTERN_EVIDENCE_SOURCES,
  computePatternIdentityHash,
  getPatternIntelligenceContractFoundation,
  replayPatternIntelligenceContract,
  SUPPORTED_PATTERN_TYPES,
  validatePatternIntelligenceContract,
} from "@/services/pattern-intelligence-contract";
import type { PatternContractFailure, PatternContractScenario } from "@/types/pattern-intelligence-contract";

describe("Mission Control Phase 10.4.1 Pattern Intelligence Contract", () => {
  it("publishes the pattern intelligence contract foundation", () => {
    const foundation = getPatternIntelligenceContractFoundation();

    expect(foundation.pattern_intelligence_contract_version).toBe("pattern-intelligence-contract/v1");
    expect(foundation.supported_pattern_types).toEqual(SUPPORTED_PATTERN_TYPES);
    expect(foundation.evidence_sources).toEqual(ALLOWED_PATTERN_EVIDENCE_SOURCES);
    expect(foundation.api_surface.load_contract).toBe("GET /pattern-intelligence-contract/contract");
    expect(foundation.result.validation.valid).toBe(true);
  });

  it("defines all supported pattern types and allowed evidence sources", () => {
    const result = validatePatternIntelligenceContract();

    expect(result.contract.supported_pattern_types).toContain("RECOMMENDATION_FAILURE_PATTERN");
    expect(result.contract.supported_pattern_types).toContain("STRATEGIC_OPPORTUNITY_PATTERN");
    expect(result.contract.evidence_rules).toContain("RECOMMENDATION_EFFECTIVENESS_ANALYSIS");
    expect(result.contract.evidence_rules).toContain("TRUTH_LEDGER");
    expect(result.schema.evidence_requirements.length).toBeGreaterThan(0);
  });

  it("requires certified Phase 10.3 output before pattern intelligence is valid", () => {
    const result = validatePatternIntelligenceContract();

    expect(result.certification.certification.certification_result).toBe("PASS");
    expect(result.validation.failures).not.toContain("PHASE_10_3_CERTIFICATION_REQUIRED");
  });

  it("preserves advisory-only and non-autonomous boundaries", () => {
    const result = validatePatternIntelligenceContract();

    expect(result.advisory_only).toBe(true);
    expect(result.governance_first).toBe(true);
    expect(result.autonomous_learning).toBe(false);
    expect(result.autonomous_execution).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_priorities).toBe(false);
    expect(result.modifies_confidence).toBe(false);
    expect(result.modifies_governance_policy).toBe(false);
  });

  it("generates deterministic immutable pattern identities", () => {
    const first = validatePatternIntelligenceContract();
    const second = validatePatternIntelligenceContract();

    expect(first.identity.pattern_id).toBe(second.identity.pattern_id);
    expect(first.identity.immutable).toBe(true);
    expect(computePatternIdentityHash(first.identity)).toBe(first.identity.integrity_hash);
  });

  it("enforces recurrence and confidence rules deterministically", () => {
    const result = validatePatternIntelligenceContract();

    expect(result.contract.recurrence_window_rules.minimum_observations).toBe(3);
    expect(result.identity.recurrence_observations).toBeGreaterThanOrEqual(result.contract.minimum_recurrence_threshold);
    expect(result.contract.confidence_rules.randomness_allowed).toBe(false);
    expect(result.identity.confidence_score).toBeGreaterThanOrEqual(result.contract.confidence_rules.minimum_overall_confidence);
  });

  it("validates replay, governance, operator visibility, tenant isolation, and integrity", () => {
    const result = validatePatternIntelligenceContract();

    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.operator_visible).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(replayPatternIntelligenceContract(result)).toBe(true);
  });

  it.each([
    ["PHASE_10_3_NOT_CERTIFIED", "PHASE_10_3_CERTIFICATION_REQUIRED"],
    ["UNSUPPORTED_PATTERN", "UNSUPPORTED_PATTERN_TYPE"],
    ["UNSUPPORTED_EVIDENCE", "UNSUPPORTED_EVIDENCE_SOURCE"],
    ["MISSING_EVIDENCE", "MANDATORY_EVIDENCE_MISSING"],
    ["LOW_RECURRENCE", "RECURRENCE_THRESHOLD_NOT_MET"],
    ["CONFIDENCE_FAILURE", "CONFIDENCE_CALCULATION_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_REVIEW_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_RULE_VIOLATED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_FAILED"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATED"],
    ["OPERATOR_VISIBILITY_GAP", "OPERATOR_VISIBILITY_INCOMPLETE"],
    ["INVALID_TRANSITION", "INVALID_LIFECYCLE_TRANSITION"],
    ["IDENTITY_MUTATION", "IDENTITY_MUTATION_DETECTED"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_DETECTED"],
    ["HIDDEN_INTELLIGENCE", "HIDDEN_INTELLIGENCE_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternContractScenario, PatternContractFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validatePatternIntelligenceContract({ scenario });

    expect(result.validation.valid).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_learning).toBe(false);
  });

  it("keeps missing evidence pending instead of valid", () => {
    const result = validatePatternIntelligenceContract({ scenario: "MISSING_EVIDENCE" });

    expect(result.contract.contract_status).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_sufficient).toBe(false);
  });

  it("detects contract replay tampering", () => {
    const result = validatePatternIntelligenceContract();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternIntelligenceContract(tampered)).toBe(false);
  });
});
