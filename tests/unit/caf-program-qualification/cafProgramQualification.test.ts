import { describe, expect, it } from "vitest";
import {
  getProgramQualificationBundle,
  replayProgramQualification,
  runProgramQualification,
  validateProgramQualification,
} from "@/services/caf-program-qualification";
import type { ProgramQualificationScenario } from "@/types/caf-program-qualification";

describe("Program 3 P3.18 Program Qualification", () => {
  it("publishes qualification doctrine without owning certification, deployment, migration execution, replay execution, or assurance aggregation", () => {
    const bundle = getProgramQualificationBundle();

    expect(bundle.doctrine.version).toBe("caf-program-qualification/v3.18");
    expect(bundle.doctrine.owns_constitutional_qualification).toBe(true);
    expect(bundle.doctrine.owns_architectural_qualification).toBe(true);
    expect(bundle.doctrine.owns_governance_qualification).toBe(true);
    expect(bundle.doctrine.owns_platform_maturity_assessment).toBe(true);
    expect(bundle.doctrine.owns_platform_certification).toBe(false);
    expect(bundle.doctrine.owns_certification_issuance).toBe(false);
    expect(bundle.doctrine.owns_production_deployment).toBe(false);
    expect(bundle.doctrine.owns_migration_execution).toBe(false);
    expect(bundle.doctrine.owns_replay_execution).toBe(false);
    expect(bundle.doctrine.owns_assurance_aggregation).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("qualifies CAF Legion deterministically from Program 3 evidence dependencies", () => {
    const first = runProgramQualification();
    const second = runProgramQualification();

    expect(first.replay_evidence_ref).toBe("caf-behavioral-replay-divergence/v3.11");
    expect(first.operational_evidence_ref).toBe("caf-operations-incident-governance/v3.13");
    expect(first.platform_assurance_ref).toBe("caf-platform-assurance/v3.14");
    expect(first.platform_certification_requirements_ref).toBe("caf-platform-certification/v3.15");
    expect(first.interface_qualification_ref).toBe("caf-sdk-interface-qualification/v3.16");
    expect(first.migration_readiness_ref).toBe("caf-consumer-adoption-migration/v3.17");
    expect(first.decision.decision).toBe("QUALIFIED");
    expect(first.decision.outcome).toBe("PASS");
    expect(first.decision.certification_submission_ref).toBe("submit-to:p3.15:platform-certification");
    expect(first.decision.certification_authority_retained_by_p3_15).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProgramQualification(first).valid).toBe(true);
    expect(replayProgramQualification(first)).toBe(true);
  });

  it("enforces lifecycle, immutable evidence, replay consumption without execution, readiness, and maturity", () => {
    const result = runProgramQualification();

    expect(result.framework.lifecycle.at(0)).toBe("QUALIFICATION_REQUESTED");
    expect(result.framework.lifecycle.at(-1)).toBe("SUBMITTED_TO_P3_15_CERTIFICATION");
    expect(result.evidence_ledger.complete).toBe(true);
    expect(result.evidence_ledger.immutable).toBe(true);
    expect(result.evidence_ledger.lineage_refs.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.replay_consumed_not_executed).toBe(true);
    expect(result.readiness.result).toBe("PASS");
    expect(result.maturity.maturity_score).toBeGreaterThanOrEqual(result.maturity.threshold);
    expect(result.report.generated).toBe(true);
  });

  it.each([
    "P3_11_REPLAY_EVIDENCE_INVALID",
    "P3_13_OPERATIONAL_EVIDENCE_INVALID",
    "P3_14_ASSURANCE_REPORT_INVALID",
    "P3_15_CERTIFICATION_REQUIREMENTS_INVALID",
    "P3_16_INTERFACE_QUALIFICATION_INVALID",
    "P3_17_MIGRATION_READINESS_INVALID",
    "CCI_CONSTITUTIONAL_CONTRACTS_INVALID",
    "CONSTITUTIONAL_COMPLIANCE_FAILED",
    "ARCHITECTURE_INCOMPLETE",
    "GOVERNANCE_IMPLEMENTATION_FAILED",
    "AUTHORITY_ENFORCEMENT_FAILED",
    "POLICY_ENFORCEMENT_FAILED",
    "SAFETY_ENFORCEMENT_FAILED",
    "REPLAY_EVIDENCE_NOT_CONSUMED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "EVIDENCE_INCOMPLETE",
    "EVIDENCE_MUTABLE",
    "EVIDENCE_LINEAGE_INCOMPLETE",
    "INTEROPERABILITY_FAILED",
    "OPERATIONAL_READINESS_FAILED",
    "CONSUMER_READINESS_FAILED",
    "MATURITY_THRESHOLD_NOT_MET",
    "QUALIFICATION_REPORT_MISSING",
    "QUALIFICATION_DECISION_MISSING",
    "PLATFORM_CERTIFICATION_DUPLICATED",
    "PRODUCTION_DEPLOYMENT_ATTEMPTED",
    "MIGRATION_EXECUTION_ATTEMPTED",
    "ASSURANCE_AGGREGATION_DUPLICATED",
  ] as const)("rejects qualification for %s", (scenario: ProgramQualificationScenario) => {
    const result = runProgramQualification({ scenario });
    const validation = validateProgramQualification(result);

    expect(result.decision.decision).toBe("NOT_QUALIFIED");
    expect(result.decision.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports explicitly accepted conditional qualification without issuing certification", () => {
    const result = runProgramQualification({ scenario: "CONDITIONAL_DEFICIENCIES_ACCEPTED" });

    expect(result.decision.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.decision.outcome).toBe("CONDITIONAL_PASS");
    expect(result.decision.accepted_conditions.length).toBeGreaterThan(0);
    expect(result.decision.certification_authority_retained_by_p3_15).toBe(true);
    expect(validateProgramQualification(result).valid).toBe(true);
  });
});
