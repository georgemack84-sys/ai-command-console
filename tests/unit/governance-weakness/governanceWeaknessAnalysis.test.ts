import { describe, expect, it } from "vitest";
import {
  aggregateWeaknessInputs,
  analyzeGovernanceWeakness,
  assignWeaknessReviewPriority,
  buildGovernanceWeaknessDoctrine,
  buildGovernanceWeaknessMappingRules,
  buildGovernanceWeaknessObservabilitySurface,
  buildGovernanceWeaknessRecord,
  calculateWeaknessConfidence,
  computeGovernanceWeaknessHash,
  generateGovernanceWeaknessId,
  replayGovernanceWeakness,
  transitionGovernanceWeaknessState,
  validateGovernanceWeaknessRecord,
} from "@/services/governance-weakness";
import { detectViolationPatterns } from "@/services/violation-patterns";
import type { GovernanceWeaknessCategory, GovernanceWeaknessRecord } from "@/types/governance-weakness";

function valid(overrides: Partial<GovernanceWeaknessRecord> = {}) {
  return buildGovernanceWeaknessRecord(overrides);
}

describe("Mission Control Phase 7C.3 Governance Weakness Analysis", () => {
  it("defines advisory-only weakness doctrine, categories, types, and mapping rules", () => {
    const doctrine = buildGovernanceWeaknessDoctrine();
    expect(doctrine.principles).toContain("advisory-only");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.prohibited_behaviors).toContain("risk scoring");
    expect(doctrine.allowed_categories).toContain("WEAK_CONTROL");
    expect(doctrine.allowed_review_priorities).toContain("IMMEDIATE_REVIEW");
    expect(buildGovernanceWeaknessMappingRules().some((rule) => rule.pattern_type === "POLICY_DRIFT" && rule.weakness_category === "AMBIGUOUS_POLICY")).toBe(true);
  });

  it("aggregates and deduplicates violation pattern inputs", () => {
    const patterns = detectViolationPatterns().patterns.slice(0, 1);
    const aggregated = aggregateWeaknessInputs([patterns[0], patterns[0]]);
    expect(aggregated).toHaveLength(1);
    expect(aggregated[0].violation_pattern_id).toBe(patterns[0].violation_pattern_id);
  }, 30000);

  it("maps violation patterns into all required weakness categories", () => {
    const result = analyzeGovernanceWeakness();
    const categories = result.weaknesses.map((weakness) => weakness.weakness_category);
    const required: GovernanceWeaknessCategory[] = ["WEAK_CONTROL", "MISSING_CONTROL", "AMBIGUOUS_POLICY", "UNRESOLVED_POLICY_CONFLICT", "AUTHORITY_BOUNDARY_WEAKNESS", "ESCALATION_PATH_WEAKNESS", "OVERSIGHT_DEFICIENCY", "REPEATED_EXCEPTION_DEPENDENCY", "CERTIFICATION_GAP", "REPLAY_GAP", "LINEAGE_GAP", "EVIDENCE_GAP", "VISIBILITY_GAP", "TENANT_BOUNDARY_WEAKNESS"];
    for (const category of required) expect(categories).toContain(category);
  }, 30000);

  it("misses weak controls when supporting patterns are absent", () => {
    const patterns = detectViolationPatterns().patterns.filter((pattern) => pattern.pattern_type !== "RECURRING_POLICY_VIOLATION");
    const result = analyzeGovernanceWeakness({ patterns });
    expect(result.weaknesses.some((weakness) => weakness.weakness_category === "WEAK_CONTROL")).toBe(false);
  });

  it("identifies control, missing-control, and governance gap weaknesses", () => {
    const weaknesses = analyzeGovernanceWeakness().weaknesses;
    expect(weaknesses.some((weakness) => weakness.weakness_type === "CONTROL_ALLOWS_RECURRING_VIOLATIONS")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "MISSING_CONTROL")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_type === "POLICY_WITHOUT_ESCALATION_RULE")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_type === "VIOLATION_WITHOUT_REVIEW_PATH")).toBe(true);
  }, 30000);

  it("identifies repeated exception dependency and detects absence", () => {
    expect(analyzeGovernanceWeakness().weaknesses.some((weakness) => weakness.weakness_category === "REPEATED_EXCEPTION_DEPENDENCY")).toBe(true);
    const patterns = detectViolationPatterns().patterns.filter((pattern) => pattern.pattern_type !== "EXCEPTION_RECURRENCE");
    expect(analyzeGovernanceWeakness({ patterns }).weaknesses.some((weakness) => weakness.weakness_category === "REPEATED_EXCEPTION_DEPENDENCY")).toBe(false);
  });

  it("identifies oversight, policy ambiguity, authority ambiguity, and unresolved conflict", () => {
    const weaknesses = analyzeGovernanceWeakness().weaknesses;
    expect(weaknesses.some((weakness) => weakness.weakness_category === "OVERSIGHT_DEFICIENCY")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "AMBIGUOUS_POLICY")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_type === "AUTHORITY_SCOPE_AMBIGUOUS" || weakness.weakness_type === "AUTHORITY_BOUNDARY_DRIFT_RECURRING")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "UNRESOLVED_POLICY_CONFLICT")).toBe(true);
  });

  it("identifies replay, lineage, evidence, certification, visibility, containment, and tenant weaknesses", () => {
    const weaknesses = analyzeGovernanceWeakness().weaknesses;
    expect(weaknesses.some((weakness) => weakness.weakness_category === "REPLAY_GAP")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "LINEAGE_GAP")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "EVIDENCE_GAP")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "CERTIFICATION_GAP")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "VISIBILITY_GAP")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_type === "CONTAINMENT_PATTERN_WITHOUT_REVIEW")).toBe(true);
    expect(weaknesses.some((weakness) => weakness.weakness_category === "TENANT_BOUNDARY_WEAKNESS")).toBe(true);
  });

  it("misses replay and certification gaps when source patterns are absent", () => {
    const patterns = detectViolationPatterns().patterns.filter((pattern) => !["REPLAY_MISMATCH_RECURRENCE", "CERTIFICATION_FAILURE_RECURRENCE"].includes(pattern.pattern_type));
    const result = analyzeGovernanceWeakness({ patterns });
    expect(result.weaknesses.some((weakness) => weakness.weakness_category === "REPLAY_GAP")).toBe(false);
    expect(result.weaknesses.some((weakness) => weakness.weakness_category === "CERTIFICATION_GAP")).toBe(false);
  });

  it("calculates reproducible confidence and review priority", () => {
    const weakness = valid();
    const confidence = calculateWeaknessConfidence(weakness.supporting_patterns, weakness.weakness_indicators);
    expect(weakness.confidence_score).toBe(confidence.confidence_score);
    expect(weakness.confidence_basis.supporting_pattern_count).toBeGreaterThan(0);
    expect(assignWeaknessReviewPriority("AUTHORITY_BOUNDARY_WEAKNESS", "STANDARD_REVIEW", weakness.weakness_indicators)).toBe("IMMEDIATE_REVIEW");
  }, 30000);

  it("builds and validates a complete weakness record", () => {
    const record = valid();
    const result = validateGovernanceWeaknessRecord(record);
    expect(record.contract_version).toBe("GOV-WEAKNESS-CONTRACT-V1");
    expect(result.validation_state).toBe("VALID");
    expect(result.errors).toEqual([]);
  });

  it("generates deterministic tenant-bound identities and hashes", () => {
    const record = valid();
    expect(generateGovernanceWeaknessId("tenant_alpha", "mission_query_layer", "WEAK_CONTROL", ["VPAT-1"])).toBe(generateGovernanceWeaknessId("tenant_alpha", "mission_query_layer", "WEAK_CONTROL", ["VPAT-1"]));
    expect(computeGovernanceWeaknessHash(record)).toBe(record.weakness_hash);
  }, 30000);

  it("rejects invalid category, missing tenant, priority mismatch, and missing pattern support", () => {
    expect(validateGovernanceWeaknessRecord(valid({ weakness_category: "BAD" as never })).errors.some((error) => error.reason === "INVALID_WEAKNESS_CATEGORY")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ recommended_review_priority: "LATER" as never })).errors.some((error) => error.reason === "INVALID_REVIEW_PRIORITY")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ supporting_patterns: [] })).errors.some((error) => error.reason === "SUPPORTING_PATTERNS_MISSING")).toBe(true);
  });

  it("fails closed for confidence, models, evidence, lineage, replay, and explanation", () => {
    expect(validateGovernanceWeaknessRecord(valid({ confidence_score: undefined as never })).errors.some((error) => error.reason === "CONFIDENCE_SCORE_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ confidence_score: 2 })).errors.some((error) => error.reason === "CONFIDENCE_OUT_OF_RANGE")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ confidence_basis: { ...valid().confidence_basis, replay_status: undefined as never } })).errors.some((error) => error.reason === "CONFIDENCE_BASIS_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ mapping_model_version: "" as never })).errors.some((error) => error.reason === "MAPPING_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ analysis_model_version: "" as never })).errors.some((error) => error.reason === "ANALYSIS_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ confidence_model_version: "" as never })).errors.some((error) => error.reason === "CONFIDENCE_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ lineage_refs: [] })).validation_state).toBe("LINEAGE_REFERENCE_MISSING");
    expect(validateGovernanceWeaknessRecord(valid({ replay_refs: [] })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
    expect(validateGovernanceWeaknessRecord(valid({ explanation: "unsupported claim" })).errors.some((error) => error.reason === "UNSUPPORTED_EXPLANATION")).toBe(true);
  }, 30000);

  it("enforces tenant isolation and identity immutability", () => {
    const record = valid();
    expect(validateGovernanceWeaknessRecord(valid({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateGovernanceWeaknessRecord({ ...record, governance_weakness_id: "GWEAK-MUTATED" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
    expect(validateGovernanceWeaknessRecord({ ...record, tenant_id: "tenant_beta" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
  });

  it("validates lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionGovernanceWeaknessState(valid(), "READY_FOR_SCORING").validation_state).toBe("VALID");
    expect(transitionGovernanceWeaknessState(valid({ weakness_state: "ARCHIVED" }), "IDENTIFIED").errors.some((error) => error.reason === "INVALID_STATE_TRANSITION")).toBe(true);
    expect(validateGovernanceWeaknessRecord(valid({ weakness_state: "ACTIVE" as never })).validation_state).toBe("INVALID_STATE");
  });

  it("replays weakness records deterministically and detects tampering", () => {
    const record = valid();
    expect(replayGovernanceWeakness(record).validation_state).toBe("PASS");
    expect(validateGovernanceWeaknessRecord({ ...record, weakness_hash: "tampered" }).errors.some((error) => error.reason === "WEAKNESS_HASH_MISMATCH")).toBe(true);
  });

  it("builds complete operator observability", () => {
    const surface = buildGovernanceWeaknessObservabilitySurface(valid());
    expect(surface.weakness_category).toBe("WEAK_CONTROL");
    expect(surface.model_versions.analysis_model_version).toBe("GOV-WEAKNESS-ANALYSIS-V1");
    expect(surface.supporting_pattern_ids.length).toBeGreaterThan(0);
    expect(surface.validation_failures).toEqual([]);
  });
});
