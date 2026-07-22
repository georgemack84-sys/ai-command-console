import { describe, expect, it } from "vitest";
import {
  OUTCOME_COMPLETENESS_CHECKS,
  OUTCOME_COMPLETENESS_LIFECYCLE,
  computeOutcomeCompletenessValidatorHash,
  getOutcomeCompletenessValidatorFoundation,
  replayOutcomeCompletenessValidator,
  runOutcomeCompletenessValidator,
} from "@/services/outcome-completeness-validator";
import type { OutcomeCompletenessFailure, OutcomeCompletenessValidatorInput } from "@/types/outcome-completeness-validator";

describe("Mission Control Phase 10.1.5 Outcome Completeness Validator", () => {
  it("publishes the outcome completeness validator foundation", () => {
    const foundation = getOutcomeCompletenessValidatorFoundation();

    expect(foundation.outcome_completeness_validator_version).toBe("outcome-completeness-validator/v1");
    expect(foundation.checks).toEqual(OUTCOME_COMPLETENESS_CHECKS);
    expect(foundation.lifecycle).toEqual(OUTCOME_COMPLETENESS_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates a complete outcome observation without judging correctness", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.validation.validation_status).toBe("VALID");
    expect(result.completeness_only).toBe(true);
    expect(result.permits_correctness_judgment).toBe(false);
    expect(result.modifies_observation).toBe(false);
  });

  it("creates deterministic validation integrity hashes", () => {
    const result = runOutcomeCompletenessValidator();

    expect(computeOutcomeCompletenessValidatorHash(result.validation)).toBe(result.validation.integrity_hash);
    expect(replayOutcomeCompletenessValidator(result)).toBe(true);
  });

  it("applies structural, relationship, evidence, replay, and integrity rules", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.rule_results.map((entry) => entry.validation_area)).toEqual(["STRUCTURAL", "RELATIONSHIP", "RELATIONSHIP", "RELATIONSHIP", "RELATIONSHIP", "EVIDENCE", "REPLAY", "INTEGRITY"]);
    expect(result.rule_results.every((entry) => entry.present)).toBe(true);
  });

  it("detects no missing data for a complete observation and never repairs inputs", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.missing_data_report.missing_identifiers).toHaveLength(0);
    expect(result.missing_data_report.missing_evidence).toHaveLength(0);
    expect(result.missing_data_report.missing_replay_metadata).toHaveLength(0);
    expect(result.missing_data_report.repair_attempted).toBe(false);
  });

  it("generates a deterministic 100 percent quality report for complete observations", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.quality_report.completeness_score).toBe(100);
    expect(result.quality_report.completeness_label).toBe("100% Complete");
    expect(result.quality_report.final_certification_recommendation).toBe("PASS");
  });

  it("produces replay reports that reconstruct the original validation", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.replay_report.validation_hash).toBe(result.validation.integrity_hash);
    expect(result.replay_report.quality_hash).toBe(result.quality_report.integrity_hash);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
    expect(result.replay_report.deterministic_ordering).toBe(true);
  });

  it("keeps observability metrics advisory-only", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.metrics.outcome_records_validated).toBe(1);
    expect(result.metrics.validation_success_rate).toBe(1);
    expect(result.metrics.completeness_score_distribution).toEqual([100]);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("certifies the ledger gate only when completeness validation passes", () => {
    const result = runOutcomeCompletenessValidator();

    expect(result.audit_report.completeness_engine_operational).toBe(true);
    expect(result.audit_report.validation_rule_engine_operational).toBe(true);
    expect(result.audit_report.outcome_observation_ledger_gate_enforced).toBe(true);
    expect(result.audit_report.certification_decision).toBe("PASS");
  });

  it("maps missing evidence to INSUFFICIENT_EVIDENCE instead of a generic invalid state", () => {
    const result = runOutcomeCompletenessValidator({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.validation_status).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.quality_report.evidence_validation).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.validation.failures).toContain("MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE");
  });

  it.each([
    ["MISSING_DECISION", "MISSING_DECISION_LINKAGE_ACCEPTED", "INVALID"],
    ["MISSING_DECISION_PACKAGE", "MISSING_DECISION_LINKAGE_ACCEPTED", "INVALID"],
    ["MISSING_OPERATOR", "MISSING_OPERATOR_REFERENCES_ACCEPTED", "OPERATOR_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "MISSING_GOVERNANCE_REFERENCES_ACCEPTED", "GOVERNANCE_INCOMPLETE"],
    ["MISSING_REPLAY", "MISSING_REPLAY_REFERENCES_ACCEPTED", "REPLAY_INCOMPLETE"],
    ["MISSING_MISSION", "MISSING_MISSION_LINKAGE_ACCEPTED", "MISSION_INCOMPLETE"],
    ["MISSING_SCHEMA_VERSION", "MISSING_SCHEMA_VERSION_ACCEPTED", "INCOMPLETE"],
    ["MISSING_INTEGRITY_HASH", "MISSING_INTEGRITY_HASH_ACCEPTED", "INCOMPLETE"],
    ["ORPHAN_OBSERVATION", "ORPHAN_OUTCOME_OBSERVATION_ACCEPTED", "INCOMPLETE"],
    ["NONDETERMINISTIC_VALIDATION", "VALIDATION_RESULTS_NONDETERMINISTIC", "INVALID"],
    ["RULE_BYPASS", "COMPLETENESS_RULES_BYPASSED", "INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION", "REPLAY_INCOMPLETE"],
    ["INTEGRITY_OMITTED", "INTEGRITY_VERIFICATION_OMITTED", "INCOMPLETE"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED", "INVALID"],
    ["INFERRED_REFERENCE", "INFERRED_REFERENCE_ACCEPTED", "INCOMPLETE"],
    ["OBSERVATION_MUTATED", "OBSERVATION_MUTATED_DURING_VALIDATION", "INVALID"],
    ["INVALID_EVIDENCE_REGISTRY", "EVIDENCE_REGISTRY_NOT_VALIDATED", "INSUFFICIENT_EVIDENCE"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_GOVERNANCE_BYPASSED", "GOVERNANCE_INCOMPLETE"],
    ["FAIL_OPEN", "FAIL_OPEN_COMPLETENESS_VALIDATION_BEHAVIOR", "INVALID"],
  ] as readonly [NonNullable<OutcomeCompletenessValidatorInput["scenario"]>, OutcomeCompletenessFailure, string][])("fails closed for %s", (scenario, failure, validationState) => {
    const result = runOutcomeCompletenessValidator({ scenario });

    expect(result.validation.validation_status).toBe(validationState);
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.audit_report.outcome_observation_ledger_gate_enforced).toBe(false);
    expect(result.modifies_observation).toBe(false);
  });

  it("fails closed when the role lacks completeness validation visibility", () => {
    const result = runOutcomeCompletenessValidator({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("INVALID");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects completeness validator tampering during replay", () => {
    const result = runOutcomeCompletenessValidator();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeCompletenessValidator(tampered)).toBe(false);
  });
});
