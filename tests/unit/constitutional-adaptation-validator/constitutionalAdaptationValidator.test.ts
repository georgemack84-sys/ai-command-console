import { describe, expect, it } from "vitest";
import {
  getConstitutionalAdaptationValidatorFoundation,
  replayConstitutionalAdaptationValidation,
  validateConstitutionalAdaptation,
} from "@/services/constitutional-adaptation-validator";
import type { ConstitutionalAdaptationFailure, ConstitutionalAdaptationScenario } from "@/types/constitutional-adaptation-validator";

describe("Mission Control Phase 10.8.2 Constitutional Adaptation Validator", () => {
  it("publishes the constitutional adaptation validator foundation", () => {
    const foundation = getConstitutionalAdaptationValidatorFoundation();

    expect(foundation.constitutional_adaptation_validator_version).toBe("constitutional-adaptation-validator/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /constitutional-adaptation-validator/validate");
    expect(foundation.api_surface.execution_approval_supported).toBe(false);
    expect(foundation.api_surface.authority_expansion_supported).toBe(false);
    expect(foundation.result.validation.constitutional_status).toBe("COMPLIANT");
  });

  it("validates proposals deterministically", () => {
    const first = validateConstitutionalAdaptation({ scenario: "BASELINE" });
    const second = validateConstitutionalAdaptation({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("preserves constitutional operating constraints", () => {
    const result = validateConstitutionalAdaptation();

    expect(result.advisory_only).toBe(true);
    expect(result.human_governed).toBe(true);
    expect(result.operator_controlled).toBe(true);
    expect(result.governance_enforced).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("evaluates protected principles, rules, dependencies, conflicts, and ledger output", () => {
    const result = validateConstitutionalAdaptation({ scenario: "BASELINE" });

    expect(result.validation.protected_principles.length).toBeGreaterThan(10);
    expect(result.validation.evaluated_rules.length).toBeGreaterThan(0);
    expect(result.validation.constitutional_dependencies.length).toBeGreaterThan(0);
    expect(result.validation.conflict_results[0].severity).toBe("NONE");
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
  });

  it("requires constitutional review without granting execution authority", () => {
    const result = validateConstitutionalAdaptation({ scenario: "REVIEW_REQUIRED" });

    expect(result.validation.constitutional_status).toBe("REQUIRES_CONSTITUTIONAL_REVIEW");
    expect(result.validation.conflict_results[0].severity).toBe("REVIEW_REQUIRED");
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_DETECTED"],
    ["AUTONOMOUS_EXECUTION", "AUTONOMOUS_EXECUTION_INTRODUCED"],
    ["HISTORICAL_TRUTH_MUTATION", "HISTORICAL_TRUTH_MUTATION_RISK"],
    ["CONSTITUTIONAL_REVIEW_BYPASS", "CONSTITUTIONAL_REVIEW_BYPASSED"],
  ] as readonly [ConstitutionalAdaptationScenario, ConstitutionalAdaptationFailure][])("automatically rejects %s", (scenario, failure) => {
    const result = validateConstitutionalAdaptation({ scenario });

    expect(result.validation.constitutional_status).toBe("REJECTED");
    expect(result.validation.failures).toContain(failure);
    expect(result.validation.violations.some((violation) => violation.automatically_rejected)).toBe(true);
    expect(result.fail_closed).toBe(true);
  });

  it.each([
    ["PRINCIPLE_DISCOVERY_FAILURE", "PRINCIPLES_UNRESOLVED"],
    ["RULE_EVALUATION_INCOMPLETE", "RULE_EVALUATION_INCOMPLETE"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_REASONING"],
    ["HUMAN_AUTHORITY_LOSS", "HUMAN_AUTHORITY_UNGUARANTEED"],
    ["GOVERNANCE_WEAKENING", "GOVERNANCE_SUPREMACY_WEAKENED"],
    ["OPERATOR_SUPREMACY_WEAKENING", "OPERATOR_SUPREMACY_WEAKENED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATED"],
    ["EXPLAINABILITY_REDUCTION", "EXPLAINABILITY_REDUCED"],
    ["REPLAY_DEGRADATION", "REPLAY_DEGRADED"],
    ["AUDITABILITY_WEAKENING", "AUDITABILITY_WEAKENED"],
    ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_FAILED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_UNGUARANTEED"],
    ["HISTORICAL_IMMUTABILITY_VIOLATION", "HISTORICAL_IMMUTABILITY_VIOLATED"],
    ["LINEAGE_INCOMPLETE", "CONSTITUTIONAL_LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_FAILURE", "DECISION_RECORDING_FAILED"],
    ["TRANSPARENCY_REDUCTION", "TRANSPARENCY_REDUCED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConstitutionalAdaptationScenario, ConstitutionalAdaptationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateConstitutionalAdaptation({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.fail_closed).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("classifies constitutional conflict and restricted proposals", () => {
    expect(validateConstitutionalAdaptation({ scenario: "CONSTITUTIONAL_CONFLICT" }).validation.constitutional_status).toBe("CONSTITUTIONAL_CONFLICT");
    expect(validateConstitutionalAdaptation({ scenario: "RESTRICTED_PROPOSAL" }).validation.constitutional_status).toBe("COMPLIANT");
  });

  it("replays validation and detects tampering", () => {
    const result = validateConstitutionalAdaptation({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConstitutionalAdaptationValidation(result)).toBe(true);
    expect(replayConstitutionalAdaptationValidation(tampered)).toBe(false);
  });
});
