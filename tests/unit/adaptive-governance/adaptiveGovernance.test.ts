import { describe, expect, it } from "vitest";
import {
  getAdaptiveGovernanceBundle,
  replayAdaptiveGovernance,
  runAdaptiveGovernance,
  validateAdaptiveGovernance,
} from "@/services/adaptive-governance";
import type { AdaptiveGovernanceFailure, AdaptiveGovernanceResult } from "@/types/adaptive-governance";

const failureScenarios: AdaptiveGovernanceFailure[] = [
  "GOVERNANCE_EVALUATIONS_NOT_DETERMINISTIC",
  "POLICY_EFFECTIVENESS_NOT_CONTINUOUSLY_EVALUATED",
  "GOVERNANCE_WORKLOAD_NOT_CONTINUOUSLY_EVALUATED",
  "APPROVAL_LATENCY_NOT_CONTINUOUSLY_EVALUATED",
  "CONSTITUTIONAL_COMPLIANCE_NOT_CONTINUOUSLY_VERIFIED",
  "RECOMMENDATIONS_NOT_ADVISORY_ONLY",
  "AUTHORITY_SCOPING_NOT_PRESERVED",
  "REPLAY_NOT_REPRODUCIBLE",
  "EVIDENCE_INCOMPLETE",
  "IMMUTABLE_LINEAGE_NOT_PRESERVED",
  "TENANT_AUTHORITY_BOUNDARIES_NOT_MAINTAINED",
  "FAIL_CLOSED_NOT_VERIFIED",
  "ADAPTIVE_GOVERNANCE_NOT_CERTIFIED",
  "POLICY_MODIFICATION_ATTEMPTED",
  "UNGOVERNED_DATA_CONSUMED",
  "RECOMMENDATION_QUALIFICATION_FAILED",
  "PHASE_18_7_CERTIFICATION_NOT_VALID",
];

describe("adaptive governance", () => {
  it("publishes the Phase 18.8 doctrine and validates the baseline bundle", () => {
    const bundle = getAdaptiveGovernanceBundle();

    expect(bundle.doctrine.version).toBe("adaptive-governance/v18.8");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-operational-certification-service/v18.7");
    expect(bundle.doctrine.lifecycle_states).toEqual([
      "OPERATIONAL_EVIDENCE",
      "GOVERNANCE_EVALUATION",
      "POLICY_ASSESSMENT",
      "WORKLOAD_ASSESSMENT",
      "LATENCY_ASSESSMENT",
      "CONSTITUTIONAL_COMPLIANCE",
      "RECOMMENDATION_GENERATION",
      "RECOMMENDATION_QUALIFICATION",
      "GOVERNANCE_REGISTRY",
      "IMMUTABLE_LEDGER",
    ]);
    expect(bundle.doctrine.recommendation_types).toHaveLength(7);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("evaluates governed evidence without policy mutation or implementation authority", () => {
    const result = runAdaptiveGovernance();

    expect(result.adaptive_governance_engine.deterministic).toBe(true);
    expect(result.adaptive_governance_engine.governed_inputs_only).toBe(true);
    expect(result.adaptive_governance_engine.advisory_only).toBe(true);
    expect(result.adaptive_governance_engine.policy_modified).toBe(false);
    expect(result.adaptive_governance_engine.implementation_authority).toBe(false);
  });

  it("continuously evaluates policy, workload, latency, and constitutional compliance", () => {
    const result = runAdaptiveGovernance();

    expect(result.policy_effectiveness_evaluator.continuous_evaluation).toBe(true);
    expect(result.governance_workload_analyzer.continuous_evaluation).toBe(true);
    expect(result.approval_latency_analyzer.continuous_evaluation).toBe(true);
    expect(result.approval_latency_analyzer.latency_influences_authority).toBe(false);
    expect(result.constitutional_compliance_evaluator.continuously_verified).toBe(true);
    expect(result.constitutional_compliance_evaluator.advisory_boundary_preservation).toBe(true);
  });

  it("creates immutable qualified advisory governance recommendations with complete scope", () => {
    const result = runAdaptiveGovernance();

    expect(result.recommendation_engine.recommendations).toHaveLength(7);
    for (const recommendation of result.recommendation_engine.recommendations) {
      expect(recommendation.supporting_evidence_refs.length).toBeGreaterThan(0);
      expect(recommendation.simulation_refs.length).toBeGreaterThan(0);
      expect(recommendation.qualification_refs.length).toBeGreaterThan(0);
      expect(recommendation.certification_refs.length).toBeGreaterThan(0);
      expect(recommendation.authority_model).toBe("external-constitutional-authority");
      expect(recommendation.authority_scope).toContain("informational");
      expect(recommendation.recommendation_scope).toContain("no implementation authority");
      expect(recommendation.immutable && recommendation.advisory_only && recommendation.qualified).toBe(true);
    }
  });

  it("preserves recommendation registry authority scoping and immutable ledger lineage", () => {
    const result = runAdaptiveGovernance();

    expect(result.recommendation_registry.immutable_recommendations).toBe(true);
    expect(result.recommendation_registry.authority_scoped).toBe(true);
    expect(result.recommendation_registry.tenant_authority_informational_only).toBe(true);
    expect(result.recommendation_registry.publication_blocked_on_fail_closed).toBe(true);
    expect(result.evaluation_ledger.additive_only).toBe(true);
    expect(result.evaluation_ledger.immutable).toBe(true);
    expect(result.evaluation_ledger.recommendations).toHaveLength(7);
  });

  it("certifies the Phase 18.8 exit criteria", () => {
    const result = runAdaptiveGovernance();

    expect(result.certification_package.governance_evaluations_deterministic).toBe(true);
    expect(result.certification_package.policy_effectiveness_continuously_evaluated).toBe(true);
    expect(result.certification_package.governance_workload_continuously_evaluated).toBe(true);
    expect(result.certification_package.approval_latency_continuously_evaluated).toBe(true);
    expect(result.certification_package.constitutional_compliance_continuously_verified).toBe(true);
    expect(result.certification_package.recommendations_advisory_only).toBe(true);
    expect(result.certification_package.authority_scoping_preserved).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.evidence_complete).toBe(true);
    expect(result.certification_package.immutable_lineage_preserved).toBe(true);
    expect(result.certification_package.tenant_authority_boundaries_maintained).toBe(true);
    expect(result.certification_package.fail_closed_behavior_verified).toBe(true);
    expect(result.certification_package.adaptive_governance_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runAdaptiveGovernance();
    const second = runAdaptiveGovernance();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAdaptiveGovernance(first).valid).toBe(true);
    expect(replayAdaptiveGovernance(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runAdaptiveGovernance({ scenario: "NON_CONSTITUTIONAL_GOVERNANCE_WARNING" });
    const validation = validateAdaptiveGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_GOVERNANCE_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runAdaptiveGovernance({ scenario });
    const validation = validateAdaptiveGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runAdaptiveGovernance();
    const tamperedLedger: AdaptiveGovernanceResult = {
      ...result,
      evaluation_ledger: {
        ...result.evaluation_ledger,
        immutable: false,
      },
    };
    const tamperedReplay: AdaptiveGovernanceResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const ledgerValidation = validateAdaptiveGovernance(tamperedLedger);
    const replayValidation = validateAdaptiveGovernance(tamperedReplay);

    expect(ledgerValidation.valid).toBe(false);
    expect(ledgerValidation.ledger_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
