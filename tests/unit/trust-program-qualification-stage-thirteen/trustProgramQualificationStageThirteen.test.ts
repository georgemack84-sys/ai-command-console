import { describe, expect, it } from "vitest";

import { getTrustProgramQualificationStageThirteenBundle, replayTrustProgramQualificationStageThirteen, runTrustProgramQualificationStageThirteen, validateTrustProgramQualificationStageThirteen } from "@/services/trust-program-qualification-stage-thirteen";
import type { TrustProgramQualificationFailure } from "@/types/trust-program-qualification-stage-thirteen";

const conditionalFailures = ["CONSTITUTIONAL_COMPLIANCE_UNVERIFIED", "TRUST_DETERMINISM_UNVERIFIED", "RESOLUTION_CORRECTNESS_UNVERIFIED", "EXPLAINABILITY_INCOMPLETE", "HUMAN_OVERSIGHT_UNQUALIFIED", "CONTINUOUS_MONITORING_UNQUALIFIED", "DRIFT_DETECTION_UNQUALIFIED", "RECOVERY_REVOCATION_UNQUALIFIED", "TRUST_CERTIFICATION_UNQUALIFIED", "TRUST_FEDERATION_UNQUALIFIED", "REPLAY_QUALIFICATION_UNVERIFIED", "EVIDENCE_INTEGRITY_UNVERIFIED", "IMMUTABLE_LINEAGE_UNVERIFIED", "TENANT_ISOLATION_UNVERIFIED", "CONSTITUTIONAL_INVARIANTS_UNVERIFIED", "PROGRAM_QUALIFICATION_REPORT_MISSING", "QUALIFICATION_EVIDENCE_LEDGER_MISSING", "TRUST_READINESS_ASSESSMENT_MISSING", "FINAL_EVIDENCE_PACKAGE_MISSING", "QUALIFICATION_DASHBOARD_MISSING"] as const satisfies readonly TrustProgramQualificationFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "STAGE_8_CONTINUOUS_MONITORING_INVALID", "STAGE_9_DRIFT_DETECTION_INVALID", "STAGE_10_RECOVERY_REVOCATION_INVALID", "STAGE_11_TRUST_CERTIFICATION_INVALID", "STAGE_12_TRUST_FEDERATION_INVALID", "CONSTITUTIONAL_BYPASS_DETECTED", "NONDETERMINISTIC_TRUST_DECISION_DETECTED", "UNREPLAYABLE_DECISION_DETECTED", "MUTABLE_EVIDENCE_DETECTED", "INCOMPLETE_LINEAGE_DETECTED", "TENANT_ISOLATION_BREACH_DETECTED", "HIGH_OR_CRITICAL_FINDINGS_OPEN", "FINAL_AUTHORITY_NOT_ISSUED", "PROGRAM_QUALIFICATION_REPLAY_DIVERGED"] as const satisfies readonly TrustProgramQualificationFailure[];

describe("Stage 13 Program Qualification", () => {
  it("publishes the final program qualification doctrine", () => {
    const bundle = getTrustProgramQualificationStageThirteenBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-program-qualification-stage-thirteen/stage-13", final_constitutional_qualification_gate: true, cata_authority_requires_qualified_decision: true, no_component_may_rely_before_qualification: true, immutable_evidence_required: true, deterministic_replay_required: true, no_high_or_critical_findings_allowed: true, qualification_gate: "Stage 13 Program Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 12", () => {
    const first = runTrustProgramQualificationStageThirteen({ seed: "deterministic" });
    const second = runTrustProgramQualificationStageThirteen({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7", "trust-continuous-monitoring-stage-eight/stage-8", "trust-drift-detection-stage-nine/stage-9", "trust-recovery-revocation-stage-ten/stage-10", "trust-certification-stage-eleven/stage-11", "trust-federation-stage-twelve/stage-12"]);
    expect(first.provides).toEqual(["program-qualification-report", "qualification-evidence-ledger", "qualification-decision", "trust-readiness-assessment", "constitutional-compliance-report", "deterministic-replay-report", "evidence-integrity-report", "trust-qualification-dashboard", "final-qualification-evidence-package"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustProgramQualificationStageThirteen(first).valid).toBe(true);
    expect(replayTrustProgramQualificationStageThirteen()).toBe(true);
  });

  it("validates the complete program qualification matrix", () => {
    const result = runTrustProgramQualificationStageThirteen();

    expect(result.matrix.areas).toEqual(["CONSTITUTIONAL_COMPLIANCE", "TRUST_DETERMINISM", "RESOLUTION", "EXPLAINABILITY", "HUMAN_OVERSIGHT", "CONTINUOUS_MONITORING", "DRIFT_DETECTION", "RECOVERY", "CERTIFICATION", "FEDERATION", "REPLAY", "EVIDENCE_INTEGRITY", "IMMUTABLE_LINEAGE", "TENANT_ISOLATION", "CONSTITUTIONAL_INVARIANTS"]);
    expect(result.matrix).toMatchObject({ constitutional_compliance: true, trust_determinism: true, resolution_correctness: true, explainability: true, human_oversight: true, continuous_monitoring: true, drift_detection: true, recovery_revocation: true, trust_certification: true, trust_federation: true, replay: true, evidence_integrity: true, immutable_lineage: true, tenant_isolation: true, constitutional_invariants: true });
    expect(runTrustProgramQualificationStageThirteen({ scenario: "CONSTITUTIONAL_BYPASS_DETECTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustProgramQualificationStageThirteen({ scenario: "NONDETERMINISTIC_TRUST_DECISION_DETECTED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("publishes immutable evidence, replay, lineage, and isolation reports", () => {
    const result = runTrustProgramQualificationStageThirteen();

    expect(result.evidence).toMatchObject({ program_qualification_report: true, qualification_evidence_ledger: true, qualification_decision: true, trust_readiness_assessment: true, constitutional_compliance_report: true, deterministic_replay_report: true, evidence_integrity_report: true, trust_qualification_dashboard: true, final_qualification_evidence_package: true, immutable: true, complete: true, replayable: true });
    expect(result.replay).toMatchObject({ decision_replay: true, constitutional_replay: true, evidence_replay: true, oversight_replay: true, monitoring_replay: true, certification_replay: true, federation_replay: true, identical_outcomes: true, identical_evidence: true, identical_lineage: true });
    expect(result.lineage).toMatchObject({ decision_lineage: true, standing_lineage: true, evidence_lineage: true, oversight_lineage: true, certification_lineage: true, federation_lineage: true, immutable_lineage: true, complete_lineage: true, queryable_lineage: true });
    expect(result.isolation).toMatchObject({ domain_isolation: true, tenant_boundaries: true, cross_domain_enforcement: true, federation_boundaries: true, trust_registry_isolation: true, evidence_isolation: true, no_cross_tenant_leakage: true, isolation_validated: true });
  });

  it("issues final authority only with no high or critical findings", () => {
    const result = runTrustProgramQualificationStageThirteen();

    expect(result.findings).toMatchObject({ highest_severity: "NONE", critical_findings_open: 0, high_findings_open: 0, unresolved_constitutional_findings: 0, unresolved_governance_findings: 0, unresolved_replay_findings: 0, unresolved_evidence_findings: 0, unresolved_trust_integrity_findings: 0, no_blocking_findings: true });
    expect(result.authority).toMatchObject({ final_decision: "QUALIFIED", cata_trust_framework_qualified: true, constitutional_trust_authority_for_proprium: true, constitutional_trust_authority_for_civitas: true, autonomous_trust_governance_ready: true, formal_authority_issued: true, effective_authority: true });
    expect(runTrustProgramQualificationStageThirteen({ scenario: "HIGH_OR_CRITICAL_FINDINGS_OPEN" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustProgramQualificationStageThirteen({ scenario: "FINAL_AUTHORITY_NOT_ISSUED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("declares final readiness for CATA trust authority", () => {
    const result = runTrustProgramQualificationStageThirteen();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, matrix_ready: true, evidence_ready: true, replay_ready: true, lineage_ready: true, isolation_ready: true, findings_clear: true, authority_ready: true, constitutional_supremacy: true, deterministic_trust: true, evidence_based_qualification: true, replayability: true, explainability: true, tenant_isolation: true, no_bypass: true, no_high_or_critical_findings: true, formally_qualified: true });
    expect(runTrustProgramQualificationStageThirteen({ scenario: "MUTABLE_EVIDENCE_DETECTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustProgramQualificationStageThirteen({ scenario: "INCOMPLETE_LINEAGE_DETECTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustProgramQualificationStageThirteen({ scenario: "TENANT_ISOLATION_BREACH_DETECTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustProgramQualificationStageThirteen({ scenario: "PROGRAM_QUALIFICATION_REPLAY_DIVERGED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustProgramQualificationStageThirteen({ scenario: failure });
    const validation = validateTrustProgramQualificationStageThirteen(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustProgramQualificationStageThirteen({ scenario: failure });
    const validation = validateTrustProgramQualificationStageThirteen(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustProgramQualificationStageThirteen({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustProgramQualificationStageThirteen({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustProgramQualificationStageThirteen({ scenario: "TRUST_PROGRAM_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustProgramQualificationStageThirteen(notQualified).valid).toBe(false);
  });
});
