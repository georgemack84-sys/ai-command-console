export type ProductionReplayOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReplayLifecycleState = "REPLAY_REQUESTED" | "PRODUCTION_CAPTURED" | "DIGITAL_TWIN_INITIALIZED" | "REPLAY_EXECUTED" | "COMPARISON_COMPLETE" | "DIVERGENCE_CLASSIFIED" | "QUALIFICATION_EVALUATED" | "RECORDED";
export type ReplayComparisonResult = "IDENTICAL" | "EXPLAINED_DIFFERENCE" | "UNEXPECTED_DIFFERENCE" | "REPLAY_INCOMPLETE";
export type ReplayDivergenceCategory = "INPUT_DIVERGENCE" | "CONFIGURATION_DIVERGENCE" | "DEPENDENCY_DIVERGENCE" | "POLICY_DIVERGENCE" | "MODEL_DIVERGENCE" | "ORDERING_DIVERGENCE" | "OUTPUT_DIVERGENCE" | "UNEXPLAINED_DIVERGENCE";
export type ReplayDivergenceSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ReplayQualificationAction = "NO_ACTION" | "MONITOR" | "REQUIRE_REPLAY" | "REQUIRE_REQUALIFICATION" | "REQUIRE_GOVERNANCE_REVIEW" | "CONTAINMENT_REQUIRED";
export type ReplayQualificationOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "REQUALIFICATION_REQUIRED" | "GOVERNANCE_REVIEW_REQUIRED" | "CONTAINMENT_REQUIRED" | "FAIL";
export type ProductionReplayFailure = "PRODUCTION_DECISIONS_NOT_REPLAYABLE" | "DIGITAL_TWIN_NOT_SYNCHRONIZED" | "COMPARISON_NON_DETERMINISTIC" | "DIVERGENCE_NOT_CLASSIFIED" | "QUALIFICATION_NOT_REPRODUCIBLE" | "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED" | "CONTAINMENT_NOT_DETERMINISTIC" | "REPLAY_EVIDENCE_MUTABLE" | "LINEAGE_INCOMPLETE" | "TENANT_ISOLATION_NOT_PRESERVED" | "GOVERNANCE_AUTHORITY_NOT_MAINTAINED" | "REPLAY_NOT_ADVISORY_ONLY" | "PRODUCTION_INPUT_NOT_REPRODUCED" | "CONFIGURATION_NOT_REPLAYED" | "DEPENDENCY_NOT_REPLAYED" | "POLICY_NOT_REPLAYED" | "MODEL_NOT_REPLAYED" | "EXECUTION_ORDERING_NOT_REPRODUCED" | "OUTPUT_COMPARISON_FAILED" | "NON_CONSTITUTIONAL_REPLAY_WARNING";
export type ProductionReplayScenario = "BASELINE" | ProductionReplayFailure;

export type ProductionReplayInput = Readonly<{ scenario?: ProductionReplayScenario; tenant_id?: string }>;

export type ProductionReplayContract = Readonly<{
  contract_version: "production-replay-digital-twin-validation/v15.8";
  lifecycle: readonly ReplayLifecycleState[];
  advisory_only: boolean;
  replay_never_modifies_production: boolean;
  deterministic_replay_required: boolean;
  fail_closed_qualification: boolean;
  tenant_isolation_required: boolean;
  governance_first_validation: boolean;
  integrity_hash: string;
}>;

export type ProductionDigitalTwin = Readonly<{
  twin_id: string;
  certified_configuration: boolean;
  dependency_versions_aligned: boolean;
  policy_versions_aligned: boolean;
  execution_state_reproducible: boolean;
  environmental_characteristics_reproducible: boolean;
  synchronized: boolean;
  isolated_from_production: boolean;
  no_production_side_effects: boolean;
  integrity_hash: string;
}>;

export type ProductionReplayRecord = Readonly<{
  replay_id: string;
  replay_version: "15.8.0";
  tenant_id: string;
  production_session_id: string;
  certification_reference: string;
  environment_reference: string;
  replay_start_time: string;
  replay_end_time: string;
  replay_duration: number;
  replay_engine_version: "production-replay-engine/15.8";
  digital_twin_reference: string;
  production_input_reference: string;
  production_output_reference: string;
  configuration_reference: string;
  dependency_reference: string;
  policy_reference: string;
  replay_result: "REPRODUCED" | "DIVERGED" | "INCOMPLETE";
  comparison_result: ReplayComparisonResult;
  divergence_detected: boolean;
  divergence_category: ReplayDivergenceCategory | null;
  divergence_severity: ReplayDivergenceSeverity;
  divergence_summary: string;
  qualification_outcome: ReplayQualificationOutcome;
  containment_required: boolean;
  governance_review_required: boolean;
  replay_status: "COMPLETED" | "FAILED";
  replay_evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  audit_refs: readonly string[];
  integrity_hash: string;
}>;

export type LiveToReplayComparison = Readonly<{
  comparison_id: string;
  inputs_reproduced: boolean;
  execution_ordering_reproduced: boolean;
  dependencies_replayed: boolean;
  policies_replayed: boolean;
  outputs_compared: boolean;
  timing_compared: boolean;
  evidence_lineage_linked: boolean;
  deterministic: boolean;
  result: ReplayComparisonResult;
  integrity_hash: string;
}>;

export type DivergenceClassificationRecord = Readonly<{
  classification_id: string;
  categories_evaluated: readonly ReplayDivergenceCategory[];
  severity: ReplayDivergenceSeverity;
  every_divergence_classified: boolean;
  root_cause_traceable: boolean;
  qualification_action: ReplayQualificationAction;
  unexplained_divergence_ignored: false;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ReplayQualificationAssessment = Readonly<{
  assessment_id: string;
  replay_success: boolean;
  certification_consistency: boolean;
  policy_compliance: boolean;
  dependency_alignment: boolean;
  configuration_integrity: boolean;
  deterministic_behavior: boolean;
  outcome: ReplayQualificationOutcome;
  containment_deterministic: boolean;
  governance_enforced: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type ProductionReplayLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "REPLAY_EXECUTION" | "REPLAY_EVIDENCE" | "DIVERGENCE_CLASSIFICATION" | "QUALIFICATION_OUTCOME" | "CONTAINMENT_ACTION" | "CERTIFICATION_REFERENCE";
  sequence: number;
  replay_id: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  tenant_isolated: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type ProductionReplayCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionReplayOutcome;
  passed: boolean;
  failure_reason: ProductionReplayFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionReplayDigitalTwinResult = Readonly<{
  phase_version: "production-replay-digital-twin-validation/v15.8";
  phase_identifier: "ProductionReplayDigitalTwinValidation";
  live_tenant_isolation_ref: string;
  contract: ProductionReplayContract;
  digital_twin: ProductionDigitalTwin;
  replay_record: ProductionReplayRecord;
  comparison: LiveToReplayComparison;
  divergence: DivergenceClassificationRecord;
  qualification: ReplayQualificationAssessment;
  ledger: readonly ProductionReplayLedgerEntry[];
  certification_tests: readonly ProductionReplayCertificationTest[];
  failures: readonly ProductionReplayFailure[];
  outcome: ProductionReplayOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionReplayDigitalTwinValidation = Readonly<{
  valid: boolean;
  outcome: ProductionReplayOutcome;
  contract_valid: boolean;
  twin_valid: boolean;
  replay_record_valid: boolean;
  comparison_valid: boolean;
  divergence_valid: boolean;
  qualification_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ProductionReplayFailure[];
  integrity_hash: string;
}>;

export type ProductionReplayDigitalTwinBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-replay-digital-twin-validation/v15.8";
    upstream_phase: "live-tenant-isolation-qualification/v15.7";
    lifecycle: readonly ReplayLifecycleState[];
    comparison_results: readonly ReplayComparisonResult[];
    divergence_categories: readonly ReplayDivergenceCategory[];
    qualification_outcomes: readonly ReplayQualificationOutcome[];
    certification_outcomes: readonly ProductionReplayOutcome[];
  }>;
  result: ProductionReplayDigitalTwinResult;
  validation: ProductionReplayDigitalTwinValidation;
}>;
