import { describe, expect, it } from "vitest";
import {
  APPROVAL_WORKFLOW_STAGES,
  AUTHORITY_VISIBILITY_LEVELS,
  CONSTITUTIONAL_VISIBILITY_STATES,
  GOVERNANCE_VISIBILITY_STATES,
  RESTRICTION_TYPES,
  computeGovernanceStatusRecordHash,
  getGovernanceAuthorityVisibilityFoundation,
  replayGovernanceAuthorityVisibility,
  runGovernanceAuthorityVisibility,
} from "@/services/decision-governance-authority-visibility";
import type { GovernanceAuthorityVisibilityFailure, GovernanceAuthorityVisibilityInput } from "@/types/decision-governance-authority-visibility";

describe("Mission Control Phase 9.11.6 Governance & Authority Visibility", () => {
  it("publishes the governance and authority visibility foundation", () => {
    const foundation = getGovernanceAuthorityVisibilityFoundation();

    expect(foundation.visibility_version).toBe("decision-governance-authority-visibility/v1");
    expect(foundation.governance_states).toEqual(GOVERNANCE_VISIBILITY_STATES);
    expect(foundation.constitutional_states).toEqual(CONSTITUTIONAL_VISIBILITY_STATES);
    expect(foundation.authority_levels).toEqual(AUTHORITY_VISIBILITY_LEVELS);
    expect(foundation.approval_stages).toEqual(APPROVAL_WORKFLOW_STAGES);
    expect(foundation.restriction_types).toEqual(RESTRICTION_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("renders deterministic governance, constitutional, authority, approval, and restriction views", () => {
    const first = runGovernanceAuthorityVisibility();
    const second = runGovernanceAuthorityVisibility();

    expect(second).toEqual(first);
    expect(first.governance_dashboard.governance_state).toBe("CONDITIONALLY_COMPLIANT");
    expect(first.constitutional_dashboard.constitutional_state).toBe("CONDITIONAL_REVIEW");
    expect(first.authority_dashboard.authority_level).toBe("GOVERNANCE_BOARD");
    expect(first.approval_workflow.approval_stage).toBe("GOVERNANCE_REVIEW");
    expect(first.restriction_views.length).toBeGreaterThan(0);
  });

  it("preserves status record integrity and immutable governance ledger evidence", () => {
    const result = runGovernanceAuthorityVisibility();

    expect(result.status_records.every((record) => computeGovernanceStatusRecordHash(record) === record.integrity_hash)).toBe(true);
    expect(result.governance_ledger).toHaveLength(3);
    expect(result.governance_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3]);
    expect(result.governance_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("shows governance lineage, replay references, and certification dependencies", () => {
    const result = runGovernanceAuthorityVisibility();

    expect(result.governance_dashboard.policy_results.length).toBeGreaterThan(0);
    expect(result.governance_dashboard.replay_refs.length).toBeGreaterThan(0);
    expect(result.governance_dashboard.certification_refs.length).toBeGreaterThan(0);
    expect(result.visibility_record.replay_ref).toBeTruthy();
    expect(result.visibility_record.certification_ref).toBeTruthy();
    expect(result.validation.governance_lineage_consistent).toBe(true);
    expect(result.validation.certification_dependencies_present).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runGovernanceAuthorityVisibility();

    expect(replayGovernanceAuthorityVisibility(result)).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_governance_or_authority).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("validates every required visibility boundary", () => {
    const result = runGovernanceAuthorityVisibility();

    expect(result.validation.governance_status_visible).toBe(true);
    expect(result.validation.constitutional_violations_visible).toBe(true);
    expect(result.validation.authority_assignments_accurate).toBe(true);
    expect(result.validation.approval_workflows_complete).toBe(true);
    expect(result.validation.operational_restrictions_visible).toBe(true);
    expect(result.validation.replay_refs_present).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["HIDE_GOVERNANCE_STATUS", "GOVERNANCE_STATUS_HIDDEN"],
    ["OMIT_CONSTITUTIONAL_VIOLATIONS", "CONSTITUTIONAL_VIOLATIONS_OMITTED"],
    ["BAD_AUTHORITY_ASSIGNMENTS", "AUTHORITY_ASSIGNMENTS_INACCURATE"],
    ["INCOMPLETE_APPROVAL_WORKFLOW", "APPROVAL_WORKFLOWS_INCOMPLETE"],
    ["HIDE_RESTRICTIONS", "OPERATIONAL_RESTRICTIONS_HIDDEN"],
    ["BAD_GOVERNANCE_LINEAGE", "GOVERNANCE_LINEAGE_INCONSISTENT"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION_DEPENDENCIES", "CERTIFICATION_DEPENDENCIES_ABSENT"],
    ["NONDETERMINISTIC_RENDERING", "DASHBOARD_RENDERING_NONDETERMINISTIC"],
    ["CROSS_TENANT", "CROSS_TENANT_GOVERNANCE_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "GOVERNANCE_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<GovernanceAuthorityVisibilityInput["scenario"]>, GovernanceAuthorityVisibilityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runGovernanceAuthorityVisibility({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_governance_or_authority).toBe(false);
  });

  it("fails closed when the role lacks governance visibility", () => {
    const result = runGovernanceAuthorityVisibility({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runGovernanceAuthorityVisibility();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceAuthorityVisibility(tampered)).toBe(false);
  });
});
