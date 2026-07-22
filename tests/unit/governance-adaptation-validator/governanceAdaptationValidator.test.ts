import { describe, expect, it } from "vitest";
import {
  getGovernanceAdaptationValidatorFoundation,
  replayGovernanceAdaptationValidation,
  validateGovernanceAdaptation,
} from "@/services/governance-adaptation-validator";
import type { GovernanceAdaptationFailure, GovernanceAdaptationScenario } from "@/types/governance-adaptation-validator";

describe("Mission Control Phase 10.8.1 Governance Adaptation Validator", () => {
  it("publishes the governance adaptation validator foundation", () => {
    const foundation = getGovernanceAdaptationValidatorFoundation();

    expect(foundation.governance_adaptation_validator_version).toBe("governance-adaptation-validator/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /governance-adaptation-validator/validate");
    expect(foundation.api_surface.execution_approval_supported).toBe(false);
    expect(foundation.result.validation.governance_status).toBe("COMPLIANT_WITH_APPROVAL");
  });

  it("validates proposals deterministically", () => {
    const first = validateGovernanceAdaptation({ scenario: "BASELINE" });
    const second = validateGovernanceAdaptation({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("remains advisory-only and operator controlled", () => {
    const result = validateGovernanceAdaptation();

    expect(result.advisory_only).toBe(true);
    expect(result.operator_controlled).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
    expect(result.validation.required_approvals.map((approval) => approval.approver_role)).toContain("operator");
  });

  it("evaluates policies, rules, dependencies, approvals, obligations, exceptions, and escalations", () => {
    const result = validateGovernanceAdaptation({ scenario: "EXECUTIVE_REQUIRED" });

    expect(result.validation.evaluated_policies.length).toBeGreaterThan(0);
    expect(result.validation.rule_results.length).toBeGreaterThan(0);
    expect(result.validation.dependency_results.length).toBeGreaterThan(0);
    expect(result.validation.required_approvals.some((approval) => approval.approver_role === "executive_reviewer")).toBe(true);
    expect(result.validation.governance_obligations.length).toBeGreaterThan(0);
    expect(result.validation.exception_results[0].decision).toBe("NONE_REQUESTED");
    expect(result.validation.escalation_requirements[0].level).toBe("EXECUTIVE");
    expect(result.validation.governance_status).toBe("REQUIRES_EXECUTIVE_REVIEW");
  });

  it("permits authorized exceptions only with approval", () => {
    const result = validateGovernanceAdaptation({ scenario: "AUTHORIZED_EXCEPTION" });

    expect(result.validation.exception_results[0].decision).toBe("PERMITTED_WITH_APPROVAL");
    expect(result.validation.exception_results[0].required_approvals).toContain("governance_board");
    expect(result.validation.governance_status).toBe("COMPLIANT_WITH_APPROVAL");
  });

  it.each([
    ["POLICY_DISCOVERY_FAILURE", "POLICIES_UNRESOLVED"],
    ["RULE_DISCOVERY_FAILURE", "RULES_MISSING"],
    ["POLICY_CONFLICT", "POLICY_CONFLICT_DETECTED"],
    ["DEPENDENCY_UNVERIFIABLE", "DEPENDENCY_UNVERIFIABLE"],
    ["APPROVAL_UNDETERMINED", "APPROVALS_UNDETERMINED"],
    ["OBLIGATION_INCOMPLETE", "OBLIGATIONS_INCOMPLETE"],
    ["UNAUTHORIZED_EXCEPTION", "UNAUTHORIZED_EXCEPTION"],
    ["CONSTITUTIONAL_EXCEPTION", "CONSTITUTIONAL_EXCEPTION"],
    ["GOVERNANCE_THRESHOLD_UPDATE", "GOVERNANCE_BYPASS_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["OPERATOR_BYPASS", "OPERATOR_AUTHORITY_REMOVAL_DETECTED"],
    ["MISSING_REPLAY", "REPLAY_EVIDENCE_UNAVAILABLE"],
    ["MISSING_EVIDENCE", "AUDIT_EVIDENCE_INCOMPLETE"],
    ["BROKEN_LINEAGE", "LINEAGE_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_FAILED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_FAILURE", "LEDGER_RECORDING_FAILED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_VALIDATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [GovernanceAdaptationScenario, GovernanceAdaptationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateGovernanceAdaptation({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.fail_closed).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("classifies policy conflicts, restricted proposals, and constitutional exceptions", () => {
    expect(validateGovernanceAdaptation({ scenario: "POLICY_CONFLICT" }).validation.governance_status).toBe("POLICY_CONFLICT");
    expect(validateGovernanceAdaptation({ scenario: "RESTRICTED_PROPOSAL" }).validation.governance_status).toBe("RESTRICTED");
    expect(validateGovernanceAdaptation({ scenario: "CONSTITUTIONAL_EXCEPTION" }).validation.governance_status).toBe("REJECTED");
  });

  it("records immutable ledger evidence", () => {
    const result = validateGovernanceAdaptation({ scenario: "BASELINE" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
  });

  it("replays validation and detects tampering", () => {
    const result = validateGovernanceAdaptation({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceAdaptationValidation(result)).toBe(true);
    expect(replayGovernanceAdaptationValidation(tampered)).toBe(false);
  });
});
