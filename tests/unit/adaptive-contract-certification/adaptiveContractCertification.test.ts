import { describe, expect, it } from "vitest";

import {
  certifyAdaptiveContract,
  getAdaptiveContractCertificationContract,
  replayAdaptiveContractCertification,
  validateAdaptiveContractCertification,
} from "../../../services/adaptive-contract-certification";
import type {
  AdaptiveContractCertificationFailure,
  AdaptiveContractCertificationScenario,
} from "../../../types/adaptive-contract-certification";

const failureScenarios: ReadonlyArray<readonly [AdaptiveContractCertificationScenario, AdaptiveContractCertificationFailure]> = [
  ["CONTRACT_MISSING", "ADAPTIVE_CONTRACT_MISSING"],
  ["SCHEMA_INVALID", "CONTRACT_SCHEMA_INVALID"],
  ["VERSION_UNCERTIFIED", "CONTRACT_VERSION_UNCERTIFIED"],
  ["SCOPE_MISSING", "ADAPTIVE_SCOPE_UNDEFINED"],
  ["LEARNING_BOUNDARY_UNDEFINED", "LEARNING_BOUNDARY_UNDEFINED"],
  ["PROHIBITED_DOMAINS_OMITTED", "PROHIBITED_DOMAINS_OMITTED"],
  ["HIDDEN_LEARNING_PERMITTED", "HIDDEN_LEARNING_PERMITTED"],
  ["UNAUTHORIZED_MEMORY", "UNAUTHORIZED_MEMORY_REJECTED"],
  ["CROSS_TENANT_LEARNING", "CROSS_TENANT_LEARNING_DETECTED"],
  ["ADVISORY_ONLY_ABSENT", "ADVISORY_ONLY_GUARANTEE_ABSENT"],
  ["AUTONOMOUS_EXECUTION", "AUTONOMOUS_EXECUTION_PERMITTED"],
  ["GOVERNANCE_BINDING_MISSING", "GOVERNANCE_BINDING_MISSING"],
  ["CONSTITUTIONAL_BINDING_MISSING", "CONSTITUTIONAL_BINDING_MISSING"],
  ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_DETECTED"],
  ["TRUTH_LEDGER_MUTATION", "TRUTH_LEDGER_MUTATION_ALLOWED"],
  ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASS"],
  ["REPLAY_INCOMPLETE", "REPLAY_REQUIREMENTS_INCOMPLETE"],
  ["NONDETERMINISTIC_EVALUATION", "NONDETERMINISTIC_CONTRACT_EVALUATION"],
  ["SIMULATION_PREREQUISITE_MISSING", "SIMULATION_PREREQUISITE_MISSING"],
  ["ROLLBACK_MISSING", "ROLLBACK_REQUIREMENTS_MISSING"],
  ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
  ["AUDIT_LINEAGE_INCOMPLETE", "AUDIT_LINEAGE_INCOMPLETE"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("adaptive contract certification", () => {
  it("publishes the adaptive contract certification doctrine", () => {
    const contract = getAdaptiveContractCertificationContract();

    expect(contract.doctrine.version).toBe("adaptive-contract-certification/v10.15.1");
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.doctrine.certification_required).toBe(true);
    expect(contract.doctrine.permitted_learning_domains).toEqual(expect.arrayContaining(["TRUTH_LEDGER_RECORDS", "CERTIFIED_ADAPTIVE_MEMORY", "REPLAY_ANALYSIS"]));
    expect(contract.doctrine.prohibited_learning_domains).toEqual(expect.arrayContaining(["HIDDEN_RUNTIME_STATE", "CROSS_TENANT_INFORMATION", "POISONED_EVIDENCE"]));
    expect(contract.doctrine.permitted_authority).toEqual(expect.arrayContaining(["OBSERVATION", "RECOMMENDATION", "SIMULATION"]));
    expect(contract.doctrine.prohibited_authority).toEqual(expect.arrayContaining(["EXECUTION", "PRODUCTION_MUTATION", "TRUTH_LEDGER_MUTATION", "CERTIFICATION_APPROVAL"]));
    expect(contract.doctrine.required_scope).toContain("Adaptive Dashboard");
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies deterministically and replays without drift", () => {
    const first = certifyAdaptiveContract();
    const second = certifyAdaptiveContract();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAdaptiveContractCertification(first).valid).toBe(true);
    expect(replayAdaptiveContractCertification(first)).toBe(true);
  });

  it("validates learning, governance, constitutional, authority, advisory, and replay boundaries", () => {
    const result = certifyAdaptiveContract();

    expect(result.learning_boundary.permitted_domains_validated).toBe(true);
    expect(result.learning_boundary.prohibited_domains_enforced).toBe(true);
    expect(result.learning_boundary.hidden_learning_blocked).toBe(true);
    expect(result.governance_binding.invocation_mandatory).toBe(true);
    expect(result.governance_binding.overrides_prohibited).toBe(true);
    expect(result.constitutional_binding.review_mandatory).toBe(true);
    expect(result.constitutional_binding.violations_rejected).toBe(true);
    expect(result.authority_boundary.execution_prohibited).toBe(true);
    expect(result.authority_boundary.truth_ledger_mutation_prohibited).toBe(true);
    expect(result.authority_boundary.operator_approval_required).toBe(true);
    expect(result.advisory_boundary.execute_allowed).toBe(false);
    expect(result.advisory_boundary.approve_allowed).toBe(false);
    expect(result.replay_validation.contract_replay_reproducible).toBe(true);
  });

  it("emits complete certification and boundary reports", () => {
    const result = certifyAdaptiveContract();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.authority_boundary_assessment).toBe("PASS");
    expect(result.certification_report.governance_binding_assessment).toBe("PASS");
    expect(result.boundary_report.tenant_isolation_validated).toBe(true);
    expect(result.boundary_report.operator_authority_preserved).toBe(true);
    expect(result.boundary_report.advisory_only_verified).toBe(true);
    expect(result.boundary_report.certification_evidence_refs).toHaveLength(2);
    expect(result.validation_tests).toHaveLength(27);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyAdaptiveContract({ scenario });
    const validation = validateAdaptiveContractCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayAdaptiveContractCertification(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = certifyAdaptiveContract();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        contract_version: "tampered",
      },
    };

    expect(validateAdaptiveContractCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayAdaptiveContractCertification(tampered)).toBe(false);
  });
});
