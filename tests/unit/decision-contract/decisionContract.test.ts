import { describe, expect, it } from "vitest";
import {
  computeDecisionContractIntegrityHash,
  createDecisionContract,
  getDecisionContractFoundation,
  serializeDecisionContract,
  validateCompatibility,
  validateContractVersion,
  validateDecisionContract,
  validateIntegrityHash,
} from "@/services/decision-contract";

describe("Mission Control Phase 9.1.1 Decision Contract Foundation", () => {
  it("publishes the canonical advisory-only Decision Contract foundation", () => {
    const foundation = getDecisionContractFoundation();

    expect(foundation.contract.contract_version).toBe("1.0.0");
    expect(foundation.contract.required_fields).toContain("governance_requirements");
    expect(foundation.contract.required_fields).toContain("constitutional_requirements");
    expect(foundation.contract.integrity_algorithm).toBe("SHA-256");
    expect(foundation.contract.authority_boundary.advisory_only).toBe(true);
    expect(foundation.contract.authority_boundary.execution_authorized).toBe(false);
    expect(foundation.validation.validation_state).toBe("VALID");
  });

  it("serializes and hashes deterministically for identical inputs", () => {
    const first = createDecisionContract();
    const second = createDecisionContract();

    expect(serializeDecisionContract(first)).toBe(serializeDecisionContract(second));
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(computeDecisionContractIntegrityHash(first)).toBe(first.integrity_hash);
    expect(validateIntegrityHash(first)).toBe(true);
  });

  it("validates semantic versions and same-major compatibility", () => {
    expect(validateContractVersion("1.0.0")).toBeNull();
    expect(validateContractVersion("1.2.3")).toBeNull();
    expect(validateContractVersion("2.0.0")?.reason).toBe("UNSUPPORTED_CONTRACT_VERSION");
    expect(validateContractVersion("1")?.reason).toBe("INVALID_SEMANTIC_VERSION");
    expect(validateCompatibility("1.0.0", "1.4.0").compatibility_state).toBe("COMPATIBLE");
    expect(validateCompatibility("1.0.0", "2.0.0").compatibility_state).toBe("INCOMPATIBLE");
  });

  it("fails closed when required identity or enum fields are missing or unsupported", () => {
    expect(validateDecisionContract(undefined).validation_state).toBe("INVALID");
    expect(validateDecisionContract(createDecisionContract({ orchestration_id: "" })).errors.some((error) => error.reason === "REQUIRED_FIELD_MISSING")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ decision_type: "BAD_TYPE" as never })).errors.some((error) => error.reason === "UNSUPPORTED_DECISION_TYPE")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ decision_priority: "BAD_PRIORITY" as never })).errors.some((error) => error.reason === "UNSUPPORTED_DECISION_PRIORITY")).toBe(true);
  });

  it("requires governance and constitutional references", () => {
    const contract = createDecisionContract();

    expect(validateDecisionContract(contract).checks.governance_valid).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ governance_requirements: { ...contract.governance_requirements, governing_policy_refs: [] } })).errors.some((error) => error.reason === "GOVERNANCE_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ constitutional_requirements: { ...contract.constitutional_requirements, constitutional_evaluation_refs: [] } })).errors.some((error) => error.reason === "CONSTITUTIONAL_REQUIREMENTS_MISSING")).toBe(true);
  });

  it("requires replay, lineage, serialization, and normalized timestamp guarantees", () => {
    const contract = createDecisionContract();

    expect(validateDecisionContract(createDecisionContract({ replay_requirements: { ...contract.replay_requirements, replay_id: "" } })).errors.some((error) => error.reason === "REPLAY_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ lineage_requirements: { ...contract.lineage_requirements, append_only: false as true } })).errors.some((error) => error.reason === "LINEAGE_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ serialization_rules: { ...contract.serialization_rules, canonical_ordering: false as true } })).errors.some((error) => error.reason === "SERIALIZATION_RULES_INVALID")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ created_at: "2026-07-02" })).errors.some((error) => error.reason === "IMMUTABLE_TIMESTAMP_INVALID")).toBe(true);
  });

  it("detects integrity mismatches and unsupported integrity algorithms", () => {
    expect(validateDecisionContract(createDecisionContract({ integrity_hash: "tampered" })).validation_state).toBe("INTEGRITY_MISMATCH");
    expect(validateDecisionContract(createDecisionContract({ integrity_algorithm: "MD5" as never })).errors.some((error) => error.reason === "INTEGRITY_ALGORITHM_UNSUPPORTED")).toBe(true);
  });

  it("blocks cross-tenant references, hidden behavior, and non-advisory authority", () => {
    const contract = createDecisionContract();

    expect(validateDecisionContract(createDecisionContract({ governance_requirements: { ...contract.governance_requirements, governing_policy_refs: ["policy_tenant_beta_decision_orchestration_v1"] } })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateDecisionContract({ ...contract, hidden_state: true }).errors.some((error) => error.reason === "HIDDEN_BEHAVIOR_DETECTED")).toBe(true);
    expect(validateDecisionContract(createDecisionContract({ authority_boundary: { ...contract.authority_boundary, execution_authorized: true as false } })).errors.some((error) => error.reason === "ADVISORY_ONLY_VIOLATION")).toBe(true);
  });

  it("publishes observability counters for created contracts and validation outcomes", () => {
    const foundation = getDecisionContractFoundation();

    expect(foundation.observability.contracts_created).toBe(1);
    expect(foundation.observability.version_distribution["1.0.0"]).toBe(1);
    expect(foundation.observability.replay_validation_success).toBe(1);
    expect(foundation.observability.validation_failures).toBe(0);
  });
});
