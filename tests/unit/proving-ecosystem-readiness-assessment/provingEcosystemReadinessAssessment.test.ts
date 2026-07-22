import { describe, expect, it } from "vitest";
import { getProvingEcosystemReadinessAssessmentBundle, replayProvingEcosystemReadinessAssessment, runProvingEcosystemReadinessAssessment, validateProvingEcosystemReadinessAssessment } from "@/services/proving-ecosystem-readiness-assessment";
import type { ReadinessFailure } from "@/types/proving-ecosystem-readiness-assessment";

const FAILURE_MATRIX: readonly ReadinessFailure[] = [
  "ECOSYSTEM_READINESS_EVALUATOR_MISSING",
  "PLATFORM_READINESS_INCOMPLETE",
  "APPLICATION_READINESS_INCOMPLETE",
  "GOVERNANCE_READINESS_INCOMPLETE",
  "TRUST_READINESS_INCOMPLETE",
  "INTEROPERABILITY_READINESS_INCOMPLETE",
  "VALIDATION_COMPLETENESS_INSUFFICIENT",
  "OPERATIONAL_READINESS_ASSESSOR_MISSING",
  "OPERATIONAL_WORKFLOWS_INCOMPLETE",
  "MISSION_EXECUTION_UNPREPARED",
  "DEPLOYMENT_PROCEDURES_INCOMPLETE",
  "RECOVERY_CAPABILITY_INSUFFICIENT",
  "OPERATOR_PREPAREDNESS_INSUFFICIENT",
  "GOVERNANCE_PREPAREDNESS_INSUFFICIENT",
  "DEPLOYMENT_READINESS_ASSESSOR_MISSING",
  "DEPLOYMENT_EVIDENCE_INCOMPLETE",
  "INFRASTRUCTURE_READINESS_INCOMPLETE",
  "CONFIGURATION_READINESS_INCOMPLETE",
  "SCALABILITY_READINESS_INSUFFICIENT",
  "FAILOVER_CAPABILITY_INSUFFICIENT",
  "MONITORING_READINESS_INSUFFICIENT",
  "CONSUMER_READINESS_ASSESSOR_MISSING",
  "USABILITY_READINESS_INSUFFICIENT",
  "DOCUMENTATION_INCOMPLETE",
  "OPERATIONAL_GUIDANCE_INCOMPLETE",
  "SUPPORT_READINESS_INSUFFICIENT",
  "GOVERNANCE_TRANSPARENCY_INSUFFICIENT",
  "EXPLAINABILITY_INSUFFICIENT",
  "ONBOARDING_READINESS_INSUFFICIENT",
  "MATURITY_ASSESSOR_MISSING",
  "MATURITY_LEVEL_INSUFFICIENT",
  "ECOSYSTEM_HEALTH_ASSESSOR_MISSING",
  "VALIDATION_SUCCESS_DEGRADED",
  "OPERATIONAL_STABILITY_DEGRADED",
  "REPLAY_CONSISTENCY_DEGRADED",
  "TRUST_STABILITY_DEGRADED",
  "CERTIFICATION_HEALTH_DEGRADED",
  "DEPENDENCY_HEALTH_DEGRADED",
  "EVIDENCE_FRESHNESS_DEGRADED",
  "GAP_ANALYSIS_MISSING",
  "READINESS_GAPS_UNDOCUMENTED",
  "RECOMMENDATION_ENGINE_MISSING",
];

describe("P6.16 Ecosystem Readiness Assessment", () => {
  it("publishes readiness doctrine without replacing upstream authority", () => {
    const bundle = getProvingEcosystemReadinessAssessmentBundle();

    expect(bundle.doctrine.version).toBe("proving-ecosystem-readiness-assessment/v6.16");
    expect(bundle.doctrine.owns_ecosystem_readiness).toBe(true);
    expect(bundle.doctrine.owns_operational_maturity).toBe(true);
    expect(bundle.doctrine.owns_deployment_readiness).toBe(true);
    expect(bundle.doctrine.owns_consumer_readiness).toBe(true);
    expect(bundle.doctrine.owns_ecosystem_health).toBe(true);
    expect(bundle.doctrine.preserves_upstream_authority).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic readiness assessment with the P6.15 evidence dependency", () => {
    const first = runProvingEcosystemReadinessAssessment();
    const second = runProvingEcosystemReadinessAssessment();

    expect(first.phase_identifier).toBe("ProvingEcosystemReadinessAssessment");
    expect(first.evidence_ledger_ref).toBe("proving-evidence-aggregation-qualification-ledger/v6.15");
    expect(first.ecosystem_assessment.dimensions).toHaveLength(6);
    expect(first.evidence_package.immutable_evidence).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingEcosystemReadinessAssessment(first).valid).toBe(true);
    expect(replayProvingEcosystemReadinessAssessment(first)).toBe(true);
  });

  it("produces ecosystem, operational, deployment, consumer, maturity, and health reports", () => {
    const result = runProvingEcosystemReadinessAssessment();

    expect(result.ecosystem_assessment.overall_score).toBeGreaterThanOrEqual(90);
    expect(result.operational_report.operator_preparedness).toBe(true);
    expect(result.deployment_report.deployment_eligible).toBe(true);
    expect(result.consumer_report.documentation).toBe(true);
    expect(result.consumer_report.onboarding_readiness).toBe(true);
    expect(result.maturity_assessment.maturity_level).toBe(5);
    expect(result.health_report.replay_consistency).toBe(true);
    expect(result.health_report.evidence_freshness).toBe(true);
  });

  it("documents gaps, recommendations, evidence lineage, and operational readiness decision", () => {
    const result = runProvingEcosystemReadinessAssessment();

    expect(result.gap_report.gaps_documented).toBe(true);
    expect(result.recommendations.published).toBe(true);
    expect(result.recommendations.deployment_sequencing).toContain("authorize full deployment sequence");
    expect(result.evidence_package.evidence_lineage_verified).toBe(true);
    expect(result.evidence_package.cross_program_evidence_integrated).toBe(true);
    expect(result.evidence_package.p617_ready).toBe(true);
    expect(result.decision.decision).toBe("READY");
    expect(result.decision.does_not_replace_upstream_decisions).toBe(true);
  });

  it("passes all P6.16 gates and readiness checks", () => {
    const result = runProvingEcosystemReadinessAssessment();

    expect(result.gates.ecosystem_gate).toBe(true);
    expect(result.gates.operational_gate).toBe(true);
    expect(result.gates.deployment_gate).toBe(true);
    expect(result.gates.consumer_gate).toBe(true);
    expect(result.gates.maturity_gate).toBe(true);
    expect(result.gates.health_gate).toBe(true);
    expect(result.gates.gap_gate).toBe(true);
    expect(result.gates.recommendation_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.report_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.readiness.decision).toBe("READY");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("marks readiness conditional for remediable deficiency %s", (failure) => {
    const result = runProvingEcosystemReadinessAssessment({ scenario: failure });
    const validation = validateProvingEcosystemReadinessAssessment(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["P6_15_EVIDENCE_LEDGER_INVALID", "READINESS_REPORT_MISSING", "EVIDENCE_LINEAGE_UNVERIFIED", "ASSESSMENT_PACKAGE_MISSING"] as const)("marks ecosystem not ready for evidence or package blocker %s", (failure) => {
    const result = runProvingEcosystemReadinessAssessment({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_READY");
    expect(result.decision.deployment_recommended).toBe(false);
    expect(result.decision.consumer_adoption_recommended).toBe(false);
    expect(result.decision.program_qualification_evidence_ready).toBe(false);
    expect(validateProvingEcosystemReadinessAssessment(result).valid).toBe(false);
  });

  it("supports ready with limitations but keeps conditional follow-up out of full readiness", () => {
    const limited = runProvingEcosystemReadinessAssessment({ scenario: "READY_WITH_LIMITATIONS" });
    const conditional = runProvingEcosystemReadinessAssessment({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(limited.readiness.decision).toBe("READY_WITH_LIMITATIONS");
    expect(limited.readiness.phase_ready).toBe(true);
    expect(limited.recommendations.deployment_sequencing).toContain("authorize limited deployment sequence");
    expect(validateProvingEcosystemReadinessAssessment(limited).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(conditional.readiness.phase_ready).toBe(false);
    expect(conditional.decision.deployment_recommended).toBe(false);
  });
});
