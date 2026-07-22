import { describe, expect, it } from "vitest";
import {
  buildAutonomyMaturityAssessmentContract,
  buildAutonomyMaturityContractObservabilitySurface,
  getAutonomyMaturityAssessmentContractBundle,
  getAutonomyMaturityAssessmentSchema,
  listAutonomyMaturityDomains,
  listAutonomyMaturityLevels,
  listAutonomyMaturityLifecycle,
  validateAutonomyMaturityAssessmentContract,
} from "@/services/autonomy-maturity-assessment-contract";
import type { AutonomyMaturityFailure, AutonomyMaturityScenario } from "@/types/autonomy-maturity-assessment-contract";

describe("autonomy maturity assessment contract", () => {
  it("publishes the canonical advisory-only contract bundle", () => {
    const bundle = getAutonomyMaturityAssessmentContractBundle();

    expect(bundle.doctrine.contract_version).toBe("autonomy-maturity-assessment-contract/v8ALT.11.1");
    expect(bundle.doctrine.final_state).toBe("AUTONOMY_MATURITY_CONTRACT_SPECIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.final_state).toBe("AUTONOMY_MATURITY_CONTRACT_READY");
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.maturity_advancement_authorized).toBe(false);
    expect(bundle.repository.production_certification_authorized).toBe(false);
    expect(bundle.repository.authority_change_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("defines deterministic domains, levels, scoring, lifecycle, and schema", () => {
    const repository = buildAutonomyMaturityAssessmentContract();

    expect(repository.domains).toHaveLength(10);
    expect(repository.levels).toHaveLength(5);
    expect(repository.scoring).toHaveLength(5);
    expect(repository.lifecycle).toHaveLength(7);
    expect(repository.failures).toEqual([]);
    expect(repository.schema.sections).toHaveLength(5);
    expect(repository.schema.required_fields).toEqual(expect.arrayContaining(["replay_reference", "lineage_reference", "integrity_hash"]));
    expect(repository.lifecycle.map((transition) => transition.transition_order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(repository.domains.every((domain) => domain.governance_required && domain.constitutional_validation_required && domain.replay_required)).toBe(true);
  });

  it("keeps construction deterministic and exposes contract slices", () => {
    const first = buildAutonomyMaturityAssessmentContract();
    const second = buildAutonomyMaturityAssessmentContract();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.contract.integrity_hash).toBe(first.contract.integrity_hash);
    expect(listAutonomyMaturityDomains()).toHaveLength(10);
    expect(listAutonomyMaturityLevels()).toHaveLength(5);
    expect(listAutonomyMaturityLifecycle()).toHaveLength(7);
    expect(getAutonomyMaturityAssessmentSchema().sections).toHaveLength(5);
  });

  it.each([
    ["INVALID_SCHEMA", "ASSESSMENT_SCHEMA_INVALID"],
    ["UNDEFINED_MATURITY_LEVEL", "MATURITY_LEVEL_UNDEFINED"],
    ["INCONSISTENT_SCORING_RULES", "SCORING_RULES_INCONSISTENT"],
    ["MISSING_GOVERNANCE_RULES", "GOVERNANCE_RULES_MISSING"],
    ["MISSING_CONSTITUTIONAL_RULES", "CONSTITUTIONAL_RULES_MISSING"],
    ["INCOMPLETE_LIFECYCLE", "LIFECYCLE_INCOMPLETE"],
    ["ABSENT_REPLAY_REFERENCES", "REPLAY_REFERENCES_ABSENT"],
    ["MISSING_INTEGRITY_HASH", "INTEGRITY_HASH_MISSING"],
    ["DETERMINISTIC_ORDERING_VIOLATION", "DETERMINISTIC_ORDERING_VIOLATED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["HIDDEN_SCORING_LOGIC", "HIDDEN_SCORING_LOGIC_DETECTED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_VIOLATED"],
  ] satisfies [AutonomyMaturityScenario, AutonomyMaturityFailure][])("invalidates %s", (scenario, failure) => {
    const repository = buildAutonomyMaturityAssessmentContract({ scenario });
    const validation = validateAutonomyMaturityAssessmentContract(repository);

    expect(repository.final_state).toBe("AUTONOMY_MATURITY_CONTRACT_INVALID");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.maturity_advancement_authorized).toBe(false);
    expect(repository.production_certification_authorized).toBe(false);
    expect(repository.authority_change_authorized).toBe(false);
    expect(repository.execution_behavior_change_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "INVALID_SCHEMA" })).schema_valid).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "UNDEFINED_MATURITY_LEVEL" })).maturity_level_defined).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "INCONSISTENT_SCORING_RULES" })).scoring_consistent).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "MISSING_GOVERNANCE_RULES" })).governance_rules_present).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "MISSING_CONSTITUTIONAL_RULES" })).constitutional_rules_present).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "ABSENT_REPLAY_REFERENCES" })).replay_references_present).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
    expect(validateAutonomyMaturityAssessmentContract(buildAutonomyMaturityAssessmentContract({ scenario: "HIDDEN_SCORING_LOGIC" })).no_hidden_scoring_logic).toBe(false);
  });

  it("publishes observability without authority", () => {
    const surface = buildAutonomyMaturityContractObservabilitySurface(buildAutonomyMaturityAssessmentContract({ scenario: "MISSING_INTEGRITY_HASH" }));

    expect(surface.final_state).toBe("AUTONOMY_MATURITY_CONTRACT_INVALID");
    expect(surface.domain_count).toBe(10);
    expect(surface.level_count).toBe(5);
    expect(surface.scoring_rule_count).toBe(5);
    expect(surface.lifecycle_transition_count).toBe(7);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.maturity_advancement_authorized).toBe(false);
  });
});
