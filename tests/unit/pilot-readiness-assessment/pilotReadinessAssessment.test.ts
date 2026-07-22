import { describe, expect, it } from "vitest";
import {
  getPilotReadinessAssessmentBundle,
  replayPilotReadinessAssessment,
  runPilotReadinessAssessment,
  validatePilotReadinessAssessment,
} from "@/services/pilot-readiness-assessment";
import type { PilotReadinessAssessmentFailure } from "@/types/pilot-readiness-assessment";

describe("Mission Control Phase 16.9 Pilot Readiness Assessment", () => {
  it("publishes pilot readiness assessment doctrine", () => {
    const bundle = getPilotReadinessAssessmentBundle();

    expect(bundle.doctrine.version).toBe("pilot-readiness-assessment/v16.9");
    expect(bundle.doctrine.upstream_phase).toBe("incident-exception-governance/v16.8");
    expect(bundle.doctrine.readiness_categories).toEqual(["OPERATIONAL_READINESS", "GOVERNANCE_READINESS", "REPLAY_READINESS", "ADVISORY_READINESS", "CERTIFICATION_READINESS"]);
    expect(bundle.doctrine.assessment_outcomes).toContain("READY_FOR_CERTIFICATION");
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds a complete readiness scorecard", () => {
    const result = runPilotReadinessAssessment();

    expect(result.scorecard.pilot_version).toBe("pilot-readiness-assessment/v16.9");
    expect(result.scorecard.overall_readiness_score).toBe(98);
    expect(result.scorecard.assessment_outcome).toBe("READY_FOR_CERTIFICATION");
    expect(result.scorecard.evidence_refs.length).toBeGreaterThan(0);
    expect(result.scorecard.replay_refs.length).toBeGreaterThan(0);
    expect(result.scorecard.governance_refs.length).toBeGreaterThan(0);
  });

  it("evaluates every readiness category deterministically", () => {
    const result = runPilotReadinessAssessment();

    expect(result.category_assessments).toHaveLength(5);
    expect(result.category_assessments.every((entry) => entry.score === 98 && entry.deterministic && entry.compliant && entry.deficiencies.length === 0)).toBe(true);
  });

  it("produces operational, governance, and certification reports", () => {
    const result = runPilotReadinessAssessment();

    expect(result.operational_health_report.complete).toBe(true);
    expect(result.operational_health_report.incident_frequency).toBe(0);
    expect(result.governance_compliance_report.validated).toBe(true);
    expect(result.governance_compliance_report.critical_governance_violations).toBe(0);
    expect(result.certification_dashboard.continuously_visible).toBe(true);
    expect(result.certification_dashboard.phase_16_exit_readiness).toBe(true);
  });

  it("reuses existing infrastructure and preserves deterministic trends", () => {
    const result = runPilotReadinessAssessment();

    expect(result.metrics_registry.deterministic_calculations).toBe(true);
    expect(result.metrics_registry.inherited_thresholds_authoritative).toBe(true);
    expect(result.metrics_registry.parallel_infrastructure_created).toBe(false);
    expect(result.metrics_registry.reused_infrastructure_refs.length).toBeGreaterThan(0);
    expect(result.trend_analyzer.deterministic).toBe(true);
    expect(result.trend_analyzer.degradation_detected).toBe(false);
  });

  it("records reproducible readiness decision and immutable history", () => {
    const result = runPilotReadinessAssessment();

    expect(result.decision.decision).toBe("READY_FOR_CERTIFICATION");
    expect(result.decision.grants_operational_authority).toBe(false);
    expect(result.decision.modifies_pilot_scope).toBe(false);
    expect(result.decision.reproducible).toBe(true);
    expect(result.history).toHaveLength(3);
    expect(result.history.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable)).toBe(true);
  });

  it("records immutable readiness evidence ledger", () => {
    const result = runPilotReadinessAssessment();

    expect(result.evidence_ledger).toHaveLength(9);
    expect(result.evidence_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.readiness_refs.length > 0 && entry.replay_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotReadinessAssessment();
    const second = runPilotReadinessAssessment();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotReadinessAssessment(first).valid).toBe(true);
    expect(replayPilotReadinessAssessment(first)).toBe(true);
  });

  it("executes the Phase 16.9 readiness certification matrix", () => {
    const result = runPilotReadinessAssessment();

    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Readiness measurable",
      "Deficiencies identified",
      "Compliance validated",
      "Readiness scoring deterministic",
      "Assessments replayable",
      "Readiness evidence immutable",
      "Certification readiness continuously visible",
      "Governance review fully supported",
      "Constitutional requirements not overridden",
      "Existing certification evidence governance infrastructure reused",
      "Readiness assessment grants no operational authority",
      "Phase 16.8 incident governance valid",
    ]);
  });

  it("supports conditional pass for non-constitutional readiness warnings", () => {
    const result = runPilotReadinessAssessment({ scenario: "NON_CONSTITUTIONAL_READINESS_WARNING" });
    const validation = validatePilotReadinessAssessment(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "READINESS_NOT_MEASURABLE",
    "DEFICIENCIES_NOT_IDENTIFIED",
    "COMPLIANCE_NOT_VALIDATED",
    "READINESS_SCORING_NON_DETERMINISTIC",
    "ASSESSMENTS_NOT_REPLAYABLE",
    "READINESS_EVIDENCE_MUTABLE",
    "CERTIFICATION_READINESS_NOT_VISIBLE",
    "GOVERNANCE_REVIEW_NOT_SUPPORTED",
    "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN",
    "PARALLEL_READINESS_INFRASTRUCTURE_CREATED",
    "OPERATIONAL_AUTHORITY_GRANTED",
    "PHASE_16_8_INCIDENTS_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: PilotReadinessAssessmentFailure) => {
    const result = runPilotReadinessAssessment({ scenario });
    const validation = validatePilotReadinessAssessment(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested scorecard tampering", () => {
    const result = runPilotReadinessAssessment();
    const tampered = {
      ...result,
      scorecard: {
        ...result.scorecard,
        overall_readiness_score: 1,
      },
    };

    expect(validatePilotReadinessAssessment(tampered).valid).toBe(false);
  });
});
