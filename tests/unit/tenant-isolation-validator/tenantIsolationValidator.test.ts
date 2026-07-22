import { describe, expect, it } from "vitest";
import {
  getTenantIsolationValidatorFoundation,
  replayTenantIsolationValidation,
  validateTenantIsolation,
} from "@/services/tenant-isolation-validator";
import type { TenantIsolationFailure, TenantIsolationScenario } from "@/types/tenant-isolation-validator";

describe("Mission Control Phase 10.8.4 Tenant Isolation Validator", () => {
  it("publishes the tenant isolation validator foundation", () => {
    const foundation = getTenantIsolationValidatorFoundation();

    expect(foundation.tenant_isolation_validator_version).toBe("tenant-isolation-validator/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /tenant-isolation-validator/validate");
    expect(foundation.api_surface.cross_tenant_learning_supported).toBe(false);
    expect(foundation.api_surface.shared_replay_supported).toBe(false);
    expect(foundation.result.validation.isolation_status).toBe("ISOLATED");
  });

  it("validates tenant isolation deterministically", () => {
    const first = validateTenantIsolation({ scenario: "BASELINE" });
    const second = validateTenantIsolation({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("enforces tenant-first zero influence constraints", () => {
    const result = validateTenantIsolation();

    expect(result.advisory_only).toBe(true);
    expect(result.tenant_first).toBe(true);
    expect(result.privacy_preserving).toBe(true);
    expect(result.least_access_enforced).toBe(true);
    expect(result.zero_cross_tenant_influence).toBe(true);
    expect(result.tenant_isolated).toBe(true);
  });

  it("evaluates ownership, data, recommendation, replay, evidence, ledger, governance, and certification isolation", () => {
    const result = validateTenantIsolation({ scenario: "BASELINE" });

    expect(result.validation.ownership_status).toBe("ISOLATED");
    expect(result.validation.data_isolation_status).toBe("ISOLATED");
    expect(result.validation.recommendation_isolation_status).toBe("ISOLATED");
    expect(result.validation.replay_isolation_status).toBe("ISOLATED");
    expect(result.validation.evidence_isolation_status).toBe("ISOLATED");
    expect(result.validation.ledger_isolation_status).toBe("ISOLATED");
    expect(result.validation.governance_isolation_status).toBe("ISOLATED");
    expect(result.validation.certification_isolation_status).toBe("ISOLATED");
    expect(result.validation.tenant_lineage.complete).toBe(true);
  });

  it("requires review without allowing tenant influence", () => {
    const result = validateTenantIsolation({ scenario: "REVIEW_REQUIRED" });

    expect(result.validation.isolation_status).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.zero_cross_tenant_influence).toBe(true);
  });

  it.each([
    ["CROSS_TENANT_DATA", "CROSS_TENANT_DATA_ACCESS"],
    ["CROSS_TENANT_RECOMMENDATION", "CROSS_TENANT_RECOMMENDATION_INFLUENCE"],
    ["CROSS_TENANT_LEARNING", "CROSS_TENANT_LEARNING_DETECTED"],
    ["CROSS_TENANT_OPTIMIZATION", "CROSS_TENANT_OPTIMIZATION_DETECTED"],
    ["SHARED_REPLAY", "SHARED_REPLAY_HISTORY"],
    ["SHARED_EVIDENCE", "SHARED_EVIDENCE_USAGE"],
    ["AUTHORITY_PROPAGATION", "CROSS_TENANT_AUTHORITY_PROPAGATION"],
    ["FOREIGN_REFERENCE", "FOREIGN_TENANT_REFERENCE"],
  ] as readonly [TenantIsolationScenario, TenantIsolationFailure][])("rejects cross-tenant leakage for %s", (scenario, failure) => {
    const result = validateTenantIsolation({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.validation.isolation_status).toBe("REJECTED");
    expect(result.zero_cross_tenant_influence).toBe(false);
    expect(result.validation.detected_leakage.length).toBeGreaterThan(0);
  });

  it.each([
    ["TENANT_IDENTITY_FAILURE", "TENANT_IDENTITY_UNVERIFIED"],
    ["OWNERSHIP_AMBIGUOUS", "PROPOSAL_OWNERSHIP_AMBIGUOUS"],
    ["LINEAGE_INCOMPLETE", "TENANT_LINEAGE_INCOMPLETE"],
    ["REPLAY_BOUNDARY", "REPLAY_BOUNDARY_VIOLATED"],
    ["EVIDENCE_UNVERIFIED", "EVIDENCE_OWNERSHIP_UNVERIFIED"],
    ["LEDGER_COMPROMISED", "LEDGER_ISOLATION_COMPROMISED"],
    ["GOVERNANCE_CONTAMINATION", "GOVERNANCE_ISOLATION_FAILED"],
    ["CERTIFICATION_CONTAMINATION", "CERTIFICATION_ISOLATION_FAILED"],
    ["NAMESPACE_VIOLATION", "NAMESPACE_INTEGRITY_VIOLATED"],
    ["HIDDEN_TENANT_DEPENDENCY", "HIDDEN_TENANT_DEPENDENCY"],
    ["SHARED_PROPOSAL", "SHARED_PROPOSAL_INFLUENCE"],
    ["SHARED_CONFIDENCE", "SHARED_CONFIDENCE_ADAPTATION"],
    ["SHARED_GOVERNANCE", "SHARED_GOVERNANCE_OUTCOME"],
    ["SHARED_CERTIFICATION", "SHARED_CERTIFICATION_INHERITANCE"],
    ["POLICY_EVALUATION", "CROSS_TENANT_POLICY_EVALUATION"],
    ["MIXED_OWNERSHIP", "MIXED_TENANT_OWNERSHIP"],
    ["METADATA_LEAKAGE", "METADATA_LEAKAGE"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ISOLATION_REASONING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["LEDGER_FAILURE", "ISOLATION_DECISION_RECORDING_FAILED"],
  ] as readonly [TenantIsolationScenario, TenantIsolationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateTenantIsolation({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.fail_closed).toBe(true);
    expect(result.tenant_isolated).toBe(false);
  });

  it("classifies isolation conflicts and restricted proposals", () => {
    expect(validateTenantIsolation({ scenario: "ISOLATION_CONFLICT" }).validation.isolation_status).toBe("ISOLATION_CONFLICT");
    expect(validateTenantIsolation({ scenario: "MIXED_OWNERSHIP" }).validation.isolation_status).toBe("ISOLATION_CONFLICT");
    expect(validateTenantIsolation({ scenario: "RESTRICTED_PROPOSAL" }).validation.isolation_status).toBe("ISOLATED");
  });

  it("records immutable tenant isolation ledger evidence", () => {
    const result = validateTenantIsolation({ scenario: "BASELINE" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.replayable).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
  });

  it("replays validation and detects tampering", () => {
    const result = validateTenantIsolation({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayTenantIsolationValidation(result)).toBe(true);
    expect(replayTenantIsolationValidation(tampered)).toBe(false);
  });
});
