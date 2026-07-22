import { describe, expect, it } from "vitest";
import {
  defendGovernanceAuthority,
  getGovernanceAuthorityFoundation,
  replayGovernanceAuthorityDefense,
} from "@/services/governance-authority-drift-defense";
import type {
  GovernanceAuthorityDriftFailure,
  GovernanceAuthorityDriftScenario,
  GovernanceAuthorityDriftStatus,
} from "@/types/governance-authority-drift-defense";

describe("Mission Control Phase 10.12.5 Governance & Authority Drift Defense", () => {
  it("publishes the governance authority drift defense contract", () => {
    const foundation = getGovernanceAuthorityFoundation();

    expect(foundation.governance_authority_drift_defense_version).toBe("governance-authority-drift-defense/v1");
    expect(foundation.api_surface.defend_governance_authority).toBe("POST /governance-authority-drift-defense/defend");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /governance-authority-drift-defense/baseline");
    expect(foundation.api_surface.retrieve_governance_report).toBe("POST /governance-authority-drift-defense/governance-report");
    expect(foundation.api_surface.retrieve_authority_report).toBe("POST /governance-authority-drift-defense/authority-report");
    expect(foundation.api_surface.retrieve_containment).toBe("POST /governance-authority-drift-defense/containment");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /governance-authority-drift-defense/contract");
    expect(foundation.api_surface.authority_expansion_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.autonomous_execution_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.defense_identifier).toBe("GovernanceAuthorityDriftDefense");
    expect(foundation.result.status).toBe("PASS");
  });

  it("defends deterministically with stable replay and integrity hashes", () => {
    const first = defendGovernanceAuthority();
    const second = defendGovernanceAuthority();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.governance_report.integrity_hash).toBe(second.governance_report.integrity_hash);
    expect(first.authority_report.integrity_hash).toBe(second.authority_report.integrity_hash);
    expect(first.constitutional_report.integrity_hash).toBe(second.constitutional_report.integrity_hash);
    expect(first.approval_report.integrity_hash).toBe(second.approval_report.integrity_hash);
    expect(first.escalation_report.integrity_hash).toBe(second.escalation_report.integrity_hash);
    expect(first.containment_decision.integrity_hash).toBe(second.containment_decision.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.mandatory_escalation.integrity_hash).toBe(second.mandatory_escalation.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayGovernanceAuthorityDefense(first)).toBe(true);
  });

  it("maintains the authoritative governance baseline", () => {
    const baseline = defendGovernanceAuthority().baseline;

    expect(baseline.baseline_id).toBe("governance_authority_baseline_v1");
    expect(baseline.governance_version).toBe("governance/v1");
    expect(baseline.constitutional_version).toBe("constitutional/v1");
    expect(baseline.authority_model).toEqual(expect.arrayContaining(["advisory_only", "no_execution_authority", "operator_final_authority"]));
    expect(baseline.approval_workflows).toContain("certification_approval_required");
    expect(baseline.escalation_policies).toContain("authority_expansion_block");
    expect(baseline.certification_requirements).toContain("tenant_isolation");
    expect(baseline.operator_authority).toContain("final_decision_authority");
    expect(baseline.approval_reference).toBe("governance-approval:governance-authority-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("generates governance, authority, constitutional, approval, and escalation reports", () => {
    const result = defendGovernanceAuthority();

    expect(result.governance_report.detected_governance_drift).toEqual([]);
    expect(result.governance_report.constitutional_analysis).toContain("intact");
    expect(result.governance_report.containment_actions).toContain("monitor_governance_integrity");
    expect(result.authority_report.authority_integrity_score).toBe(0.97);
    expect(result.authority_report.unauthorized_permissions).toEqual([]);
    expect(result.constitutional_report.governance_supremacy_preserved).toBe(true);
    expect(result.constitutional_report.operator_supremacy_preserved).toBe(true);
    expect(result.constitutional_report.tenant_isolation_preserved).toBe(true);
    expect(result.approval_report.approval_integrity_score).toBe(0.97);
    expect(result.escalation_report.escalation_consistency_score).toBe(0.97);
  });

  it("keeps baseline containment advisory while requiring a governed path", () => {
    const containment = defendGovernanceAuthority().containment_decision;

    expect(containment.automatic_blocks).toEqual([]);
    expect(containment.containment_actions).toEqual(["monitor_governance_integrity"]);
    expect(containment.mandatory_escalation_required).toBe(false);
    expect(containment.escalation_destinations).toEqual(["Operator Review"]);
    expect(containment.deterministic).toBe(true);
    expect(containment.replayable).toBe(true);
    expect(containment.auditable).toBe(true);
    expect(containment.governance_approved_path_required).toBe(true);
  });

  it("writes the canonical GovernanceDriftRecord ledger entry", () => {
    const record = defendGovernanceAuthority({ tenant_id: "tenant-alpha" }).drift_record;

    expect(record.drift_id).toMatch(/^governance_authority_drift_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.baseline_ref).toMatch(/[a-f0-9]{64}/);
    expect(record.governance_version).toBe("governance/v1");
    expect(record.constitutional_version).toBe("constitutional/v1");
    expect(record.drift_category).toBe("GOVERNANCE_AUTHORITY_DRIFT");
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.authority_impact).toBe("authority_preserved");
    expect(record.governance_impact).toBe("governance_preserved");
    expect(record.constitutional_impact).toBe("constitutional_preserved");
    expect(record.approval_workflow_impact).toBe("approval_workflow_preserved");
    expect(record.escalation_impact).toBe("escalation_preserved");
    expect(record.automatic_blocks).toEqual([]);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.replay_refs).toContain("replay:governance-authority-drift-defense");
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("preserves deterministic, replayable, governance, constitutional, operator, tenant, advisory, and no-authority-expansion invariants", () => {
    const result = defendGovernanceAuthority();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.expands_authority).toBe(false);
    expect(result.authorizes_autonomous_execution).toBe(false);
  });

  it.each([
    ["GOVERNANCE_RELAXATION", "GOVERNANCE_RELAXATION_DETECTED", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED", "FAIL_CLOSED"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_DETECTED", "CONTAINED"],
    ["APPROVAL_BYPASS", "APPROVAL_BYPASS_ATTEMPT", "CONTAINED"],
    ["GOVERNANCE_RULE_WEAKENING", "GOVERNANCE_RULE_WEAKENING", "REQUIRES_GOVERNANCE_REVIEW"],
    ["GOVERNANCE_DEPENDENCY_REMOVAL", "GOVERNANCE_DEPENDENCY_REMOVAL", "REQUIRES_GOVERNANCE_REVIEW"],
    ["POLICY_ENFORCEMENT_DEGRADATION", "POLICY_ENFORCEMENT_DEGRADATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["GOVERNANCE_SUPPRESSION", "GOVERNANCE_SUPPRESSION_DETECTED", "REQUIRES_GOVERNANCE_REVIEW"],
    ["APPROVAL_WORKFLOW_DEGRADATION", "APPROVAL_WORKFLOW_DEGRADATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["ESCALATION_SUPPRESSION", "ESCALATION_SUPPRESSION_DETECTED", "CONTAINED"],
    ["CERTIFICATION_AVOIDANCE", "CERTIFICATION_AVOIDANCE_DETECTED", "CONTAINED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED", "CONTAINED"],
    ["OPERATOR_AUTHORITY_REDUCTION", "OPERATOR_AUTHORITY_REDUCTION", "CONTAINED"],
    ["UNAUTHORIZED_GOVERNANCE_EVOLUTION", "UNAUTHORIZED_GOVERNANCE_EVOLUTION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ENFORCEMENT", "REQUIRES_GOVERNANCE_REVIEW"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_GOVERNANCE_EVIDENCE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_GOVERNANCE_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies and replays %s", (scenario: GovernanceAuthorityDriftScenario, failure: GovernanceAuthorityDriftFailure, status: GovernanceAuthorityDriftStatus) => {
    const result = defendGovernanceAuthority({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.drift_record.drift_category).toBe("GOVERNANCE_AUTHORITY_DRIFT");
    expect(result.expands_authority).toBe(false);
    expect(result.authorizes_autonomous_execution).toBe(false);
    expect(replayGovernanceAuthorityDefense(result)).toBe(true);
  });

  it("automatically blocks authority, approval, certification, escalation, privilege, and operator authority violations", () => {
    const authority = defendGovernanceAuthority({ scenario: "AUTHORITY_EXPANSION" });
    const approval = defendGovernanceAuthority({ scenario: "APPROVAL_BYPASS" });
    const certification = defendGovernanceAuthority({ scenario: "CERTIFICATION_AVOIDANCE" });
    const escalation = defendGovernanceAuthority({ scenario: "ESCALATION_SUPPRESSION" });
    const privilege = defendGovernanceAuthority({ scenario: "PRIVILEGE_ESCALATION" });
    const operator = defendGovernanceAuthority({ scenario: "OPERATOR_AUTHORITY_REDUCTION" });

    expect(authority.containment_decision.automatic_blocks).toContain("block_authority_expansion");
    expect(approval.containment_decision.automatic_blocks).toContain("block_approval_bypass");
    expect(certification.containment_decision.automatic_blocks).toContain("block_certification_avoidance");
    expect(escalation.containment_decision.automatic_blocks).toContain("block_escalation_suppression");
    expect(privilege.containment_decision.automatic_blocks).toContain("block_privilege_escalation");
    expect(operator.containment_decision.automatic_blocks).toContain("block_operator_authority_reduction");
    expect(authority.containment_decision.containment_actions).toEqual(expect.arrayContaining(["suspend_adaptation", "require_governance_review", "notify_operators"]));
    expect(authority.mandatory_escalation.required).toBe(true);
  });

  it("requires fail-closed recovery for constitutional violations and unknown governance behavior", () => {
    const constitutional = defendGovernanceAuthority({ scenario: "CONSTITUTIONAL_VIOLATION" });
    const unknown = defendGovernanceAuthority({ scenario: "UNKNOWN_BEHAVIOR" });

    expect(constitutional.status).toBe("FAIL_CLOSED");
    expect(constitutional.drift_record.recommended_response).toBe("FAIL_CLOSED");
    expect(constitutional.containment_decision.containment_actions).toContain("fail_closed");
    expect(constitutional.mandatory_escalation.destinations).toContain("Fail-Closed Recovery");
    expect(unknown.status).toBe("FAIL_CLOSED");
    expect(unknown.containment_decision.automatic_blocks).toContain("block_unknown_governance_behavior");
  });

  it("marks degraded determinism, replay, governance, constitutional, operator, and tenant guarantees", () => {
    expect(defendGovernanceAuthority({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "NONREPLAYABLE_EVIDENCE" }).replayable).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "NONREPLAYABLE_EVIDENCE" }).evidence_backed).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "GOVERNANCE_RELAXATION" }).governance_preserved).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "CONSTITUTIONAL_VIOLATION" }).constitutional_preserved).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "OPERATOR_AUTHORITY_REDUCTION" }).operator_authority_preserved).toBe(false);
    expect(defendGovernanceAuthority({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested governance containment tampering", () => {
    const result = defendGovernanceAuthority();
    const tampered = {
      ...result,
      containment_decision: {
        ...result.containment_decision,
        containment_actions: ["silently_continue"],
      },
    };

    expect(replayGovernanceAuthorityDefense(tampered)).toBe(false);
  });
});
