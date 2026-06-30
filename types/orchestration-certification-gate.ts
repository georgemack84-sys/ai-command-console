export type OrchestrationCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type OrchestrationCertificationLifecycleState =
  | "REQUESTED"
  | "LOADING_EXECUTION_EVIDENCE"
  | "VALIDATING_COMPONENTS"
  | "RUNNING_CERTIFICATION_TESTS"
  | "VERIFYING_REPLAY"
  | "VERIFYING_GOVERNANCE"
  | "VERIFYING_INTEGRITY"
  | "CALCULATING_RESULT"
  | "CERTIFIED"
  | "CONDITIONAL_CERTIFICATION"
  | "BLOCKED";

export type OrchestrationCertificationArea =
  | "EXECUTION_CONTRACT"
  | "WORKFLOW_ORCHESTRATOR"
  | "TASK_SEQUENCING"
  | "DEPENDENCY_SCHEDULER"
  | "EXECUTION_MONITOR"
  | "CHECKPOINT_MANAGER"
  | "ROLLBACK_PREPARATION"
  | "DETERMINISM"
  | "REPLAY"
  | "GOVERNANCE"
  | "AUTHORITY"
  | "INTEGRITY"
  | "ISOLATION"
  | "OPERATOR_VISIBILITY"
  | "CERTIFICATION_SUITE";

export type OrchestrationCertificationFailure =
  | "EXECUTION_CONTRACT_INVALID"
  | "WORKFLOW_IDENTITY_NOT_UNIQUE"
  | "ORCHESTRATION_NONDETERMINISTIC"
  | "WORKFLOW_NOT_REPRODUCIBLE"
  | "TASK_SEQUENCING_NONDETERMINISTIC"
  | "DEPENDENCY_GRAPH_NONREPRODUCIBLE"
  | "DEPENDENCY_VIOLATIONS_NOT_DETECTED"
  | "CIRCULAR_DEPENDENCY_NOT_REJECTED"
  | "WORKFLOW_STATE_NONDETERMINISTIC"
  | "CHECKPOINTS_NOT_REPRODUCIBLE"
  | "CHECKPOINT_INTEGRITY_NOT_VERIFIED"
  | "ROLLBACK_PLAN_NOT_GENERATED"
  | "ROLLBACK_NOT_REPRODUCIBLE"
  | "ROLLBACK_BOUNDARIES_NOT_PRESERVED"
  | "EXECUTION_MONITORING_NOT_OPERATIONAL"
  | "EXECUTION_DRIFT_NOT_DETECTED"
  | "WORKFLOW_LINEAGE_INCOMPLETE"
  | "ORCHESTRATION_REPLAY_MISMATCH"
  | "GOVERNANCE_REFERENCES_NOT_PRESERVED"
  | "AUTHORITY_VALIDATION_NOT_ENFORCED"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED"
  | "OPERATOR_INTERVENTION_NOT_SUPPORTED"
  | "EXECUTION_PAUSE_FAILED"
  | "EXECUTION_RESUME_NONDETERMINISTIC"
  | "UNAUTHORIZED_EXECUTION_NOT_REJECTED"
  | "GOVERNANCE_BYPASS_NOT_PREVENTED"
  | "AUTHORITY_ESCALATION_NOT_REJECTED"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "HIDDEN_ORCHESTRATION_STATE_NOT_PROHIBITED"
  | "INTEGRITY_HASHES_NOT_REPRODUCIBLE"
  | "CERTIFICATION_SUITE_NOT_PASSING"
  | "REPORTING_COMPLETENESS_GAP";

export type OrchestrationCertificationScenario =
  | "BASELINE"
  | "REPORTING_COMPLETENESS_GAP"
  | OrchestrationCertificationFailure;

export type OrchestrationCertificationComponent =
  | "8C.1_EXECUTION_CONTRACT"
  | "8C.2_WORKFLOW_ORCHESTRATOR"
  | "8C.3_TASK_SEQUENCING"
  | "8C.4_DEPENDENCY_SCHEDULER"
  | "8C.5_EXECUTION_MONITOR"
  | "8C.6_CHECKPOINT_MANAGER"
  | "8C.7_ROLLBACK_PREPARATION";

export type OrchestrationComponentSummary = Readonly<{
  component: OrchestrationCertificationComponent;
  artifact_reference: string;
  validation_reference: string;
  replay_reference: string;
  integrity_reference: string;
  certification_state: OrchestrationCertificationState;
  ready_for_next_phase: boolean;
  summary_hash: string;
}>;

export type OrchestrationCertificationCheck = Readonly<{
  certification_check_id: string;
  area: OrchestrationCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: OrchestrationCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  reasoning: string;
  check_hash: string;
}>;

export type OrchestrationCertificationResult = Readonly<{
  certification_result_id: string;
  overall_state: OrchestrationCertificationState;
  pass_count: number;
  fail_count: number;
  critical_failure_count: number;
  warning_count: number;
  blocking_failures: readonly OrchestrationCertificationFailure[];
  remediation_guidance: readonly string[];
  production_decision: "CERTIFIED_FOR_CONTROLLED_AUTONOMY" | "LIMITED_REMEDIATION_REQUIRED" | "BLOCKED_FROM_HIGHER_AUTONOMY";
  result_hash: string;
}>;

export type OrchestrationCertificationEvidence = Readonly<{
  certification_id: string;
  phase: "8C";
  execution_reference: string;
  workflow_reference: string;
  orchestration_reference: string;
  dependency_reference: string;
  monitor_reference: string;
  checkpoint_reference: string;
  rollback_reference: string;
  governance_reference: string;
  authority_reference: string;
  replay_reference: string;
  integrity_reference: string;
  certification_timestamp: string;
  certification_hash: string;
}>;

export type OrchestrationCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  certification_decision: OrchestrationCertificationState;
  evidence_hash: string;
  check_hashes: readonly string[];
  replay_references: readonly string[];
  integrity_hashes: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type ExecutionAssuranceReport = Readonly<{
  assurance_report_id: string;
  orchestration_quality: OrchestrationCertificationState;
  workflow_health: OrchestrationCertificationState;
  dependency_health: OrchestrationCertificationState;
  governance_compliance: OrchestrationCertificationState;
  replay_fidelity: OrchestrationCertificationState;
  tenant_isolation: OrchestrationCertificationState;
  assurance_hash: string;
}>;

export type ProductionReadinessAssessment = Readonly<{
  readiness_assessment_id: string;
  operational_readiness: OrchestrationCertificationState;
  governance_readiness: OrchestrationCertificationState;
  replay_readiness: OrchestrationCertificationState;
  certification_maturity: OrchestrationCertificationState;
  deployment_allowed: boolean;
  controlled_autonomy_support_allowed: boolean;
  readiness_hash: string;
}>;

export type OrchestrationCertificationTimelineEvent = Readonly<{
  event_id: string;
  stage: "INITIALIZE_CERTIFICATION" | "LOAD_EXECUTION_EVIDENCE" | "VALIDATE_COMPONENTS" | "RUN_CERTIFICATION_TESTS" | "VERIFY_REPLAY" | "VERIFY_GOVERNANCE" | "VERIFY_INTEGRITY" | "CALCULATE_CERTIFICATION_RESULT";
  timestamp: string;
  state: OrchestrationCertificationLifecycleState;
  summary: string;
  event_hash: string;
}>;

export type OrchestrationCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "8C.8";
  schema_version: "orchestration-certification-gate/v8C.8";
  generated_at: string;
  coordination_service_only: true;
  read_only: true;
  advisory_only: true;
  governance_subordinate: true;
  autonomous_execution_authority: false;
  production_deployment_allowed: boolean;
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  integrity_protected: boolean;
  tenant_isolated: boolean;
  operator_visible: boolean;
  component_summaries: readonly OrchestrationComponentSummary[];
  certification_checks: readonly OrchestrationCertificationCheck[];
  certification_result: OrchestrationCertificationResult;
  certification_evidence: OrchestrationCertificationEvidence;
  execution_assurance_report: ExecutionAssuranceReport;
  production_readiness_assessment: ProductionReadinessAssessment;
  certification_ledger_entry: OrchestrationCertificationLedgerEntry;
  timeline: readonly OrchestrationCertificationTimelineEvent[];
  observability: Readonly<{
    certification_duration_ms: number;
    certification_test_count: number;
    pass_rate: number;
    critical_failure_rate: number;
    component_pass_rate: number;
    replay_reference_count: number;
    integrity_reference_count: number;
  }>;
  report_hash: string;
}>;

export type OrchestrationCertificationGateInput = Readonly<{
  scenario?: OrchestrationCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
  validator_id?: string;
}>;

export type OrchestrationCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  overall_state: OrchestrationCertificationState;
  lifecycle_state: OrchestrationCertificationLifecycleState;
  certification_test_count: number;
  critical_failure_count: number;
  production_decision: OrchestrationCertificationResult["production_decision"];
  production_deployment_allowed: boolean;
  report_hash: string;
}>;
