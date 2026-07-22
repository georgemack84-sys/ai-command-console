export type PerformanceOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED";
export type QualificationLevel = "DEVELOPMENT" | "VALIDATED" | "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED";
export type BenchmarkCategory = "FUNCTIONAL" | "LOAD" | "STRESS" | "SPIKE" | "SOAK" | "CONCURRENCY" | "ELASTICITY" | "RESOURCE" | "MULTI_TENANT" | "MISSION";
export type BottleneckDomain = "COMPUTE" | "STORAGE" | "NETWORK" | "MESSAGING" | "ORCHESTRATION" | "REPLAY" | "SIMULATION" | "TRUST_EVALUATION" | "APPLICATION_SERVICES";
export type PerformanceFailure =
  | "P6_8_RESILIENCE_RECOVERY_INVALID"
  | "PERFORMANCE_FRAMEWORK_MISSING"
  | "BENCHMARK_CATALOG_MISSING"
  | "BENCHMARK_SCENARIO_NOT_APPROVED"
  | "WORKLOAD_GENERATION_MISSING"
  | "WORKLOAD_NOT_ISOLATED"
  | "BENCHMARK_EXECUTION_MISSING"
  | "BENCHMARK_NONREPRODUCIBLE"
  | "METRICS_REGISTRY_MISSING"
  | "LATENCY_OBJECTIVE_FAILED"
  | "THROUGHPUT_OBJECTIVE_FAILED"
  | "RESOURCE_EFFICIENCY_FAILED"
  | "SCALABILITY_QUALIFICATION_MISSING"
  | "SCALABILITY_NONDETERMINISTIC"
  | "TENANT_SCALING_ISOLATION_FAILED"
  | "CAPACITY_PLANNING_MISSING"
  | "CAPACITY_FORECAST_NOT_EVIDENCE_BASED"
  | "BOTTLENECK_ANALYSIS_MISSING"
  | "SATURATION_ANALYSIS_MISSING"
  | "PERFORMANCE_REGRESSION_DETECTION_MISSING"
  | "REPLAY_COMPATIBILITY_FAILED"
  | "PERFORMANCE_EVIDENCE_MISSING"
  | "PERFORMANCE_EVIDENCE_MUTATED"
  | "PERFORMANCE_LINEAGE_INCOMPLETE"
  | "RESOURCE_TRACEABILITY_FAILED"
  | "CONSTITUTIONAL_LIMIT_BYPASS_ATTEMPTED"
  | "POLICY_MODIFICATION_ATTEMPTED"
  | "AUTHORIZATION_ATTEMPTED"
  | "TRUST_EVALUATION_ATTEMPTED"
  | "CERTIFICATION_ATTEMPTED"
  | "DEPLOYMENT_ATTEMPTED"
  | "RUNTIME_ORCHESTRATION_ATTEMPTED"
  | "REPLAY_CORRECTNESS_OWNERSHIP_VIOLATION"
  | "RESILIENCE_GOVERNANCE_OWNERSHIP_VIOLATION"
  | "DISASTER_RECOVERY_OWNERSHIP_VIOLATION";
export type PerformanceScenario = "BASELINE" | "DOCUMENTED_CAPACITY_CONSTRAINT" | PerformanceFailure;
export type PerformanceInput = Readonly<{ scenario?: PerformanceScenario; seed?: string }>;
export type PerformanceFramework = Readonly<{ framework_id: string; qualification_lifecycle: readonly string[]; performance_qualification: boolean; scalability_qualification: boolean; throughput_validation: boolean; latency_validation: boolean; resource_efficiency: boolean; capacity_planning: boolean; benchmark_governance: boolean; deterministic: boolean; integrity_hash: string }>;
export type BenchmarkCatalog = Readonly<{ catalog_id: string; categories: readonly BenchmarkCategory[]; approved_scenarios: readonly string[]; workload_definitions: readonly string[]; isolated_environments: readonly string[]; reproducible_inputs: boolean; integrity_hash: string }>;
export type BenchmarkExecution = Readonly<{ execution_id: string; benchmark_identifier: string; workload_definition: string; scenario_identifier: string; execution_environment: string; synthetic_dataset_identifier: string; software_versions: readonly string[]; configuration: string; operator: string; reproducible: boolean; replay_compatible: boolean; integrity_hash: string }>;
export type PerformanceMetrics = Readonly<{ metrics_id: string; average_latency_ms: number; median_latency_ms: number; p95_latency_ms: number; p99_latency_ms: number; max_latency_ms: number; requests_per_second: number; workflows_per_second: number; missions_per_hour: number; events_per_second: number; timeout_rate: number; retry_rate: number; saturation: number; degradation: number; objectives_met: boolean; integrity_hash: string }>;
export type ResourceUtilizationReport = Readonly<{ report_id: string; cpu: number; memory: number; storage: number; disk_io: number; network_io: number; gpu: number; accelerator: number; cache_efficiency: number; node_utilization: number; cluster_utilization: number; scaling_efficiency: number; queue_depth: number; traceable_to_workload: boolean; integrity_hash: string }>;
export type ScalabilityReport = Readonly<{ report_id: string; horizontal_scaling: boolean; vertical_scaling: boolean; tenant_scaling: boolean; organization_scaling: boolean; workload_scaling: boolean; infrastructure_scaling: boolean; distributed_workload_validation: boolean; tenant_isolation_preserved: boolean; deterministic: boolean; integrity_hash: string }>;
export type CapacityReport = Readonly<{ report_id: string; maximum_supported_tenants: number; maximum_organizations: number; concurrent_users: number; concurrent_agents: number; active_workflows: number; concurrent_missions: number; infrastructure_saturation: number; sustainable_capacity: number; burst_capacity: number; forecast_growth: number; evidence_based: boolean; constitutional_limits_preserved: boolean; integrity_hash: string }>;
export type BottleneckReport = Readonly<{ report_id: string; domains: readonly BottleneckDomain[]; compute: boolean; storage: boolean; network: boolean; messaging: boolean; orchestration: boolean; replay: boolean; simulation: boolean; trust_evaluation: boolean; application_services: boolean; saturation_analysis: boolean; regression_detection: boolean; integrity_hash: string }>;
export type PerformanceEvidence = Readonly<{ evidence_id: string; benchmark_identifier: string; workload_definition: string; scenario_identifier: string; execution_environment: string; software_versions: readonly string[]; configuration: string; synthetic_dataset_identifier: string; timestamps: readonly string[]; metrics: readonly string[]; observations: readonly string[]; bottlenecks: readonly string[]; replay_reference: string; simulation_reference: string; operator: string; immutable: boolean; traceable: boolean; replayable: boolean; integrity_hash: string }>;
export type PerformanceGates = Readonly<{ gate_id: string; approved_scenario_gate: boolean; isolated_environment_gate: boolean; immutable_evidence_gate: boolean; evidence_based_capacity_gate: boolean; replay_compatibility_gate: boolean; tenant_isolation_gate: boolean; resource_traceability_gate: boolean; reproducibility_gate: boolean; passed: boolean; integrity_hash: string }>;
export type PerformanceInvariants = Readonly<{ no_policy_modification: boolean; no_authorization: boolean; reproducible_benchmarks: boolean; immutable_evidence: boolean; replayable_executions: boolean; tenant_isolation: boolean; constitutional_limits_preserved: boolean; deterministic_scalability: boolean; degradation_evidence_generated: boolean; no_trust_evaluation_replacement: boolean; integrity_hash: string }>;
export type PerformanceBoundaries = Readonly<{ boundary_id: string; owns_trust_evaluation: false; owns_policy_decisions: false; owns_authorization: false; owns_certification: false; owns_deployment: false; owns_runtime_orchestration: false; owns_replay_correctness: false; owns_resilience_governance: false; owns_disaster_recovery: false; integrity_hash: string }>;
export type PerformanceReadiness = Readonly<{ readiness_id: string; outcome: PerformanceOutcome; level: QualificationLevel; phase_ready: boolean; framework_ready: boolean; benchmark_ready: boolean; execution_ready: boolean; metrics_ready: boolean; scalability_ready: boolean; capacity_ready: boolean; bottleneck_ready: boolean; evidence_ready: boolean; gates_passed: boolean; invariants_satisfied: boolean; boundaries_respected: boolean; failures: readonly PerformanceFailure[]; integrity_hash: string }>;
export type PerformanceResult = Readonly<{ phase_version: "proving-performance-scalability-qualification/v6.9"; phase_identifier: "ProvingPerformanceScalabilityQualification"; resilience_recovery_ref: "proving-resilience-recovery-validation/v6.8"; framework: PerformanceFramework; benchmark_catalog: BenchmarkCatalog; benchmark_execution: BenchmarkExecution; metrics: PerformanceMetrics; resource_report: ResourceUtilizationReport; scalability_report: ScalabilityReport; capacity_report: CapacityReport; bottleneck_report: BottleneckReport; evidence: PerformanceEvidence; gates: PerformanceGates; invariants: PerformanceInvariants; boundaries: PerformanceBoundaries; readiness: PerformanceReadiness; replay_hash: string; integrity_hash: string }>;
export type PerformanceValidation = Readonly<{ valid: boolean; outcome: PerformanceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; framework_valid: boolean; benchmark_valid: boolean; execution_valid: boolean; metrics_valid: boolean; resource_valid: boolean; scalability_valid: boolean; capacity_valid: boolean; bottleneck_valid: boolean; evidence_valid: boolean; gates_valid: boolean; invariants_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly PerformanceFailure[]; integrity_hash: string }>;
export type PerformanceBundle = Readonly<{ doctrine: Readonly<{ version: "proving-performance-scalability-qualification/v6.9"; owns_performance_qualification: true; owns_scalability_qualification: true; owns_throughput_validation: true; owns_latency_validation: true; owns_resource_efficiency: true; owns_capacity_planning: true; owns_benchmark_governance: true; owns_trust_evaluation: false; owns_policy_decisions: false; owns_authorization: false; owns_certification: false; owns_deployment: false; owns_runtime_orchestration: false; owns_replay_correctness: false; owns_resilience_governance: false; owns_disaster_recovery: false }>; result: PerformanceResult; validation: PerformanceValidation }>;
