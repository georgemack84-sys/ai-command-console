import { describe, expect, it } from "vitest";

import {
  getStrategicRecommendationIntelligenceFoundationContract,
  replayStrategicRecommendationIntelligenceFoundation,
  runStrategicRecommendationIntelligenceFoundation,
  validateStrategicRecommendationIntelligenceFoundation,
} from "../../../services/strategic-recommendation-intelligence-foundation";

describe("strategic recommendation intelligence foundation", () => {
  it("runs deterministic certified foundation", () => {
    const first = runStrategicRecommendationIntelligenceFoundation();
    const second = runStrategicRecommendationIntelligenceFoundation();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.downstream_phase_12_enabled).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategicRecommendationIntelligenceFoundation(first).valid).toBe(true);
    expect(replayStrategicRecommendationIntelligenceFoundation(first)).toBe(true);
  });

  it("preserves strategic doctrine", () => {
    const bundle = getStrategicRecommendationIntelligenceFoundationContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.derived_authority_supported).toBe(false);
    expect(bundle.doctrine.src_018_origin_required).toBe(true);
    expect(bundle.doctrine.sri_005_single_source_of_truth_required).toBe(true);
    expect(bundle.doctrine.replay_required).toBe(true);
  });

  it("registers bounded vocabularies and all artifact families", () => {
    const result = runStrategicRecommendationIntelligenceFoundation();

    expect(result.vocabulary_registry.bounded).toBe(true);
    expect(result.vocabulary_registry.lifecycle_states).toHaveLength(9);
    expect(result.artifact_registry).toHaveLength(13);
    expect(result.identities).toHaveLength(13);
    expect(result.artifact_registry.every((artifact) => artifact.authoritative && artifact.authority === "Advisory")).toBe(true);
  });

  it("implements SRC-018 origins and SRI-005 source of truth", () => {
    const result = runStrategicRecommendationIntelligenceFoundation();

    expect(result.origin_registry.every((origin) => origin.immutable && origin.lineage_complete && origin.originating_policy === "SRC-018")).toBe(true);
    expect(result.source_of_truth_registry.some((row) => row.derived_view)).toBe(true);
    expect(result.source_of_truth_registry.every((row) => !row.derived_view || !row.authoritative)).toBe(true);
    expect(result.source_of_truth_registry.filter((row) => row.authoritative && !row.derived_view)).toHaveLength(13);
  });

  it("validates lifecycle transitions and referential integrity", () => {
    const result = runStrategicRecommendationIntelligenceFoundation();

    expect(result.lifecycle_transition_registry.complete).toBe(true);
    expect(result.lifecycle_transition_registry.transitions.every((transition) => transition.documented && transition.approval_required)).toBe(true);
    expect(result.referential_integrity.unresolved_references).toHaveLength(0);
    expect(result.referential_integrity.replay_references_valid).toBe(true);
  });

  it("runs the foundation certification suite", () => {
    const result = runStrategicRecommendationIntelligenceFoundation();

    expect(result.certification.tests).toHaveLength(15);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for blocking foundation violations", () => {
    for (const scenario of ["VOCABULARY_UNBOUNDED", "IDENTITY_NONDETERMINISTIC", "DUPLICATE_CANONICAL_ARTIFACT", "REGISTRY_INCOMPLETE", "ORIGIN_CONTRACT_BROKEN", "DERIVED_VIEW_AUTHORITATIVE", "REFERENTIAL_INTEGRITY_BROKEN", "TENANT_ISOLATION_BREACH"] as const) {
      const result = runStrategicRecommendationIntelligenceFoundation({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.downstream_phase_12_enabled).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateStrategicRecommendationIntelligenceFoundation(result).valid).toBe(false);
    }
  });
});
