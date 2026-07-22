import { describe, expect, it } from "vitest";

import {
  getRecommendationCycleManagementContract,
  replayRecommendationCycleManagement,
  runRecommendationCycleManagement,
  validateRecommendationCycleManagement,
} from "../../../services/recommendation-cycle-management";
import type { RecommendationCycleScenario } from "../../../types/recommendation-cycle-management";

describe("recommendation cycle management", () => {
  it("certifies a deterministic recommendation cycle transaction boundary", () => {
    const first = runRecommendationCycleManagement();
    const second = runRecommendationCycleManagement();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.canonical_transaction_boundary_certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateRecommendationCycleManagement(first).valid).toBe(true);
    expect(replayRecommendationCycleManagement(first)).toBe(true);
  });

  it("publishes the cycle management doctrine", () => {
    const bundle = getRecommendationCycleManagementContract();

    expect(bundle.doctrine.recommendation_cycle_first_class_artifact).toBe(true);
    expect(bundle.doctrine.atomic_transaction_boundary).toBe(true);
    expect(bundle.doctrine.immutable_policy_binding_required).toBe(true);
    expect(bundle.doctrine.exactly_one_terminal_outcome_required).toBe(true);
    expect(bundle.doctrine.completed_cycles_never_reopened).toBe(true);
    expect(bundle.doctrine.reevaluation_requires_new_cycle).toBe(true);
  });

  it("requires policy-bound entry before generation", () => {
    const result = runRecommendationCycleManagement();

    expect(result.policy_bound_entry.manifest_exists).toBe(true);
    expect(result.policy_bound_entry.manifest_validated).toBe(true);
    expect(result.policy_bound_entry.authority_resolved).toBe(true);
    expect(result.policy_bound_entry.governance_approved).toBe(true);
    expect(result.policy_bound_entry.constitutional_validated).toBe(true);
    expect(result.policy_bound_entry.execution_allowed).toBe(true);
  });

  it("coordinates generation, evaluation, completion, ledger, replay, and archival", () => {
    const result = runRecommendationCycleManagement();

    expect(result.generation.deterministic).toBe(true);
    expect(result.generation.generated_artifact_refs).toHaveLength(8);
    expect(result.evaluation.deterministic_outcome).toBe("SELECT_PRIMARY_RECOMMENDATION");
    expect(result.evaluation.evaluation_artifact_refs).toHaveLength(9);
    expect(result.completion.complete).toBe(true);
    expect(result.completion.terminal_outcome).toBe("COMPLETE");
    expect(result.ledger.append_only).toBe(true);
    expect(result.replay.byte_identical).toBe(true);
    expect(result.archive.reconstructable).toBe(true);
  });

  it("preserves immutable supersession and creates a new cycle for reevaluation", () => {
    const result = runRecommendationCycleManagement({ reevaluation_requested: true });

    expect(result.supersession.completed_cycle_immutable).toBe(true);
    expect(result.supersession.reopened_original).toBe(false);
    expect(result.supersession.replacement_cycle_id).not.toBe(result.supersession.original_cycle_id);
    expect(result.supersession.lineage_preserved).toBe(true);
  });

  it("runs the phase 12.3 certification suite", () => {
    const result = runRecommendationCycleManagement();

    expect(result.certification.tests).toHaveLength(42);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for transaction, policy, generation, evaluation, recovery, supersession, archival, and governance violations", () => {
    const scenarios: readonly RecommendationCycleScenario[] = [
      "POLICY_BINDING_MISSING",
      "POLICY_VALIDATION_FAILED",
      "AUTHORITY_NOT_RESOLVED",
      "GOVERNANCE_NOT_APPROVED",
      "CONSTITUTIONAL_VALIDATION_FAILED",
      "GENERATION_ORDER_NONDETERMINISTIC",
      "DUPLICATE_ARTIFACT_REGISTERED",
      "EVIDENCE_INSUFFICIENT",
      "COMPARISON_INCOMPLETE",
      "MULTIPLE_TERMINAL_OUTCOMES",
      "PARTIAL_CYCLE_MARKED_COMPLETE",
      "LEDGER_COMMIT_FAILED",
      "REPLAY_VALIDATION_FAILED",
      "RECOVERY_FABRICATED_ARTIFACT",
      "FAIL_CLOSED_NOT_ENFORCED",
      "POST_COMPLETION_MUTATION",
      "REEVALUATION_REUSED_CYCLE",
      "ARCHIVE_INCOMPLETE",
      "LEDGER_NOT_APPEND_ONLY",
      "TENANT_ISOLATION_BREACH",
      "ADVISORY_BOUNDARY_VIOLATION",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runRecommendationCycleManagement({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.canonical_transaction_boundary_certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateRecommendationCycleManagement(result).valid).toBe(false);
    }
  });
});
