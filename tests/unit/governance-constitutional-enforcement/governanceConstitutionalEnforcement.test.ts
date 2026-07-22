import { describe, expect, it } from "vitest";

import {
  getGovernanceConstitutionalEnforcementContract,
  replayGovernanceConstitutionalEnforcement,
  runGovernanceConstitutionalEnforcement,
  validateGovernanceConstitutionalEnforcement,
} from "../../../services/governance-constitutional-enforcement";

describe("governance constitutional enforcement", () => {
  it("runs deterministic certified governance enforcement", () => {
    const first = runGovernanceConstitutionalEnforcement();
    const second = runGovernanceConstitutionalEnforcement();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.persistent_capabilities_enabled).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateGovernanceConstitutionalEnforcement(first).valid).toBe(true);
    expect(replayGovernanceConstitutionalEnforcement(first)).toBe(true);
  });

  it("preserves constitutional and authority doctrine", () => {
    const bundle = getGovernanceConstitutionalEnforcementContract();

    expect(bundle.doctrine.constitution_supersedes_policy).toBe(true);
    expect(bundle.doctrine.human_authority_delegated).toBe(false);
    expect(bundle.doctrine.intelligence_advisory_only).toBe(true);
    expect(bundle.doctrine.fail_closed_default).toBe(true);
    expect(bundle.doctrine.governance_bypass_supported).toBe(false);
  });

  it("enforces governance, policy, authority, and human approval", () => {
    const result = runGovernanceConstitutionalEnforcement();

    expect(result.lifecycle_certified).toBe(true);
    expect(result.governance.governance_approved).toBe(true);
    expect(result.governance.workflow_valid).toBe(true);
    expect(result.policy.retention_policy_valid).toBe(true);
    expect(result.authority.advisory_only_enforced).toBe(true);
    expect(result.authority.operator_supremacy_enforced).toBe(true);
    expect(result.human_approval.state).toBe("APPROVED");
  });

  it("validates replay, evidence, audit, and observability", () => {
    const result = runGovernanceConstitutionalEnforcement();

    expect(result.replay_evidence.deterministic_replay).toBe(true);
    expect(result.replay_evidence.evidence_complete).toBe(true);
    expect(result.replay_evidence.provenance_valid).toBe(true);
    expect(result.ledger).toHaveLength(9);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
    expect(result.observability.governance_compliance_rate).toBe(1);
    expect(result.observability.audit_completeness).toBe(1);
  });

  it("runs the governance certification suite", () => {
    const result = runGovernanceConstitutionalEnforcement();

    expect(result.certification.tests).toHaveLength(45);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for mandatory blocking violations", () => {
    for (const scenario of ["GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "AUTHORITY_ESCALATION", "HUMAN_APPROVAL_MISSING", "REPLAY_DIVERGENCE", "TENANT_ISOLATION_BREACH", "UNAUTHORIZED_PERSISTENCE"] as const) {
      const result = runGovernanceConstitutionalEnforcement({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.persistent_capabilities_enabled).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateGovernanceConstitutionalEnforcement(result).valid).toBe(false);
    }
  });
});
