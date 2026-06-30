import { describe, expect, it } from "vitest";
import {
  buildExecutionBoundaryPackage,
  buildExecutionBoundaryVisibilitySurface,
  computeExecutionBoundaryEvaluationHash,
  computeExecutionBoundaryEvidenceHash,
  computeExecutionBoundaryHash,
  getExecutionBoundaryFramework,
} from "@/services/execution-boundary-engine";
import type { ExecutionBoundaryDecision, ExecutionBoundaryScenario, ExecutionBoundaryViolation } from "@/types/execution-boundary-engine";

describe("Mission Control Phase 8F.3 Execution Boundary Engine", () => {
  it("publishes execution boundary doctrine, states, decisions, and categories", () => {
    const framework = getExecutionBoundaryFramework();

    expect(framework.doctrine.engine_version).toBe("execution-boundary-engine/v8F.3");
    expect(framework.doctrine.principles).toContain("execution-never-exceeds-authorization");
    expect(framework.doctrine.principles).toContain("continuous-validation");
    expect(framework.doctrine.principles).toContain("fail-closed");
    expect(framework.doctrine.states).toContain("ROLLBACK_READY");
    expect(framework.doctrine.decisions).toEqual(["CONTINUE", "RESTRICT", "CHECKPOINT", "PAUSE", "ESCALATE", "ROLLBACK", "TERMINATE", "FAIL_SAFE"]);
    expect(framework.doctrine.categories).toEqual(["SCOPE", "TIME", "RESOURCE", "DEPENDENCY", "RETRY", "CONCURRENCY", "ROLLBACK"]);
  });

  it("continues a baseline execution without expanding scope or authority", () => {
    const pkg = buildExecutionBoundaryPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("execution-boundary-engine/v8F.3");
    expect(pkg.execution_boundary.decision).toBe("CONTINUE");
    expect(pkg.execution_boundary.boundary_status).toBe("WITHIN_BOUNDARY");
    expect(pkg.execution_scope_expanded).toBe(false);
    expect(pkg.autonomous_execution_performed).toBe(false);
    expect(pkg.authority_expanded).toBe(false);
    expect(pkg.ledger_entry.append_only).toBe(true);
  });

  it("produces deterministic hashes, evidence, ledger, and replay reconstruction", () => {
    const first = buildExecutionBoundaryPackage();
    const second = buildExecutionBoundaryPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeExecutionBoundaryHash(first.execution_boundary)).toBe(first.execution_boundary.integrity_hash);
    expect(first.boundary_evaluations.every((item) => computeExecutionBoundaryEvaluationHash(item) === item.integrity_hash)).toBe(true);
    expect(computeExecutionBoundaryEvidenceHash(first.execution_evidence)).toBe(first.execution_evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["Execution Request", "Approved Scope Reconstruction", "Workflow Graph Validation", "Task Sequencing", "Dependency Validation", "Resource Utilization", "Retry History", "Timeout History", "Checkpoint Creation", "Rollback Decisions", "Boundary Evaluations", "Enforcement Actions", "Final Execution Outcome"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["MINOR_DEVIATION", "RESTRICT", undefined],
    ["CHECKPOINT_REQUIRED", "CHECKPOINT", undefined],
    ["DEPENDENCY_UNCERTAINTY", "PAUSE", undefined],
    ["RESOURCE_INSTABILITY", "PAUSE", undefined],
    ["REPEATED_VIOLATIONS", "ESCALATE", undefined],
    ["CONFLICTING_EXECUTION_STATE", "ESCALATE", undefined],
    ["UNAUTHORIZED_ROLLBACK", "ROLLBACK", "UNAUTHORIZED_ROLLBACK"],
    ["OUTSIDE_AUTHORITY", "TERMINATE", "EXECUTION_OUTSIDE_AUTHORITY"],
    ["CONSTITUTIONAL_CONFLICT", "TERMINATE", "CONSTITUTIONAL_CONFLICT"],
    ["TENANT_ISOLATION_VIOLATION", "TERMINATE", "TENANT_ISOLATION_VIOLATION"],
    ["HIDDEN_EXECUTION_PATH", "TERMINATE", "HIDDEN_EXECUTION_PATH"],
    ["INTEGRITY_FAILURE", "TERMINATE", "EXECUTION_INTEGRITY_FAILURE"],
    ["AUTHORITY_BLOCKED", "FAIL_SAFE", "AUTHORITY_NOT_GRANTED"],
  ] as readonly [ExecutionBoundaryScenario, ExecutionBoundaryDecision, ExecutionBoundaryViolation | undefined][])("maps %s to %s", (scenario, decision, violation) => {
    const pkg = buildExecutionBoundaryPackage({ scenario });

    expect(pkg.execution_boundary.decision).toBe(decision);
    if (violation) expect(pkg.execution_boundary.detected_violations).toContain(violation);
    expect(pkg.execution_scope_expanded).toBe(false);
    expect(pkg.authority_expanded).toBe(false);
  });

  it.each([
    ["SCOPE_EXPANSION", "EXECUTION_OUTSIDE_APPROVED_SCOPE"],
    ["UNAUTHORIZED_WORKFLOW_CHANGE", "UNAUTHORIZED_WORKFLOW_CHANGE"],
    ["RECURSIVE_EXECUTION_LOOP", "RECURSIVE_EXECUTION_LOOP"],
    ["DEPENDENCY_VIOLATION", "DEPENDENCY_VIOLATION"],
    ["TIMEOUT_VIOLATION", "TIMEOUT_VIOLATION"],
    ["EXCESSIVE_RETRIES", "EXCESSIVE_RETRIES"],
    ["UNCONTROLLED_CONCURRENCY", "UNCONTROLLED_CONCURRENCY"],
    ["RESOURCE_EXHAUSTION", "RESOURCE_EXHAUSTION"],
    ["SKIPPED_CHECKPOINT", "SKIPPED_CHECKPOINT"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["LINEAGE_MISSING", "LINEAGE_REFERENCE_MISSING"],
    ["TRUTH_LEDGER_MISSING", "TRUTH_LEDGER_REFERENCE_MISSING"],
  ] as readonly [ExecutionBoundaryScenario, ExecutionBoundaryViolation][])("detects and restricts runtime violation %s", (scenario, violation) => {
    const pkg = buildExecutionBoundaryPackage({ scenario });

    expect(pkg.execution_boundary.detected_violations).toContain(violation);
    expect(pkg.execution_boundary.boundary_status).toBe("VIOLATION");
    expect(["RESTRICT", "CHECKPOINT"]).toContain(pkg.execution_boundary.decision);
  });

  it("exposes execution boundary visibility", () => {
    const surface = buildExecutionBoundaryVisibilitySurface(buildExecutionBoundaryPackage({ scenario: "RESOURCE_EXHAUSTION" }));

    expect(surface.execution_state).toBe("RESTRICTED");
    expect(surface.enforcement_decision).toBe("RESTRICT");
    expect(surface.detected_violations).toContain("RESOURCE_EXHAUSTION");
    expect(surface.resource_usage.cpu).toBe(98);
    expect(surface.active_restrictions).toContain("limit retries");
    expect(surface.integrity_status).toBe("VALID");
  });
});
