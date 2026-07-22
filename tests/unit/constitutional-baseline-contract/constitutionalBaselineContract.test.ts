import { describe, expect, it } from "vitest";
import {
  buildConstitutionalBaselineObservabilitySurface,
  getConstitutionalAuthorityModel,
  getConstitutionalBaselineContract,
  getConstitutionalBaselineContractBundle,
  getConstitutionalComplianceSchema,
  getConstitutionalGovernanceRequirements,
  getConstitutionalInvariants,
  listConstitutionalAuditRecords,
  validateConstitutionalBaseline,
} from "@/services/constitutional-baseline-contract";
import type { ConstitutionalBaselineFailure, ConstitutionalBaselineScenario } from "@/types/constitutional-baseline-contract";

describe("constitutional baseline contract", () => {
  it("publishes the immutable constitutional baseline bundle", () => {
    const bundle = getConstitutionalBaselineContractBundle();

    expect(bundle.doctrine.contract_version).toBe("constitutional-baseline-contract/v8ALT.10.1");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_BASELINE_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.contract.contract_only).toBe(true);
    expect(bundle.contract.execution_authority_granted).toBe(false);
    expect(bundle.contract.mission_outcome_modification_authorized).toBe(false);
    expect(bundle.contract.governance_modification_authorized).toBe(false);
    expect(bundle.contract.constitution_modification_authorized).toBe(false);
    expect(bundle.contract.fail_open_authorized).toBe(false);
  });

  it("defines version, mission scope, authority, governance, invariants, and schema", () => {
    const contract = getConstitutionalBaselineContract();

    expect(contract.version_definition.constitution_version).toBe("constitutional-baseline-contract/v8ALT.10.1");
    expect(contract.mission_scopes.length).toBeGreaterThan(0);
    expect(getConstitutionalAuthorityModel().operator_authority).toBe("SUPREME");
    expect(getConstitutionalGovernanceRequirements().governance_precedes_execution).toBe(true);
    expect(getConstitutionalInvariants().length).toBe(14);
    expect(getConstitutionalComplianceSchema().sections.CONSTITUTION).toBe("REQUIRED");
  });

  it("keeps autonomy advisory, governed, deterministic, and operator-supervised", () => {
    const contract = getConstitutionalBaselineContract();

    expect(contract.authority_model.agent_authority).toBe("ADVISORY_ONLY");
    expect(contract.authority_model.autonomous_authority_creation_allowed).toBe(false);
    expect(contract.authority_model.privilege_escalation_allowed).toBe(false);
    expect(contract.governance_requirements.governance_bypass_allowed).toBe(false);
    expect(contract.compliance_schema.sections.DETERMINISM).toBe("REQUIRED");
    expect(contract.compliance_schema.sections.REPLAY).toBe("REQUIRED");
    expect(contract.compliance_schema.sections.ISOLATION).toBe("REQUIRED");
  });

  it("lists no audit records for the valid baseline", () => {
    expect(listConstitutionalAuditRecords()).toEqual([]);
  });

  it.each([
    ["CONSTITUTIONAL_VERSION_MISMATCH", "CONSTITUTIONAL_VERSION_MISMATCH"],
    ["MISSING_INVARIANT", "MISSING_INVARIANT_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["OPERATOR_BYPASS", "OPERATOR_BYPASS_DETECTED"],
    ["NONDETERMINISTIC_EXECUTION", "NONDETERMINISTIC_EXECUTION_DETECTED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["INTEGRITY_CORRUPTION", "INTEGRITY_CORRUPTION_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATION_DETECTED"],
    ["UNAUTHORIZED_LEARNING", "UNAUTHORIZED_LEARNING_DETECTED"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION_DETECTED"],
    ["UNAUTHORIZED_RECOVERY", "UNAUTHORIZED_RECOVERY_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["HIDDEN_STATE", "HIDDEN_STATE_DETECTED"],
    ["CONSTITUTIONAL_MODIFICATION", "CONSTITUTIONAL_MODIFICATION_DETECTED"],
    ["MISSING_AUDIT_EVIDENCE", "AUDIT_EVIDENCE_MISSING"],
    ["INCOMPLETE_REPLAY_LINEAGE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["FAIL_OPEN_BEHAVIOR", "FAIL_OPEN_BEHAVIOR_DETECTED"],
  ] satisfies [ConstitutionalBaselineScenario, ConstitutionalBaselineFailure][])("fails closed and audits %s", (scenario, failure) => {
    const contract = getConstitutionalBaselineContract({ scenario });
    const validation = validateConstitutionalBaseline(contract);

    expect(contract.final_state).toBe("CONSTITUTIONAL_BASELINE_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(contract.audit_records.some((record) => record.failure === failure)).toBe(true);
    expect(contract.audit_records.every((record) => record.immutable && record.append_only)).toBe(true);
    expect(contract.execution_authority_granted).toBe(false);
  });

  it("publishes constitutional baseline observability", () => {
    const surface = buildConstitutionalBaselineObservabilitySurface();

    expect(surface.final_state).toBe("CONSTITUTIONAL_BASELINE_DEFINED");
    expect(surface.invariant_count).toBe(14);
    expect(surface.mission_scope_count).toBeGreaterThan(0);
    expect(surface.audit_count).toBe(0);
    expect(surface.failure_count).toBe(0);
    expect(surface.execution_authority_granted).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
