import { describe, expect, it } from "vitest";

import {
  getAssuranceDependencyEvaluationContract,
  replayAssuranceDependencyEvaluation,
  runAssuranceDependencyEvaluation,
  validateAssuranceDependencyEvaluation,
} from "../../../services/assurance-dependency-evaluation";
import type { AssuranceDependencyScenario } from "../../../types/assurance-dependency-evaluation";

describe("assurance dependency evaluation", () => {
  it("creates deterministic certified dependency evaluation", () => {
    const first = runAssuranceDependencyEvaluation();
    const second = runAssuranceDependencyEvaluation();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAssuranceDependencyEvaluation(first).valid).toBe(true);
    expect(replayAssuranceDependencyEvaluation(first)).toBe(true);
  });

  it("publishes dependency doctrine", () => {
    const bundle = getAssuranceDependencyEvaluationContract();

    expect(bundle.doctrine.deterministic_dependency_graph).toBe(true);
    expect(bundle.doctrine.immutable_execution_plan).toBe(true);
    expect(bundle.doctrine.pruned_is_not_failure).toBe(true);
    expect(bundle.doctrine.dependency_first_ordering).toBe(true);
    expect(bundle.doctrine.replay_required).toBe(true);
    expect(bundle.doctrine.audit_ledger_required).toBe(true);
  });

  it("builds a directed acyclic dependency graph and registry", () => {
    const result = runAssuranceDependencyEvaluation();

    expect(result.contract.classifications).toContain("CONSTITUTIONAL_REQUIRED");
    expect(result.graph.directed).toBe(true);
    expect(result.graph.acyclic).toBe(true);
    expect(result.graph.nodes).toHaveLength(6);
    expect(result.registry.complete).toBe(true);
    expect(result.registry.duplicate_free).toBe(true);
  });

  it("computes deterministic ordering and immutable execution plan", () => {
    const result = runAssuranceDependencyEvaluation();

    expect(result.ordering.order[0]).toBe("constitutional-authority");
    expect(result.ordering.dependency_first).toBe(true);
    expect(result.execution_plan.execution_sequence).toEqual(result.ordering.order);
    expect(result.execution_plan.immutable_once_started).toBe(true);
  });

  it("preserves PRUNED semantics, replay, explainability, integrity, and ledger", () => {
    const result = runAssuranceDependencyEvaluation();

    expect(result.execution_records.every((record) => record.lifecycle_state === "PASS")).toBe(true);
    expect(result.propagation.independent_branches_continued).toBe(true);
    expect(result.replay.identical_outcomes).toBe(true);
    expect(result.explainability.complete).toBe(true);
    expect(result.integrity.graph_complete).toBe(true);
    expect(result.audit_ledger.append_only).toBe(true);
  });

  it("runs the phase 13.2 certification suite", () => {
    const result = runAssuranceDependencyEvaluation();

    expect(result.certification.tests).toHaveLength(17);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for dependency graph, planning, replay, and integrity violations", () => {
    const scenarios: readonly AssuranceDependencyScenario[] = [
      "MISSING_DEPENDENCY",
      "DUPLICATE_DEPENDENCY",
      "CIRCULAR_DEPENDENCY",
      "INVALID_REFERENCE",
      "ORPHAN_DEPENDENCY",
      "INCOMPATIBLE_DEPENDENCY_TYPE",
      "POLICY_VIOLATION",
      "AUTHORITY_VIOLATION",
      "ORDERING_NONDETERMINISTIC",
      "EXECUTION_PLAN_MUTATED",
      "PRUNED_EXECUTED",
      "FAILURE_PROPAGATION_INVALID",
      "INDEPENDENT_BRANCH_PRUNED",
      "REPLAY_MISMATCH",
      "EXPLAINABILITY_INCOMPLETE",
      "INTEGRITY_FAILURE",
      "AUDIT_LEDGER_MUTABLE",
    ];

    for (const scenario of scenarios) {
      const result = runAssuranceDependencyEvaluation({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateAssuranceDependencyEvaluation(result).valid).toBe(false);
    }
  });
});
