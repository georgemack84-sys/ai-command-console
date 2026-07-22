import { describe, expect, it } from "vitest";

import {
  buildProposedResponseDashboard,
  getProposedResponseDashboardContract,
  replayProposedResponseDashboard,
  validateProposedResponseDashboard,
} from "../../../services/proposed-response-dashboard";
import type {
  ProposedResponseDashboardFailure,
  ProposedResponseDashboardScenario,
} from "../../../types/proposed-response-dashboard";

const failureScenarios: ReadonlyArray<readonly [ProposedResponseDashboardScenario, ProposedResponseDashboardFailure]> = [
  ["MISSING_TENANT", "TENANT_CONTEXT_UNAVAILABLE"],
  ["MISSION_SCOPE_UNVERIFIED", "MISSION_SCOPE_UNVERIFIED"],
  ["SOURCE_PATTERN_MISSING", "SOURCE_PATTERN_UNRESOLVED"],
  ["PROPOSAL_VERSION_UNVERIFIED", "PROPOSAL_VERSION_UNVERIFIED"],
  ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_FAILED"],
  ["UNSUPPORTED_BENEFIT", "EXPECTED_BENEFIT_UNSUPPORTED"],
  ["MISSING_RISK", "EXPECTED_RISK_MISSING"],
  ["SIMULATION_UNVERIFIED", "SIMULATION_STATUS_UNVERIFIED"],
  ["SIMULATION_FAILED", "SIMULATION_FAILED_OR_DIVERGED"],
  ["GOVERNANCE_UNAVAILABLE", "GOVERNANCE_STATUS_UNAVAILABLE"],
  ["CERTIFICATION_UNAVAILABLE", "CERTIFICATION_READINESS_UNAVAILABLE"],
  ["REPLAY_UNAVAILABLE", "REPLAY_READINESS_UNAVAILABLE"],
  ["ROLLBACK_UNAVAILABLE", "ROLLBACK_READINESS_UNAVAILABLE"],
  ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
  ["NONDETERMINISTIC_CALCULATION", "CALCULATION_NONDETERMINISTIC"],
  ["HIDDEN_RESPONSE", "RESPONSE_PROPOSAL_HIDDEN"],
  ["REJECTED_RESPONSE_HIDDEN", "REJECTED_OR_FAILED_RESPONSE_HIDDEN"],
  ["CONDITIONAL_READY", "CONDITIONAL_READINESS_MISREPRESENTED"],
  ["UNDETERMINED_SCOPE", "AFFECTED_SCOPE_UNDETERMINED"],
  ["CROSS_TENANT_SCOPE", "CROSS_TENANT_SCOPE_BLOCKED"],
  ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
  ["EXECUTION_AUTHORITY_EXPOSED", "EXECUTION_AUTHORITY_EXPOSED"],
  ["APPROVAL_BYPASS", "APPROVAL_BYPASS_EXPOSED"],
  ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS_EXPOSED"],
  ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
];

describe("proposed response dashboard", () => {
  it("publishes the governed proposed response contract", () => {
    const contract = getProposedResponseDashboardContract();

    expect(contract.doctrine.version).toBe("proposed-response-dashboard/v10.14.4.9");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.doctrine.response_types).toEqual(expect.arrayContaining(["NO_ACTION", "UPDATE_OPERATOR_WORKFLOW", "INITIATE_CERTIFICATION_REVIEW"]));
    expect(contract.doctrine.response_statuses).toEqual(expect.arrayContaining(["REJECTED", "CONDITIONAL_PASS", "SUPERSEDED", "WITHDRAWN"]));
    expect(contract.doctrine.benefit_categories).toContain("OPERATOR_USABILITY");
    expect(contract.doctrine.risk_categories).toContain("UNKNOWN_RISK");
    expect(contract.doctrine.scope_states).toContain("UNDETERMINED");
    expect(contract.doctrine.simulation_states).toContain("DIVERGED");
    expect(contract.doctrine.certification_readiness_states).toContain("CONDITIONALLY_READY");
    expect(contract.doctrine.replay_states).toContain("INTEGRITY_FAILURE");
    expect(contract.doctrine.required_data_sources).toEqual(expect.arrayContaining(["Pattern Intelligence Engine", "Adaptive Simulation Framework", "Certification Ledger"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministically and replays without drift", () => {
    const first = buildProposedResponseDashboard();
    const second = buildProposedResponseDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateProposedResponseDashboard(first).valid).toBe(true);
    expect(replayProposedResponseDashboard(first)).toBe(true);
  });

  it("exposes complete response review context", () => {
    const result = buildProposedResponseDashboard();

    expect(result.records).toHaveLength(1);
    expect(result.proposal_queue.retained_terminal_states).toEqual(expect.arrayContaining(["REJECTED", "FAIL", "SUPERSEDED", "WITHDRAWN"]));
    expect(result.detail_view.proposal_distinguished_from_authority).toBe(true);
    expect(result.rationale_view.no_action_considered).toBe(true);
    expect(result.benefit_view.state).toBe("VERIFIED");
    expect(result.benefit_view.paired_risk_ref).toBe("expected_risk_view");
    expect(result.risk_view.residual_risk.length).toBeGreaterThan(0);
    expect(result.affected_scope_view.scope_state).toBe("MISSION_SCOPED");
    expect(result.simulation_view.expected_benefit_distinguished).toBe(true);
    expect(result.governance_view.approval_equals_certification).toBe(false);
    expect(result.certification_view.ready_for_formal_certification).toBe(true);
    expect(result.lineage_explorer.lineage_flow[0]).toBe("Observation");
    expect(result.evidence_workspace.contradictory_evidence_refs).toHaveLength(1);
    expect(result.replay_view.calculation_reproducible).toBe(true);
  });

  it("keeps proposals advisory and separate from execution authority", () => {
    const result = buildProposedResponseDashboard();

    expect(result.api_surface.execution_supported).toBe(false);
    expect(result.api_surface.production_modification_supported).toBe(false);
    expect(result.api_surface.policy_change_supported).toBe(false);
    expect(result.api_surface.strategy_change_supported).toBe(false);
    expect(result.api_surface.confidence_recalibration_supported).toBe(false);
    expect(result.api_surface.risk_recalibration_supported).toBe(false);
    expect(result.api_surface.automatic_approval_supported).toBe(false);
    expect(result.api_surface.governance_bypass_supported).toBe(false);
    expect(result.api_surface.certification_execution_supported).toBe(false);
    expect(result.next_action_panel.executes_action).toBe(false);
    expect(result.write_authority_granted).toBe(false);
  });

  it("derives next permitted actions deterministically", () => {
    expect(buildProposedResponseDashboard({ scenario: "EVIDENCE_INTEGRITY_FAILURE" }).next_action_panel.action).toBe("COLLECT_MORE_EVIDENCE");
    expect(buildProposedResponseDashboard({ scenario: "SIMULATION_FAILED" }).next_action_panel.action).toBe("RUN_SIMULATION");
    expect(buildProposedResponseDashboard({ scenario: "GOVERNANCE_UNAVAILABLE" }).next_action_panel.action).toBe("REQUEST_GOVERNANCE_REVIEW");
    expect(buildProposedResponseDashboard({ scenario: "CROSS_TENANT_SCOPE" }).next_action_panel.action).toBe("NO_ACTION_PERMITTED");
  });

  it("surfaces validation and observability counters", () => {
    const result = buildProposedResponseDashboard();

    expect(result.validation_tests).toHaveLength(25);
    expect(result.metrics.missing_response_proposals).toBe(0);
    expect(result.metrics.benefit_risk_mismatches).toBe(0);
    expect(result.metrics.simulation_state_inconsistencies).toBe(0);
    expect(result.metrics.integrity_verification_failures).toBe(0);
  });

  it.each(failureScenarios)("fails closed for %s", (scenario, failure) => {
    const result = buildProposedResponseDashboard({ scenario });
    const validation = validateProposedResponseDashboard(result);

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayProposedResponseDashboard(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = buildProposedResponseDashboard();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0]!,
          response_version: "v9",
        },
      ],
    };

    expect(validateProposedResponseDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayProposedResponseDashboard(tampered)).toBe(false);
  });
});
