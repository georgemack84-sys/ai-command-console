import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_AUTHORITY_LEVELS,
  AUTHORITY_GOVERNANCE_CHECKS,
  computeAuthorityBindingHash,
  getAuthorityGovernanceBindingFoundation,
  replayAuthorityGovernanceBinding,
  runAuthorityGovernanceBinding,
} from "@/services/authority-governance-binding";
import type { AuthorityGovernanceBindingInput, AuthorityGovernanceFailure } from "@/types/authority-governance-binding";

describe("Mission Control Phase 10.0.5 Authority & Governance Binding", () => {
  it("publishes the authority governance binding foundation", () => {
    const foundation = getAuthorityGovernanceBindingFoundation();

    expect(foundation.binding_version).toBe("authority-governance-binding/v1");
    expect(foundation.checks).toEqual(AUTHORITY_GOVERNANCE_CHECKS);
    expect(foundation.allowed_authority_levels).toEqual(ADAPTIVE_AUTHORITY_LEVELS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("binds adaptive authority to governance and constitutional references", () => {
    const result = runAuthorityGovernanceBinding();

    expect(computeAuthorityBindingHash(result.binding)).toBe(result.binding.integrity_hash);
    expect(result.binding.authority_level).toBe("RECOMMENDATION");
    expect(result.binding.governance_policy_refs.length).toBeGreaterThan(0);
    expect(result.binding.constitutional_refs.length).toBeGreaterThan(0);
    expect(result.authority_decision.validation_outcome).toBe("PASS");
  });

  it("preserves operator supremacy and separation of duties", () => {
    const result = runAuthorityGovernanceBinding();

    expect(result.binding.operator_authority_required).toBe(true);
    expect(result.binding.separation_of_duties_verified).toBe(true);
    expect(result.validation.operator_supremacy_preserved).toBe(true);
    expect(result.validation.separation_of_duties_verified).toBe(true);
  });

  it("records replayable authority decisions and append-only ledger entries", () => {
    const result = runAuthorityGovernanceBinding();

    expect(result.replay_model.deterministic_reconstruction).toBe(true);
    expect(result.replay_model.integrity_reproducible).toBe(true);
    expect(result.authority_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.authority_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("remains replayable, advisory-only, and non-governance-mutating", () => {
    const result = runAuthorityGovernanceBinding();

    expect(replayAuthorityGovernanceBinding(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.authority_granted).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.mutates_governance).toBe(false);
  });

  it.each([
    ["STATE_MACHINE_INVALID", "ADAPTATION_STATE_MACHINE_INVALID"],
    ["AUTHORITY_SCOPE_EXCEEDED", "AUTHORITY_EXCEEDS_ASSIGNED_SCOPE"],
    ["PROHIBITED_AUTHORITY", "AUTHORITY_LEVEL_PROHIBITED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_APPROVAL_MISSING"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_MUTATION", "CONSTITUTIONAL_MUTATION_ATTEMPTED"],
    ["OPERATOR_BYPASS", "OPERATOR_AUTHORITY_BYPASSED"],
    ["OPERATOR_SUPREMACY_VIOLATION", "OPERATOR_SUPREMACY_VIOLATED"],
    ["SEPARATION_OF_DUTIES", "SEPARATION_OF_DUTIES_VIOLATED"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["RECURSIVE_DELEGATION", "RECURSIVE_DELEGATION"],
    ["IMPLICIT_PERMISSION", "IMPLICIT_PERMISSION"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["HIDDEN_AUTHORITY", "HIDDEN_AUTHORITY"],
    ["HIDDEN_EXECUTION_AUTHORITY", "HIDDEN_EXECUTION_AUTHORITY"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_PREREQUISITES_MISSING"],
    ["TENANT_CROSSOVER", "TENANT_AUTHORITY_CROSSOVER"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_AUTHORITY_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<AuthorityGovernanceBindingInput["scenario"]>, AuthorityGovernanceFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAuthorityGovernanceBinding({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.authority_granted).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks authority governance visibility", () => {
    const result = runAuthorityGovernanceBinding({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects authority governance binding tampering", () => {
    const result = runAuthorityGovernanceBinding();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAuthorityGovernanceBinding(tampered)).toBe(false);
  });
});
