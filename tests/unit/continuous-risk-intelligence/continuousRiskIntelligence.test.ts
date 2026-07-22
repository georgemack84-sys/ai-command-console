import { describe, expect, it } from "vitest";
import {
  getContinuousRiskIntelligenceBundle,
  replayContinuousRiskIntelligence,
  runContinuousRiskIntelligence,
  validateContinuousRiskIntelligence,
} from "@/services/continuous-risk-intelligence";
import type { ContinuousRiskIntelligenceFailure, ContinuousRiskIntelligenceResult } from "@/types/continuous-risk-intelligence";

const failureScenarios: ContinuousRiskIntelligenceFailure[] = [
  "CONTINUOUS_RISK_EVALUATION_NOT_OPERATIONAL",
  "OPERATIONAL_RISK_NOT_TRACKED",
  "GOVERNANCE_RISK_NOT_TRACKED",
  "DEPENDENCY_RISK_NOT_TRACKED",
  "REPLAY_RISK_NOT_TRACKED",
  "CERTIFICATION_RISK_NOT_TRACKED",
  "INFRASTRUCTURE_RISK_NOT_TRACKED",
  "RISK_RECOMMENDATIONS_NOT_DETERMINISTIC",
  "RECOMMENDATIONS_NOT_EXPLAINABLE",
  "EVIDENCE_INCOMPLETE",
  "REPLAY_NOT_REPRODUCIBLE",
  "IMMUTABLE_LINEAGE_NOT_VERIFIED",
  "GOVERNANCE_NOT_PRESERVED",
  "ADVISORY_BOUNDARY_NOT_ENFORCED",
  "TENANT_ISOLATION_NOT_MAINTAINED",
  "FAIL_CLOSED_NOT_VERIFIED",
  "CONTINUOUS_RISK_INTELLIGENCE_NOT_CERTIFIED",
  "PHASE_18_8_ADAPTIVE_GOVERNANCE_NOT_VALID",
];

describe("continuous risk intelligence", () => {
  it("publishes the Phase 18.9 doctrine and validates the baseline bundle", () => {
    const bundle = getContinuousRiskIntelligenceBundle();

    expect(bundle.doctrine.version).toBe("continuous-risk-intelligence/v18.9");
    expect(bundle.doctrine.upstream_phase).toBe("adaptive-governance/v18.8");
    expect(bundle.doctrine.risk_categories).toEqual(["OPERATIONAL", "GOVERNANCE", "DEPENDENCY", "REPLAY", "CERTIFICATION", "INFRASTRUCTURE"]);
    expect(bundle.doctrine.recommendation_outcomes).toHaveLength(7);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("runs as advisory continuous risk evaluation with governance and fail-closed boundaries", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.risk_engine.continuous_risk_evaluation).toBe(true);
    expect(result.risk_engine.deterministic_scheduling).toBe(true);
    expect(result.risk_engine.governance_integration).toBe(true);
    expect(result.risk_engine.advisory_only).toBe(true);
    expect(result.risk_engine.tenant_isolation).toBe(true);
    expect(result.risk_engine.fail_closed).toBe(true);
  });

  it("tracks every governed risk category", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.risk_analyzers).toHaveLength(6);
    expect(new Set(result.risk_analyzers.map((analyzer) => analyzer.category)).size).toBe(6);
    expect(result.risk_analyzers.every((analyzer) => analyzer.tracked && analyzer.deterministic && analyzer.score > 0)).toBe(true);
    expect(result.risk_assessment.identified_risks).toHaveLength(6);
  });

  it("correlates cross-domain risk deterministically and replayably", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.risk_correlation_engine.cross_domain_correlation).toBe(true);
    expect(result.risk_correlation_engine.cascading_risk_detection).toBe(true);
    expect(result.risk_correlation_engine.dependency_chain_analysis).toBe(true);
    expect(result.risk_correlation_engine.constitutional_impact_assessment).toBe(true);
    expect(result.risk_correlation_engine.replayable).toBe(true);
    expect(result.risk_correlation_engine.correlation_refs).toHaveLength(6);
  });

  it("generates explainable advisory recommendations only", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.recommendation_generator.deterministic_recommendations).toBe(true);
    expect(result.recommendation_generator.explainable_recommendations).toBe(true);
    expect(result.recommendation_generator.advisory_only).toBe(true);
    expect(result.recommendation_generator.recommendations).toHaveLength(7);
    for (const recommendation of result.recommendation_generator.recommendations) {
      expect(recommendation.contributing_evidence.length).toBeGreaterThan(0);
      expect(recommendation.contributing_risks.length).toBeGreaterThan(0);
      expect(recommendation.applicable_governance.length).toBeGreaterThan(0);
      expect(recommendation.supporting_rationale.length).toBeGreaterThan(0);
      expect(recommendation.advisory_only).toBe(true);
      expect(recommendation.grants_operational_authority).toBe(false);
    }
  });

  it("preserves immutable evidence and additive risk lineage", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.evidence_registry.complete).toBe(true);
    expect(result.evidence_registry.immutable_evidence).toBe(true);
    expect(result.evidence_registry.monitored_events.length).toBeGreaterThan(0);
    expect(result.evidence_registry.governance_records.length).toBeGreaterThan(0);
    expect(result.evidence_registry.replay_references.length).toBeGreaterThan(0);
    expect(result.risk_ledger.additive_only).toBe(true);
    expect(result.risk_ledger.immutable).toBe(true);
    expect(result.risk_ledger.recommendations).toHaveLength(7);
  });

  it("certifies the Phase 18.9 exit criteria", () => {
    const result = runContinuousRiskIntelligence();

    expect(result.certification_package.continuous_risk_evaluation_operational).toBe(true);
    expect(result.certification_package.operational_risk_tracked).toBe(true);
    expect(result.certification_package.governance_risk_tracked).toBe(true);
    expect(result.certification_package.dependency_risk_tracked).toBe(true);
    expect(result.certification_package.replay_risk_tracked).toBe(true);
    expect(result.certification_package.certification_risk_tracked).toBe(true);
    expect(result.certification_package.infrastructure_risk_tracked).toBe(true);
    expect(result.certification_package.risk_recommendations_deterministic).toBe(true);
    expect(result.certification_package.recommendations_explainable).toBe(true);
    expect(result.certification_package.evidence_complete).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.immutable_lineage_verified).toBe(true);
    expect(result.certification_package.governance_preserved).toBe(true);
    expect(result.certification_package.advisory_boundary_enforced).toBe(true);
    expect(result.certification_package.tenant_isolation_maintained).toBe(true);
    expect(result.certification_package.fail_closed_behavior_verified).toBe(true);
    expect(result.certification_package.continuous_risk_intelligence_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(17);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runContinuousRiskIntelligence();
    const second = runContinuousRiskIntelligence();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousRiskIntelligence(first).valid).toBe(true);
    expect(replayContinuousRiskIntelligence(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runContinuousRiskIntelligence({ scenario: "NON_CONSTITUTIONAL_RISK_WARNING" });
    const validation = validateContinuousRiskIntelligence(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_RISK_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runContinuousRiskIntelligence({ scenario });
    const validation = validateContinuousRiskIntelligence(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runContinuousRiskIntelligence();
    const tamperedLedger: ContinuousRiskIntelligenceResult = {
      ...result,
      risk_ledger: {
        ...result.risk_ledger,
        immutable: false,
      },
    };
    const tamperedReplay: ContinuousRiskIntelligenceResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const ledgerValidation = validateContinuousRiskIntelligence(tamperedLedger);
    const replayValidation = validateContinuousRiskIntelligence(tamperedReplay);

    expect(ledgerValidation.valid).toBe(false);
    expect(ledgerValidation.ledger_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
