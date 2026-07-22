import { describe, expect, it } from "vitest";
import { createDecisionInput, DECISION_SCHEMA_TYPES } from "@/services/decision-schema";
import {
  DECISION_CLASSIFICATION_REGISTRY,
  buildDecisionClassificationObservability,
  classifyDecision,
  getDecisionClassification,
  getDecisionClassificationFramework,
  resolveBehaviorProfile,
  validateDecisionClassification,
  validateDecisionTaxonomy,
} from "@/services/decision-classification";
import type { DecisionClassificationFailure, DecisionClassificationInput } from "@/types/decision-classification";
import type { DecisionType } from "@/types/decision-schema";

describe("Mission Control Phase 9.1.3 Decision Classification Framework", () => {
  it("publishes an active classification registry for every canonical decision category", () => {
    const framework = getDecisionClassificationFramework();

    expect(framework.taxonomy_version).toBe("decision-taxonomy/v9.1.3");
    expect(Object.keys(DECISION_CLASSIFICATION_REGISTRY)).toEqual([...DECISION_SCHEMA_TYPES]);
    expect(framework.taxonomy.valid).toBe(true);
    expect(framework.taxonomy.category_count).toBe(12);
    expect(framework.validation.validation_state).toBe("VALID");
  });

  it.each([...DECISION_SCHEMA_TYPES])("defines complete behavior, governance, constitutional, replay, lineage, and authority profiles for %s", (category) => {
    const record = getDecisionClassification(category);
    const validation = validateDecisionClassification(record);

    expect(record?.category_name).toBe(category);
    expect(record?.status).toBe("ACTIVE");
    expect(record?.authority_level).toBe("ADVISORY_ONLY");
    expect(record?.behavioral_profile.produces.length).toBeGreaterThan(0);
    expect(record?.governance_requirements.length).toBeGreaterThan(0);
    expect(record?.constitutional_requirements.length).toBeGreaterThan(0);
    expect(record?.replay_requirements.length).toBeGreaterThan(0);
    expect(record?.lineage_requirements.length).toBeGreaterThan(0);
    expect(validation.validation_state).toBe("VALID");
  });

  it("classifies a validated decision input into exactly one deterministic primary category", () => {
    const input = createDecisionInput({ decision_type: "RISK_RESPONSE" });
    const first = classifyDecision({ decision_input: input });
    const second = classifyDecision({ decision_input: input });

    expect(first.primary_category).toBe("RISK_RESPONSE");
    expect(first.related_categories).toEqual([]);
    expect(first.classification_hash).toBe(second.classification_hash);
    expect(validateDecisionClassification(first, input).checks.exactly_one_primary_category).toBe(true);
  });

  it("supports deterministic explicit classification when the category matches the registry", () => {
    const classification = classifyDecision({ category: "MISSION_HEALTH_ACTION" });
    const profile = resolveBehaviorProfile("MISSION_HEALTH_ACTION");

    expect(classification.primary_category).toBe("MISSION_HEALTH_ACTION");
    expect(profile?.produces).toContain("health recommendation");
    expect(validateDecisionClassification(classification).validation_state).toBe("VALID");
  });

  it("inherits governance, constitutional, replay, lineage, integrity, tenant isolation, advisory-only, and fail-closed guarantees", () => {
    const classification = classifyDecision();

    expect(classification.inherited_guarantees).toEqual([
      "governance validation",
      "constitutional validation",
      "replay requirements",
      "lineage requirements",
      "integrity requirements",
      "tenant isolation",
      "advisory-only behavior",
      "fail-closed enforcement",
    ]);
    expect(classification.advisory_only).toBe(true);
    expect(classification.execution_authorized).toBe(false);
    expect(classification.governance_modification_authorized).toBe(false);
    expect(classification.constitutional_modification_authorized).toBe(false);
    expect(classification.operator_bypass_authorized).toBe(false);
    expect(classification.self_authorization_allowed).toBe(false);
  });

  it("validates taxonomy integrity and category count", () => {
    const taxonomy = validateDecisionTaxonomy();

    expect(taxonomy.valid).toBe(true);
    expect(taxonomy.category_count).toBe(DECISION_SCHEMA_TYPES.length);
    expect(taxonomy.failures).toEqual([]);
  });

  it.each([
    ["UNDEFINED_CATEGORY", "CATEGORY_UNDEFINED"],
    ["INACTIVE_CATEGORY", "CATEGORY_INACTIVE"],
    ["DUPLICATE_PRIMARY", "DUPLICATE_PRIMARY_CLASSIFICATION"],
    ["MISSING_BEHAVIOR", "BEHAVIORAL_PROFILE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_PROFILE_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_PROFILE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_PROFILE_MISSING"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
  ] satisfies [DecisionClassificationInput["scenario"], DecisionClassificationFailure][])("fails closed for %s", (scenario, failure) => {
    const input = createDecisionInput();
    const classification = classifyDecision({ decision_input: input, scenario });
    const validation = validateDecisionClassification(classification, input);

    expect(validation.validation_state).toBe("FAILED_CLOSED");
    expect(validation.failures).toContain(failure);
  });

  it("rejects unsupported taxonomy versions and invalid decision inputs", () => {
    const badInput = createDecisionInput({ governance_refs: [] });
    const taxonomyMismatch = classifyDecision({ taxonomy_version: "decision-taxonomy/v99" });

    expect(validateDecisionClassification(taxonomyMismatch).failures).toContain("UNSUPPORTED_TAXONOMY_VERSION");
    expect(validateDecisionClassification(classifyDecision({ decision_input: badInput }), badInput).failures).toContain("DECISION_INPUT_INVALID");
  });

  it("rejects tenant leakage against the source decision input", () => {
    const input = createDecisionInput({ tenant_id: "tenant_alpha" });
    const classification = classifyDecision({ decision_input: input, scenario: "TENANT_LEAK" });

    expect(validateDecisionClassification(classification, input).failures).toContain("TENANT_ISOLATION_VIOLATION");
  });

  it("reports classification observability metrics", () => {
    const valid = classifyDecision({ category: "PLAN_SELECTION" });
    const invalid = classifyDecision({ scenario: "UNDEFINED_CATEGORY" });
    const advisoryViolation = classifyDecision({ scenario: "ADVISORY_ONLY_VIOLATION" });
    const metrics = buildDecisionClassificationObservability([valid, invalid, advisoryViolation]);

    expect(metrics.classification_requests).toBe(3);
    expect(metrics.category_distribution.PLAN_SELECTION).toBe(1);
    expect(metrics.validation_failures).toBe(2);
    expect(metrics.undefined_category_attempts).toBe(1);
    expect(metrics.authority_violations).toBe(1);
    expect(metrics.taxonomy_version_usage["decision-taxonomy/v9.1.3"]).toBe(3);
  });

  it("keeps every schema decision type classifiable without ambiguity", () => {
    const results = DECISION_SCHEMA_TYPES.map((category) => classifyDecision({ decision_input: createDecisionInput({ decision_type: category as DecisionType }) }));

    expect(results.map((result) => result.primary_category)).toEqual([...DECISION_SCHEMA_TYPES]);
    expect(results.every((result) => validateDecisionClassification(result).validation_state === "VALID")).toBe(true);
  });
});
