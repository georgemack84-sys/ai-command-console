import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import {
  activateWorkflow,
  buildWorkflowVisibilitySurface,
  computeWorkflowHash,
  getWorkflowOrchestratorFramework,
  replayWorkflow,
  validateOrchestration,
} from "@/services/workflow-orchestrator";
import type { WorkflowFailureReason, WorkflowOrchestratorScenario } from "@/types/workflow-orchestrator";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const contract = buildExecutionContract(identity);
  return { identity, contract };
}

describe("Mission Control Phase 8C.2 Workflow Orchestrator", () => {
  it("activates a governed workflow from a valid execution contract", () => {
    const { identity, contract } = buildBaseline();
    const workflow = activateWorkflow(identity, contract);
    expect(workflow.activation_record.activation_state).toBe("ACTIVATED");
    expect(workflow.workflow_state).toBe("READY");
    expect(workflow.execution_id).toBe(contract.execution_identity.execution_id);
    expect(computeWorkflowHash(workflow)).toBe(workflow.integrity_hash);
  });

  it("records deterministic workflow transitions and events", () => {
    const { identity, contract } = buildBaseline();
    const workflow = activateWorkflow(identity, contract);
    expect(workflow.transition_history.map((transition) => `${transition.from_state}->${transition.to_state}`)).toEqual(["REGISTERED->ACTIVATED", "ACTIVATED->READY"]);
    expect(workflow.orchestration_events.map((event) => event.event_type)).toEqual(["WORKFLOW_ACTIVATED", "DEPENDENCY_SATISFIED"]);
    expect(workflow.orchestration_events.map((event) => event.event_order)).toEqual([1, 2]);
  });

  it("builds deterministic synchronization state", () => {
    const { identity, contract } = buildBaseline();
    const workflow = activateWorkflow(identity, contract);
    expect(workflow.synchronization_points.length).toBeGreaterThan(0);
    expect(workflow.synchronization_points.every((point) => point.synchronization_state === "READY")).toBe(true);
  });

  it("validates baseline orchestration for task sequencing", () => {
    const { identity, contract } = buildBaseline();
    const validation = validateOrchestration(activateWorkflow(identity, contract));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_task_sequencing).toBe(true);
  });

  it.each([
    ["UNAUTHORIZED_WORKFLOW", "UNAUTHORIZED_WORKFLOW"],
    ["INVALID_EXECUTION_CONTRACT", "INVALID_EXECUTION_CONTRACT"],
    ["MISSING_GOVERNANCE_APPROVAL", "MISSING_GOVERNANCE_APPROVAL"],
    ["INCOMPLETE_DEPENDENCIES", "INCOMPLETE_DEPENDENCIES"],
    ["INVALID_AUTHORITY_SCOPE", "INVALID_AUTHORITY_SCOPE"],
    ["ILLEGAL_TRANSITION", "ILLEGAL_STATE_TRANSITION"],
    ["SKIPPED_STATE", "WORKFLOW_STATE_SKIPPED"],
    ["DUPLICATE_TRANSITION", "DUPLICATE_STATE_TRANSITION"],
    ["SYNCHRONIZATION_CONFLICT", "SYNCHRONIZATION_CONFLICT"],
    ["DEADLOCK", "DEADLOCK_DETECTED"],
    ["RACE_CONDITION", "RACE_CONDITION"],
    ["MISSING_EVENT", "MISSING_ORCHESTRATION_EVENT"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HIDDEN_ORCHESTRATION", "HIDDEN_ORCHESTRATION_PATH"],
    ["COMPLETION_INCOMPLETE", "COMPLETION_CRITERIA_UNMET"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
  ] as readonly [WorkflowOrchestratorScenario, WorkflowFailureReason][])("rejects orchestration scenario %s", (scenario, reason) => {
    const { identity, contract } = buildBaseline();
    const validation = validateOrchestration(activateWorkflow(identity, contract, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("allows conditional telemetry gaps without hidden orchestration", () => {
    const { identity, contract } = buildBaseline();
    const validation = validateOrchestration(activateWorkflow(identity, contract, "CONDITIONAL_TELEMETRY_GAP"));
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("TELEMETRY_GAP");
    expect(validation.ready_for_task_sequencing).toBe(true);
  });

  it("replays workflow orchestration deterministically", () => {
    const { identity, contract } = buildBaseline();
    const workflow = activateWorkflow(identity, contract);
    const replay = replayWorkflow(workflow);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_transition_order).toEqual(["REGISTERED", "ACTIVATED", "READY"]);
    expect(replay.replay_event_order).toEqual(["WORKFLOW_ACTIVATED", "DEPENDENCY_SATISFIED"]);
  });

  it("exposes workflow orchestration visibility", () => {
    const { identity, contract } = buildBaseline();
    const workflow = activateWorkflow(identity, contract);
    const visibility = buildWorkflowVisibilitySurface(workflow);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.workflow_id).toBe(workflow.workflow_id);
    expect(visibility.event_count).toBe(workflow.orchestration_events.length);
  });

  it("publishes aggregate workflow orchestrator framework", () => {
    const framework = getWorkflowOrchestratorFramework();
    expect(framework.execution_contract_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
