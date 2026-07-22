import { describe, expect, it } from "vitest";
import {
  getOperatorFeedbackGovernanceValidationFoundation,
  replayOperatorFeedbackGovernanceValidation,
  validateOperatorFeedbackGovernance,
} from "@/services/operator-feedback-governance-validation";
import type { FeedbackGovernanceFailure, FeedbackGovernanceScenario } from "@/types/operator-feedback-governance-validation";

describe("Mission Control Phase 10.9.8 Operator Feedback Governance Validation", () => {
  it("publishes the governance validation contract", () => {
    const foundation = getOperatorFeedbackGovernanceValidationFoundation();

    expect(foundation.operator_feedback_governance_validation_version).toBe("operator-feedback-governance-validation/v1");
    expect(foundation.api_surface.validate_governance).toBe("POST /operator-feedback-governance-validation/validate");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.governance_approval_execution_supported).toBe(false);
    expect(foundation.result.validation_state).toBe("VALIDATED");
  });

  it("validates governance deterministically", () => {
    const first = validateOperatorFeedbackGovernance({ scenario: "BASELINE" });
    const second = validateOperatorFeedbackGovernance({ scenario: "BASELINE" });

    expect(first.decision_registry_record.governance_decision_id).toBe(second.decision_registry_record.governance_decision_id);
    expect(first.escalation_decision.integrity_hash).toBe(second.escalation_decision.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("keeps feedback evidence rather than authority", () => {
    const result = validateOperatorFeedbackGovernance({ scenario: "ADVISORY" });

    expect(result.governance_validation.allowed_actions).toEqual(expect.arrayContaining(["increase_adaptation_priority", "trigger_simulation", "trigger_review", "trigger_investigation", "trigger_governance_review"]));
    expect(result.governance_validation.prohibited_actions).toEqual(expect.arrayContaining(["modify_production", "change_policy", "alter_governance", "override_constitution", "bypass_approval", "authorize_implementation", "modify_history", "expand_authority"]));
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_adaptive_implementation).toBe(false);
  });

  it.each([
    ["INFORMATIONAL", "INFORMATIONAL"],
    ["ADVISORY", "ADVISORY"],
    ["GOVERNANCE_REVIEW", "GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_REVIEW", "CONSTITUTIONAL_REVIEW"],
    ["CRITICAL_ESCALATION", "CRITICAL_ESCALATION"],
    ["HIGH_RISK_FEEDBACK", "CRITICAL_ESCALATION"],
  ] as const)("maps %s to %s escalation", (scenario, category) => {
    const result = validateOperatorFeedbackGovernance({ scenario });

    expect(result.escalation_decision.category).toBe(category);
    expect(result.validation_state).toBe("VALIDATED");
  });

  it("requires governance review, simulation, and operator approval for high-risk feedback", () => {
    const result = validateOperatorFeedbackGovernance({ scenario: "HIGH_RISK_FEEDBACK" });

    expect(result.escalation_decision.category).toBe("CRITICAL_ESCALATION");
    expect(result.escalation_decision.governance_review_required).toBe(true);
    expect(result.escalation_decision.simulation_required).toBe(true);
    expect(result.escalation_decision.operator_approval_required).toBe(true);
    expect(result.escalation_decision.certification_review_required).toBe(true);
  });

  it("maintains immutable governance decision registry and audit", () => {
    const result = validateOperatorFeedbackGovernance({ scenario: "GOVERNANCE_REVIEW" });

    expect(result.decision_registry_record.append_only).toBe(true);
    expect(result.decision_registry_record.immutable).toBe(true);
    expect(result.decision_registry_record.cryptographically_verifiable).toBe(true);
    expect(result.audit_events.every((event) => event.append_only && event.immutable)).toBe(true);
    expect(result.explanation.traceable).toBe(true);
  });

  it("enforces supremacy and authority boundaries without mutation", () => {
    const result = validateOperatorFeedbackGovernance({ scenario: "BASELINE" });

    expect(result.governance_supremacy_enforced).toBe(true);
    expect(result.constitutional_supremacy_enforced).toBe(true);
    expect(result.authority_separation_enforced).toBe(true);
    expect(result.modifies_production).toBe(false);
    expect(result.changes_policy).toBe(false);
    expect(result.alters_governance).toBe(false);
    expect(result.overrides_constitutional_constraints).toBe(false);
    expect(result.bypasses_approval_workflows).toBe(false);
    expect(result.modifies_historical_records).toBe(false);
    expect(result.expands_operator_authority).toBe(false);
  });

  it.each([
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_MISSING"],
    ["AUTHORITY_UNDEFINED", "AUTHORITY_UNDEFINED"],
    ["AUTHORITY_EXCEEDED", "AUTHORITY_EXCEEDED"],
    ["ROLE_MISMATCH", "ROLE_MISMATCH"],
    ["UNAUTHORIZED_OPERATOR", "UNAUTHORIZED_OPERATOR"],
    ["CROSS_TENANT_AUTHORITY", "CROSS_TENANT_AUTHORITY"],
    ["GOVERNANCE_RESTRICTION_VIOLATED", "GOVERNANCE_RESTRICTION_VIOLATED"],
    ["CONSTITUTIONAL_RULES_UNAVAILABLE", "CONSTITUTIONAL_RULES_UNAVAILABLE"],
    ["POLICY_VERSION_UNAVAILABLE", "POLICY_VERSION_UNAVAILABLE"],
    ["REPLAY_LINEAGE_INCOMPLETE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["TENANT_OWNERSHIP_AMBIGUOUS", "TENANT_OWNERSHIP_AMBIGUOUS"],
    ["ESCALATION_RULES_INVALID", "ESCALATION_RULES_INVALID"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["POLICY_MUTATION_ATTEMPT", "POLICY_MUTATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS_ATTEMPT", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["CONSTITUTIONAL_BYPASS_ATTEMPT", "CONSTITUTIONAL_BYPASS_ATTEMPT"],
    ["ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT", "ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT"],
    ["HISTORICAL_RECORD_MUTATION_ATTEMPT", "HISTORICAL_RECORD_MUTATION_ATTEMPT"],
    ["OPERATOR_AUTHORITY_EXPANSION_ATTEMPT", "OPERATOR_AUTHORITY_EXPANSION_ATTEMPT"],
    ["LEDGER_FAILURE", "LEDGER_NOT_CERTIFIED"],
  ] as readonly [FeedbackGovernanceScenario, FeedbackGovernanceFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateOperatorFeedbackGovernance({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.validation_state).toBe("HALTED");
    expect(result.fail_closed).toBe(true);
    expect(result.escalation_decision.downstream_progression_halted).toBe(true);
    expect(result.governance_validation.status).toBe("NON_COMPLIANT");
  });

  it("replays governance validation and detects tampering", () => {
    const result = validateOperatorFeedbackGovernance({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorFeedbackGovernanceValidation(result)).toBe(true);
    expect(replayOperatorFeedbackGovernanceValidation(tampered)).toBe(false);
  });
});
