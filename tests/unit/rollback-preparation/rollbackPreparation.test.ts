import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor } from "@/services/execution-monitor";
import { buildCheckpointManager } from "@/services/checkpoint-manager";
import {
  buildRollbackPreparation,
  buildRollbackPreparationVisibilitySurface,
  computeRollbackPlanHash,
  computeRollbackPreparationHash,
  getRollbackPreparationFramework,
  replayRollbackPreparation,
  validateRollbackPreparation,
} from "@/services/rollback-preparation";
import type { RollbackFailureReason, RollbackPreparationScenario } from "@/types/rollback-preparation";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule);
  const checkpointManager = buildCheckpointManager(identity, monitor);
  return { identity, checkpointManager };
}

describe("Mission Control Phase 8C.7 Rollback Preparation Engine", () => {
  it("prepares advisory rollback plans without executing rollback", () => {
    const { identity, checkpointManager } = buildBaseline();
    const preparation = buildRollbackPreparation(identity, checkpointManager);
    expect(preparation.rollback_state).toBe("READY_FOR_APPROVAL");
    expect(preparation.plans).toHaveLength(1);
    expect(preparation.advisory_only).toBe(true);
    expect(preparation.rollback_executed).toBe(false);
    expect(preparation.execution_restarted).toBe(false);
    expect(preparation.workflow_modified).toBe(false);
    expect(computeRollbackPreparationHash(preparation)).toBe(preparation.integrity_hash);
  });

  it("selects the latest eligible certified checkpoint and ranks alternatives", () => {
    const { identity, checkpointManager } = buildBaseline();
    const plan = buildRollbackPreparation(identity, checkpointManager).plans[0];
    const latest = checkpointManager.checkpoints[checkpointManager.checkpoints.length - 1];
    expect(plan.selected_checkpoint.selected_checkpoint_id).toBe(latest.checkpoint_id);
    expect(plan.selected_checkpoint.alternative_checkpoint_ids).toEqual(checkpointManager.checkpoints.slice(0, -1).reverse().map((checkpoint) => checkpoint.checkpoint_id));
    expect(plan.rollback_boundary.recovery_boundary).toBe(latest.rollback_reference.recovery_boundary);
    expect(computeRollbackPlanHash(plan)).toBe(plan.integrity_hash);
  });

  it("generates deterministic rollback graph, sequence, confidence, and recommendations", () => {
    const { identity, checkpointManager } = buildBaseline();
    const plan = buildRollbackPreparation(identity, checkpointManager).plans[0];
    expect(plan.rollback_graph.deterministic).toBe(true);
    expect(plan.rollback_sequence.map((step) => step.stage)).toEqual(["ANALYZE", "SELECT_CHECKPOINT", "RESTORE_DEPENDENCIES", "VALIDATE_GOVERNANCE", "VALIDATE_AUTHORITY", "REQUEST_APPROVAL", "PUBLISH_PLAN"]);
    expect(plan.rollback_confidence.confidence_level).toBe("VERY_HIGH");
    expect(plan.recovery_recommendations.map((item) => item.recommendation_type)).toEqual(["ROLLBACK_TO_CHECKPOINT", "OPERATOR_INTERVENTION", "GOVERNANCE_REVIEW"]);
    expect(plan.recovery_recommendations.every((item) => item.advisory_only)).toBe(true);
  });

  it("validates baseline rollback preparation for orchestration certification", () => {
    const { identity, checkpointManager } = buildBaseline();
    const validation = validateRollbackPreparation(buildRollbackPreparation(identity, checkpointManager));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_orchestration_certification).toBe(true);
  });

  it.each([
    ["INVALID_CHECKPOINT_MANAGER", "INVALID_CHECKPOINT_MANAGER"],
    ["NO_ELIGIBLE_CHECKPOINT", "NO_ELIGIBLE_CHECKPOINT"],
    ["BOUNDARY_UNSAFE", "ROLLBACK_BOUNDARY_UNSAFE"],
    ["IRREVERSIBLE_TASK", "IRREVERSIBLE_TASK"],
    ["DEPENDENCY_NOT_REVERSIBLE", "DEPENDENCY_NOT_REVERSIBLE"],
    ["RESOURCE_RESTORATION_FAILURE", "RESOURCE_RESTORATION_FAILURE"],
    ["WORKFLOW_INCONSISTENT", "WORKFLOW_INCONSISTENT"],
    ["GOVERNANCE_CONFLICT", "GOVERNANCE_CONFLICT"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_VIOLATION"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_REQUIRED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["AUTONOMOUS_RECOVERY_ATTEMPT", "AUTONOMOUS_RECOVERY_ATTEMPT"],
  ] as readonly [RollbackPreparationScenario, RollbackFailureReason][])("detects rollback preparation scenario %s", (scenario, reason) => {
    const { identity, checkpointManager } = buildBaseline();
    const validation = validateRollbackPreparation(buildRollbackPreparation(identity, checkpointManager, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("allows conditional low confidence without enabling rollback", () => {
    const { identity, checkpointManager } = buildBaseline();
    const preparation = buildRollbackPreparation(identity, checkpointManager, "CONDITIONAL_LOW_CONFIDENCE");
    const validation = validateRollbackPreparation(preparation);
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("LOW_CONFIDENCE");
    expect(validation.advisory_only_enforced).toBe(true);
    expect(preparation.rollback_executed).toBe(false);
  });

  it("replays rollback preparation deterministically", () => {
    const { identity, checkpointManager } = buildBaseline();
    const preparation = buildRollbackPreparation(identity, checkpointManager);
    const replay = replayRollbackPreparation(preparation);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_plan_order).toEqual(preparation.plans.map((plan) => plan.rollback_plan_id));
    expect(replay.replay_checkpoint_order).toEqual(preparation.plans.map((plan) => plan.selected_checkpoint.selected_checkpoint_id));
  });

  it("exposes rollback preparation visibility without enabling rollback", () => {
    const { identity, checkpointManager } = buildBaseline();
    const preparation = buildRollbackPreparation(identity, checkpointManager);
    const visibility = buildRollbackPreparationVisibilitySurface(preparation);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.rollback_enabled).toBe(false);
    expect(visibility.confidence_level).toBe("VERY_HIGH");
    expect(visibility.recommendation_types).toEqual(preparation.plans[0].recovery_recommendations.map((item) => item.recommendation_type));
  });

  it("publishes aggregate rollback preparation framework", () => {
    const framework = getRollbackPreparationFramework();
    expect(framework.checkpoint_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
