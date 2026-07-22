import { describe, expect, it } from "vitest";
import {
  getPlanningReasoningBundle,
  replayPlanningReasoning,
  runPlanningReasoning,
  validatePlanningReasoning,
} from "@/services/caf-planning-reasoning";
import type { PlanningReasoningScenario } from "@/types/caf-planning-reasoning";

describe("Program 3 P3.5 Planning and Reasoning", () => {
  it("publishes advisory-only planning doctrine", () => {
    const bundle = getPlanningReasoningBundle();

    expect(bundle.doctrine.version).toBe("caf-planning-reasoning/v3.5");
    expect(bundle.doctrine.authority_classification).toBe("ADVISORY_ONLY");
    expect(bundle.doctrine.execution_authority).toBe("NONE");
    expect(bundle.doctrine.consumes_memory_knowledge).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic objective, goal graph, and replay hashes", () => {
    const first = runPlanningReasoning();
    const second = runPlanningReasoning();

    expect(first.memory_knowledge_ref).toBe("caf-memory-knowledge/v3.4");
    expect(first.objective.qualification_status).toBe("QUALIFIED_WITH_CONSTRAINTS");
    expect(first.objective.advisory_only).toBe(true);
    expect(first.goal_graph.cycles_detected).toHaveLength(0);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlanningReasoning(first).valid).toBe(true);
    expect(replayPlanningReasoning(first)).toBe(true);
  });

  it("keeps decomposition, plans, assumptions, and recommendations bounded", () => {
    const result = runPlanningReasoning();

    expect(result.decomposition.child_constraints_at_least_as_restrictive).toBe(true);
    expect(result.decomposition.no_authority_expansion).toBe(true);
    expect(result.candidate_plan.advisory_only).toBe(true);
    expect(result.candidate_plan.plan_steps.every((step) => step.required_capability_ref && step.execution_prohibited)).toBe(true);
    expect(result.assumptions.every((assumption) => !assumption.hidden && assumption.evidence_refs.length > 0)).toBe(true);
    expect(result.recommendation.advisory_only).toBe(true);
    expect(result.recommendation.prohibited_actions).toContain("execute-plan");
  });

  it("certifies governance, evidence, replay, and operator visibility", () => {
    const result = runPlanningReasoning();

    expect(result.governance.authority_evaluated).toBe(true);
    expect(result.governance.execution_attempt_blocked).toBe(true);
    expect(result.evidence).toHaveLength(10);
    expect(result.replay_validation.deterministic).toBe(true);
    expect(result.observability.complete_visibility).toBe(true);
    expect(result.certification.outcome).toBe("QUALIFIED");
    expect(result.certification.qualified).toBe(true);
    expect(result.certification.no_execution_authority).toBe(true);
  });

  it.each([
    "P3_4_MEMORY_KNOWLEDGE_INVALID",
    "OBJECTIVE_NOT_QUALIFIED",
    "OBJECTIVE_SCOPE_EXPANDED",
    "AMBIGUOUS_OBJECTIVE_ACCEPTED",
    "GOAL_GRAPH_CYCLE",
    "ORPHAN_GOAL_ACTIONABLE",
    "DECOMPOSITION_WEAKENS_CONSTRAINTS",
    "UNAUTHORIZED_CAPABILITY_INSERTION",
    "PLAN_STEP_MISSING_CAPABILITY",
    "REASONING_PIPELINE_UNOBSERVABLE",
    "HIDDEN_ASSUMPTION",
    "UNCERTAINTY_NOT_PROPAGATED",
    "RECOMMENDATION_NOT_ADVISORY",
    "PLANNING_GOVERNANCE_BYPASS",
    "EXECUTION_AUTHORITY_GRANTED",
    "EVIDENCE_INCOMPLETE",
    "REPLAY_DIVERGENCE",
    "TENANT_ISOLATION_VIOLATION",
    "OPERATOR_CONTROL_MISSING",
  ] as const)("fails qualification for %s", (scenario: PlanningReasoningScenario) => {
    const result = runPlanningReasoning({ scenario });
    const validation = validatePlanningReasoning(result);

    expect(result.certification.outcome).toBe("NOT_QUALIFIED");
    expect(result.certification.qualified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runPlanningReasoning({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("NOT_QUALIFIED");
    expect(result.certification.qualified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
