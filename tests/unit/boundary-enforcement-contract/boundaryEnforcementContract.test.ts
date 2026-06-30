import { describe, expect, it } from "vitest";
import {
  buildBoundaryEnforcementContract,
  buildBoundaryEnforcementObservabilitySurface,
  computeBoundaryContractIntegrityHash,
  computeBoundaryDecisionHash,
  computeBoundaryDigitalSignature,
  computeBoundaryValidationHash,
  getBoundaryEnforcementFramework,
  validateBoundaryEnforcementContract,
} from "@/services/boundary-enforcement-contract";
import type { BoundaryEnforcementFailureReason, BoundaryEnforcementScenario } from "@/types/boundary-enforcement-contract";

describe("Mission Control Phase 8F.1 Boundary Enforcement Contract", () => {
  it("publishes canonical boundary doctrine and schema dimensions", () => {
    const framework = getBoundaryEnforcementFramework();

    expect(framework.doctrine.contract_version).toBe("boundary-enforcement-contract/v8F.1");
    expect(framework.doctrine.principles).toContain("explicit-authorization");
    expect(framework.doctrine.principles).toContain("default-deny");
    expect(framework.doctrine.principles).toContain("constitutional-supremacy");
    expect(framework.doctrine.lifecycle_states).toContain("AUTHORITY_VALIDATED");
    expect(framework.doctrine.request_types).toEqual(["PLAN", "ORCHESTRATE", "DELEGATE", "SUPERVISE", "EXECUTE", "ROLLBACK", "PAUSE", "RESUME", "TERMINATE", "ESCALATE"]);
    expect(framework.doctrine.boundary_categories).toEqual(["AUTHORITY", "GOVERNANCE", "CONSTITUTIONAL", "POLICY", "EXECUTION", "TENANT"]);
    expect(framework.doctrine.decision_types).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "BLOCK", "ESCALATE", "FAIL_SAFE"]);
  });

  it("builds an immutable baseline allow contract with complete evidence", () => {
    const contract = buildBoundaryEnforcementContract();
    const validation = validateBoundaryEnforcementContract(contract);

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.contract_version).toBe("boundary-enforcement-contract/v8F.1");
    expect(contract.decision.decision).toBe("ALLOW");
    expect(contract.runtime_state).toBe("AUTHORIZED");
    expect(validation.validation_state).toBe("PASS");
    expect(validation.authority_validated).toBe(true);
    expect(validation.governance_validated).toBe(true);
    expect(validation.constitution_validated).toBe(true);
    expect(validation.truth_ledger_recorded).toBe(true);
    expect(contract.truth_ledger_entry.append_only).toBe(true);
  });

  it("produces deterministic contract, validation, decision, replay, and signature hashes", () => {
    const first = buildBoundaryEnforcementContract();
    const second = buildBoundaryEnforcementContract();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(computeBoundaryContractIntegrityHash(first)).toBe(first.integrity_hash);
    expect(computeBoundaryDecisionHash(first.decision)).toBe(first.decision.integrity_hash);
    expect(computeBoundaryDigitalSignature(first.integrity_hash)).toBe(first.digital_signature);
    expect(first.validation_results.every((item) => computeBoundaryValidationHash(item) === item.integrity_hash)).toBe(true);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it("allows restriction and escalation states without granting unrestricted execution", () => {
    const restricted = buildBoundaryEnforcementContract({ scenario: "ALLOW_WITH_RESTRICTIONS" });
    const escalated = buildBoundaryEnforcementContract({ scenario: "OPERATOR_ESCALATION_REQUIRED" });

    expect(restricted.decision.decision).toBe("ALLOW_WITH_RESTRICTIONS");
    expect(restricted.runtime_state).toBe("RESTRICTED");
    expect(restricted.decision.restrictions).toContain("SUPERVISION_REQUIRED");
    expect(validateBoundaryEnforcementContract(restricted).validation_state).toBe("PASS");
    expect(escalated.decision.decision).toBe("ESCALATE");
    expect(escalated.operator_required).toBe(true);
    expect(escalated.escalation_reason).toContain("Operator approval");
  });

  it.each([
    ["AUTHORITY_INSUFFICIENT", "AUTHORITY_INSUFFICIENT"],
    ["GOVERNANCE_REJECTION", "GOVERNANCE_REJECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["EXECUTION_LIMIT_EXCEEDED", "EXECUTION_LIMIT_EXCEEDED"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["REPLAY_INTEGRITY_FAILURE", "REPLAY_INTEGRITY_FAILURE"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILURE"],
    ["UNKNOWN_CONDITION", "UNKNOWN_CONDITION_FAIL_CLOSED"],
    ["MISSING_TRUTH_LEDGER", "TRUTH_LEDGER_REFERENCE_MISSING"],
    ["LINEAGE_MISSING", "LINEAGE_REFERENCE_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILURE"],
    ["SIGNATURE_MISMATCH", "DIGITAL_SIGNATURE_INVALID"],
  ] as readonly [BoundaryEnforcementScenario, BoundaryEnforcementFailureReason][])("fails closed for %s", (scenario, reason) => {
    const contract = buildBoundaryEnforcementContract({ scenario });
    const validation = validateBoundaryEnforcementContract(contract);

    expect(validation.validation_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
    expect(contract.decision.allowed).toBe(false);
    expect(["BLOCK", "FAIL_SAFE"]).toContain(contract.decision.decision);
  });

  it("exposes boundary observability", () => {
    const contract = buildBoundaryEnforcementContract({ scenario: "POLICY_VIOLATION" });
    const surface = buildBoundaryEnforcementObservabilitySurface(contract);

    expect(surface.lifecycle_state).toBe("BLOCKED");
    expect(surface.evaluated_boundaries).toEqual(["AUTHORITY", "GOVERNANCE", "POLICY", "CONSTITUTIONAL", "EXECUTION", "TENANT"]);
    expect(surface.detected_violations).toContain("POLICY_VIOLATION");
    expect(surface.replay_status).toBe("PASS");
    expect(surface.integrity_status).toBe("VALID");
  });
});
