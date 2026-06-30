import { describe, expect, it } from "vitest";
import {
  buildExecutionReconstructionPackage,
  buildExecutionReconstructionVisibilitySurface,
  computeExecutionReconstructionIdentityHash,
  computeExecutionReconstructionValidationHash,
  computeExecutionTimelineHash,
  getExecutionReconstructionFramework,
  verifyReplayContractHashes,
} from "@/services/autonomous-execution-reconstruction";
import type { ExecutionReconstructionFailure, ExecutionReconstructionScenario } from "@/types/autonomous-execution-reconstruction";

describe("Mission Control Phase 8G.2 Autonomous Execution Reconstruction", () => {
  it("publishes deterministic execution reconstruction doctrine", () => {
    const framework = getExecutionReconstructionFramework();

    expect(framework.doctrine.engine_version).toBe("autonomous-execution-reconstruction/v8G.2");
    expect(framework.doctrine.principles).toContain("no-speculative-history");
    expect(framework.doctrine.lifecycle_states).toContain("ROLLING_BACK");
    expect(framework.doctrine.event_types).toContain("CHECKPOINT_VALIDATED");
    expect(framework.doctrine.graph_node_types).toEqual(["MISSION", "WORKFLOW", "STAGE", "TASK", "SUBTASK", "CHECKPOINT", "ROLLBACK", "COMPLETION"]);
    expect(framework.doctrine.outcomes).toEqual(["VERIFIED", "PARTIAL", "MISMATCH", "INVALID"]);
  });

  it("reconstructs a complete immutable baseline execution", () => {
    const pkg = buildExecutionReconstructionPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("autonomous-execution-reconstruction/v8G.2");
    expect(pkg.validation.outcome).toBe("VERIFIED");
    expect(pkg.validation.certification_ready).toBe(true);
    expect(pkg.validation.speculative_history_generated).toBe(false);
    expect(pkg.speculative_history_permitted).toBe(false);
    expect(pkg.timeline.events.map((event) => event.state)).toEqual(["REGISTERED", "INITIALIZED", "READY", "EXECUTING", "CHECKPOINTING", "VALIDATING", "COMPLETED"]);
    expect(pkg.graph.checkpoint_nodes).toHaveLength(1);
    expect(pkg.state_replay.checkpoint_replay[0].dependency_status).toBe("SATISFIED");
    expect(pkg.state_replay.final_execution_state).toBe("COMPLETED");
  });

  it("produces deterministic hashes and verifies the source replay contract", () => {
    const first = buildExecutionReconstructionPackage();
    const second = buildExecutionReconstructionPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeExecutionReconstructionIdentityHash(first.identity)).toBe(first.identity.integrity_hash);
    expect(computeExecutionTimelineHash(first.timeline)).toBe(first.timeline.timeline_hash);
    expect(computeExecutionReconstructionValidationHash(first.validation)).toBe(first.validation.validation_hash);
    expect(verifyReplayContractHashes(first.source_replay_contract)).toBe(true);
  });

  it("builds timeline, graph, state replay, checkpoint replay, and rollback replay artifacts", () => {
    const pkg = buildExecutionReconstructionPackage();

    expect(pkg.timeline.events.every((event, index) => event.sequence === index + 1)).toBe(true);
    expect(pkg.graph.nodes.map((node) => node.node_type)).toContain("COMPLETION");
    expect(pkg.graph.dependency_edges).toHaveLength(1);
    expect(pkg.state_replay.reconstructed_states[3].previous_state).toBe("READY");
    expect(pkg.state_replay.dependency_replay[0].replay_deterministic).toBe(true);
    expect(pkg.state_replay.rollback_replay[0].rollback_trigger).toBe("not-required");
  });

  it.each([
    ["MISSING_STATE", "MISSING_STATE", "INVALID"],
    ["INVALID_TRANSITION", "INVALID_TRANSITION", "INVALID"],
    ["DEPENDENCY_MISMATCH", "DEPENDENCY_MISMATCH", "MISMATCH"],
    ["CHECKPOINT_MISMATCH", "CHECKPOINT_MISMATCH", "MISMATCH"],
    ["EXECUTION_DIVERGENCE", "EXECUTION_DIVERGENCE", "MISMATCH"],
    ["ROLLBACK_DIVERGENCE", "ROLLBACK_DIVERGENCE", "MISMATCH"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE", "PARTIAL"],
    ["INTEGRITY_VIOLATION", "INTEGRITY_VIOLATION", "INVALID"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK", "INVALID"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_APPROVAL_MISSING", "INVALID"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VALIDATION_FAILED", "INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "INVALID"],
    ["TIMING_MISMATCH", "TIMING_MISMATCH", "MISMATCH"],
    ["COMPLETION_INCOMPLETE", "COMPLETION_INCOMPLETE", "MISMATCH"],
  ] as readonly [ExecutionReconstructionScenario, ExecutionReconstructionFailure, string][])("fails closed for %s", (scenario, failure, outcome) => {
    const pkg = buildExecutionReconstructionPackage({ scenario });

    expect(pkg.validation.outcome).toBe(outcome);
    expect(pkg.validation.failures).toContain(failure);
    expect(pkg.validation.certification_ready).toBe(false);
    expect(pkg.validation.speculative_history_generated).toBe(false);
    expect(pkg.speculative_history_permitted).toBe(false);
  });

  it("exposes concise reconstruction visibility", () => {
    const surface = buildExecutionReconstructionVisibilitySurface(buildExecutionReconstructionPackage({ scenario: "ROLLBACK_DIVERGENCE" }));

    expect(surface.outcome).toBe("MISMATCH");
    expect(surface.failure_reasons).toContain("ROLLBACK_DIVERGENCE");
    expect(surface.rollback_count).toBe(1);
    expect(surface.integrity_status).toBe("VALID");
    expect(surface.certification_ready).toBe(false);
  });
});
