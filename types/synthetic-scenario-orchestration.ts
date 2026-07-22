export type SyntheticScenarioLifecycleState = "DEFINED" | "REGISTERED" | "QUALIFIED" | "SCHEDULED" | "EXECUTING" | "COMPLETED" | "REPLAYABLE" | "ARCHIVED";
export type SyntheticScenarioType = "NOMINAL" | "EDGE_CASE" | "ADVERSARIAL" | "FAILURE" | "RECOVERY";
export type SyntheticScenarioOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type SyntheticScenarioDivergenceCategory = "ORDERING_DIVERGENCE" | "ENVIRONMENT_DIVERGENCE" | "DATASET_DIVERGENCE" | "IDENTITY_DIVERGENCE" | "UNEXPLAINED_DIVERGENCE";
export type SyntheticScenarioFailure = "DATA_GENERATION_NOT_APPROVED" | "SCENARIO_CONTRACT_INVALID" | "SCENARIO_REGISTRY_NON_DETERMINISTIC" | "SCENARIO_IDENTITY_DUPLICATE" | "COMPOSITION_NON_DETERMINISTIC" | "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC" | "EXECUTION_ORDER_NON_REPRODUCIBLE" | "NOMINAL_EXECUTION_FAILED" | "EDGE_CASE_EXECUTION_FAILED" | "ADVERSARIAL_EXECUTION_FAILED" | "FAILURE_EXECUTION_FAILED" | "RECOVERY_EXECUTION_FAILED" | "MULTI_SCENARIO_ORCHESTRATION_NON_DETERMINISTIC" | "REPLAY_EXECUTION_MISMATCH" | "REPLAY_DIVERGENCE_UNDETECTED" | "LINEAGE_INCOMPLETE" | "AUDIT_MUTABLE" | "GOVERNANCE_NOT_ENFORCED" | "ADVISORY_BOUNDARY_BREACH" | "TENANT_ISOLATION_BREACH" | "EXECUTION_INTEGRITY_FAILED" | "OBSERVABILITY_INCOMPLETE" | "CERTIFICATION_EVIDENCE_MUTABLE" | "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING";
export type SyntheticScenarioOrchestrationScenario = "BASELINE" | SyntheticScenarioFailure;

export type SyntheticScenarioOrchestrationInput = Readonly<{
  scenario?: SyntheticScenarioOrchestrationScenario;
  tenant_id?: string;
  owner?: string;
  scenario_seed?: string;
}>;

export type SyntheticScenarioContract = Readonly<{
  contract_version: "synthetic-scenario-orchestration/v14.4";
  data_generation_ref: string;
  lifecycle: readonly SyntheticScenarioLifecycleState[];
  supported_scenario_types: readonly SyntheticScenarioType[];
  deterministic_execution_required: boolean;
  deterministic_scheduling_required: boolean;
  replay_required: boolean;
  lineage_required: boolean;
  governance_required: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioRecord = Readonly<{
  scenario_id: string;
  scenario_name: string;
  tenant_id: string;
  scenario_type: SyntheticScenarioType;
  environment_ref: string;
  dataset_refs: readonly string[];
  identity_refs: readonly string[];
  dependency_refs: readonly string[];
  execution_plan: readonly string[];
  governance_refs: readonly string[];
  owner: string;
  status: SyntheticScenarioLifecycleState;
  lineage_refs: readonly string[];
  origin_ref: string;
  integrity_hash: string;
}>;

export type SyntheticScenarioComposition = Readonly<{
  composition_id: string;
  component_refs: readonly string[];
  dependency_graph: readonly string[];
  ownership_validated: boolean;
  integrity_validated: boolean;
  tenant_isolation_preserved: boolean;
  deterministic_ordering_preserved: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioSchedule = Readonly<{
  schedule_id: string;
  scheduling_graph: readonly string[];
  execution_queue: readonly string[];
  prerequisites_respected: boolean;
  parallel_eligibility_deterministic: boolean;
  dependency_readiness_validated: boolean;
  replay_ordering_preserved: boolean;
  nondeterministic_inputs_rejected: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioExecutionReport = Readonly<{
  execution_id: string;
  scenario_results: readonly Readonly<{ scenario_id: string; scenario_type: SyntheticScenarioType; result: "COMPLETED" | "FAILED"; output_ref: string; integrity_hash: string }>[];
  nominal_executed: boolean;
  edge_case_executed: boolean;
  adversarial_executed: boolean;
  failure_executed: boolean;
  recovery_executed: boolean;
  deterministic: boolean;
  immutable_results: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioReplayReport = Readonly<{
  replay_id: string;
  execution_order_reproduced: boolean;
  environment_state_reproduced: boolean;
  identities_reproduced: boolean;
  datasets_reproduced: boolean;
  scheduling_decisions_reproduced: boolean;
  execution_outputs_reproduced: boolean;
  divergence_categories: readonly SyntheticScenarioDivergenceCategory[];
  divergence_detected: boolean;
  replay_evidence_immutable: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioLineageAudit = Readonly<{
  lineage_id: string;
  creation_tracked: boolean;
  composition_tracked: boolean;
  scheduling_tracked: boolean;
  execution_tracked: boolean;
  replay_tracked: boolean;
  recovery_tracked: boolean;
  supersession_tracked: boolean;
  audit_entries: readonly string[];
  immutable: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioGovernanceValidation = Readonly<{
  governance_validation_id: string;
  constitutional_compliance: boolean;
  governance_approval: boolean;
  authority_boundaries_validated: boolean;
  advisory_only_constraints: boolean;
  tenant_isolation: boolean;
  execution_integrity: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioObservability = Readonly<{
  observability_id: string;
  scenario_throughput_monitored: boolean;
  scheduling_latency_monitored: boolean;
  dependency_bottlenecks_monitored: boolean;
  replay_success_monitored: boolean;
  divergence_detection_monitored: boolean;
  failure_rates_monitored: boolean;
  recovery_success_monitored: boolean;
  governance_violations_monitored: boolean;
  tenant_isolation_violations_monitored: boolean;
  alerts_configured: boolean;
  integrity_hash: string;
}>;

export type SyntheticScenarioCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: SyntheticScenarioOutcome;
  passed: boolean;
  failure_reason: SyntheticScenarioFailure | null;
  integrity_hash: string;
}>;

export type SyntheticScenarioOrchestrationResult = Readonly<{
  phase_version: "synthetic-scenario-orchestration/v14.4";
  phase_identifier: "SyntheticScenarioOrchestration";
  data_generation_ref: string;
  contract: SyntheticScenarioContract;
  registry: readonly SyntheticScenarioRecord[];
  composition: SyntheticScenarioComposition;
  schedule: SyntheticScenarioSchedule;
  execution: SyntheticScenarioExecutionReport;
  replay: SyntheticScenarioReplayReport;
  lineage_audit: SyntheticScenarioLineageAudit;
  governance: SyntheticScenarioGovernanceValidation;
  observability: SyntheticScenarioObservability;
  certification_tests: readonly SyntheticScenarioCertificationTest[];
  failures: readonly SyntheticScenarioFailure[];
  outcome: SyntheticScenarioOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SyntheticScenarioOrchestrationValidation = Readonly<{
  valid: boolean;
  outcome: SyntheticScenarioOutcome;
  contract_valid: boolean;
  registry_valid: boolean;
  composition_valid: boolean;
  schedule_valid: boolean;
  execution_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  governance_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly SyntheticScenarioFailure[];
  integrity_hash: string;
}>;

export type SyntheticScenarioOrchestrationBundle = Readonly<{
  doctrine: Readonly<{
    version: "synthetic-scenario-orchestration/v14.4";
    data_generation_phase: "synthetic-identity-data-generation/v14.3";
    certification_outcomes: readonly SyntheticScenarioOutcome[];
    supported_scenario_types: readonly SyntheticScenarioType[];
    replay_divergence_categories: readonly SyntheticScenarioDivergenceCategory[];
  }>;
  result: SyntheticScenarioOrchestrationResult;
  validation: SyntheticScenarioOrchestrationValidation;
}>;
