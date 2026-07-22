import { describe, expect, it } from "vitest";
import {
  analyzeDependencyWeight,
  buildDependencyWeightObservability,
  getDependencyWeightAnalyzerEngine,
  replayDependencyWeightAnalysis,
} from "@/services/decision-dependency-weight-analyzer";

describe("Mission Control Phase 9.5.6 Dependency Weight Analyzer", () => {
  it("analyzes dependency weight deterministically with replayable graph artifacts", () => {
    const first = analyzeDependencyWeight();
    const second = analyzeDependencyWeight();

    expect(first).toEqual(second);
    expect(first.analyzer_status).toBe("PASS");
    expect(first.dependency_assessment.composite_dependency_score).toBeGreaterThan(0);
    expect(first.execution_sequence_assessment.execution_sequence_state).toBe("READY");
    expect(first.explanation.blockage_rationale).toContain("blocked decisions");
    expect(first.ledger_record.dependency_assessment_ref).toBe(first.dependency_assessment.assessment_id);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_input.dependency_score).toBe(first.dependency_assessment.composite_dependency_score);
    expect(first.advisoryOnly).toBe(true);
  });

  it("elevates decisions that unlock major downstream mission execution", () => {
    const result = analyzeDependencyWeight({
      blocked_decision_count: 8,
      blocked_workflow_count: 3,
      dependency_chain_depth: 5,
      graph_depth_score: 92,
      cascade_impact_score: 95,
      bottleneck_score: 94,
      execution_sequence_state: "READY",
      prerequisite_refs: [],
      downstream_refs: ["decision-a", "decision-b", "decision-c", "decision-d", "decision-e", "decision-f", "decision-g", "decision-h"],
    });

    expect(result.dependency_assessment.dependency_priority_level).toBe("CRITICAL");
    expect(result.dependency_assessment.blocked_decision_count).toBe(8);
    expect(result.execution_sequence_assessment.execution_sequence_state).toBe("READY");
    expect(result.ledger_record.priority_adjustment).toBe(20);
    expect(result.priority_input.dependency_score).toBeGreaterThanOrEqual(90);
  });

  it("restricts invalid or blocked execution sequencing without authorizing execution", () => {
    const blocked = analyzeDependencyWeight({
      execution_sequence_state: "BLOCKED",
      blocked_by_refs: ["decision-parent"],
      downstream_refs: ["decision-child"],
    });
    const invalid = analyzeDependencyWeight({
      execution_sequence_state: "INVALID",
      unresolved_cycle_refs: ["cycle-a"],
    });

    expect(blocked.execution_sequence_assessment.execution_sequence_state).toBe("BLOCKED");
    expect(blocked.ledger_record.priority_adjustment).toBe(-10);
    expect(blocked.priority_input.advisory_only).toBe(true);
    expect(invalid.failures).toContain("EXECUTION_SEQUENCE_INCONSISTENT");
    expect(invalid.failures).toContain("CYCLIC_DEPENDENCY_UNRESOLVED");
  });

  it("fails closed for incomplete graph data, missing refs, integrity failure, tenant leaks, ordering failure, hidden weighting, and replay mismatch", () => {
    const incomplete = analyzeDependencyWeight({ dependency_graph_complete: false });
    const noDependencies = analyzeDependencyWeight({ dependency_refs: [], downstream_refs: [], prerequisite_refs: [] });
    const badIntegrity = analyzeDependencyWeight({ graph_integrity_verified: false });
    const noGovernance = analyzeDependencyWeight({ governance_refs: [] });
    const noReplay = analyzeDependencyWeight({ replay_refs: [] });
    const tenantLeak = analyzeDependencyWeight({ dependency_refs: ["dependency_tenant_beta_leak"] });
    const ordering = analyzeDependencyWeight({ canonical_ordering_reproducible: false });
    const hidden = analyzeDependencyWeight({ hidden_weighting_refs: ["hidden"] });
    const invalidScore = analyzeDependencyWeight({ graph_depth_score: 101 });
    const base = analyzeDependencyWeight();
    const replayMismatch = analyzeDependencyWeight({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(incomplete.failures).toContain("DEPENDENCY_GRAPH_INCOMPLETE");
    expect(noDependencies.failures).toContain("DEPENDENCY_REFERENCES_MISSING");
    expect(badIntegrity.failures).toContain("GRAPH_INTEGRITY_VERIFICATION_FAILED");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_DEPENDENCY_DETECTED");
    expect(ordering.failures).toContain("CANONICAL_GRAPH_ORDERING_FAILED");
    expect(hidden.failures).toContain("HIDDEN_DEPENDENCY_WEIGHTING_DETECTED");
    expect(invalidScore.failures).toContain("GRAPH_INTEGRITY_VERIFICATION_FAILED");
    expect(replayMismatch.failures).toContain("DEPENDENCY_REPLAY_MISMATCH");
  });

  it("replays dependency artifacts and reports observability", () => {
    const valid = analyzeDependencyWeight();
    const invalid = analyzeDependencyWeight({ dependency_graph_complete: false, execution_sequence_state: "INVALID" });
    const replay = replayDependencyWeightAnalysis(valid);
    const engine = getDependencyWeightAnalyzerEngine();
    const metrics = buildDependencyWeightObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("dependency-weight-analyzer/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.graph_failures).toBe(1);
    expect(metrics.sequence_failures).toBe(1);
    expect(metrics.average_dependency_score).toBeGreaterThan(0);
  });
});
