import { describe, expect, it } from "vitest";
import {
  explainGovernanceReplay,
  getGovernanceExplainabilityReplayFoundation,
  replayGovernanceExplainability,
} from "@/services/governance-explainability-replay";
import type {
  GovernanceExplainabilityReplayFailure,
  GovernanceExplainabilityReplayScenario,
  GovernanceExplainabilityReplayState,
} from "@/types/governance-explainability-replay";

describe("Mission Control Phase 10.8.9 Governance Explainability & Replay", () => {
  it("publishes the governance explainability replay foundation", () => {
    const foundation = getGovernanceExplainabilityReplayFoundation();

    expect(foundation.governance_explainability_replay_version).toBe("governance-explainability-replay/v1");
    expect(foundation.api_surface.explain_governance).toBe("POST /governance-explainability-replay/explain");
    expect(foundation.api_surface.new_governance_decisions_supported).toBe(false);
    expect(foundation.api_surface.byte_identical_replay_required).toBe(true);
    expect(foundation.result.final_validation_state).toBe("APPROVED_FOR_SIMULATION");
  });

  it("explains governance replay deterministically", () => {
    const first = explainGovernanceReplay({ scenario: "BASELINE" });
    const second = explainGovernanceReplay({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.byte_identical).toBe(true);
  });

  it("remains advisory-only, immutable, audit-ready, and fully explainable when replay is clean", () => {
    const result = explainGovernanceReplay();

    expect(result.advisory_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.audit_ready).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.fully_explainable).toBe(true);
    expect(result.fail_closed).toBe(false);
  });

  it.each([
    ["APPROVED_FOR_SIMULATION", "APPROVED_FOR_SIMULATION"],
    ["REQUIRES_OPERATOR_REVIEW", "REQUIRES_OPERATOR_REVIEW"],
    ["REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_GOVERNANCE_REVIEW"],
    ["REQUIRES_CONSTITUTIONAL_REVIEW", "REQUIRES_CONSTITUTIONAL_REVIEW"],
    ["RESTRICTED", "RESTRICTED"],
    ["REJECTED", "REJECTED"],
  ] as readonly [GovernanceExplainabilityReplayScenario, GovernanceExplainabilityReplayState][])("explains %s as %s", (scenario, state) => {
    expect(explainGovernanceReplay({ scenario }).final_validation_state).toBe(state);
  });

  it("produces all explanation reports and evidence attribution", () => {
    const result = explainGovernanceReplay({ scenario: "APPROVED_FOR_SIMULATION" });

    expect(result.governance_explainability_report).toContain("FULLY_EXPLAINABLE");
    expect(result.governance_decision_narrative[0]).toContain("APPROVED_FOR_SIMULATION");
    expect(result.policy_attribution_report[0]).toContain("policy_status");
    expect(result.constitutional_reasoning_report[0]).toContain("constitutional_status");
    expect(result.authority_validation_explanation[0]).toContain("authority_status");
    expect(result.evidence_attribution_graph.length).toBeGreaterThan(4);
    expect(result.escalation_explanation_report).toBeDefined();
    expect(result.restriction_explanation_report).toBeDefined();
  });

  it("reconstructs byte-identical governance replay trace", () => {
    const result = explainGovernanceReplay({ scenario: "BASELINE" });

    expect(result.governance_replay_trace.map((step) => step.step_name)).toEqual([
      "validation",
      "policy_evaluation",
      "rule_execution",
      "tenant_isolation",
      "evidence_certification",
      "escalation_restriction",
    ]);
    expect(result.governance_replay_trace.every((step) => step.byte_identical)).toBe(true);
    expect(result.deterministic_replay_verification_report.replay_status).toBe("BYTE_IDENTICAL");
  });

  it("records immutable explainability ledger metadata", () => {
    const result = explainGovernanceReplay({ scenario: "BASELINE" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
    expect(result.ledger_entry.replay_report_id).toBe(result.deterministic_replay_verification_report.report_id);
  });

  it.each([
    ["MISSING_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_MISSING"],
    ["UNKNOWN_CONSTITUTIONAL_IMPLICATIONS", "CONSTITUTIONAL_IMPLICATIONS_UNKNOWN"],
    ["MISSING_REPLAY_CAPABILITY", "REPLAY_CAPABILITY_MISSING"],
    ["UNCLEAR_AUTHORITY_IMPACT", "AUTHORITY_IMPACT_UNCLEAR"],
    ["TENANT_BOUNDARY_RISK", "TENANT_BOUNDARY_RISK_EXISTS"],
    ["PROHIBITED_DOMAIN", "PROHIBITED_DOMAIN_AFFECTED"],
    ["OPERATOR_VISIBILITY_REDUCTION", "OPERATOR_VISIBILITY_REDUCED"],
    ["AUDITABILITY_WEAKENED", "AUDITABILITY_WEAKENED"],
    ["HISTORICAL_TRUTH_MUTATION", "HISTORICAL_TRUTH_MUTATED"],
    ["EXECUTION_CHANGE_WITHOUT_APPROVAL", "EXECUTION_BEHAVIOR_CHANGED_WITHOUT_APPROVAL"],
    ["INCOMPLETE_GOVERNANCE_LINEAGE", "GOVERNANCE_LINEAGE_INCOMPLETE"],
    ["NONDETERMINISTIC_CONSTITUTIONAL_VALIDATION", "CONSTITUTIONAL_VALIDATION_NONDETERMINISTIC"],
    ["UNRESOLVED_APPROVAL_REQUIREMENTS", "APPROVAL_REQUIREMENTS_UNRESOLVED"],
    ["ROLLBACK_UNAVAILABLE", "ROLLBACK_PATH_UNAVAILABLE"],
    ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_FAILED"],
    ["LEDGER_INTEGRITY_FAILURE", "GOVERNANCE_LEDGER_INTEGRITY_FAILED"],
    ["REPLAY_DIVERGENCE", "DETERMINISTIC_REPLAY_DIVERGED"],
    ["UNRESOLVED_CERTIFICATION_DEPENDENCIES", "CERTIFICATION_DEPENDENCIES_UNRESOLVED"],
    ["EXPLANATION_GENERATION_FAILURE", "GOVERNANCE_EXPLANATION_GENERATION_FAILED"],
    ["INCOMPLETE_EVIDENCE_ATTRIBUTION", "EVIDENCE_ATTRIBUTION_INCOMPLETE"],
    ["INCONSISTENT_REPLAY_METADATA", "REPLAY_METADATA_INCONSISTENT"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
  ] as readonly [GovernanceExplainabilityReplayScenario, GovernanceExplainabilityReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const result = explainGovernanceReplay({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.final_validation_state).toBe("FAIL_CLOSED");
    expect(result.fail_closed).toBe(true);
    expect(result.fully_explainable).toBe(false);
  });

  it("marks replay divergence as non-byte-identical", () => {
    const result = explainGovernanceReplay({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.byte_identical).toBe(false);
    expect(result.replayable).toBe(false);
    expect(result.deterministic_replay_verification_report.replay_status).toBe("DIVERGED");
  });

  it("replays explainability output and detects tampering", () => {
    const result = explainGovernanceReplay({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceExplainability(result)).toBe(true);
    expect(replayGovernanceExplainability(tampered)).toBe(false);
  });
});
