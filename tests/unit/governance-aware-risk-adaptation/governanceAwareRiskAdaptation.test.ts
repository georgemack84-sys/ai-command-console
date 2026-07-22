import { describe, expect, it } from "vitest";
import { evaluateGovernanceAwareRiskAdaptation, getGovernanceAwareRiskAdaptationFoundation, replayGovernanceAwareRiskAdaptation } from "@/services/governance-aware-risk-adaptation";
import type { GovernanceRiskFailure, GovernanceRiskScenario } from "@/types/governance-aware-risk-adaptation";

describe("Mission Control Phase 10.7.7 Governance-Aware Risk Adaptation", () => {
  it("publishes the governance-aware risk adaptation foundation", () => {
    const foundation = getGovernanceAwareRiskAdaptationFoundation();

    expect(foundation.governance_aware_risk_adaptation_version).toBe("governance-aware-risk-adaptation/v1");
    expect(foundation.api_surface.evaluate_governance).toBe("POST /governance-aware-risk-adaptation/evaluate");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("evaluates governance deterministically", () => {
    const first = evaluateGovernanceAwareRiskAdaptation({ scenario: "GOVERNANCE_REVIEW" });
    const second = evaluateGovernanceAwareRiskAdaptation({ scenario: "GOVERNANCE_REVIEW" });

    expect(first.records[0].governance_review_id).toBe(second.records[0].governance_review_id);
    expect(first.records[0].governance_decision).toBe(second.records[0].governance_decision);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("produces supported governance decisions", () => {
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "APPROVED_FOR_SIMULATION" }).records[0].governance_decision).toBe("APPROVED_FOR_SIMULATION");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "GOVERNANCE_REVIEW" }).records[0].governance_decision).toBe("GOVERNANCE_REVIEW_REQUIRED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "CONSTITUTIONAL_REVIEW" }).records[0].governance_decision).toBe("CONSTITUTIONAL_REVIEW_REQUIRED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "COMPLIANCE_REVIEW" }).records[0].governance_decision).toBe("COMPLIANCE_REVIEW_REQUIRED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "TRUST_REVIEW" }).records[0].governance_decision).toBe("TRUST_REVIEW_REQUIRED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "ESCALATED" }).records[0].governance_decision).toBe("ESCALATED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "REJECTED" }).records[0].governance_decision).toBe("REJECTED");
  });

  it("deterministically escalates mandatory escalation scenarios", () => {
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "CRITICAL_SEVERITY" }).impact_report.escalation_reasons).toContain("critical severity increase");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "AUTHORITY_BOUNDARY" }).impact_report.escalation_reasons).toContain("authority boundary change");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "ENTERPRISE_IMPACT" }).impact_report.escalation_reasons).toContain("enterprise-wide impact");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "CONSTITUTIONAL_REVIEW" }).impact_report.escalation_reasons).toContain("constitutional risk");
  });

  it("keeps governance evaluation advisory only", () => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario: "APPROVED_FOR_SIMULATION" });
    const record = result.records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_production_deployment).toBe(false);
    expect(result.mutates_production_risk_models).toBe(false);
    expect(result.changes_governance_policy).toBe(false);
    expect(result.modifies_certification_status).toBe(false);
    expect(record.overrides_operator_authority).toBe(false);
  });

  it("indexes governance decisions in an immutable ledger", () => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario: "TRUST_REVIEW" });
    const record = result.records[0];

    expect(result.decision_ledger.append_only).toBe(true);
    expect(result.decision_ledger.immutable).toBe(true);
    expect(result.decision_ledger.deleted).toBe(false);
    expect(result.decision_ledger.decision_index.TRUST_REVIEW_REQUIRED).toContain(record.governance_review_id);
  });

  it("replays governance evaluation", () => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario: "GOVERNANCE_REVIEW" });

    expect(replayGovernanceAwareRiskAdaptation(result)).toBe(true);
  });

  it.each([
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_COMPLIANCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_COMPLIANCE_MISSING"],
    ["MISSING_AUTHORITY", "AUTHORITY_VALIDATION_MISSING"],
    ["MISSING_COMPLIANCE", "COMPLIANCE_ASSESSMENT_MISSING"],
    ["MISSING_TRUST", "TRUST_ASSESSMENT_MISSING"],
    ["MISSING_ESCALATION", "ESCALATION_EVALUATION_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_ASSESSMENT_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_DECISION", "DETERMINISTIC_DECISION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["WEAKEN_CONSTITUTION", "CONSTITUTIONAL_PROTECTION_WEAKENING_DETECTED"],
    ["REDUCE_GOVERNANCE", "GOVERNANCE_OVERSIGHT_REDUCTION_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["APPROVAL_BYPASS", "APPROVAL_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"],
    ["GOVERNANCE_POLICY_MUTATION", "GOVERNANCE_POLICY_MUTATION_DETECTED"],
    ["CERTIFICATION_MUTATION", "CERTIFICATION_STATUS_MUTATION_DETECTED"],
    ["COMPLIANCE_POLICY_MUTATION", "COMPLIANCE_POLICY_MUTATION_DETECTED"],
    ["EVIDENCE_REWRITE", "HISTORICAL_EVIDENCE_REWRITE_DETECTED"],
    ["PRODUCTION_APPROVAL", "PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_GOVERNANCE_DECISION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [GovernanceRiskScenario, GovernanceRiskFailure][])("fails closed for %s", (scenario, failure) => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.authorizes_production_deployment).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects production and operator authority violations", () => {
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "PRODUCTION_APPROVAL" }).validation.state).toBe("REJECTED");
    expect(evaluateGovernanceAwareRiskAdaptation({ scenario: "OPERATOR_OVERRIDE" }).validation.state).toBe("REJECTED");
  });

  it("detects replay tampering", () => {
    const result = evaluateGovernanceAwareRiskAdaptation({ scenario: "APPROVED_FOR_SIMULATION" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceAwareRiskAdaptation(tampered)).toBe(false);
  });
});
