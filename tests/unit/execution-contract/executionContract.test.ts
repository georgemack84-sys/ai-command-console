import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  buildExecutionContract,
  buildExecutionContractVisibilitySurface,
  computeExecutionContractHash,
  generateExecutionIdentity,
  getExecutionContractFramework,
  replayExecutionContract,
  validateExecutionContract,
  validateExecutionState,
} from "@/services/execution-contract";
import type { ExecutionContractScenario, ExecutionFailureReason } from "@/types/execution-contract";

describe("Mission Control Phase 8C.1 Execution Contract", () => {
  it("generates deterministic immutable execution identity", () => {
    const identity = generateAutonomyIdentity();
    const first = generateExecutionIdentity(identity);
    const second = generateExecutionIdentity(identity);
    expect(first).toEqual(second);
    expect(first.execution_id).toMatch(/^EXE-/);
    expect(first.execution_version).toBe("8C.1.0");
  });

  it("builds a canonical execution contract from confidence-certified planning", () => {
    const contract = buildExecutionContract(generateAutonomyIdentity());
    expect(contract.execution_identity.execution_id).toMatch(/^EXE-/);
    expect(contract.workflow_identity.workflow_id).toMatch(/^WF-/);
    expect(contract.plan_association.planning_reference).toBe(contract.planning_confidence.confidence_assessment_id);
    expect(contract.execution_state).toBe("CREATED");
    expect(contract.checkpoint_list).toHaveLength(4);
    expect(computeExecutionContractHash(contract)).toBe(contract.integrity_hash);
  });

  it("validates a baseline contract for the workflow orchestrator", () => {
    const contract = buildExecutionContract(generateAutonomyIdentity());
    const validation = validateExecutionContract(contract);
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_workflow_orchestrator).toBe(true);
  });

  it("validates baseline state transition history", () => {
    const state = validateExecutionState(buildExecutionContract(generateAutonomyIdentity()));
    expect(state.certification_state).toBe("PASS");
    expect(state.failures).toEqual([]);
    expect(state.allowed_next_states).toEqual(["VALIDATED"]);
  });

  it.each([
    ["UNAPPROVED_PLAN", "PLAN_NOT_APPROVED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCE_MISSING"],
    ["MISSING_AUTHORITY", "AUTHORITY_REFERENCE_MISSING"],
    ["INVALID_TENANT", "TENANT_ISOLATION_VIOLATION"],
    ["MISSING_OPERATOR", "OPERATOR_AUTHORIZATION_MISSING"],
    ["INVALID_DEPENDENCY_GRAPH", "DEPENDENCY_GRAPH_INVALID"],
    ["MISSING_CHECKPOINT", "CHECKPOINT_STRUCTURE_INVALID"],
    ["MISSING_ROLLBACK", "ROLLBACK_REFERENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [ExecutionContractScenario, ExecutionFailureReason][])("rejects contract scenario %s", (scenario, reason) => {
    const validation = validateExecutionContract(buildExecutionContract(generateAutonomyIdentity(), undefined, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it.each([
    ["ILLEGAL_TRANSITION", "ILLEGAL_STATE_TRANSITION"],
    ["SKIPPED_LIFECYCLE", "LIFECYCLE_STAGE_SKIPPED"],
    ["DUPLICATE_TRANSITION", "DUPLICATE_STATE_TRANSITION"],
  ] as readonly [ExecutionContractScenario, ExecutionFailureReason][])("rejects state scenario %s", (scenario, reason) => {
    const state = validateExecutionState(buildExecutionContract(generateAutonomyIdentity(), undefined, scenario));
    expect(state.certification_state).toBe("FAIL");
    expect(state.failures).toContain(reason);
  });

  it("allows conditional warning certification without hard failures", () => {
    const validation = validateExecutionContract(buildExecutionContract(generateAutonomyIdentity(), undefined, "CONDITIONAL_WARNING"));
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("WARNING_ONLY");
    expect(validation.ready_for_workflow_orchestrator).toBe(true);
  });

  it("replays execution contract deterministically", () => {
    const contract = buildExecutionContract(generateAutonomyIdentity());
    const replay = replayExecutionContract(contract);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_state_order).toEqual(["CREATED", "VALIDATED", "REGISTERED", "READY"]);
    expect(replay.replay_checkpoint_ids).toHaveLength(contract.checkpoint_list.length);
  });

  it("exposes execution contract visibility", () => {
    const contract = buildExecutionContract(generateAutonomyIdentity());
    const visibility = buildExecutionContractVisibilitySurface(contract);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.execution_id).toBe(contract.execution_identity.execution_id);
    expect(visibility.checkpoint_ids).toHaveLength(contract.checkpoint_list.length);
  });

  it("publishes aggregate execution contract framework", () => {
    const framework = getExecutionContractFramework();
    expect(framework.contract_validation.certification_state).toBe("PASS");
    expect(framework.state_validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
