import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_CONTRACT_CHECKS,
  ADAPTIVE_DOMAINS_ALLOWED,
  computeAdaptiveContractHash,
  getAdaptiveContractFoundation,
  replayAdaptiveContractFoundation,
  runAdaptiveContractFoundation,
} from "@/services/adaptive-intelligence-contract-foundation";
import type { AdaptiveContractFailure, AdaptiveContractFoundationInput } from "@/types/adaptive-intelligence-contract-foundation";

describe("Mission Control Phase 10.0.1 Adaptive Intelligence Contract Foundation", () => {
  it("publishes the adaptive contract foundation", () => {
    const foundation = getAdaptiveContractFoundation();

    expect(foundation.foundation_version).toBe("adaptive-intelligence-contract-foundation/v1");
    expect(foundation.checks).toEqual(ADAPTIVE_CONTRACT_CHECKS);
    expect(foundation.allowed_domains).toEqual(ADAPTIVE_DOMAINS_ALLOWED);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("creates an immutable adaptive intelligence contract identity", () => {
    const result = runAdaptiveContractFoundation();

    expect(computeAdaptiveContractHash(result.contract)).toBe(result.contract.integrity_hash);
    expect(result.contract.contract_id).toBe("adaptive_intelligence_contract_phase_10");
    expect(result.identity_record.unique_identity).toBe(true);
    expect(result.identity_record.immutable).toBe(true);
  });

  it("enforces deterministic version, tenant, mission, and ownership scope", () => {
    const result = runAdaptiveContractFoundation();

    expect(result.contract.contract_version.version_label).toBe("10.0.1");
    expect(result.contract.tenant_id).toBeTruthy();
    expect(result.contract.mission_scope.length).toBeGreaterThan(0);
    expect(result.contract.contract_authority.self_activation_allowed).toBe(false);
    expect(result.contract.contract_authority.self_certification_allowed).toBe(false);
  });

  it("binds governance, replay, certification, and rollback requirements", () => {
    const result = runAdaptiveContractFoundation();

    expect(result.contract.governance_requirements.length).toBeGreaterThan(0);
    expect(result.contract.constitutional_requirements.length).toBeGreaterThan(0);
    expect(result.replay_binding.deterministic_reconstruction).toBe(true);
    expect(result.certification_metadata.certification_status).toBe("CERTIFIED");
    expect(result.contract.rollback_required).toBe(true);
  });

  it("enforces inherited safety restrictions for future adaptive modules", () => {
    const result = runAdaptiveContractFoundation();

    expect(result.inheritance_rules.governance_requirements_inherited).toBe(true);
    expect(result.inheritance_rules.constitutional_requirements_inherited).toBe(true);
    expect(result.inheritance_rules.advisory_only_inherited).toBe(true);
    expect(result.inheritance_rules.restrictions_weakened).toBe(false);
    expect(result.inheritance_rules.cross_tenant_inheritance_allowed).toBe(false);
  });

  it("writes deterministic validation and adaptive contract ledger entries", () => {
    const result = runAdaptiveContractFoundation();

    expect(result.validation_report.validation_state).toBe("PASS");
    expect(result.contract_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.contract_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("remains replayable, advisory-only, and non-executing", () => {
    const result = runAdaptiveContractFoundation();

    expect(replayAdaptiveContractFoundation(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_adaptation).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["FINAL_CERTIFICATION_INVALID", "FINAL_ORCHESTRATOR_CERTIFICATION_INVALID"],
    ["DUPLICATE_IDENTITY", "DUPLICATE_CONTRACT_IDENTITY"],
    ["INVALID_VERSION", "INVALID_CONTRACT_VERSION"],
    ["MISSING_TENANT", "TENANT_SCOPE_MISSING"],
    ["MISSING_MISSION", "MISSION_SCOPE_MISSING"],
    ["AUTHORITY_UNDEFINED", "AUTHORITY_UNDEFINED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_CONSTITUTION", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["INCOMPLETE_AUTHORITY_REFS", "AUTHORITY_REFERENCES_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REFERENCES_MISSING"],
    ["ADVISORY_DISABLED", "ADVISORY_ONLY_DISABLED"],
    ["MISSING_PROHIBITED_TARGETS", "PROHIBITED_LEARNING_TARGETS_OMITTED"],
    ["ROLLBACK_DISABLED", "ROLLBACK_DISABLED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["LIFECYCLE_VIOLATION", "LIFECYCLE_VIOLATION"],
    ["CROSS_TENANT_INHERITANCE", "CROSS_TENANT_INHERITANCE"],
    ["RESTRICTION_WEAKENED", "INHERITED_RESTRICTION_WEAKENED"],
    ["HIDDEN_PERMISSION", "HIDDEN_PERMISSION"],
    ["SELF_CERTIFICATION", "SELF_CERTIFICATION_ATTEMPTED"],
    ["SELF_ACTIVATION", "SELF_ACTIVATION_ATTEMPTED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<AdaptiveContractFoundationInput["scenario"]>, AdaptiveContractFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveContractFoundation({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.validation_report.validation_state).toBe("FAIL");
    expect(result.permits_adaptation).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks adaptive contract visibility", () => {
    const result = runAdaptiveContractFoundation({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects adaptive contract foundation tampering", () => {
    const result = runAdaptiveContractFoundation();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveContractFoundation(tampered)).toBe(false);
  });
});
