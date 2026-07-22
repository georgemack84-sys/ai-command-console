export type SimulationFrameworkOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type SimulationType = "DETERMINISTIC" | "EVENT" | "OPERATIONAL" | "MISSION" | "REPLAY";
export type SimulationStatus = "DEFINED" | "CONFIGURED" | "VALIDATED" | "READY" | "EXECUTING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED" | "TERMINATED";
export type SimulationResultStatus = "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "CANCELLED" | "TERMINATED";

export type SimulationFrameworkFailure =
  | "P6_4_SYNTHETIC_GENERATION_INVALID"
  | "SIMULATION_ARCHITECTURE_MISSING"
  | "DETERMINISTIC_ENGINE_MISSING"
  | "EVENT_SIMULATION_MISSING"
  | "OPERATIONAL_SIMULATION_MISSING"
  | "MISSION_SIMULATION_MISSING"
  | "REPLAY_SIMULATION_MISSING"
  | "TIME_SERVICE_MISSING"
  | "SCHEDULER_SERVICE_MISSING"
  | "STATE_REGISTRY_MISSING"
  | "FAILURE_INJECTION_MISSING"
  | "METRICS_COLLECTION_MISSING"
  | "SIMULATION_REPORTING_MISSING"
  | "EVIDENCE_GENERATION_MISSING"
  | "DETERMINISTIC_EXECUTION_FAILED"
  | "REPLAY_FIDELITY_FAILED"
  | "SIMULATION_ISOLATION_FAILED"
  | "EVIDENCE_INCOMPLETE"
  | "TIME_NONDETERMINISTIC"
  | "STATE_RECOVERY_FAILED"
  | "PRODUCTION_TENANT_MODIFIED"
  | "PRODUCTION_IDENTITY_MODIFIED"
  | "PRODUCTION_REGISTRY_MODIFIED"
  | "PRODUCTION_EVIDENCE_MODIFIED"
  | "PRODUCTION_TRUST_DECISION_MODIFIED"
  | "LIVE_OPERATIONAL_EXECUTION_ATTEMPTED"
  | "EXECUTION_ORDER_NONDETERMINISTIC"
  | "EVENT_ORDER_NONDETERMINISTIC"
  | "SCHEDULER_DECISION_NONDETERMINISTIC"
  | "VIRTUAL_TIME_NONDETERMINISTIC"
  | "SERVICE_INTERACTION_NONDETERMINISTIC"
  | "STATE_TRANSITION_NONDETERMINISTIC"
  | "GENERATED_EVIDENCE_NONDETERMINISTIC"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type SimulationFrameworkScenario = "BASELINE" | SimulationFrameworkFailure;
export type SimulationFrameworkInput = Readonly<{ scenario?: SimulationFrameworkScenario; seed?: string }>;

export type SimulationArchitecture = Readonly<{ architecture_id: string; simulation_services: boolean; simulation_lifecycle: boolean; execution_topology: boolean; orchestration: boolean; execution_pipelines: boolean; service_model: boolean; execution_model: boolean; isolated_proving_only: boolean; integrity_hash: string }>;
export type SimulationRecord = Readonly<{ simulation_id: string; simulation_type: SimulationType; scenario_id: string; environment_id: string; digital_twin_id: string; mission_id: string; status: SimulationStatus; configuration: string; seed: string; created_time: string; integrity_hash: string }>;
export type SimulationExecution = Readonly<{ execution_id: string; simulation_id: string; start_time: string; end_time: string; engine_version: string; scheduler_version: string; dataset_version: string; result: SimulationResultStatus; replay_id: string; execution_order: readonly string[]; event_order: readonly string[]; scheduler_decisions: readonly string[]; virtual_time_progression: readonly number[]; service_interactions: readonly string[]; state_transitions: readonly string[]; generated_evidence: readonly string[]; integrity_hash: string }>;
export type SimulationEngine = Readonly<{ engine_id: string; deterministic_scheduler: boolean; execution_ordering: boolean; deterministic_clocks: boolean; deterministic_event_processing: boolean; repeatable_execution: boolean; event_simulation: boolean; operational_simulation: boolean; mission_simulation: boolean; replay_simulation: boolean; integrity_hash: string }>;
export type SimulationRuntimeServices = Readonly<{ services_id: string; time_service: boolean; scheduler_service: boolean; state_registry: boolean; failure_injection: boolean; metrics_collection: boolean; reporting: boolean; evidence_generation: boolean; integrity_hash: string }>;
export type SimulationStateRegistry = Readonly<{ registry_id: string; simulation_state: boolean; checkpoints: readonly string[]; snapshots: readonly string[]; rollback_points: readonly string[]; restoration_reproducible: boolean; integrity_hash: string }>;
export type FailureInjectionLibrary = Readonly<{ library_id: string; infrastructure_faults: boolean; service_failures: boolean; network_failures: boolean; resource_exhaustion: boolean; dependency_failures: boolean; controlled: boolean; integrity_hash: string }>;
export type SimulationMetrics = Readonly<{ metrics_id: string; latency: number; throughput: number; resource_utilization: number; event_counts: number; execution_statistics: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type SimulationReport = Readonly<{ report_id: string; execution_id: string; summary: string; metrics: readonly string[]; findings: readonly string[]; divergence_summary: string; recommendations: readonly string[]; integrity_hash: string }>;
export type SimulationEvidence = Readonly<{ evidence_id: string; execution_id: string; replay_hash: string; environment_hash: string; dataset_hash: string; digital_twin_hash: string; policy_hash: string; signature: string; scenario_ref: string; environment_ref: string; digital_twin_ref: string; dataset_refs: readonly string[]; software_versions: readonly string[]; timing_model: string; random_seed: string; configuration_ref: string; generated_events: readonly string[]; outputs: readonly string[]; metric_refs: readonly string[]; report_refs: readonly string[]; immutable: boolean; integrity_hash: string }>;
export type SimulationVerificationGates = Readonly<{ gate_id: string; deterministic_execution: boolean; replay_fidelity: boolean; simulation_isolation: boolean; evidence_completeness: boolean; time_determinism: boolean; state_recovery: boolean; passed: boolean; integrity_hash: string }>;
export type SimulationBoundary = Readonly<{ boundary_id: string; modifies_production_tenants: false; modifies_production_identities: false; modifies_production_registries: false; modifies_production_evidence: false; modifies_production_trust_decisions: false; performs_live_operational_execution: false; integrity_hash: string }>;
export type SimulationFrameworkReadiness = Readonly<{ readiness_id: string; outcome: SimulationFrameworkOutcome; phase_ready: boolean; architecture_ready: boolean; engine_ready: boolean; event_ready: boolean; operational_ready: boolean; mission_ready: boolean; replay_ready: boolean; time_ready: boolean; scheduler_ready: boolean; state_ready: boolean; failure_injection_ready: boolean; metrics_ready: boolean; reports_ready: boolean; evidence_ready: boolean; gates_passed: boolean; isolation_respected: boolean; failures: readonly SimulationFrameworkFailure[]; integrity_hash: string }>;

export type SimulationFrameworkResult = Readonly<{ phase_version: "proving-simulation-framework/v6.5"; phase_identifier: "ProvingSimulationFramework"; synthetic_generation_ref: "proving-synthetic-data-digital-twin-generation/v6.4"; architecture: SimulationArchitecture; simulation: SimulationRecord; execution: SimulationExecution; engine: SimulationEngine; runtime_services: SimulationRuntimeServices; state_registry: SimulationStateRegistry; failure_injection: FailureInjectionLibrary; metrics: SimulationMetrics; report: SimulationReport; evidence: SimulationEvidence; gates: SimulationVerificationGates; boundaries: SimulationBoundary; readiness: SimulationFrameworkReadiness; replay_hash: string; integrity_hash: string }>;
export type SimulationFrameworkValidation = Readonly<{ valid: boolean; outcome: SimulationFrameworkOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; simulation_valid: boolean; execution_valid: boolean; engine_valid: boolean; services_valid: boolean; state_valid: boolean; failure_injection_valid: boolean; metrics_valid: boolean; report_valid: boolean; evidence_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly SimulationFrameworkFailure[]; integrity_hash: string }>;
export type SimulationFrameworkBundle = Readonly<{ doctrine: Readonly<{ version: "proving-simulation-framework/v6.5"; owns_deterministic_simulation: true; owns_event_simulation: true; owns_operational_simulation: true; owns_mission_simulation: true; owns_replay_simulation: true; performs_live_operational_execution: false; modifies_production_systems: false }>; result: SimulationFrameworkResult; validation: SimulationFrameworkValidation }>;
