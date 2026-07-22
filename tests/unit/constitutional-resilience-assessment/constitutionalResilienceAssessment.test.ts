import { describe, expect, it } from "vitest";
import {
  assessConstitutionalResilience,
  buildConstitutionalResilienceAssessmentObservabilitySurface,
  getConstitutionalResilienceAssessmentEngine,
  listConstitutionalAssessmentLedger,
  listConstitutionalResilienceExplanations,
  listConstitutionalResilienceScores,
  listConstitutionalResilienceTrends,
  validateConstitutionalResilienceAssessment,
} from "@/services/constitutional-resilience-assessment";
import type { ConstitutionalResilienceDomain, ConstitutionalResilienceFailure, ConstitutionalResilienceScenario } from "@/types/constitutional-resilience-assessment";

const domains: readonly ConstitutionalResilienceDomain[] = ["AUTHORITY", "GOVERNANCE", "REPLAY", "INTEGRITY", "OPERATOR_CONTROL", "POLICY", "ISOLATION", "LEARNING_SAFETY", "OPTIMIZATION_SAFETY"];

describe("constitutional resilience assessment", () => {
  it("publishes the deterministic observational assessment bundle", () => {
    const bundle = getConstitutionalResilienceAssessmentEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-resilience-assessment/v8ALT.10.5");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_RESILIENCE_ASSESSMENT_READY");
    expect(bundle.doctrine.score_domains).toEqual(domains);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.observational_only).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.execution_modification_authorized).toBe(false);
    expect(bundle.repository.policy_modification_authorized).toBe(false);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.autonomous_remediation_authorized).toBe(false);
  });

  it("uses immutable prompt weights that total one", () => {
    const repository = assessConstitutionalResilience();
    const total = Object.values(repository.weights).reduce((sum, value) => sum + value, 0);

    expect(repository.weights).toEqual({
      AUTHORITY: 0.15,
      GOVERNANCE: 0.15,
      REPLAY: 0.1,
      INTEGRITY: 0.15,
      OPERATOR_CONTROL: 0.15,
      POLICY: 0.1,
      ISOLATION: 0.1,
      LEARNING_SAFETY: 0.05,
      OPTIMIZATION_SAFETY: 0.05,
    });
    expect(total).toBe(1);
  });

  it("produces scores, explanations, trends, and ledger records", () => {
    expect(listConstitutionalResilienceScores().map((score) => score.domain)).toEqual(domains);
    expect(listConstitutionalResilienceExplanations().length).toBe(domains.length);
    expect(listConstitutionalResilienceTrends().length).toBe(domains.length + 1);
    expect(listConstitutionalAssessmentLedger().length).toBe(1);
  });

  it("keeps baseline scoring deterministic and fully resilient", () => {
    const first = assessConstitutionalResilience();
    const second = assessConstitutionalResilience();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(first.final_state).toBe("CONSTITUTIONAL_RESILIENCE_ASSESSMENT_COMPLETE");
    expect(first.assessment.overall_constitutional_score).toBe(1);
    expect(first.assessment.health_state).toBe("FULLY_RESILIENT");
    expect(first.assessment.fail_closed_required).toBe(false);
    expect(first.scores.every((score) => score.score === 1 && score.risk_level === "LOW")).toBe(true);
    expect(first.ledger.every((record) => record.immutable && record.append_only)).toBe(true);
  });

  it("explains every score with replayable evidence and weighting calculations", () => {
    const repository = assessConstitutionalResilience();

    expect(repository.explanations.every((item) => item.deterministic && item.replayable)).toBe(true);
    expect(repository.explanations.every((item) => item.constitutional_rules_evaluated.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.governance_references.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.authority_references.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.replay_references.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.weighting_calculation.includes("="))).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC_SCORING", "NONDETERMINISTIC_SCORING_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_ASSESSMENT_MISMATCH_DETECTED"],
    ["REPLAY_NONDETERMINISM", "REPLAY_ASSESSMENT_MISMATCH_DETECTED"],
    ["WEIGHT_MUTATION", "ASSESSMENT_WEIGHT_MUTATION_DETECTED"],
    ["INTEGRITY_DEGRADATION", "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE"],
    ["EVIDENCE_TAMPERING", "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE"],
    ["MISSING_CONSTITUTIONAL_REFERENCE", "CONSTITUTIONAL_REFERENCE_MISSING"],
    ["INCOMPLETE_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_INCOMPLETE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_EVIDENCE_INCOMPLETE"],
    ["AUTHORITY_VALIDATION_UNAVAILABLE", "AUTHORITY_VALIDATION_UNAVAILABLE"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_VALIDATION_UNAVAILABLE"],
    ["OPERATOR_CONTROL_UNCONFIRMED", "OPERATOR_CONTROL_UNCONFIRMED"],
    ["OPERATOR_AUTHORITY_OVERRIDE", "OPERATOR_CONTROL_UNCONFIRMED"],
    ["TENANT_ISOLATION_EVIDENCE_UNAVAILABLE", "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE"],
    ["TENANT_LEAKAGE", "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE"],
    ["ASSESSMENT_LINEAGE_BROKEN", "ASSESSMENT_LINEAGE_BROKEN"],
    ["MONITORING_FAILURE", "ASSESSMENT_LINEAGE_BROKEN"],
    ["HEALTH_CALCULATION_UNAVAILABLE", "CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE"],
  ] satisfies [ConstitutionalResilienceScenario, ConstitutionalResilienceFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = assessConstitutionalResilience({ scenario });
    const validation = validateConstitutionalResilienceAssessment(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_RESILIENCE_ASSESSMENT_FAIL_CLOSED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.assessment.fail_closed_required).toBe(true);
    expect(repository.execution_modification_authorized).toBe(false);
    expect(repository.policy_modification_authorized).toBe(false);
    expect(repository.authority_grant_authorized).toBe(false);
  });

  it("validates failure-specific assessment guarantees", () => {
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "REPLAY_MISMATCH" })).replay_identical).toBe(false);
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "WEIGHT_MUTATION" })).immutable_weights).toBe(false);
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "ASSESSMENT_LINEAGE_BROKEN" })).lineage_complete).toBe(false);
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE" })).tenant_isolated).toBe(false);
    expect(validateConstitutionalResilienceAssessment(assessConstitutionalResilience({ scenario: "HEALTH_CALCULATION_UNAVAILABLE" })).health_calculated).toBe(false);
  });

  it("publishes an observability surface for dashboards and certification", () => {
    const surface = buildConstitutionalResilienceAssessmentObservabilitySurface(assessConstitutionalResilience({ scenario: "GOVERNANCE_BYPASS" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_RESILIENCE_ASSESSMENT_FAIL_CLOSED");
    expect(surface.score_count).toBe(domains.length);
    expect(surface.explanation_count).toBe(domains.length);
    expect(surface.trend_count).toBe(domains.length + 1);
    expect(surface.ledger_count).toBe(1);
    expect(surface.observational_only).toBe(true);
    expect(surface.execution_modification_authorized).toBe(false);
    expect(surface.autonomous_remediation_authorized).toBe(false);
  });
});
