export type GovernanceCertificationExecutionMode =
  | "MANUAL_CERTIFICATION"
  | "SCHEDULED_CERTIFICATION"
  | "PRE_RELEASE_CERTIFICATION"
  | "REGRESSION_CERTIFICATION"
  | "FULL_SYSTEM_CERTIFICATION"
  | "INCREMENTAL_CERTIFICATION"
  | "REPLAY_CERTIFICATION";

export type GovernanceCertificationExecutionState =
  | "REQUESTED"
  | "VALIDATING"
  | "PREPARING"
  | "EXECUTING"
  | "COLLECTING_RESULTS"
  | "AGGREGATING"
  | "CERTIFIED"
  | "ARCHIVED"
  | "VALIDATION_FAILED"
  | "EXECUTION_FAILED"
  | "AGGREGATION_FAILED"
  | "REPLAY_FAILED"
  | "INTEGRITY_FAILED"
  | "ISOLATION_FAILED";

export type GovernanceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "SKIPPED";

export type GovernanceCertificationOrchestratorScenario =
  | "BASELINE"
  | "SCHEDULED_BASELINE"
  | "PRE_RELEASE_BASELINE"
  | "REGRESSION_BASELINE"
  | "INCREMENTAL_BASELINE"
  | "REPLAY_BASELINE"
  | "REQUEST_INVALID"
  | "EXECUTION_ORDER_CHANGED"
  | "ISOLATION_BROKEN"
  | "REPLAY_FAILED"
  | "INTEGRITY_FAILED"
  | "AGGREGATION_NONDETERMINISTIC"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_BOUNDARY_EXCEEDED"
  | "MINOR_VISIBILITY_WARNING";

export type GovernanceCertificationOrchestrationFailure =
  | "REQUEST_VALIDATION_FAILED"
  | "EXECUTION_ORDER_CHANGED"
  | "SCENARIO_EXECUTION_FAILED"
  | "ISOLATION_VIOLATION"
  | "REPLAY_VALIDATION_FAILED"
  | "INTEGRITY_VALIDATION_FAILED"
  | "AGGREGATION_NONDETERMINISTIC"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_BOUNDARY_EXCEEDED"
  | "MINOR_VISIBILITY_WARNING";

export type GovernanceCertificationScenarioDefinition = Readonly<{
  scenario_id: string;
  scenario_name: "REPLAY_CERTIFICATION" | "INTEGRITY_CERTIFICATION" | "QUERY_CERTIFICATION" | "VISIBILITY_CERTIFICATION";
  phase: "7H.5" | "7I.5" | "7J.5" | "7K.5";
  component: string;
  execution_order: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  required: boolean;
  timeout_ms: number;
  expected_result: "PASS";
  dependencies: readonly string[];
  replay_enabled: boolean;
  scenario_hash: string;
}>;

export type GovernanceCertificationIsolationContext = Readonly<{
  isolation_id: string;
  isolated_runtime: true;
  isolated_datasets: true;
  isolated_replay_state: true;
  isolated_governance_state: true;
  isolated_evidence_cache: true;
  isolated_logging: true;
  isolated_tenant_context: boolean;
  tenant_id: string;
  mission_id: string;
  isolation_hash: string;
}>;

export type GovernanceCertificationScenarioResult = Readonly<{
  scenario_result_id: string;
  scenario_id: string;
  execution_timestamp: string;
  execution_duration_ms: number;
  result: GovernanceCertificationState;
  confidence: number;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
  failure_reason: GovernanceCertificationOrchestrationFailure | null;
  warnings: readonly GovernanceCertificationOrchestrationFailure[];
  result_hash: string;
}>;

export type GovernanceCertificationOverallResult = Readonly<{
  overall_result_id: string;
  certification_run_id: string;
  overall_state: Exclude<GovernanceCertificationState, "SKIPPED">;
  pass_count: number;
  conditional_pass_count: number;
  fail_count: number;
  blocking_failures: readonly GovernanceCertificationOrchestrationFailure[];
  overall_confidence: number;
  recommendations: readonly string[];
  approval_status: "APPROVED_FOR_PRODUCTION" | "LIMITED_CERTIFICATION_MODE" | "BLOCKED";
  overall_hash: string;
}>;

export type GovernanceCertificationRun = Readonly<{
  certification_run_id: string;
  tenant_id: string;
  mission_id: string;
  suite_version: "governance-intelligence-certification-suite/v7L.1";
  execution_mode: GovernanceCertificationExecutionMode;
  initiated_by: string;
  start_timestamp: string;
  end_timestamp: string;
  execution_state: GovernanceCertificationExecutionState;
  overall_result: Exclude<GovernanceCertificationState, "SKIPPED">;
  confidence: number;
  scenario_count: number;
  successful_scenarios: number;
  failed_scenarios: number;
  warning_count: number;
  replay_reference: string;
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceCertificationTimelineEvent = Readonly<{
  event_id: string;
  stage: "REQUEST_INITIALIZATION" | "SCENARIO_PREPARATION" | "SCENARIO_EXECUTION" | "AGGREGATION" | "CERTIFICATION_PUBLICATION";
  timestamp: string;
  execution_state: GovernanceCertificationExecutionState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceCertificationLedgerRecord = Readonly<{
  ledger_record_id: string;
  certification_run_id: string;
  tenant_id: string;
  mission_id: string;
  scenario_result_hashes: readonly string[];
  overall_hash: string;
  evidence_hash: string;
  replay_reference: string;
  integrity_hash: string;
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type GovernanceCertificationOrchestratorReport = Readonly<{
  orchestrator_id: string;
  phase_version: "7L.1";
  schema_version: "governance-certification-orchestrator/v7L.1";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  governance_execution_allowed: false;
  mutation_allowed: false;
  tenant_isolated: boolean;
  authority_protected: boolean;
  run: GovernanceCertificationRun;
  execution_plan: readonly GovernanceCertificationScenarioDefinition[];
  isolation_context: GovernanceCertificationIsolationContext;
  scenario_results: readonly GovernanceCertificationScenarioResult[];
  overall_result: GovernanceCertificationOverallResult;
  timeline: readonly GovernanceCertificationTimelineEvent[];
  truth_ledger_record: GovernanceCertificationLedgerRecord;
  evidence_package: Readonly<{
    evidence_package_id: string;
    certification_evidence_refs: readonly string[];
    replay_refs: readonly string[];
    integrity_hashes: readonly string[];
    lineage_refs: readonly string[];
    evidence_hash: string;
  }>;
  observability: Readonly<{
    certification_duration_ms: number;
    scenario_throughput: number;
    replay_success_rate: number;
    integrity_verification_rate: number;
    isolation_violations: number;
    orchestration_failures: number;
    certification_success_rate: number;
  }>;
  report_hash: string;
}>;

export type GovernanceCertificationOrchestratorInput = Readonly<{
  scenario?: GovernanceCertificationOrchestratorScenario;
  execution_mode?: GovernanceCertificationExecutionMode;
  tenant_id?: string;
  mission_id?: string;
  initiated_by?: string;
}>;

export type GovernanceCertificationOrchestratorObservabilitySurface = Readonly<{
  certification_run_id: string;
  execution_mode: GovernanceCertificationExecutionMode;
  execution_state: GovernanceCertificationExecutionState;
  overall_result: Exclude<GovernanceCertificationState, "SKIPPED">;
  scenario_count: number;
  failed_scenarios: number;
  warning_count: number;
  isolation_violations: number;
  orchestration_failures: number;
  report_hash: string;
}>;
