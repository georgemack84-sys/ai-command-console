export type ScaleWorkloadProfile = "SMALL" | "MEDIUM" | "ENTERPRISE" | "HYPERSCALE" | "BURST" | "SUSTAINED";
export type StressType = "CPU_SATURATION" | "MEMORY_PRESSURE" | "STORAGE_PRESSURE" | "NETWORK_CONGESTION" | "QUEUE_OVERLOAD" | "DEPENDENCY_SATURATION" | "SERVICE_CONTENTION" | "CONCURRENT_TENANT_LOAD";
export type InjectedFailureType = "SERVICE_FAILURE" | "DEPENDENCY_FAILURE" | "TIMEOUT" | "RESOURCE_EXHAUSTION" | "NETWORK_PARTITION" | "DELAYED_RESPONSE" | "INFRASTRUCTURE_RESTART" | "CORRUPTED_SYNTHETIC_INPUTS" | "REPLAY_INTERRUPTION";
export type ScaleValidationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ScaleValidationFailure = "ADVISORY_BOUNDARY_NOT_APPROVED" | "CONTRACT_NOT_APPROVED" | "WORKLOAD_NON_DETERMINISTIC" | "LOAD_GENERATION_NON_REPRODUCIBLE" | "STRESS_NON_DETERMINISTIC" | "LATENCY_NOT_CHARACTERIZED" | "THROUGHPUT_NON_REPRODUCIBLE" | "RESOURCE_METRICS_INVALID" | "DEGRADATION_NOT_GRACEFUL" | "RECOVERY_NOT_REPRODUCIBLE" | "RESILIENCE_NOT_REPRODUCIBLE" | "REPLAY_NON_DETERMINISTIC" | "DIVERGENCE_UNDETECTED" | "AUDIT_LINEAGE_INCOMPLETE" | "GOVERNANCE_NOT_PRESERVED" | "TENANT_ISOLATION_BREACH" | "ADVISORY_BOUNDARY_BREACH" | "EXECUTION_AUTHORITY_EMERGED" | "CONSTITUTIONAL_COMPLIANCE_FAILED" | "EVIDENCE_MUTABLE" | "NON_CONSTITUTIONAL_CAPACITY_WARNING";
export type ScaleValidationScenario = "BASELINE" | ScaleValidationFailure;

export type ScaleStressResilienceInput = Readonly<{ scenario?: ScaleValidationScenario; workload_profile?: ScaleWorkloadProfile }>;

export type ScaleValidationContract = Readonly<{
  contract_version: "scale-stress-resilience-validation/v14.7";
  advisory_boundary_ref: string;
  workload_taxonomy: readonly ScaleWorkloadProfile[];
  stress_taxonomy: readonly StressType[];
  failure_taxonomy: readonly InjectedFailureType[];
  deterministic_scaling_required: boolean;
  replay_required: boolean;
  governance_required: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type ScaleValidationRecord = Readonly<{
  scale_validation_id: string;
  workload_profile: ScaleWorkloadProfile;
  environment_id: string;
  scenario_refs: readonly string[];
  tenant_count: number;
  mission_count: number;
  concurrent_operations: number;
  latency_metrics: Readonly<{ p50_ms: number; p95_ms: number; p99_ms: number }>;
  throughput_metrics: Readonly<{ requests_per_second: number; events_per_second: number }>;
  resource_metrics: Readonly<{ cpu_percent: number; memory_percent: number; storage_percent: number; queue_depth: number }>;
  injected_failures: readonly string[];
  degradation_summary: string;
  recovery_summary: string;
  resilience_score: number;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  validation_result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type WorkloadProfileRecord = Readonly<{
  workload_id: string;
  profile: ScaleWorkloadProfile;
  tenant_count: number;
  mission_count: number;
  concurrent_operations: number;
  deterministic: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type StressValidationReport = Readonly<{
  stress_id: string;
  stress_types: readonly StressType[];
  deterministic: boolean;
  bottlenecks_identified: boolean;
  capacity_measurable: boolean;
  resource_saturation_classified: boolean;
  integrity_hash: string;
}>;

export type FailureRecoveryReport = Readonly<{
  failure_recovery_id: string;
  injected_failure_types: readonly InjectedFailureType[];
  failures_reproducible: boolean;
  injections_deterministic: boolean;
  degradation_graceful: boolean;
  recovery_reproducible: boolean;
  integrity_preserved: boolean;
  audit_continuity: boolean;
  integrity_hash: string;
}>;

export type ScaleReplayReport = Readonly<{
  replay_id: string;
  workload_replayed: boolean;
  timing_consistent: boolean;
  execution_ordering_reproduced: boolean;
  recovery_replayed: boolean;
  failure_replayed: boolean;
  divergence_detected: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ScaleEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "WORKLOAD_GENERATED" | "STRESS_EXECUTED" | "FAILURE_INJECTED" | "RECOVERY_VALIDATED" | "REPLAY_VALIDATED" | "GOVERNANCE_VALIDATED" | "INTEGRITY_VALIDATED";
  evidence_ref: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type ScaleGovernanceReport = Readonly<{
  governance_id: string;
  advisory_only_outputs: boolean;
  execution_blocking: boolean;
  authority_boundaries: boolean;
  tenant_isolation: boolean;
  policy_compliance: boolean;
  audit_ownership: boolean;
  constitutional_compliance: boolean;
  integrity_hash: string;
}>;

export type ScaleCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ScaleValidationOutcome;
  passed: boolean;
  failure_reason: ScaleValidationFailure | null;
  integrity_hash: string;
}>;

export type ScaleStressResilienceResult = Readonly<{
  phase_version: "scale-stress-resilience-validation/v14.7";
  phase_identifier: "ScaleStressResilienceValidation";
  advisory_boundary_ref: string;
  contract: ScaleValidationContract;
  validation_record: ScaleValidationRecord;
  workloads: readonly WorkloadProfileRecord[];
  stress: StressValidationReport;
  recovery: FailureRecoveryReport;
  replay: ScaleReplayReport;
  governance: ScaleGovernanceReport;
  evidence_ledger: readonly ScaleEvidenceLedgerEntry[];
  certification_tests: readonly ScaleCertificationTest[];
  failures: readonly ScaleValidationFailure[];
  outcome: ScaleValidationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ScaleStressResilienceValidation = Readonly<{
  valid: boolean;
  outcome: ScaleValidationOutcome;
  contract_valid: boolean;
  record_valid: boolean;
  workloads_valid: boolean;
  stress_valid: boolean;
  recovery_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly ScaleValidationFailure[];
  integrity_hash: string;
}>;

export type ScaleStressResilienceBundle = Readonly<{
  doctrine: Readonly<{
    version: "scale-stress-resilience-validation/v14.7";
    advisory_boundary_phase: "advisory-boundary-validation/v14.6";
    certification_outcomes: readonly ScaleValidationOutcome[];
    workload_profiles: readonly ScaleWorkloadProfile[];
    stress_types: readonly StressType[];
    failure_types: readonly InjectedFailureType[];
  }>;
  result: ScaleStressResilienceResult;
  validation: ScaleStressResilienceValidation;
}>;
