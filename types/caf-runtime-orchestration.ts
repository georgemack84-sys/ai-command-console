export type RuntimeLifecycleState =
  | "REGISTERED"
  | "INITIALIZING"
  | "READY"
  | "SCHEDULED"
  | "EXECUTING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "SUSPENDED"
  | "STOPPING"
  | "TERMINATED"
  | "RECOVERING"
  | "RETIRED";

export type RuntimeScheduleMode = "IMMEDIATE" | "DELAYED" | "SCHEDULED" | "RECURRING" | "EVENT_TRIGGERED" | "DEPENDENCY_TRIGGERED";
export type RuntimeCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type RuntimeOrchestrationFailure =
  | "P3_2_COMPOSITION_INVALID"
  | "CCI_RUNTIME_INFRASTRUCTURE_REDEFINED"
  | "UNORCHESTRATED_EXECUTION"
  | "SCHEDULING_NON_DETERMINISTIC"
  | "SCHEDULING_GOVERNANCE_BYPASS"
  | "LIFECYCLE_SUPERVISION_GAP"
  | "ILLEGAL_RUNTIME_TRANSITION"
  | "DEPENDENCY_SYNC_FAILURE"
  | "CONCURRENCY_ORDERING_DRIFT"
  | "RUNTIME_CONTRACT_MISSING"
  | "RUNTIME_GOVERNANCE_BYPASS"
  | "RUNTIME_EVIDENCE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "OBSERVABILITY_GAP"
  | "TENANT_ISOLATION_VIOLATION"
  | "CERTIFICATION_PRUNED";

export type RuntimeOrchestrationScenario = "BASELINE" | RuntimeOrchestrationFailure;
export type RuntimeOrchestrationInput = Readonly<{ scenario?: RuntimeOrchestrationScenario; tenant_id?: string }>;

export type RuntimeOrchestratorRecord = Readonly<{
  orchestrator_id: string;
  active_agent_refs: readonly string[];
  composition_refs: readonly string[];
  cci_runtime_ref: string;
  owns_infrastructure: false;
  startup_governed: boolean;
  activation_governed: boolean;
  graceful_shutdown_supported: boolean;
  runtime_synchronization_enabled: boolean;
  all_execution_orchestrated: boolean;
  integrity_hash: string;
}>;

export type RuntimeLifecycleSupervisor = Readonly<{
  supervisor_id: string;
  states: readonly RuntimeLifecycleState[];
  legal_transitions: readonly string[];
  attempted_transition: string;
  transition_legal: boolean;
  health_supervision_enabled: boolean;
  recovery_enabled: boolean;
  forced_termination_governed: boolean;
  supervision_complete: boolean;
  integrity_hash: string;
}>;

export type RuntimeSchedulingPlan = Readonly<{
  schedule_id: string;
  supported_modes: readonly RuntimeScheduleMode[];
  execution_queue: readonly string[];
  priority_order: readonly string[];
  concurrency_policy: "SEQUENTIAL_BY_DEPENDENCY" | "PARALLEL_WITH_BARRIERS";
  execution_windows: readonly string[];
  workload_balancing_enabled: boolean;
  governance_validated: boolean;
  deterministic_ordering: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type RuntimeExecutionCoordination = Readonly<{
  coordination_id: string;
  dependency_barriers: readonly string[];
  execution_sequence: readonly string[];
  parallel_groups: readonly string[];
  completion_aggregation: boolean;
  timeout_coordination: boolean;
  retry_coordination: boolean;
  cancellation_supported: boolean;
  rollback_coordination: boolean;
  synchronization_valid: boolean;
  integrity_hash: string;
}>;

export type RuntimeStateSnapshot = Readonly<{
  state_id: string;
  active_sessions: readonly string[];
  runtime_metadata_refs: readonly string[];
  execution_status: "READY" | "RUNNING" | "BLOCKED" | "COMPLETED";
  snapshot_refs: readonly string[];
  state_persistence_enabled: boolean;
  synchronization_hash: string;
  tenant_id: string;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type RuntimeGovernanceAdapter = Readonly<{
  adapter_id: string;
  constitutional_authority_validated: boolean;
  runtime_authorization_validated: boolean;
  policy_compliance_validated: boolean;
  lifecycle_validity_validated: boolean;
  dependency_readiness_validated: boolean;
  scheduling_authorization_validated: boolean;
  unauthorized_execution_fails_closed: boolean;
  integrity_hash: string;
}>;

export type RuntimeContractLibrary = Readonly<{
  contract_id: string;
  contract_refs: readonly string[];
  versioned: boolean;
  replay_safe: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type RuntimeEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "ACTIVATION" | "SCHEDULING" | "EXECUTION" | "COORDINATION" | "LIFECYCLE_TRANSITION" | "FAILURE" | "RETRY" | "RECOVERY" | "TERMINATION" | "SHUTDOWN";
  evidence_refs: readonly string[];
  lineage_ref: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type RuntimeReplayValidation = Readonly<{
  replay_validation_id: string;
  lifecycle_replayed: boolean;
  scheduling_replayed: boolean;
  execution_replayed: boolean;
  dependency_replayed: boolean;
  supervision_replayed: boolean;
  governance_replayed: boolean;
  identical_behavior_reconstructed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type RuntimeObservabilityRecord = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    active_agents: number;
    runtime_health: "HEALTHY" | "DEGRADED" | "BLOCKED";
    scheduling_latency_ms: number;
    execution_throughput: number;
    coordination_delays: number;
    lifecycle_transitions: number;
    execution_failures: number;
    recovery_events: number;
    queue_depth: number;
    dependency_wait_times_ms: number;
  }>;
  cci_observability_integrated: boolean;
  complete_visibility: boolean;
  integrity_hash: string;
}>;

export type RuntimeOrchestrationCertification = Readonly<{
  certification_id: string;
  outcome: RuntimeCertificationOutcome;
  certified: boolean;
  all_execution_orchestrated: boolean;
  scheduling_deterministic: boolean;
  lifecycle_supervision_complete: boolean;
  execution_coordination_valid: boolean;
  contracts_complete: boolean;
  evidence_complete: boolean;
  cci_runtime_integration_valid: boolean;
  governance_enforced: boolean;
  replay_reproducible: boolean;
  observability_complete: boolean;
  tenant_isolation_preserved: boolean;
  failures: readonly RuntimeOrchestrationFailure[];
  integrity_hash: string;
}>;

export type RuntimeOrchestrationResult = Readonly<{
  phase_version: "caf-runtime-orchestration/v3.3";
  phase_identifier: "CafRuntimeOrchestration";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  agent_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  capability_composition_ref: "caf-capability-composition/v3.2";
  cci_shared_runtime_ref: "Program 2 - CCI Shared Runtime Services";
  orchestrator: RuntimeOrchestratorRecord;
  lifecycle_supervisor: RuntimeLifecycleSupervisor;
  scheduling: RuntimeSchedulingPlan;
  execution_coordination: RuntimeExecutionCoordination;
  runtime_state: RuntimeStateSnapshot;
  governance_adapter: RuntimeGovernanceAdapter;
  contract_library: RuntimeContractLibrary;
  runtime_evidence: readonly RuntimeEvidenceEntry[];
  replay_validation: RuntimeReplayValidation;
  observability: RuntimeObservabilityRecord;
  certification: RuntimeOrchestrationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RuntimeOrchestrationValidation = Readonly<{
  valid: boolean;
  outcome: RuntimeCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  orchestrator_valid: boolean;
  scheduling_valid: boolean;
  lifecycle_valid: boolean;
  coordination_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly RuntimeOrchestrationFailure[];
  integrity_hash: string;
}>;

export type RuntimeOrchestrationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-runtime-orchestration/v3.3";
    consumes_capability_composition: true;
    consumes_cci_shared_runtime_services: true;
    owns_orchestration_not_runtime_infrastructure: true;
    deterministic_scheduling_required: true;
    governed_execution_required: true;
    replayable_runtime_required: true;
    immutable_runtime_evidence_required: true;
  }>;
  result: RuntimeOrchestrationResult;
  validation: RuntimeOrchestrationValidation;
}>;
