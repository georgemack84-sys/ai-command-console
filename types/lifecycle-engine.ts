export type LifecycleEngineDecision = "W2_2_LIFECYCLE_ENGINE_QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type LifecycleEngineFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "LIFECYCLE_DOMAIN_MODEL_MISSING"
  | "AGENT_STATE_MACHINE_MISSING"
  | "RUNTIME_STATE_MACHINE_MISSING"
  | "RUNTIME_NOT_AUTHORITATIVE"
  | "EXECUTION_OUTSIDE_PERMITTED_STATE"
  | "INVALID_TRANSITIONS_ALLOWED"
  | "TERMINAL_STATE_EXIT_ALLOWED"
  | "STATE_VERSIONING_MISSING"
  | "CONCURRENCY_CONTROL_FAILED"
  | "IDEMPOTENCY_MISSING"
  | "LIFECYCLE_COUPLING_MISSING"
  | "SUSPENSION_PROPAGATION_FAILED"
  | "REVOCATION_PROPAGATION_FAILED"
  | "RETIREMENT_ACTIVE_RUNTIME_ALLOWED"
  | "TRANSITION_VALIDATION_MISSING"
  | "MISSING_PREREQUISITES_NOT_FAIL_CLOSED"
  | "STALE_REQUEST_MUTATED_STATE"
  | "HEALTH_SERVICE_MISSING"
  | "HEALTH_AUTHORIZES_EXECUTION"
  | "STALE_HEALTH_NOT_DETECTED"
  | "RECOVERY_MANAGER_MISSING"
  | "RECOVERY_BYPASSES_REVOCATION"
  | "RECOVERY_UNBOUNDED"
  | "SUSPENSION_MANAGER_MISSING"
  | "SUSPENSION_UNAUTHORIZED_CONTINUATION"
  | "RETIREMENT_MANAGER_MISSING"
  | "REVOCATION_ENFORCEMENT_MISSING"
  | "LIFECYCLE_HISTORY_MISSING"
  | "LIFECYCLE_HISTORY_NOT_IMMUTABLE"
  | "LIFECYCLE_REPLAY_DIVERGENCE"
  | "TENANT_ISOLATION_FAILED"
  | "ORCHESTRATOR_INTEGRATION_INVALID"
  | "REGISTRY_PROJECTION_AUTHORITATIVE"
  | "OBSERVABILITY_MISSING"
  | "LIFECYCLE_EVIDENCE_MISSING"
  | "LIFECYCLE_QUALIFICATION_GATE_FAILED";
export type LifecycleEngineScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | LifecycleEngineFailure;
export type LifecycleEngineInput = Readonly<{ scenario?: LifecycleEngineScenario; seed?: string }>;
export type AgentLifecycleState = "REGISTERED" | "VALIDATING" | "INACTIVE" | "ACTIVE" | "SUSPENDED" | "RECOVERING" | "RESTRICTED" | "RETIRING" | "RETIRED" | "REVOKED";
export type RuntimeLifecycleState = "REQUESTED" | "PROVISIONING" | "INITIALIZING" | "READY" | "RUNNING" | "DEGRADED" | "QUIESCING" | "SUSPENDING" | "SUSPENDED" | "RECOVERING" | "STOPPING" | "STOPPED" | "FAILED" | "QUARANTINED" | "TERMINATED" | "REVOKED";
export type TransitionOutcome = "APPROVED" | "APPROVED_WITH_RESTRICTIONS" | "DENIED" | "ESCALATION_REQUIRED" | "STALE_REQUEST" | "CONFLICT" | "FAIL_CLOSED";
export type LifecycleDomainModel = Readonly<{ model_id: string; agent_states: readonly AgentLifecycleState[]; runtime_states: readonly RuntimeLifecycleState[]; transition_definitions: boolean; state_version_model: boolean; reason_code_registry: boolean; command_model: boolean; event_model: boolean; restriction_model: boolean; integrity_hash: string }>;
export type RuntimeStateMachine = Readonly<{ machine_id: string; authoritative_execution_control: boolean; execution_enabled_states: readonly RuntimeLifecycleState[]; degraded_requires_signed_policy: boolean; illegal_transitions_rejected: boolean; terminal_state_enforcement: boolean; state_survives_restart: boolean; process_status_not_authoritative: boolean; integrity_hash: string }>;
export type AgentLifecycleMachine = Readonly<{ machine_id: string; agent_lifecycle_states: readonly AgentLifecycleState[]; version_scoped_controls: boolean; new_runtime_eligibility_control: boolean; terminal_behavior_validated: boolean; registry_projection_synchronized: boolean; revocation_terminal: boolean; integrity_hash: string }>;
export type LifecycleCoupling = Readonly<{ service_id: string; agent_to_runtime_propagation: boolean; runtime_to_agent_escalation: boolean; suspension_propagation: boolean; revocation_propagation: boolean; retirement_zero_active_runtime_check: boolean; partial_propagation_detection: boolean; coupling_evidence: boolean; deterministic: boolean; integrity_hash: string }>;
export type TransitionValidationService = Readonly<{ service_id: string; validates_source_target: boolean; validates_principal_scope: boolean; validates_authority_policy_safety: boolean; validates_trust_certification_operator: boolean; validates_idempotency: boolean; optimistic_concurrency: boolean; atomic_commitment: boolean; outcomes: readonly TransitionOutcome[]; missing_prerequisites_fail_closed: boolean; integrity_hash: string }>;
export type LifecycleHealthService = Readonly<{ service_id: string; agent_health: boolean; runtime_health: boolean; health_dimensions: readonly string[]; stale_observation_detection: boolean; critical_health_fail_closed: boolean; recommendations_only: boolean; tenant_isolation: boolean; integrity_hash: string }>;
export type LifecycleRecoverySuspensionRetirementRevocation = Readonly<{ manager_id: string; bounded_recovery: boolean; checkpoint_recovery: boolean; replay_recovery: boolean; recovery_restrictions: boolean; suspension_directives: boolean; emergency_suspension: boolean; retirement_planning: boolean; runtime_draining: boolean; revocation_commands: boolean; credential_invalidation: boolean; revocation_overrides_recovery: boolean; integrity_hash: string }>;
export type LifecycleHistoryReplay = Readonly<{ store_id: string; append_only_history: boolean; hash_chaining: boolean; ordered_per_subject: boolean; tenant_scoped: boolean; queryable: boolean; replayable: boolean; state_reconstruction: boolean; divergence_detection: boolean; mutation_detectable: boolean; integrity_hash: string }>;
export type LifecycleApisObservability = Readonly<{ api_id: string; command_api: boolean; query_api: boolean; decision_api: boolean; event_api: boolean; registry_projection_non_authoritative: boolean; orchestrator_verification: boolean; metrics: readonly string[]; dashboards: readonly string[]; integrity_hash: string }>;
export type LifecycleEvidence = Readonly<{ ledger_id: string; records: readonly string[]; transition_evidence: boolean; history_evidence: boolean; coupling_evidence: boolean; health_evidence: boolean; recovery_evidence: boolean; suspension_evidence: boolean; retirement_evidence: boolean; revocation_evidence: boolean; replay_evidence: boolean; immutable: boolean; integrity_hash: string }>;
export type LifecycleQualification = Readonly<{ report_id: string; authoritative_execution_control: boolean; state_machine_completeness: boolean; transition_integrity: boolean; coupling_validated: boolean; execution_eligibility_enforced: boolean; health_correctness: boolean; recovery_correctness: boolean; suspension_enforcement: boolean; retirement_correctness: boolean; revocation_enforcement: boolean; tenant_isolation: boolean; concurrency_safety: boolean; immutable_history: boolean; deterministic_replay: boolean; operational_readiness: boolean; evidence_completeness: boolean; gate_decision: LifecycleEngineDecision; integrity_hash: string }>;
export type LifecycleEngineReadiness = Readonly<{ readiness_id: string; decision: LifecycleEngineDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; domain_model_ready: boolean; runtime_machine_ready: boolean; agent_machine_ready: boolean; coupling_ready: boolean; transition_validation_ready: boolean; health_ready: boolean; managers_ready: boolean; history_replay_ready: boolean; api_observability_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly LifecycleEngineFailure[]; integrity_hash: string }>;
export type LifecycleEngineResult = Readonly<{ phase_version: "lifecycle-engine/w2.2"; phase_identifier: "LifecycleEngine"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; domain_model: LifecycleDomainModel; runtime_state_machine: RuntimeStateMachine; agent_lifecycle: AgentLifecycleMachine; coupling: LifecycleCoupling; transition_validation: TransitionValidationService; health_service: LifecycleHealthService; recovery_suspension_retirement_revocation: LifecycleRecoverySuspensionRetirementRevocation; history_replay: LifecycleHistoryReplay; apis_observability: LifecycleApisObservability; evidence: LifecycleEvidence; qualification: LifecycleQualification; readiness: LifecycleEngineReadiness; replay_hash: string; integrity_hash: string }>;
export type LifecycleEngineValidation = Readonly<{ valid: boolean; decision: LifecycleEngineDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; domain_model_valid: boolean; runtime_machine_valid: boolean; agent_machine_valid: boolean; coupling_valid: boolean; transition_validation_valid: boolean; health_valid: boolean; managers_valid: boolean; history_replay_valid: boolean; api_observability_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly LifecycleEngineFailure[]; integrity_hash: string }>;
export type LifecycleEngineBundle = Readonly<{ doctrine: Readonly<{ version: "lifecycle-engine/w2.2"; owns_agent_lifecycle: true; owns_runtime_instance_lifecycle: true; owns_transition_validation: true; owns_lifecycle_coupling: true; owns_health_services: true; owns_recovery_suspension_retirement_revocation: true; owns_lifecycle_history: true; owns_lifecycle_replay: true; owns_lifecycle_apis: true; qualification_gate: "Lifecycle Infrastructure Qualification Gate" }>; result: LifecycleEngineResult; validation: LifecycleEngineValidation }>;
