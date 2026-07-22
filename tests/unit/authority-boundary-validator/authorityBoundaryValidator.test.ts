import { describe, expect, it } from "vitest";
import {
  getAuthorityBoundaryValidatorFoundation,
  replayAuthorityBoundaryValidation,
  validateAuthorityBoundary,
} from "@/services/authority-boundary-validator";
import type { AuthorityBoundaryFailure, AuthorityBoundaryScenario } from "@/types/authority-boundary-validator";

describe("Mission Control Phase 10.8.3 Authority Boundary Validator", () => {
  it("publishes the authority boundary validator foundation", () => {
    const foundation = getAuthorityBoundaryValidatorFoundation();

    expect(foundation.authority_boundary_validator_version).toBe("authority-boundary-validator/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /authority-boundary-validator/validate");
    expect(foundation.api_surface.authority_grant_supported).toBe(false);
    expect(foundation.api_surface.execution_authority_supported).toBe(false);
    expect(foundation.result.validation.authority_status).toBe("AUTHORIZED");
  });

  it("validates authority boundaries deterministically", () => {
    const first = validateAuthorityBoundary({ scenario: "BASELINE" });
    const second = validateAuthorityBoundary({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("enforces least authority without granting authority", () => {
    const result = validateAuthorityBoundary();

    expect(result.advisory_only).toBe(true);
    expect(result.human_controlled).toBe(true);
    expect(result.governance_enforced).toBe(true);
    expect(result.least_authority_enforced).toBe(true);
    expect(result.authority_granted).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("evaluates all authority validation slices", () => {
    const result = validateAuthorityBoundary({ scenario: "BASELINE" });

    expect(result.validation.authority_scope.length).toBeGreaterThan(0);
    expect(result.validation.approval_authority_results[0].status).toBe("VALID");
    expect(result.validation.execution_authority_results[0].status).toBe("VALID");
    expect(result.validation.governance_authority_results[0].status).toBe("VALID");
    expect(result.validation.operator_authority_results[0].status).toBe("VALID");
    expect(result.validation.delegation_results[0].delegation_valid).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
  });

  it("returns approval and review states without granting execution", () => {
    expect(validateAuthorityBoundary({ scenario: "APPROVAL_REQUIRED" }).validation.authority_status).toBe("AUTHORIZED_WITH_APPROVAL");
    expect(validateAuthorityBoundary({ scenario: "OPERATOR_REVIEW" }).validation.authority_status).toBe("REQUIRES_OPERATOR_REVIEW");
    expect(validateAuthorityBoundary({ scenario: "GOVERNANCE_REVIEW" }).validation.authority_status).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(validateAuthorityBoundary({ scenario: "CONSTITUTIONAL_REVIEW" }).validation.authority_status).toBe("REQUIRES_CONSTITUTIONAL_REVIEW");
  });

  it.each([
    ["EXECUTION_EXPANSION", "EXECUTION_AUTHORITY_EXPANDED"],
    ["AUTONOMOUS_EXECUTION", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["RUNTIME_AUTHORITY", "RUNTIME_AUTHORITY_ACQUIRED"],
    ["PRODUCTION_AUTHORITY", "PRODUCTION_EXECUTION_AUTHORITY"],
    ["SELF_GRANTED_PERMISSION", "SELF_GRANTED_PERMISSION"],
  ] as readonly [AuthorityBoundaryScenario, AuthorityBoundaryFailure][])("rejects prohibited authority use for %s", (scenario, failure) => {
    const result = validateAuthorityBoundary({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.validation.authority_status).toBe("REJECTED");
    expect(result.authority_granted).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["SCOPE_UNDETERMINED", "AUTHORITY_SCOPE_UNDETERMINED"],
    ["OWNER_AMBIGUOUS", "AUTHORITY_OWNERSHIP_AMBIGUOUS"],
    ["APPROVAL_UNVERIFIED", "APPROVAL_AUTHORITY_UNVERIFIED"],
    ["GOVERNANCE_WEAKENING", "GOVERNANCE_AUTHORITY_WEAKENED"],
    ["OPERATOR_REDUCTION", "OPERATOR_SUPREMACY_REDUCED"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["LINEAGE_INCOMPLETE", "AUTHORITY_LINEAGE_INCOMPLETE"],
    ["CROSS_TENANT_AUTHORITY", "CROSS_TENANT_AUTHORITY_LEAKAGE"],
    ["MISSING_EVIDENCE", "AUTHORITY_EVIDENCE_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["LEDGER_FAILURE", "AUTHORITY_DECISION_RECORDING_FAILED"],
    ["INVALID_APPROVAL_CHAIN", "INVALID_APPROVAL_CHAIN"],
    ["AUTHORITY_INHERITANCE", "AUTHORITY_INHERITANCE_VIOLATION"],
    ["IMPLICIT_ELEVATION", "IMPLICIT_AUTHORITY_ELEVATION"],
    ["UNDOCUMENTED_DEPENDENCY", "UNDOCUMENTED_AUTHORITY_DEPENDENCY"],
  ] as readonly [AuthorityBoundaryScenario, AuthorityBoundaryFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateAuthorityBoundary({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.fail_closed).toBe(true);
    expect(result.authority_granted).toBe(false);
  });

  it("classifies authority conflicts and restricted proposals", () => {
    expect(validateAuthorityBoundary({ scenario: "AUTHORITY_CONFLICT" }).validation.authority_status).toBe("AUTHORITY_CONFLICT");
    expect(validateAuthorityBoundary({ scenario: "OWNER_AMBIGUOUS" }).validation.authority_status).toBe("AUTHORITY_CONFLICT");
    expect(validateAuthorityBoundary({ scenario: "RESTRICTED_PROPOSAL" }).validation.authority_status).toBe("AUTHORIZED");
  });

  it("records immutable authority ledger evidence", () => {
    const result = validateAuthorityBoundary({ scenario: "BASELINE" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.replayable).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
  });

  it("replays validation and detects tampering", () => {
    const result = validateAuthorityBoundary({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAuthorityBoundaryValidation(result)).toBe(true);
    expect(replayAuthorityBoundaryValidation(tampered)).toBe(false);
  });
});
