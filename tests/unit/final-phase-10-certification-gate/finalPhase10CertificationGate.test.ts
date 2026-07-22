import { describe, expect, it } from "vitest";

import {
  certifyFinalPhase10,
  getFinalPhase10Contract,
  replayFinalPhase10Certification,
  validateFinalPhase10Certification,
} from "../../../services/final-phase-10-certification-gate";
import type { FinalPhase10Failure, FinalPhase10Scenario } from "../../../types/final-phase-10-certification-gate";

const failureScenarios: ReadonlyArray<readonly [FinalPhase10Scenario, FinalPhase10Failure]> = [
  ["FAILED_PREREQUISITE", "FAILED_PREREQUISITE_CERTIFICATION"],
  ["NONDETERMINISTIC_BEHAVIOR", "NONDETERMINISTIC_ADAPTIVE_BEHAVIOR"],
  ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION"],
  ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
  ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
  ["ADVISORY_BOUNDARY_VIOLATION", "ADVISORY_ONLY_BOUNDARY_VIOLATION"],
  ["HIDDEN_LEARNING", "HIDDEN_LEARNING_DETECTED"],
  ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
  ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILED"],
  ["EVIDENCE_POISONING", "EVIDENCE_POISONING_DETECTED"],
  ["MEMORY_CONTAMINATION", "ADAPTIVE_MEMORY_CONTAMINATION"],
  ["CROSS_TENANT_LEAKAGE", "CROSS_TENANT_LEAKAGE"],
  ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASS"],
  ["CERTIFICATION_LINEAGE_CORRUPTION", "CERTIFICATION_LINEAGE_CORRUPTION"],
  ["LEDGER_INTEGRITY_FAILURE", "LEDGER_INTEGRITY_FAILURE"],
  ["DASHBOARD_VISIBILITY_FAILURE", "DASHBOARD_VISIBILITY_FAILURE"],
  ["UNRESOLVED_SAFETY_FINDINGS", "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS"],
  ["PRODUCTION_READINESS_FAILURE", "PRODUCTION_READINESS_FAILURE"],
  ["FAIL_OPEN_RECOVERY", "FAIL_OPEN_RECOVERY"],
  ["TRUTH_LEDGER_MUTATION", "TRUTH_LEDGER_MUTATION"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("final Phase 10 certification gate", () => {
  it("publishes final Phase 10 doctrine", () => {
    const contract = getFinalPhase10Contract();

    expect(contract.doctrine.version).toBe("final-phase-10-certification-gate/v10.15.10");
    expect(contract.doctrine.phase_11_requires_pass).toBe(true);
    expect(contract.doctrine.conditional_pass_blocks_progression).toBe(true);
    expect(contract.doctrine.governance_supremacy_required).toBe(true);
    expect(contract.doctrine.constitutional_supremacy_required).toBe(true);
    expect(contract.doctrine.prerequisite_certifications).toHaveLength(9);
    expect(contract.doctrine.lifecycle_states).toContain("AVAILABLE_FOR_USE");
    expect(contract.doctrine.rejection_states).toContain("FAIL_CLOSED");
    expect(contract.validation.valid).toBe(true);
  });

  it("issues the Phase 10 completion certificate on a clean PASS", () => {
    const first = certifyFinalPhase10();
    const second = certifyFinalPhase10();

    expect(first.status).toBe("PASS");
    expect(first.record.overall_certification_status).toBe("PASS");
    expect(first.record.production_authorized).toBe(true);
    expect(first.production_authorized).toBe(true);
    expect(first.phase_11_authorized).toBe(true);
    expect(first.completion_certificate.certification_outcome).toBe("CERTIFIED");
    expect(first.completion_certificate.phase_11_authorized).toBe(true);
    expect(first.final_report.deployment_recommendation).toBe("AUTHORIZE_PHASE_11");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateFinalPhase10Certification(first).valid).toBe(true);
    expect(replayFinalPhase10Certification(first)).toBe(true);
  });

  it("validates dependencies and qualification domains", () => {
    const result = certifyFinalPhase10();

    expect(result.dependency_validation.dependencies_complete).toBe(true);
    expect(result.end_to_end_qualification.lifecycle_states).toHaveLength(11);
    expect(result.end_to_end_qualification.rejection_states).toHaveLength(9);
    expect(result.constitutional_qualification.constitutional_supremacy_verified).toBe(true);
    expect(result.constitutional_qualification.truth_ledger_mutation_rejected).toBe(true);
    expect(result.governance_qualification.governance_validation_mandatory).toBe(true);
    expect(result.operational_qualification.production_readiness_verified).toBe(true);
    expect(result.production_authorization.production_eligible).toBe(true);
    expect(result.validation_tests).toHaveLength(39);
  });

  it.each(failureScenarios)("fails final certification for %s", (scenario, failure) => {
    const result = certifyFinalPhase10({ scenario });
    const validation = validateFinalPhase10Certification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.production_authorized).toBe(false);
    expect(result.phase_11_authorized).toBe(false);
    expect(result.completion_certificate.certification_outcome).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayFinalPhase10Certification(result)).toBe(false);
  });

  it("blocks Phase 11 on conditional pass", () => {
    const result = certifyFinalPhase10({ scenario: "NON_FUNCTIONAL_DEFICIENCY" });
    const validation = validateFinalPhase10Certification(result);

    expect(result.status).toBe("CONDITIONAL_PASS");
    expect(result.record.production_authorized).toBe(false);
    expect(result.phase_11_authorized).toBe(false);
    expect(result.completion_certificate.certification_outcome).toBe("CONDITIONALLY_CERTIFIED");
    expect(result.failures).toContain("NON_FUNCTIONAL_DEFICIENCY");
    expect(validation.valid).toBe(false);
  });

  it("detects tampering through certificate and record integrity checks", () => {
    const result = certifyFinalPhase10();
    const tampered = {
      ...result,
      completion_certificate: {
        ...result.completion_certificate,
        phase_11_authorized: false,
      },
    };

    expect(validateFinalPhase10Certification(tampered).integrity_hash_valid).toBe(false);
    expect(replayFinalPhase10Certification(tampered)).toBe(false);
  });
});
