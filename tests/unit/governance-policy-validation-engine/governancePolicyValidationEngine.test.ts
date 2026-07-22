import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_POLICY_CATEGORIES,
  GOVERNANCE_POLICY_ENFORCEMENT_LEVELS,
  GOVERNANCE_POLICY_VALIDATION_STATES,
  computeGovernancePolicyRuleHash,
  createGovernancePolicyRules,
  getGovernancePolicyValidationEngineFoundation,
  replayGovernancePolicyValidation,
  validateGovernancePolicy,
} from "@/services/governance-policy-validation-engine";
import { createGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";

describe("Mission Control Phase 9.7.2 Governance Policy Validation Engine", () => {
  it("publishes the governance policy validation foundation", () => {
    const foundation = getGovernancePolicyValidationEngineFoundation();

    expect(foundation.engine_version).toBe("governance-policy-validation-engine/v1");
    expect(foundation.policy_categories).toEqual(GOVERNANCE_POLICY_CATEGORIES);
    expect(foundation.enforcement_levels).toEqual(GOVERNANCE_POLICY_ENFORCEMENT_LEVELS);
    expect(foundation.validation_states).toEqual(GOVERNANCE_POLICY_VALIDATION_STATES);
    expect(foundation.result.policy_validation_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("evaluates registered governance policies deterministically and records evidence", () => {
    const first = validateGovernancePolicy();
    const second = validateGovernancePolicy();

    expect(first).toEqual(second);
    expect(first.evaluations).toHaveLength(first.policy_rules.length);
    expect(first.evidence.validation_state).toBe("VALID");
    expect(first.evidence.satisfied_rules).toEqual(first.policy_rules.map((rule) => rule.policy_rule_id));
    expect(first.ledger_records).toHaveLength(1);
  });

  it("detects missing approvals as conditional fail-closed inputs for downstream enforcement", () => {
    const result = validateGovernancePolicy({ approvals: ["approval_regulatory_governance"] });

    expect(result.policy_validation_status).toBe("FAIL");
    expect(result.evidence.validation_state).toBe("CONDITIONAL");
    expect(result.failures).toContain("INVALID_APPROVALS");
    expect(result.evidence.escalation_requirements).toContain("operator_change_review");
  });

  it("detects prohibited actions and governance conflicts reproducibly", () => {
    const result = validateGovernancePolicy({ action_refs: ["execute_without_governance"] });

    expect(result.evidence.validation_state).toBe("VIOLATION");
    expect(result.failures).toContain("PROHIBITED_ACTION_DETECTED");
    expect(result.failures).toContain("GOVERNANCE_CONFLICT_DETECTED");
    expect(result.evidence.prohibited_actions_detected).toContain("execute_without_governance");
  });

  it("validates authorized and unauthorized governance overrides", () => {
    const authorized = validateGovernancePolicy({ approvals: [], override_refs: ["override_change_control_board", "override_regulatory_governance_board"] });
    const unauthorized = validateGovernancePolicy({ override_refs: ["override_unknown_board"] });

    expect(authorized.evidence.override_results.every((override) => override.authorized)).toBe(true);
    expect(authorized.evidence.conditional_rules).not.toContain("policy_operational_change_control");
    expect(unauthorized.evidence.override_results).toHaveLength(0);
  });

  it("rejects missing, duplicate, inactive, malformed, and corrupted policy definitions", () => {
    const rules = createGovernancePolicyRules();
    const duplicate = [rules[0], rules[0]];
    const inactive = [{ ...rules[0], policy_status: "DEPRECATED" as const, integrity_hash: computeGovernancePolicyRuleHash({ ...rules[0], policy_status: "DEPRECATED" as const }) }];
    const malformed = [{ ...rules[0], rule_expression: "??", integrity_hash: computeGovernancePolicyRuleHash({ ...rules[0], rule_expression: "??" }) }];
    const corrupted = [{ ...rules[0], policy_name: "tampered" }];

    expect(validateGovernancePolicy({ policy_rules: [] }).failures).toContain("MISSING_POLICIES");
    expect(validateGovernancePolicy({ policy_rules: duplicate }).failures).toContain("DUPLICATE_POLICY_IDENTIFIER");
    expect(validateGovernancePolicy({ policy_rules: inactive }).failures).toContain("POLICY_NOT_ACTIVE");
    expect(validateGovernancePolicy({ policy_rules: malformed }).failures).toContain("MALFORMED_RULE_EXPRESSION");
    expect(validateGovernancePolicy({ policy_rules: corrupted }).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("rejects invalid governance contracts, unauthorized access, and replay mismatches", () => {
    const valid = validateGovernancePolicy();
    const invalidContract = createGovernanceDecisionRecord({ evidence_refs: [] });

    expect(validateGovernancePolicy({ governance_decision: invalidContract }).failures).toContain("GOVERNANCE_CONTRACT_INVALID");
    expect(validateGovernancePolicy({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_POLICY_VALIDATOR_ACCESS");
    expect(validateGovernancePolicy({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays governance policy validation evidence and ledger records deterministically", () => {
    const result = validateGovernancePolicy();
    const replay = replayGovernancePolicyValidation(result);
    const tampered = replayGovernancePolicyValidation({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.governance_decision_id).toBe(result.governance_decision.governance_decision_id);
    expect(replay.evaluated_policy_refs).toEqual(result.policy_rules.map((rule) => rule.policy_rule_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
