import { describe, expect, it } from "vitest";
import { getEcosystemApplicationQualificationBundle, replayEcosystemApplicationQualification, runEcosystemApplicationQualification, validateEcosystemApplicationQualification } from "@/services/ecosystem-application-qualification";
import type { EcosystemApplicationQualificationScenario } from "@/types/ecosystem-application-qualification";

describe("Program 4 P4.21 Ecosystem Application Qualification", () => {
  it("publishes terminal qualification doctrine without certifying individual applications or executing upstream work", () => {
    const bundle = getEcosystemApplicationQualificationBundle();

    expect(bundle.doctrine.version).toBe("ecosystem-application-qualification/v4.21");
    expect(bundle.doctrine.owns_ecosystem_qualification).toBe(true);
    expect(bundle.doctrine.owns_ecosystem_readiness_assessment).toBe(true);
    expect(bundle.doctrine.owns_qualification_evidence_production).toBe(true);
    expect(bundle.doctrine.owns_qualification_decision_issuance).toBe(true);
    expect(bundle.doctrine.certifies_individual_applications).toBe(false);
    expect(bundle.doctrine.executes_replay).toBe(false);
    expect(bundle.doctrine.executes_interoperability_testing).toBe(false);
    expect(bundle.doctrine.performs_operational_monitoring).toBe(false);
    expect(bundle.doctrine.performs_governance_aggregation).toBe(false);
    expect(bundle.doctrine.modifies_application_certificates).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic ecosystem qualification record, report, ledger, and decision", () => {
    const first = runEcosystemApplicationQualification();
    const second = runEcosystemApplicationQualification();

    expect(first.phase_identifier).toBe("EcosystemApplicationQualification");
    expect(first.portfolio_governance_ref).toBe("ecosystem-portfolio-governance/v4.20");
    expect(first.record.qualification_id).toBe("qualification:program-4:ecosystem");
    expect(first.record.participating_applications).toContain("app:stevn-application");
    expect(first.record.consumed_application_certificates.length).toBeGreaterThan(0);
    expect(first.record.qualification_result).toBe("QUALIFIED");
    expect(first.report.qualification_conclusion).toBe("QUALIFIED");
    expect(first.report.reproducible).toBe(true);
    expect(first.ledger.immutable).toBe(true);
    expect(first.certification.decision_issued).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateEcosystemApplicationQualification(first).valid).toBe(true);
    expect(replayEcosystemApplicationQualification(first)).toBe(true);
  });

  it("qualifies all ecosystem domains from consumed evidence", () => {
    const result = runEcosystemApplicationQualification();

    expect(result.architecture.valid).toBe(true);
    expect(result.governance.valid).toBe(true);
    expect(result.interoperability.valid).toBe(true);
    expect(result.operations.valid).toBe(true);
    expect(result.replay.valid).toBe(true);
    expect(result.assurance.valid).toBe(true);
    expect(result.certificates.valid).toBe(true);
    expect(result.evidence.valid).toBe(true);
    expect(result.readiness.valid).toBe(true);
    expect(result.boundary.certifies_individual_applications).toBe(false);
    expect(result.boundary.executes_replay).toBe(false);
    expect(result.boundary.modifies_application_certificates).toBe(false);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.no_out_of_scope_execution).toBe(true);
  });

  it.each([
    "P4_20_PORTFOLIO_GOVERNANCE_INVALID",
    "P4_5_CERTIFICATES_INVALID",
    "PROGRAM_1_ASSURANCE_INVALID",
    "PROGRAM_2_ASSURANCE_INVALID",
    "PROGRAM_3_ASSURANCE_INVALID",
    "QUALIFICATION_RECORD_MISSING",
    "ARCHITECTURE_ASSESSMENT_MISSING",
    "ARCHITECTURE_INCOMPLETE",
    "DEPENDENCY_GRAPH_INVALID",
    "COMPOSITION_INVALID",
    "DEPLOYMENT_ARCHITECTURE_INVALID",
    "GOVERNANCE_ASSESSMENT_MISSING",
    "GOVERNANCE_COMPLIANCE_INVALID",
    "CONSTITUTIONAL_COMPLIANCE_INVALID",
    "AUTHORITY_ENFORCEMENT_INVALID",
    "POLICY_ENFORCEMENT_INVALID",
    "INTEROPERABILITY_ASSESSMENT_MISSING",
    "FEDERATION_CONTRACTS_INVALID",
    "WORKFLOW_INTEGRATION_INVALID",
    "INTERFACE_COMPATIBILITY_INVALID",
    "ORCHESTRATION_INTEGRITY_INVALID",
    "OPERATIONAL_ASSESSMENT_MISSING",
    "OPERATIONAL_READINESS_INVALID",
    "DIAGNOSTICS_INVALID",
    "OBSERVABILITY_INVALID",
    "OPERATIONAL_RESILIENCE_INVALID",
    "REPLAY_ASSESSMENT_MISSING",
    "REPLAY_EVIDENCE_INCOMPLETE",
    "REPLAY_NOT_REPRODUCIBLE",
    "REPLAY_TRACEABILITY_INVALID",
    "ASSURANCE_ASSESSMENT_MISSING",
    "ASSURANCE_EVIDENCE_INCOMPLETE",
    "CERTIFICATE_VERIFICATION_MISSING",
    "CERTIFICATE_LINEAGE_INVALID",
    "CERTIFICATE_STATUS_INVALID",
    "CERTIFICATE_DEPENDENCY_INVALID",
    "EVIDENCE_ASSESSMENT_MISSING",
    "EVIDENCE_INCOMPLETE",
    "PROVENANCE_INTEGRITY_INVALID",
    "EVIDENCE_LINEAGE_INVALID",
    "AUDIT_INCOMPLETE",
    "CONSUMER_READINESS_MISSING",
    "ECOSYSTEM_USABILITY_INVALID",
    "DEPLOYMENT_READINESS_INVALID",
    "DOCUMENTATION_INCOMPLETE",
    "QUALIFICATION_REPORT_MISSING",
    "LEDGER_ENTRY_MISSING",
    "LEDGER_IMMUTABILITY_INVALID",
    "QUALIFICATION_DECISION_MISSING",
    "INDIVIDUAL_APPLICATION_CERTIFICATION_ATTEMPTED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "INTEROPERABILITY_TEST_EXECUTION_ATTEMPTED",
    "OPERATIONAL_MONITORING_ATTEMPTED",
    "GOVERNANCE_AGGREGATION_ATTEMPTED",
    "APPLICATION_CERTIFICATE_MODIFICATION_ATTEMPTED",
    "PROGRAM_ASSURANCE_OVERRIDE_ATTEMPTED",
  ] as const)("fails ecosystem qualification for %s", (scenario: EcosystemApplicationQualificationScenario) => {
    const result = runEcosystemApplicationQualification({ scenario });
    const validation = validateEcosystemApplicationQualification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("maps evidence and governance gaps to specific qualification decisions", () => {
    expect(runEcosystemApplicationQualification({ scenario: "EVIDENCE_INCOMPLETE" }).record.qualification_result).toBe("REQUIRES_MORE_EVIDENCE");
    expect(runEcosystemApplicationQualification({ scenario: "GOVERNANCE_COMPLIANCE_INVALID" }).record.qualification_result).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(runEcosystemApplicationQualification({ scenario: "DOCUMENTATION_INCOMPLETE" }).record.qualification_result).toBe("REQUIRES_OPERATOR_REVIEW");
  });

  it("supports pruned certification outcomes", () => {
    const result = runEcosystemApplicationQualification({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
