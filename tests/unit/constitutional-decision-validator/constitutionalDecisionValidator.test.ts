import { describe, expect, it } from "vitest";
import {
  CONSTITUTIONAL_ENFORCEMENT_LEVELS,
  CONSTITUTIONAL_RULE_CATEGORIES,
  CONSTITUTIONAL_VALIDATION_RESULTS,
  computeConstitutionalRuleHash,
  createConstitutionalRules,
  getConstitutionalDecisionValidatorFoundation,
  replayConstitutionalDecisionValidation,
  validateConstitutionalDecision,
} from "@/services/constitutional-decision-validator";
import { createGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { validateGovernancePolicy } from "@/services/governance-policy-validation-engine";

describe("Mission Control Phase 9.7.3 Constitutional Decision Validator", () => {
  it("publishes the constitutional decision validator foundation", () => {
    const foundation = getConstitutionalDecisionValidatorFoundation();

    expect(foundation.validator_version).toBe("constitutional-decision-validator/v1");
    expect(foundation.rule_categories).toEqual(CONSTITUTIONAL_RULE_CATEGORIES);
    expect(foundation.enforcement_levels).toEqual(CONSTITUTIONAL_ENFORCEMENT_LEVELS);
    expect(foundation.validation_results).toEqual(CONSTITUTIONAL_VALIDATION_RESULTS);
    expect(foundation.result.constitutional_validation_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("evaluates constitutional rules deterministically and records evidence plus ledger output", () => {
    const first = validateConstitutionalDecision();
    const second = validateConstitutionalDecision();

    expect(first).toEqual(second);
    expect(first.evaluations).toHaveLength(first.constitutional_rules.length);
    expect(first.evidence_report.validation_result).toBe("COMPLIANT");
    expect(first.evidence_report.satisfied_rules).toEqual(first.constitutional_rules.map((rule) => rule.constitutional_rule_id));
    expect(first.ledger_records).toHaveLength(1);
  });

  it("rejects advisory-only and execution prohibition violations immediately", () => {
    const autonomous = validateConstitutionalDecision({ action_refs: ["autonomous_execution"] });
    const command = validateConstitutionalDecision({ action_refs: ["direct_command"] });

    expect(autonomous.constitutional_validation_status).toBe("FAIL");
    expect(autonomous.failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(autonomous.failures).toContain("PROHIBITED_EXECUTION_DETECTED");
    expect(command.evidence_report.prohibited_actions_detected).toContain("direct_command");
  });

  it("rejects authority expansion and constitutional supremacy violations", () => {
    const authority = validateConstitutionalDecision({ authority_refs: ["execution_authority"] });
    const supremacy = validateConstitutionalDecision({ action_refs: ["constitutional_bypass"] });

    expect(authority.failures).toContain("AUTHORITY_BOUNDARY_VIOLATION");
    expect(supremacy.failures).toContain("CONSTITUTIONAL_SUPREMACY_VIOLATION");
    expect(supremacy.failures).toContain("PROHIBITED_EXECUTION_DETECTED");
  });

  it("detects governance policy constitutional conflicts", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const policy = validateGovernancePolicy({ governance_decision: decision, action_refs: ["constitutional_bypass"] });
    const result = validateConstitutionalDecision({ governance_decision: decision, governance_policy_result: policy, action_refs: ["constitutional_bypass"] });

    expect(result.failures).toContain("GOVERNANCE_POLICY_INVALID");
    expect(result.failures).toContain("CONSTITUTIONAL_CONFLICT_DETECTED");
    expect(result.evidence_report.constitutional_conflicts).toContain("governance_policy_constitutional_bypass");
  });

  it("rejects missing, duplicate, malformed, unresolved, and corrupted constitutional rules", () => {
    const rules = createConstitutionalRules();
    const duplicate = [rules[0], rules[0]];
    const malformed = [{ ...rules[0], rule_expression: "??", integrity_hash: computeConstitutionalRuleHash({ ...rules[0], rule_expression: "??" }) }];
    const unresolved = [{ ...rules[0], policy_references: [], integrity_hash: computeConstitutionalRuleHash({ ...rules[0], policy_references: [] }) }];
    const corrupted = [{ ...rules[0], rule_name: "tampered" }];

    expect(validateConstitutionalDecision({ constitutional_rules: [] }).failures).toContain("MISSING_CONSTITUTIONAL_RULES");
    expect(validateConstitutionalDecision({ constitutional_rules: duplicate }).failures).toContain("DUPLICATE_CONSTITUTIONAL_IDENTIFIER");
    expect(validateConstitutionalDecision({ constitutional_rules: malformed }).failures).toContain("MALFORMED_CONSTITUTIONAL_EXPRESSION");
    expect(validateConstitutionalDecision({ constitutional_rules: unresolved }).failures).toContain("UNRESOLVED_CONSTITUTIONAL_REFERENCE");
    expect(validateConstitutionalDecision({ constitutional_rules: corrupted }).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("rejects invalid governance contracts, missing evidence, unauthorized access, and replay mismatches", () => {
    const valid = validateConstitutionalDecision();
    const invalidContract = createGovernanceDecisionRecord({ evidence_refs: [] });
    const missingEvidence = createGovernanceDecisionRecord({ evidence_refs: ["evidence_unrelated"], lifecycle_state: "READY_FOR_ENFORCEMENT" });

    expect(validateConstitutionalDecision({ governance_decision: invalidContract }).failures).toContain("GOVERNANCE_CONTRACT_INVALID");
    expect(validateConstitutionalDecision({ governance_decision: missingEvidence }).failures).toContain("MISSING_EVIDENCE");
    expect(validateConstitutionalDecision({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_CONSTITUTIONAL_VALIDATOR_ACCESS");
    expect(validateConstitutionalDecision({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays constitutional evidence and ledger records deterministically", () => {
    const result = validateConstitutionalDecision();
    const replay = replayConstitutionalDecisionValidation(result);
    const tampered = replayConstitutionalDecisionValidation({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.governance_decision_id).toBe(result.governance_decision.governance_decision_id);
    expect(replay.evaluated_rule_refs).toEqual(result.constitutional_rules.map((rule) => rule.constitutional_rule_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
