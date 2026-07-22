import { describe, expect, it } from "vitest";
import {
  buildMaturityClassificationObservabilitySurface,
  classifyMaturity,
  getMaturityClassificationEngineBundle,
  getMaturityTransitionEvaluation,
  listMaturityClassificationLedger,
  listMaturityClassificationRules,
  validateMaturityClassification,
} from "@/services/maturity-classification-engine";
import type { MaturityClassificationFailure, MaturityClassificationScenario } from "@/types/maturity-classification-engine";

describe("maturity classification engine", () => {
  it("publishes the deterministic advisory-only classification bundle", () => {
    const bundle = getMaturityClassificationEngineBundle();

    expect(bundle.doctrine.engine_version).toBe("maturity-classification-engine/v8ALT.11.4");
    expect(bundle.doctrine.final_state).toBe("MATURITY_CLASSIFICATION_ENGINE_READY");
    expect(bundle.doctrine.level_count).toBe(5);
    expect(bundle.repository.final_state).toBe("MATURITY_CLASSIFICATION_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.promotion_authorized).toBe(false);
    expect(bundle.repository.regression_authorized).toBe(false);
    expect(bundle.repository.maturity_advancement_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("classifies baseline scoring as certified constitutional autonomy without authorizing promotion", () => {
    const repository = classifyMaturity();

    expect(repository.record.maturity_level).toBe("LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY");
    expect(repository.record.classification_state).toBe("CERTIFIED_CONSTITUTIONAL_AUTONOMY");
    expect(repository.transition.decision).toBe("PROMOTION_ELIGIBLE");
    expect(repository.transition.promotion_eligible).toBe(true);
    expect(repository.transition.promotion_authorized).toBe(false);
    expect(repository.promotion_authorized).toBe(false);
    expect(repository.rules).toHaveLength(5);
    expect(repository.ledger).toHaveLength(1);
    expect(repository.failures).toEqual([]);
    expect(repository.record.explanation).toContain("runtime assurance remains represented by execution, resilience, and visibility scoring");
  });

  it("keeps classification deterministic and exposes slices", () => {
    const first = classifyMaturity();
    const second = classifyMaturity();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.record.integrity_hash).toBe(first.record.integrity_hash);
    expect(listMaturityClassificationRules()).toHaveLength(5);
    expect(getMaturityTransitionEvaluation().to_level).toBe("LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY");
    expect(listMaturityClassificationLedger()).toHaveLength(1);
  });

  it.each([
    ["UNDEFINED_THRESHOLDS", "MATURITY_THRESHOLDS_UNDEFINED"],
    ["INCONSISTENT_CLASSIFICATION_RULES", "CLASSIFICATION_RULES_INCONSISTENT"],
    ["UNAUTHORIZED_PROMOTION", "PROMOTION_WITHOUT_PREREQUISITES"],
    ["MISSED_REGRESSION_TRIGGER", "REGRESSION_TRIGGER_MISSED"],
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_ENFORCEMENT_FAILURE", "AUTHORITY_ENFORCEMENT_FAILED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_CLASSIFICATION_LOGIC", "HIDDEN_CLASSIFICATION_LOGIC_DETECTED"],
    ["NONDETERMINISTIC_LEVEL_ASSIGNMENT", "NONDETERMINISTIC_LEVEL_ASSIGNMENT_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [MaturityClassificationScenario, MaturityClassificationFailure][])("invalidates %s", (scenario, failure) => {
    const repository = classifyMaturity({ scenario });
    const validation = validateMaturityClassification(repository);

    expect(repository.final_state).toBe("MATURITY_CLASSIFICATION_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.promotion_authorized).toBe(false);
    expect(repository.regression_authorized).toBe(false);
    expect(repository.execution_behavior_change_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateMaturityClassification(classifyMaturity({ scenario: "UNDEFINED_THRESHOLDS" })).thresholds_defined).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "INCONSISTENT_CLASSIFICATION_RULES" })).rules_consistent).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "UNAUTHORIZED_PROMOTION" })).no_unauthorized_promotion).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "MISSED_REGRESSION_TRIGGER" })).regression_detection_valid).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "GOVERNANCE_VALIDATION_FAILURE" })).governance_validated).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "CONSTITUTIONAL_VALIDATION_FAILURE" })).constitutional_validated).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "AUTHORITY_ENFORCEMENT_FAILURE" })).authority_enforced).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "REPLAY_RECONSTRUCTION_MISMATCH" })).replay_verified).toBe(false);
    expect(validateMaturityClassification(classifyMaturity({ scenario: "NONDETERMINISTIC_LEVEL_ASSIGNMENT" })).deterministic_level_assignment).toBe(false);
  });

  it("publishes observability without promotion authority", () => {
    const surface = buildMaturityClassificationObservabilitySurface(classifyMaturity({ scenario: "MISSED_REGRESSION_TRIGGER" }));

    expect(surface.final_state).toBe("MATURITY_CLASSIFICATION_FAILED");
    expect(surface.maturity_level).toBe("LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY");
    expect(surface.classification_state).toBe("REGRESSION_PENDING");
    expect(surface.transition_decision).toBe("REGRESSION_ADVISED");
    expect(surface.rule_count).toBe(5);
    expect(surface.ledger_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.promotion_authorized).toBe(false);
    expect(surface.execution_behavior_change_authorized).toBe(false);
  });
});
