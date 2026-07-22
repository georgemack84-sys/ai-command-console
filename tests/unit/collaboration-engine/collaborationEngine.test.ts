import { describe, expect, it } from "vitest";

import { getCollaborationEngineBundle, replayCollaborationEngine, runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import type { CollaborationEngineFailure } from "@/types/collaboration-engine";

const conditionalFailures = ["COLLABORATION_SESSIONS_MISSING", "SHARED_CONTEXT_MISSING", "COORDINATION_ENGINE_MISSING", "CONFLICT_RESOLUTION_MISSING", "CONSENSUS_ENGINE_MISSING", "ARBITRATION_ENGINE_MISSING", "ARBITRATION_EVIDENCE_MISSING", "COLLABORATION_GOVERNANCE_MISSING", "COLLABORATION_MONITORING_MISSING", "COLLABORATION_API_MISSING", "COLLABORATION_EVIDENCE_MISSING"] as const satisfies readonly CollaborationEngineFailure[];
const failClosedFailures = ["W2_0_CAF_CONSTITUTION_INVALID", "W2_1_AGENT_REGISTRY_INVALID", "W2_2_LIFECYCLE_ENGINE_INVALID", "W2_3_CAPABILITY_REGISTRY_INVALID", "W2_5_AUTHORITY_VALIDATOR_INVALID", "W2_6_POLICY_GATE_INVALID", "W2_7_SAFETY_GATE_INVALID", "W2_8_PLANNING_ENGINE_INVALID", "W2_9_MEMORY_ENGINE_INVALID", "W2_10_RUNTIME_ORCHESTRATOR_INVALID", "W2_11_DELEGATION_ENGINE_INVALID", "SESSION_LIFECYCLE_INVALID", "UNAUTHORIZED_PARTICIPATION_ALLOWED", "SESSION_ISOLATION_FAILED", "SHARED_CONTEXT_NON_DETERMINISTIC", "UNAUTHORIZED_CONTEXT_VISIBLE", "CONTEXT_SNAPSHOT_MUTABLE", "RESPONSIBILITY_ASSIGNMENT_INVALID", "DEPENDENCY_COORDINATION_INVALID", "EXECUTION_ORDERING_NON_DETERMINISTIC", "CONFLICT_UNDETECTED", "CONFLICT_RESOLUTION_NON_DETERMINISTIC", "AUTHORITY_PRECEDENCE_BYPASSED", "CONSENSUS_IGNORES_AUTHORITY", "CONSENSUS_IGNORES_POLICY", "CONSENSUS_IGNORES_SAFETY", "CONSENSUS_THRESHOLD_INVALID", "OPERATOR_ESCALATION_BYPASSED", "GOVERNANCE_VALIDATION_BYPASSED", "TENANT_ISOLATION_FAILED", "PERMISSION_ENFORCEMENT_FAILED", "COLLABORATION_HEALTH_UNTRACKED", "COLLABORATION_EVIDENCE_NOT_IMMUTABLE", "COLLABORATION_REPLAY_INVALID"] as const satisfies readonly CollaborationEngineFailure[];

describe("Collaboration Engine W2.12", () => {
  it("publishes the W2.12 collaboration doctrine and operational bundle", () => {
    const bundle = getCollaborationEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "collaboration-engine/w2.12",
      owns_sessions: true,
      owns_shared_context: true,
      owns_coordination: true,
      owns_conflict_resolution: true,
      owns_consensus: true,
      owns_arbitration: true,
      owns_collaboration_governance: true,
      owns_collaboration_monitoring: true,
      owns_collaboration_evidence: true,
      operational_gate: "Collaboration Engine Operational Gate",
    });
    expect(bundle.result.readiness.decision).toBe("COLLABORATION_ENGINE_OPERATIONAL");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic collaboration to W2.0 through W2.11", () => {
    const first = runCollaborationEngine();
    const second = runCollaborationEngine();

    expect(first.delegation_engine_ref).toBe("delegation-engine/w2.11");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCollaborationEngine(first).valid).toBe(true);
    expect(replayCollaborationEngine(first)).toBe(true);
  });

  it("manages sessions and shared context deterministically", () => {
    const result = runCollaborationEngine();

    expect(result.sessions).toMatchObject({ session_lifecycle: true, ownership: true, membership: true, permissions: true, state_machine: true, deterministic_sessions: true, authenticated: true, authorized: true });
    expect(result.shared_context).toMatchObject({ working_memory: true, synchronization: true, versioning: true, visibility: true, consistency: true, immutable_snapshots: true, protection: true, secure_synchronization: true, deterministic_context: true });
  });

  it("coordinates work and resolves conflicts using constitutional precedence", () => {
    const result = runCollaborationEngine();

    expect(result.coordination).toMatchObject({ work_coordination: true, responsibility_assignment: true, task_synchronization: true, dependency_coordination: true, progress_tracking: true, execution_ordering: true, coordination_checkpoints: true, deterministic_ordering: true });
    expect(result.conflicts).toMatchObject({ decision_conflicts: true, resource_conflicts: true, capability_conflicts: true, authority_conflicts: true, planning_conflicts: true, runtime_conflicts: true, memory_conflicts: true, policy_driven_resolution: true, authority_precedence: true, operator_escalation: true, arbitration: true });
  });

  it("forms governed consensus and arbitrates unresolved disputes", () => {
    const result = runCollaborationEngine();

    expect(result.consensus).toMatchObject({ proposals: true, voting_strategies: true, weighted_authority_decisions: true, capability_aware_voting: true, trust_aware_voting: true, approval_thresholds: true, consensus_evidence: true, authority_policy_safety_constrained: true });
    expect(result.arbitration).toMatchObject({ arbitration_requests: true, authority_evaluation: true, policy_evaluation: true, safety_evaluation: true, operator_review: true, arbitration_decisions: true, decision_publication: true, evidence: true });
  });

  it("enforces governance, monitoring, APIs, and immutable evidence", () => {
    const result = runCollaborationEngine();

    expect(result.governance).toMatchObject({ authority_validation: true, policy_validation: true, safety_validation: true, session_governance: true, membership_validation: true, permission_enforcement: true, governance_precedes_execution: true, tenant_isolation: true, session_isolation: true });
    expect(result.monitoring).toMatchObject({ active_sessions: true, collaboration_health: true, participation_metrics: true, conflict_metrics: true, consensus_metrics: true, arbitration_metrics: true, coordination_performance: true, continuous: true });
    expect(result.apis).toMatchObject({ create_session: true, join_session: true, share_context: true, submit_proposal: true, vote: true, resolve_conflict: true, request_arbitration: true, retrieve_evidence: true, coordinate_tasks: true, stable: true });
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.readiness.governance_precedes_collaboration_execution).toBe(true);
    expect(result.readiness.tenant_session_isolation_preserved).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional operation for %s", (failure) => {
    const result = runCollaborationEngine({ scenario: failure });
    const validation = validateCollaborationEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_OPERATIONAL");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runCollaborationEngine({ scenario: failure });
    const validation = validateCollaborationEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit operational gate failure as not operational", () => {
    const result = runCollaborationEngine({ scenario: "COLLABORATION_ENGINE_OPERATIONAL_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_OPERATIONAL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateCollaborationEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runCollaborationEngine({ scenario: "OPERATIONAL_WITH_OBSERVATIONS" });
    const followup = runCollaborationEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(followup.readiness.failures).toEqual([]);
  });
});
