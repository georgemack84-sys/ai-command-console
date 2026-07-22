export type PilotPerformanceReliabilityOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ThresholdClassification = "CONSTITUTIONAL" | "OPERATIONAL";
export type ThresholdLifecycleState = "PROPOSED" | "UNDER_REVIEW" | "APPROVED" | "ACTIVE" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type Vp1Status = "VERIFIED" | "DEFINED_BUT_UNPOPULATED" | "MISSING";
export type PilotPerformanceReliabilityFailure = "CONSTITUTIONAL_THRESHOLDS_NOT_INHERITED" | "OPERATIONAL_THRESHOLDS_NOT_APPROVED" | "THRESHOLD_REGISTRY_MUTABLE" | "THRESHOLD_PROVENANCE_INCOMPLETE" | "THRESHOLD_VERSIONING_INCOMPLETE" | "PERFORMANCE_VALIDATION_NON_DETERMINISTIC" | "RELIABILITY_VALIDATION_INCOMPLETE" | "CAPACITY_MONITORING_NOT_OPERATIONAL" | "AVAILABILITY_DASHBOARD_NOT_OPERATIONAL" | "VP1_INCOMPLETE" | "UNRESOLVED_CLASS_A_FINDINGS" | "CERTIFICATION_EVIDENCE_INCOMPLETE" | "UNDEFINED_AUTHORITY_SOURCE" | "MISSING_CONSTITUTIONAL_THRESHOLD" | "PHASE_16_5_REPLAY_NOT_VALID" | "NON_CONSTITUTIONAL_PERFORMANCE_WARNING";
export type PilotPerformanceReliabilityScenario = "BASELINE" | PilotPerformanceReliabilityFailure;

export type PilotPerformanceReliabilityInput = Readonly<{ scenario?: PilotPerformanceReliabilityScenario; tenant_id?: string; operator_id?: string; mission_id?: string; registry_version?: string }>;

export type PerformanceThresholdRecord = Readonly<{
  threshold_id: string;
  metric: string;
  classification: ThresholdClassification;
  class_a: boolean;
  value: number;
  unit: string;
  measurement_window: string;
  authority_source: string;
  version: string;
  effective_date: string;
  approval_authority: string;
  evidence_refs: readonly string[];
  lifecycle: ThresholdLifecycleState;
  inherited: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ThresholdVersionRecord = Readonly<{
  version_id: string;
  threshold_id: string;
  version: string;
  predecessor: string | null;
  successor: string | null;
  immutable: boolean;
  replayable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ThresholdProvenanceRecord = Readonly<{
  provenance_id: string;
  threshold_id: string;
  originating_specification: string;
  amendment_history: readonly string[];
  governance_approval: string;
  version_lineage: readonly string[];
  certification_refs: readonly string[];
  supersession_chain: readonly string[];
  evidence_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type PerformanceValidatorRecord = Readonly<{
  validator_id: string;
  evaluated_metrics: readonly string[];
  deterministic_measurement: boolean;
  threshold_evaluation: boolean;
  metric_normalization: boolean;
  violation_detection: boolean;
  evidence_generation: boolean;
  certification_reporting: boolean;
  all_thresholds_met: boolean;
  integrity_hash: string;
}>;

export type ReliabilityAnalyzerRecord = Readonly<{
  analyzer_id: string;
  availability: number;
  reliability: number;
  service_continuity: boolean;
  recovery_performance: boolean;
  operational_consistency: boolean;
  replay_consistency: boolean;
  recommendation_stability: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type CapacityMonitorRecord = Readonly<{
  monitor_id: string;
  cpu_utilization: number;
  memory_utilization: number;
  storage_consumption: number;
  network_utilization: number;
  concurrent_operators: number;
  concurrent_tenants: number;
  recommendation_throughput: number;
  replay_workload: number;
  evidence_ingestion_capacity: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type AvailabilityDashboardRecord = Readonly<{
  dashboard_id: string;
  uptime_visible: boolean;
  latency_visible: boolean;
  threshold_compliance_visible: boolean;
  active_violations_visible: boolean;
  historical_trends_visible: boolean;
  certification_readiness_visible: boolean;
  pilot_health_visible: boolean;
  replay_completion_visible: boolean;
  recovery_status_visible: boolean;
  operator_visibility_complete: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type ThresholdEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "THRESHOLD_REGISTERED" | "THRESHOLD_VERSIONED" | "PROVENANCE_VERIFIED" | "PERFORMANCE_VALIDATED" | "RELIABILITY_ANALYZED" | "CAPACITY_MONITORED" | "AVAILABILITY_REPORTED" | "VP1_AUDITED" | "CERTIFICATION_EVIDENCE";
  threshold_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type Vp1ThresholdAuditRecord = Readonly<{
  audit_id: string;
  threshold_id: string;
  authoritative_source_exists: boolean;
  source_specification_approved: boolean;
  threshold_definition_present: boolean;
  authority_reference_valid: boolean;
  version_traceable: boolean;
  lineage_complete: boolean;
  evidence_available: boolean;
  classification_correct: boolean;
  status: Vp1Status;
  class_a_blocking: boolean;
  integrity_hash: string;
}>;

export type Vp1VerificationReport = Readonly<{
  report_id: string;
  audit_scope: readonly string[];
  audited_thresholds: readonly Vp1ThresholdAuditRecord[];
  missing_threshold_report: readonly string[];
  class_a_blocking_report: readonly string[];
  certification_readiness: "READY" | "BLOCKED";
  complete: boolean;
  integrity_hash: string;
}>;

export type PilotPerformanceReliabilityCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: PilotPerformanceReliabilityOutcome;
  passed: boolean;
  failure_reason: PilotPerformanceReliabilityFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotPerformanceReliabilityResult = Readonly<{
  phase_version: "pilot-performance-reliability-validation/v16.6";
  phase_identifier: "PilotPerformanceReliabilityValidation";
  production_replay_determinism_ref: string;
  threshold_lifecycle: readonly ThresholdLifecycleState[];
  threshold_registry: readonly PerformanceThresholdRecord[];
  threshold_versions: readonly ThresholdVersionRecord[];
  threshold_provenance: readonly ThresholdProvenanceRecord[];
  performance_validator: PerformanceValidatorRecord;
  reliability_analyzer: ReliabilityAnalyzerRecord;
  capacity_monitor: CapacityMonitorRecord;
  availability_dashboard: AvailabilityDashboardRecord;
  threshold_evidence_ledger: readonly ThresholdEvidenceLedgerEntry[];
  vp1_report: Vp1VerificationReport;
  certification_tests: readonly PilotPerformanceReliabilityCertificationTest[];
  failures: readonly PilotPerformanceReliabilityFailure[];
  outcome: PilotPerformanceReliabilityOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotPerformanceReliabilityValidation = Readonly<{
  valid: boolean;
  outcome: PilotPerformanceReliabilityOutcome;
  registry_valid: boolean;
  provenance_valid: boolean;
  versioning_valid: boolean;
  performance_valid: boolean;
  reliability_valid: boolean;
  capacity_valid: boolean;
  dashboard_valid: boolean;
  ledger_valid: boolean;
  vp1_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly PilotPerformanceReliabilityFailure[];
  integrity_hash: string;
}>;

export type PilotPerformanceReliabilityBundle = Readonly<{
  doctrine: Readonly<{
    version: "pilot-performance-reliability-validation/v16.6";
    upstream_phase: "production-replay-determinism/v16.5";
    threshold_lifecycle: readonly ThresholdLifecycleState[];
    threshold_classifications: readonly ThresholdClassification[];
    vp1_statuses: readonly Vp1Status[];
    certification_outcomes: readonly PilotPerformanceReliabilityOutcome[];
  }>;
  result: PilotPerformanceReliabilityResult;
  validation: PilotPerformanceReliabilityValidation;
}>;
