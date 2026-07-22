import { describe, expect, it } from "vitest";
import {
  buildCertificationObservabilitySurface,
  calculateAssuranceScores,
  executeCertification,
  getCoordinationAssuranceCertificationGate,
  validateCertification,
  validateCertificationGovernance,
  validateCertificationReplay,
} from "@/services/coordination-assurance-certification-gate";
import type { CertificationFailure, CertificationScenario } from "@/types/coordination-assurance-certification-gate";

describe("coordination assurance certification gate", () => {
  it("publishes the certified coordination assurance bundle", () => {
    const bundle = getCoordinationAssuranceCertificationGate();

    expect(bundle.doctrine.contract_version).toBe("coordination-assurance-certification-gate/v8ALT.7.12");
    expect(bundle.doctrine.final_state).toBe("MULTI_AGENT_COORDINATION_ASSURED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.report.decision_state).toBe("PASS");
    expect(bundle.report.production_authorization).toBe("AUTHORIZED_BY_CERTIFICATION_FIELD_ONLY");
    expect(bundle.report.deployment_enabled).toBe(false);
  });

  it("calculates baseline and failed certification scores deterministically", () => {
    expect(calculateAssuranceScores().certification_readiness).toBe(1);

    const failed = calculateAssuranceScores(["HIDDEN_COMMUNICATION_DETECTED"]);
    expect(failed.certification_readiness).toBe(0);
    expect(failed.communication_visibility_score).toBe(0);
    expect(failed.coordination_health).toBe("FAILED");
  });

  it("generates complete certification reports with evidence, events, and integrity", () => {
    const report = executeCertification();

    expect(report.session_record?.coordination_contract_id).toBeTruthy();
    expect(report.agent_records.length).toBeGreaterThan(0);
    expect(report.evidence_references).toEqual([
      "coordination",
      "planning",
      "delegation",
      "authority",
      "governance",
      "integrity",
      "replay",
      "conflict",
      "deadlock",
      "communication",
      "dashboard",
    ]);
    expect(report.events[0]?.integrity_hash).toBeTruthy();
    expect(report.integrity_hash).toBeTruthy();
  });

  it("validates replay and governance certification paths", () => {
    expect(validateCertificationReplay().replay_reproduced).toBe(true);
    expect(validateCertificationGovernance().governance_aligned).toBe(true);
    expect(validateCertificationGovernance({ scenario: "GOVERNANCE_BYPASS" }).governance_bypass_prevented).toBe(false);
  });

  it("blocks production for conditional pass states", () => {
    const report = executeCertification({ scenario: "DASHBOARD_GAP" });
    const validation = validateCertification(report);

    expect(report.decision_state).toBe("CONDITIONAL_PASS");
    expect(report.production_authorization).toBe("BLOCKED");
    expect(report.deployment_enabled).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
  });

  it.each([
    ["MISSING_COORDINATION_CONTRACT", "MISSING_COORDINATION_CONTRACT"],
    ["UNKNOWN_AGENT", "UNKNOWN_AGENT_PARTICIPATES"],
    ["PLAN_DIVERGENCE", "PLAN_DIVERGENCE_DETECTED"],
    ["DELEGATION_MISMATCH", "DELEGATION_MISMATCH_DETECTED"],
    ["DUPLICATE_OWNERSHIP", "DUPLICATE_OWNERSHIP_DETECTED"],
    ["AUTHORITY_OVERLAP", "AUTHORITY_OVERLAP_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH_DETECTED"],
    ["HIDDEN_COMMUNICATION", "HIDDEN_COMMUNICATION_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["HASH_CORRUPTION", "HASH_CORRUPTION_DETECTED"],
    ["UNDETECTED_DEADLOCK", "UNDETECTED_DEADLOCK"],
    ["UNDETECTED_RACE_CONDITION", "UNDETECTED_RACE_CONDITION"],
    ["CROSS_TENANT_LEAKAGE", "CROSS_TENANT_LEAKAGE_DETECTED"],
    ["DASHBOARD_EXECUTION_AUTHORITY", "DASHBOARD_EXECUTION_AUTHORITY_DETECTED"],
    ["INCOMPLETE_OPERATOR_VISIBILITY", "INCOMPLETE_OPERATOR_VISIBILITY"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["EVIDENCE_INCOMPLETE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [CertificationScenario, CertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const report = executeCertification({ scenario });
    const validation = validateCertification(report);

    expect(report.decision_state).toBe("FAIL");
    expect(report.production_authorization).toBe("BLOCKED");
    expect(report.deployment_enabled).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes certification observability without execution authority", () => {
    const surface = buildCertificationObservabilitySurface();

    expect(surface.decision_state).toBe("PASS");
    expect(surface.production_authorization).toBe("AUTHORIZED_BY_CERTIFICATION_FIELD_ONLY");
    expect(surface.failure_count).toBe(0);
    expect(surface.readiness).toBe(1);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
