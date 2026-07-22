import { describe, expect, it } from "vitest";
import { getCafConstitutionalFoundationBundle, replayCafConstitutionalFoundation, runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import type { CafConstitutionalFoundationFailure } from "@/types/caf-constitutional-foundation";

const CONDITIONAL_FAILURES: readonly CafConstitutionalFoundationFailure[] = [
  "CONSTITUTION_MISSING",
  "CONSTITUTION_INCOMPLETE",
  "CONSTITUTION_INCONSISTENT",
  "CONSTITUTIONAL_OWNERSHIP_UNCLEAR",
  "AGENT_DOCTRINE_MISSING",
  "DOCTRINE_CONFLICTS_WITH_CONSTITUTION",
  "AUTHORITY_MODEL_MISSING",
  "RUNTIME_INVARIANTS_MISSING",
  "CAF_VOCABULARY_MISSING",
  "TERMINOLOGY_NOT_UNIQUE",
  "CAF_CCI_CONTRACTS_MISSING",
  "CAF_CATA_CONTRACTS_MISSING",
  "CATA_AVAILABILITY_CONTRACT_MISSING",
  "TENANT_INTEGRATION_CONTRACT_MISSING",
  "CAF_ARCHITECTURE_MISSING",
  "SERVICE_BOUNDARY_MODEL_MISSING",
  "GOVERNANCE_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly CafConstitutionalFoundationFailure[] = [
  "WAVE_1_PLATFORM_OPERATIONS_INVALID",
  "W1_8_CAF_RUNTIME_INVALID",
  "AUTHORITY_PRECEDENCE_INVALID",
  "OPERATOR_SUPREMACY_NOT_ENFORCED",
  "DETERMINISTIC_REPLAY_NOT_GUARANTEED",
  "IMMUTABLE_EVIDENCE_NOT_REQUIRED",
  "AUTHORITY_VERIFICATION_NOT_REQUIRED",
  "POLICY_VALIDATION_NOT_REQUIRED",
  "SAFETY_VALIDATION_NOT_REQUIRED",
  "TENANT_ISOLATION_NOT_GUARANTEED",
  "CCI_COMPATIBILITY_FAILED",
  "CATA_COMPATIBILITY_FAILED",
  "CATA_FAIL_CLOSED_BEHAVIOR_UNDEFINED",
  "TENANT_BOUNDARIES_UNCLEAR",
  "GOVERNANCE_EVIDENCE_NOT_IMMUTABLE",
];

describe("W2.0 CAF Constitutional Foundation", () => {
  it("publishes CAF constitutional doctrine and validates baseline", () => {
    const bundle = getCafConstitutionalFoundationBundle();

    expect(bundle.doctrine.version).toBe("caf-constitutional-foundation/w2.0");
    expect(bundle.doctrine.owns_caf_constitution).toBe(true);
    expect(bundle.doctrine.owns_agent_doctrine).toBe(true);
    expect(bundle.doctrine.owns_authority_model).toBe(true);
    expect(bundle.doctrine.owns_runtime_invariants).toBe(true);
    expect(bundle.doctrine.owns_caf_vocabulary).toBe(true);
    expect(bundle.doctrine.owns_cci_contracts).toBe(true);
    expect(bundle.doctrine.owns_cata_contracts).toBe(true);
    expect(bundle.doctrine.enables_wave_2).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic constitutional approval with Wave 1 references", () => {
    const first = runCafConstitutionalFoundation();
    const second = runCafConstitutionalFoundation();

    expect(first.phase_identifier).toBe("CafConstitutionalFoundation");
    expect(first.platform_operations_ref).toBe("platform-operations/w1.9");
    expect(first.caf_runtime_ref).toBe("caf-legion-runtime/w1.8");
    expect(first.vocabulary.terms).toHaveLength(21);
    expect(first.evidence.records).toHaveLength(9);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCafConstitutionalFoundation(first).valid).toBe(true);
    expect(replayCafConstitutionalFoundation(first)).toBe(true);
  });

  it("approves constitution, doctrine, authority precedence, and runtime invariants", () => {
    const result = runCafConstitutionalFoundation();

    expect(result.constitution.constitutional_authority).toBe(true);
    expect(result.constitution.amendment_process).toBe(true);
    expect(result.doctrine.advisory_only).toBe(true);
    expect(result.doctrine.operator_supremacy).toBe(true);
    expect(result.doctrine.bounded_autonomy).toBe(true);
    expect(result.authority_model.precedence).toEqual(["Constitution", "Operator Authority", "Governance Policy", "Safety Policy", "CAF Runtime", "Agent Execution"]);
    expect(result.invariants.authority_before_execution).toBe(true);
    expect(result.invariants.policy_before_execution).toBe(true);
    expect(result.invariants.safety_before_execution).toBe(true);
    expect(result.invariants.replay_reproducibility).toBe(true);
  });

  it("approves vocabulary, CCI contracts, CATA contracts, availability, tenant integration, architecture, and evidence", () => {
    const result = runCafConstitutionalFoundation();

    expect(result.vocabulary.terminology_unique).toBe(true);
    expect(result.vocabulary.registry_complete).toBe(true);
    expect(result.cci_contracts.identity_contract).toBe(true);
    expect(result.cci_contracts.replay_contract).toBe(true);
    expect(result.cci_contracts.compatibility_validated).toBe(true);
    expect(result.cata_contracts.trust_evaluation_contract).toBe(true);
    expect(result.cata_contracts.certification_contract).toBe(true);
    expect(result.cata_availability.availability_modes).toContain("FAIL_SAFE");
    expect(result.cata_availability.mandatory_fail_closed).toBe(true);
    expect(result.tenant_integration.tenant_boundaries).toBe(true);
    expect(result.tenant_integration.isolation_guarantees).toBe(true);
    expect(result.architecture.platform_boundaries_approved).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.readiness.decision).toBe("CONSTITUTION_APPROVED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks CAF constitution conditionally approved for remediable deficiency %s", (failure) => {
    const result = runCafConstitutionalFoundation({ scenario: failure });
    const validation = validateCafConstitutionalFoundation(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_APPROVED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks CAF constitution not approved when constitutional review fails", () => {
    const result = runCafConstitutionalFoundation({ scenario: "CONSTITUTIONAL_REVIEW_NOT_APPROVED" });

    expect(result.readiness.decision).toBe("NOT_APPROVED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateCafConstitutionalFoundation(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical constitutional defect %s", (failure) => {
    const result = runCafConstitutionalFoundation({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateCafConstitutionalFoundation(result).valid).toBe(false);
  });

  it("supports approved with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runCafConstitutionalFoundation({ scenario: "APPROVED_WITH_OBSERVATIONS" });
    const conditional = runCafConstitutionalFoundation({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("APPROVED_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateCafConstitutionalFoundation(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_APPROVED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
