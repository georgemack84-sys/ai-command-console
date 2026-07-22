import { describe, expect, it } from "vitest";

import {
  getRuntimeOrchestratorBundle,
  replayRuntimeOrchestrator,
  runRuntimeOrchestrator,
  validateRuntimeOrchestrator,
} from "@/services/runtime-orchestrator";
import type { RuntimeOrchestratorFailure } from "@/types/runtime-orchestrator";

const conditionalFailures = [
  "RUNTIME_CONTROL_PLANE_MISSING",
  "CONTEXT_ASSEMBLY_MISSING",
  "REASONING_RUNTIME_ADAPTER_MISSING",
  "RUNTIME_RESTRICTION_ENGINE_MISSING",
  "TASK_EXECUTION_MISSING",
  "CHECKPOINT_SERVICE_MISSING",
  "RECOVERY_CONTROLLER_MISSING",
  "RUNTIME_API_MISSING",
  "RUNTIME_EVIDENCE_MISSING",
] as const satisfies readonly RuntimeOrchestratorFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "W2_7_SAFETY_GATE_INVALID",
  "W2_8_PLANNING_ENGINE_INVALID",
  "W2_9_MEMORY_ENGINE_INVALID",
  "LIFECYCLE_TRANSITION_INVALID_ALLOWED",
  "DUPLICATE_EXECUTION_ALLOWED",
  "TENANT_NAMESPACE_ISOLATION_FAILED",
  "OPERATOR_SUPREMACY_WEAKENED",
  "CONTEXT_ASSEMBLY_NON_DETERMINISTIC",
  "UNAUTHORIZED_MEMORY_INCLUDED",
  "STALE_DECISION_REUSED",
  "PROVIDER_SPECIFIC_BEHAVIOR_LEAKED",
  "UNAPPROVED_TOOL_ADDED",
  "INVALID_OUTPUT_ACCEPTED",
  "RESTRICTION_CONFLICT_UNRESOLVED",
  "RESTRICTION_WEAKENED_WITHOUT_APPROVAL",
  "TASK_DEPENDENCY_BYPASSED",
  "SIDE_EFFECT_NOT_IDEMPOTENT",
  "CHECKPOINT_NOT_IMMUTABLE",
  "INCOMPATIBLE_CHECKPOINT_RESTORED",
  "RECOVERY_REUSED_INVALID_DECISION",
  "SIDE_EFFECT_DUPLICATED_DURING_RECOVERY",
  "REVOKED_RUNTIME_REVIVED",
  "RUNTIME_API_NOT_AUTHORIZED",
  "RUNTIME_API_NOT_IDEMPOTENT",
  "RUNTIME_EVIDENCE_NOT_IMMUTABLE",
  "RUNTIME_REPLAY_INVALID",
  "RUNTIME_SECURITY_ASSESSMENT_FAILED",
] as const satisfies readonly RuntimeOrchestratorFailure[];

describe("Runtime Orchestrator W2.10", () => {
  it("publishes the W2.10 runtime doctrine and qualification bundle", () => {
    const bundle = getRuntimeOrchestratorBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "runtime-orchestrator/w2.10",
      owns_runtime_control_plane: true,
      owns_context_assembly: true,
      owns_reasoning_runtime_adapter: true,
      owns_runtime_restrictions: true,
      owns_task_execution: true,
      owns_checkpointing: true,
      owns_recovery: true,
      owns_runtime_api: true,
      owns_runtime_evidence: true,
      does_not_grant_authority: true,
      does_not_override_policy: true,
      does_not_override_safety: true,
      qualification_gate: "Runtime Orchestrator Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic runtime orchestration to W2.0 through W2.9", () => {
    const first = runRuntimeOrchestrator();
    const second = runRuntimeOrchestrator();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.authority_validator_ref).toBe("authority-validator/w2.5");
    expect(first.policy_gate_ref).toBe("policy-gate/w2.6");
    expect(first.safety_gate_ref).toBe("safety-gate/w2.7");
    expect(first.planning_engine_ref).toBe("planning-engine/w2.8");
    expect(first.memory_engine_ref).toBe("memory-engine/w2.9");
    expect(first.runtime_states).toHaveLength(17);
    expect(first.dispositions).toHaveLength(13);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRuntimeOrchestrator(first).valid).toBe(true);
    expect(replayRuntimeOrchestrator(first)).toBe(true);
  });

  it("manages runtime lifecycle through W2.2 and deterministic context assembly", () => {
    const result = runRuntimeOrchestrator();

    expect(result.control_plane).toMatchObject({
      instance_creation: true,
      lifecycle_coordination: true,
      execution_admission: true,
      pause_resume_suspend_terminate: true,
      lease_management: true,
      concurrency_control: true,
      idempotent_creation: true,
      lifecycle_validated_by_w22: true,
      operator_controls_enforced: true,
    });
    expect(result.context_assembly).toMatchObject({
      execution_subject: true,
      approved_plan_loaded: true,
      authorized_memory_retrieved: true,
      capability_skill_tool_resolution: true,
      authority_policy_safety_attached: true,
      operator_disposition_attached: true,
      data_minimization: true,
      deterministic_package: true,
      context_provenance: true,
      tenant_namespace_boundary: true,
    });
  });

  it("isolates reasoning adapters and composes runtime restrictions", () => {
    const result = runRuntimeOrchestrator();

    expect(result.reasoning_adapter).toMatchObject({
      provider_neutral_request: true,
      provider_neutral_response: true,
      compatibility_validation: true,
      structured_tool_interface: true,
      output_validation: true,
      provider_isolation: true,
      tool_interception: true,
    });
    expect(result.restrictions.outcomes).toEqual(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "PAUSE", "SUSPEND", "ESCALATE", "DENY", "TERMINATE", "FAIL_CLOSED"]);
    expect(result.restrictions).toMatchObject({
      precedence_resolver: true,
      conflict_detector: true,
      effective_limits: true,
      dynamic_evaluation: true,
      budget_enforcement: true,
      tool_boundaries: true,
      data_boundaries: true,
      more_restrictive_only: true,
      replayable_history: true,
    });
  });

  it("executes tasks with dependency, side-effect, checkpoint, and recovery controls", () => {
    const result = runRuntimeOrchestrator();

    expect(result.task_execution).toMatchObject({
      task_admission: true,
      dependency_resolver: true,
      tool_gateway: true,
      result_validator: true,
      retry_controller: true,
      idempotency_service: true,
      side_effect_controls: true,
    });
    expect(result.checkpoints).toMatchObject({
      persistence: true,
      integrity_service: true,
      compatibility_validator: true,
      encryption: true,
      immutable: true,
      version_aware: true,
      deterministic_resume: true,
    });
    expect(result.recovery).toMatchObject({
      failure_classification: true,
      checkpoint_restoration: true,
      side_effect_reconciliation: true,
      bounded_attempts: true,
      deterministic_recovery: true,
      revoked_runtime_blocked: true,
    });
  });

  it("exposes authorized idempotent APIs and complete runtime evidence", () => {
    const result = runRuntimeOrchestrator();

    expect(result.apis).toMatchObject({
      runtime_management: true,
      task_endpoints: true,
      context_endpoints: true,
      restriction_endpoints: true,
      checkpoint_recovery_endpoints: true,
      administrative_endpoints: true,
      authenticated: true,
      authorized: true,
      idempotent_commands: true,
      versioned: true,
      structured_errors: true,
      evidence_references: true,
      deterministic_disposition: true,
    });
    expect(result.evidence.records).toHaveLength(14);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.lineage_query).toBe(true);
    expect(result.readiness.lifecycle_authority_preserved).toBe(true);
    expect(result.readiness.governance_sequence_preserved).toBe(true);
    expect(result.readiness.tenant_namespace_isolated).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runRuntimeOrchestrator({ scenario: failure });
    const validation = validateRuntimeOrchestrator(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runRuntimeOrchestrator({ scenario: failure });
    const validation = validateRuntimeOrchestrator(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit qualification failure as not qualified", () => {
    const result = runRuntimeOrchestrator({ scenario: "RUNTIME_ORCHESTRATOR_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateRuntimeOrchestrator(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runRuntimeOrchestrator({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runRuntimeOrchestrator({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
