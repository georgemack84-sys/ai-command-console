import { describe, expect, it } from "vitest";

import {
  buildGovernanceApprovalDashboard,
  getGovernanceApprovalDashboardContract,
  replayGovernanceApprovalDashboard,
  validateGovernanceApprovalDashboard,
} from "../../../services/governance-approval-dashboard";
import type {
  GovernanceApprovalDashboardFailure,
  GovernanceApprovalDashboardScenario,
} from "../../../types/governance-approval-dashboard";

const failureScenarios: ReadonlyArray<
  readonly [GovernanceApprovalDashboardScenario, GovernanceApprovalDashboardFailure]
> = [
  ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
  ["PROPOSAL_HIDDEN", "PROPOSAL_RECORD_HIDDEN"],
  ["BLOCKER_HIDDEN", "GOVERNANCE_BLOCKER_HIDDEN"],
  ["CONSTITUTIONAL_CONFLICT", "CONSTITUTIONAL_CONFLICT_UNRESOLVED"],
  ["INVALID_AUTHORITY", "INVALID_DECISION_AUTHORITY"],
  ["SILENCE_AS_APPROVAL", "SILENCE_TREATED_AS_APPROVAL"],
  ["CONDITIONAL_APPROVAL_UNMET", "CONDITIONAL_APPROVAL_INCOMPLETE"],
  ["MISSING_GOVERNANCE", "GOVERNANCE_STATUS_UNAVAILABLE"],
  ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_STATUS_UNAVAILABLE"],
  ["MISSING_AUTHORITY", "AUTHORITY_STATUS_UNAVAILABLE"],
  ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
  ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
  ["MISSING_CERTIFICATION", "CERTIFICATION_STATUS_UNAVAILABLE"],
  ["CONDITIONAL_CERTIFICATION", "CONDITIONAL_CERTIFICATION_MISREPRESENTED"],
  ["MISSING_REPLAY", "REPLAY_READINESS_UNAVAILABLE"],
  ["MISSING_ROLLBACK", "ROLLBACK_READINESS_UNAVAILABLE"],
  ["HIDDEN_APPROVAL_STATE", "HIDDEN_REVIEW_OR_APPROVAL_STATE"],
  ["VERSION_MISMATCH", "PROPOSAL_VERSION_INTEGRITY_FAILED"],
  ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
  ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
  ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
  ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
];

describe("governance approval dashboard", () => {
  it("publishes the governed read-only dashboard contract", () => {
    const contract = getGovernanceApprovalDashboardContract();

    expect(contract.doctrine.version).toBe("governance-approval-dashboard/v10.14.7");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.result.api_surface.independent_approval_supported).toBe(false);
    expect(contract.doctrine.governance_states).toContain("CONDITIONALLY_APPROVED");
    expect(contract.doctrine.approval_states).toContain("INVALID_AUTHORITY");
    expect(contract.doctrine.required_data_sources).toEqual(
      expect.arrayContaining([
        "Governance Engine",
        "Constitution Engine",
        "Authority Verification Service",
      ]),
    );
    expect(contract.doctrine.widgets).toEqual(
      expect.arrayContaining([
        "Approval Queue",
        "Governance Status",
        "Constitutional Status",
        "Escalation Timeline",
        "Certification Queue",
        "Rollback Readiness",
        "Authority Boundary",
        "Dependency Graph",
        "Evidence Workspace",
        "Decision History",
        "Alert Center",
      ]),
    );
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministically and replays without drift", () => {
    const first = buildGovernanceApprovalDashboard();
    const second = buildGovernanceApprovalDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateGovernanceApprovalDashboard(first).valid).toBe(true);
    expect(replayGovernanceApprovalDashboard(first)).toBe(true);
  });

  it("exposes the full governed approval workspace", () => {
    const result = buildGovernanceApprovalDashboard();

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.proposal_status).toBe("IN_REVIEW");
    expect(result.approval_queue.sorted_proposal_refs).toHaveLength(1);
    expect(result.governance_status_view.outcome).toBe("COMPLIANT");
    expect(result.constitutional_view.outcome).toBe("COMPLIANT");
    expect(result.authority_view.outcome).toBe("VALID");
    expect(result.operator_workspace.decision_state).toBe("APPROVED");
    expect(result.dependency_graph.mandatory_dependencies_satisfied).toBe(true);
    expect(result.certification_queue.certification_state).toBe("PASS");
    expect(result.replay_view.state).toBe("READY");
    expect(result.rollback_view.state).toBe("READY");
    expect(result.evidence_workspace.evidence_state).toBe("VERIFIED");
    expect(result.decision_history.append_only).toBe(true);
    expect(result.alert_center.critical_alerts_visible).toBe(true);
  });

  it("keeps approval, certification, and implementation authority separate", () => {
    const result = buildGovernanceApprovalDashboard();

    expect(result.operator_workspace.silence_treated_as_approval).toBe(false);
    expect(result.authority_view.implementation_authority_implied).toBe(false);
    expect(result.authority_view.certification_authority_implied).toBe(false);
    expect(result.governance_status_view.distinguishes_approval_from_certification).toBe(true);
    expect(result.rollback_view.implementation_eligible).toBe(true);
    expect(result.write_authority_granted).toBe(false);
    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.independent_approval_supported).toBe(false);
    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
  });

  it("derives the next permitted action from governed blockers", () => {
    expect(buildGovernanceApprovalDashboard({ scenario: "MISSING_EVIDENCE" }).records[0]?.next_permitted_action).toBe(
      "SUBMIT_EVIDENCE",
    );
    expect(
      buildGovernanceApprovalDashboard({ scenario: "CONSTITUTIONAL_CONFLICT" }).records[0]?.next_permitted_action,
    ).toBe(
      "NO_ACTION_PERMITTED",
    );
    expect(
      buildGovernanceApprovalDashboard({ scenario: "MISSING_OPERATOR_APPROVAL" }).records[0]?.next_permitted_action,
    ).toBe(
      "REQUEST_OPERATOR_REVIEW",
    );
  });

  it("surfaces complete validation and observability evidence", () => {
    const result = buildGovernanceApprovalDashboard();

    expect(result.validation_tests).toHaveLength(23);
    expect(result.metrics.unauthorized_access_attempts).toBe(0);
    expect(result.metrics.cross_tenant_exposure).toBe(0);
    expect(result.metrics.integrity_verification_failures).toBe(0);
    expect(result.metrics.certification_state_inconsistencies).toBe(0);
  });

  it.each(failureScenarios)("fails closed for %s", (scenario, failure) => {
    const result = buildGovernanceApprovalDashboard({ scenario });
    const validation = validateGovernanceApprovalDashboard(result);
    const replay = replayGovernanceApprovalDashboard(result);

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replay).toBe(false);
  });

  it("detects record tampering through integrity and replay checks", () => {
    const result = buildGovernanceApprovalDashboard();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0]!,
          tenant_id: "tenant-other",
        },
      ],
    };

    expect(validateGovernanceApprovalDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayGovernanceApprovalDashboard(tampered)).toBe(false);
  });
});
