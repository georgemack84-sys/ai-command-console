import { describe, expect, it } from "vitest";
import {
  getContinuousOptimizationFrameworkBundle,
  replayContinuousOptimizationFramework,
  runContinuousOptimizationFramework,
  validateContinuousOptimizationFramework,
} from "@/services/continuous-optimization-framework";
import type { ContinuousOptimizationFailure, ContinuousOptimizationResult } from "@/types/continuous-optimization-framework";

const failureScenarios: ContinuousOptimizationFailure[] = [
  "OPTIMIZATION_CONTRACT_NOT_APPROVED",
  "CANDIDATE_GENERATION_NOT_DETERMINISTIC",
  "PRIORITIZATION_NOT_REPRODUCIBLE",
  "RECOMMENDATION_GENERATION_NOT_DETERMINISTIC",
  "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE",
  "GOVERNANCE_VALIDATION_NOT_ENFORCED",
  "ADVISORY_BOUNDARY_NOT_PRESERVED",
  "OPERATIONAL_HISTORY_MUTABLE",
  "RECOMMENDATION_LIFECYCLE_NOT_DETERMINISTIC",
  "EVIDENCE_LINEAGE_INCOMPLETE",
  "REPLAY_NOT_REPRODUCIBLE",
  "TENANT_ISOLATION_NOT_PRESERVED",
  "CERTIFICATION_LINEAGE_NOT_MAINTAINED",
  "GOVERNANCE_VALIDATION_BYPASSED",
  "PHASE_18_3_LEARNING_NOT_VALID",
];

describe("continuous optimization framework", () => {
  it("publishes the Phase 18.4 doctrine and validates the baseline bundle", () => {
    const bundle = getContinuousOptimizationFrameworkBundle();

    expect(bundle.doctrine.version).toBe("continuous-optimization-framework/v18.4");
    expect(bundle.doctrine.upstream_phase).toBe("operational-learning-engine/v18.3");
    expect(bundle.doctrine.publication_states).toEqual([
      "GENERATED",
      "VALIDATED",
      "GOVERNED",
      "PUBLISHED",
      "REVIEWED",
      "ACCEPTED",
      "REJECTED",
      "SUPERSEDED",
      "ARCHIVED",
    ]);
    expect(bundle.doctrine.optimization_classes).toHaveLength(7);
    expect(bundle.doctrine.candidate_sources).toHaveLength(7);
    expect(bundle.doctrine.priority_factors).toHaveLength(6);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("approves the advisory optimization contract without operational mutation authority", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.optimization_contract.contract_approved).toBe(true);
    expect(result.optimization_contract.advisory_only_optimization).toBe(true);
    expect(result.optimization_contract.governance_enforced).toBe(true);
    expect(result.optimization_contract.deterministic_lifecycle).toBe(true);
  });

  it("discovers and classifies deterministic optimization candidates", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.candidate_engine.discovery_deterministic).toBe(true);
    expect(result.candidate_engine.classification_reproducible).toBe(true);
    expect(result.candidate_engine.registry_complete).toBe(true);
    expect(result.candidate_engine.candidates).toHaveLength(7);
    expect(new Set(result.candidate_engine.candidates.map((candidate) => candidate.source)).size).toBe(7);
    expect(result.candidate_engine.candidates.every((candidate) => candidate.evidence_refs.length > 0 && candidate.eligible)).toBe(true);
  });

  it("prioritizes opportunities with reproducible explanations", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.prioritizer.deterministic_prioritization).toBe(true);
    expect(result.prioritizer.explanations_complete).toBe(true);
    expect(result.prioritizer.replay_reproducible).toBe(true);
    expect(result.prioritizer.evaluations).toHaveLength(7);
    expect(result.prioritizer.evaluations.every((evaluation) => evaluation.factors.length === 6 && evaluation.priority_score > 0 && evaluation.replayable)).toBe(true);
  });

  it("generates explainable governed recommendations", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.recommendation_generator.deterministic_generation).toBe(true);
    expect(result.recommendation_generator.recommendations_explainable).toBe(true);
    expect(result.recommendation_generator.recommendations_reproducible).toBe(true);
    expect(result.recommendation_generator.recommendations).toHaveLength(7);
    for (const recommendation of result.recommendation_generator.recommendations) {
      expect(recommendation.supporting_evidence.length).toBeGreaterThan(0);
      expect(recommendation.identified_risks.length).toBeGreaterThan(0);
      expect(recommendation.implementation_considerations.length).toBeGreaterThan(0);
      expect(recommendation.governance_considerations.length).toBeGreaterThan(0);
      expect(recommendation.certification_implications.length).toBeGreaterThan(0);
      expect(recommendation.deterministic && recommendation.explainable && recommendation.reproducible).toBe(true);
    }
  });

  it("preserves complete explainability and evidence lineage", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.explainability.rationale_complete).toBe(true);
    expect(result.explainability.supporting_evidence_complete).toBe(true);
    expect(result.explainability.learned_patterns_traceable).toBe(true);
    expect(result.explainability.prioritization_reasoning_complete).toBe(true);
    expect(result.explainability.governance_decisions_traceable).toBe(true);
    expect(result.explainability.hidden_reasoning_prevented).toBe(true);
    expect(result.explainability.explanation_refs).toHaveLength(7);
  });

  it("enforces governance before publication and preserves tenant isolation", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.governance.constitutional_compliance).toBe(true);
    expect(result.governance.policy_compliance).toBe(true);
    expect(result.governance.tenant_isolation).toBe(true);
    expect(result.governance.validation_precedes_publication).toBe(true);
    expect(result.governance.failures_block_release).toBe(true);
    expect(result.publication.publication_deterministic).toBe(true);
    expect(result.publication.recommendation_history_preserved).toBe(true);
  });

  it("manages a deterministic auditable recommendation lifecycle", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.lifecycle.states).toEqual(result.publication.publication_states);
    expect(result.lifecycle.transitions_validated).toBe(true);
    expect(result.lifecycle.deterministic_transitions).toBe(true);
    expect(result.lifecycle.audit_complete).toBe(true);
    expect(result.lifecycle.rejected_recommendations_auditable).toBe(true);
    expect(result.lifecycle.history_modified).toBe(false);
  });

  it("keeps optimization activity observable and reproducible", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.observability.recommendation_generation_visible).toBe(true);
    expect(result.observability.optimization_throughput_visible).toBe(true);
    expect(result.observability.candidate_backlog_visible).toBe(true);
    expect(result.observability.priority_distribution_visible).toBe(true);
    expect(result.observability.governance_failures_visible).toBe(true);
    expect(result.observability.analytics_reproducible).toBe(true);
    expect(result.observability.monitoring_operational).toBe(true);
  });

  it("certifies the Phase 18.4 gate", () => {
    const result = runContinuousOptimizationFramework();

    expect(result.certification_package.optimization_contract_approved).toBe(true);
    expect(result.certification_package.candidate_generation_deterministic).toBe(true);
    expect(result.certification_package.improvement_prioritization_reproducible).toBe(true);
    expect(result.certification_package.recommendation_generation_deterministic).toBe(true);
    expect(result.certification_package.recommendation_explainability_complete).toBe(true);
    expect(result.certification_package.governance_validation_enforced).toBe(true);
    expect(result.certification_package.advisory_boundary_preserved).toBe(true);
    expect(result.certification_package.operational_history_immutable).toBe(true);
    expect(result.certification_package.recommendation_lifecycle_deterministic).toBe(true);
    expect(result.certification_package.evidence_lineage_complete).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.certification_lineage_maintained).toBe(true);
    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runContinuousOptimizationFramework();
    const second = runContinuousOptimizationFramework();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousOptimizationFramework(first).valid).toBe(true);
    expect(replayContinuousOptimizationFramework(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runContinuousOptimizationFramework({
      scenario: "NON_CONSTITUTIONAL_OPTIMIZATION_WARNING",
    });
    const validation = validateContinuousOptimizationFramework(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_OPTIMIZATION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runContinuousOptimizationFramework({ scenario });
    const validation = validateContinuousOptimizationFramework(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runContinuousOptimizationFramework();
    const tamperedLifecycle: ContinuousOptimizationResult = {
      ...result,
      lifecycle: {
        ...result.lifecycle,
        history_modified: true,
      },
    };
    const tamperedReplay: ContinuousOptimizationResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const lifecycleValidation = validateContinuousOptimizationFramework(tamperedLifecycle);
    const replayValidation = validateContinuousOptimizationFramework(tamperedReplay);

    expect(lifecycleValidation.valid).toBe(false);
    expect(lifecycleValidation.lifecycle_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
