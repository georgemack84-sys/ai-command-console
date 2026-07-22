export type ObservationCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ObservationLifecycleState = "REGISTERED" | "WINDOW_OPEN" | "COLLECTING" | "QUALIFIED" | "READY_FOR_EVALUATION" | "EVALUATED" | "COMPLETE" | "ARCHIVED";
export type ObservationWindowState = "SCHEDULED" | "OPEN" | "COLLECTING" | "READY_TO_CLOSE" | "CLOSED" | "ARCHIVED";
export type ObservationQualificationStatus = "QUALIFIED" | "PARTIALLY_QUALIFIED" | "INSUFFICIENT_EVIDENCE" | "INVALID" | "REQUIRES_REVIEW";
export type ObservationClosureOutcome = "COMPLETED" | "COMPLETED_WITH_LIMITATIONS" | "INCOMPLETE" | "FAILED" | "SUPERSEDED";
export type EffectivenessOutcome = "EXCEEDED_EXPECTATIONS" | "MET_EXPECTATIONS" | "PARTIALLY_MET" | "UNDERPERFORMED" | "FAILED" | "NOT_EVALUABLE";
export type ObservationFailure =
  | "OBSERVATION_CONTRACT_INVALID"
  | "OBSERVATION_IDENTITY_NONDETERMINISTIC"
  | "WINDOW_MISSING"
  | "WINDOW_REOPENED"
  | "WINDOW_OVERLAP"
  | "WINDOW_TIMING_MUTABLE"
  | "EVIDENCE_COLLECTION_INCOMPLETE"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "RECOMMENDATION_MUTATED"
  | "QUALIFICATION_FAILED"
  | "DUPLICATE_EVIDENCE"
  | "TEMPORAL_VALIDITY_FAILED"
  | "SOURCE_AUTHENTICITY_FAILED"
  | "CLOSURE_NONDETERMINISTIC"
  | "EVALUATION_INCOMPLETE"
  | "EFFECTIVENESS_NONDETERMINISTIC"
  | "LATE_EVIDENCE_MUTATED_HISTORY"
  | "MISSING_EVIDENCE_UNRECORDED"
  | "REPLAY_MISMATCH"
  | "POLICY_BINDING_INVALID"
  | "GOVERNANCE_FAILURE"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "LEDGER_NOT_APPEND_ONLY"
  | "OBSERVABILITY_MISSING";
export type ObservationScenario = "BASELINE" | ObservationFailure;
export type ObservationInput = Readonly<{ scenario?: ObservationScenario; tenant_id?: string; recommendation_id?: string }>;

export type OutcomeObservationArtifact = Readonly<{ observation_id: string; recommendation_id: string; recommendation_cycle_id: string; strategy_ref: string | null; portfolio_ref: string | null; observation_window_id: string; observation_scope: string; observation_type: string; expected_outcomes_ref: string; forecast_refs: readonly string[]; baseline_ref: string; comparison_refs: readonly string[]; observed_metrics: Readonly<Record<string, number>>; observed_outcomes: readonly string[]; evidence_refs: readonly string[]; observation_status: ObservationLifecycleState; qualification_status: ObservationQualificationStatus; confidence: number; uncertainty: number; evaluation_result: EffectivenessOutcome; effectiveness_score: number; variance_summary: string; observation_start: string; observation_end: string; closure_reason: string; origin_ref: string; policy_manifest_ref: string; created_at: string; closed_at: string | null; tenant_id: string; advisory_only: boolean; integrity_hash: string }>;
export type ObservationWindow = Readonly<{ window_id: string; opening_conditions: readonly string[]; activation_time: string; observation_duration_days: number; collection_period_days: number; evaluation_period_days: number; closure_criteria: readonly string[]; grace_period_days: number; late_evidence_policy: string; expiration_behavior: string; state: ObservationWindowState; opened_once: boolean; closed_once: boolean; overlaps_existing_window: boolean; immutable_timing: boolean; integrity_hash: string }>;
export type ObservationEvidenceSet = Readonly<{ evidence_set_id: string; evidence_refs: readonly string[]; evidence_timeline: readonly string[]; collection_sources: readonly string[]; append_only: boolean; recommendation_immutable: boolean; integrity_valid: boolean; duplicate_evidence_refs: readonly string[]; integrity_hash: string }>;
export type ObservationQualificationReport = Readonly<{ report_id: string; status: ObservationQualificationStatus; evidence_completeness: number; evidence_integrity: boolean; policy_compliant: boolean; governance_approved: boolean; temporal_valid: boolean; source_authentic: boolean; duplicates_absent: boolean; replay_eligible: boolean; confidence: number; uncertainty: number; integrity_hash: string }>;
export type ObservationClosureRecord = Readonly<{ closure_id: string; outcome: ObservationClosureOutcome; window_complete: boolean; collection_finalized: boolean; qualification_complete: boolean; evaluation_complete_or_impossible: boolean; outstanding_evidence_disposition: string; governance_satisfied: boolean; immutable: boolean; integrity_hash: string }>;
export type EffectivenessEvaluationReport = Readonly<{ report_id: string; expected_benefits_achieved: number; realized_risks: number; forecast_accuracy: number; baseline_improvement: number; portfolio_contribution: number; resource_efficiency: number; governance_impact: number; operator_burden: number; effectiveness_score: number; outcome: EffectivenessOutcome; variance_analysis: readonly string[]; reproducible: boolean; integrity_hash: string }>;
export type MissingLateEvidenceReport = Readonly<{ report_id: string; missing_evidence_refs: readonly string[]; late_evidence_refs: readonly string[]; supplemental_observation_refs: readonly string[]; historical_evaluation_mutated: boolean; arrival_chronology_preserved: boolean; integrity_hash: string }>;
export type ObservationReplayReport = Readonly<{ report_id: string; window_restored: boolean; evidence_timeline_restored: boolean; qualification_restored: boolean; policy_binding_restored: boolean; evaluation_restored: boolean; closure_restored: boolean; late_evidence_restored: boolean; outcome: "MATCH" | "FAILURE"; integrity_hash: string }>;
export type ObservationLedger = Readonly<{ ledger_id: string; append_only: boolean; immutable: boolean; entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[]; integrity_hash: string }>;
export type ObservationObservabilityReport = Readonly<{ report_id: string; observation_latency_ms: number; evidence_count: number; qualification_rate: number; replay_success: number; effectiveness_score: number; late_evidence_count: number; governance_failures: number; observable: boolean; integrity_hash: string }>;
export type ObservationCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: ObservationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ObservationCertification = Readonly<{ certification_id: string; status: ObservationCertificationStatus; organizational_intelligence_ready: boolean; failures: readonly ObservationFailure[]; tests: readonly ObservationCertificationTest[]; integrity_hash: string }>;

export type OutcomeObservationResult = Readonly<{ phase_version: "outcome-observation-evaluation/v12.10"; phase_identifier: "OutcomeObservationEvaluation"; observation: OutcomeObservationArtifact; window: ObservationWindow; evidence: ObservationEvidenceSet; qualification: ObservationQualificationReport; closure: ObservationClosureRecord; evaluation: EffectivenessEvaluationReport; missing_late_evidence: MissingLateEvidenceReport; replay: ObservationReplayReport; ledger: ObservationLedger; observability: ObservationObservabilityReport; certification: ObservationCertification; replay_hash: string; integrity_hash: string }>;
export type OutcomeObservationValidation = Readonly<{ observation_id: string | null; valid: boolean; status: ObservationCertificationStatus; organizational_intelligence_ready: boolean; failures: readonly ObservationFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; window_valid: boolean; evaluation_valid: boolean; validation_hash: string }>;
export type OutcomeObservationContractBundle = Readonly<{ doctrine: Readonly<{ version: "outcome-observation-evaluation/v12.10"; recommendation_history_immutable: true; observation_windows_policy_bound: true; qualified_evidence_required: true; late_evidence_append_only: true; replay_required: true; advisory_only: true }>; result: OutcomeObservationResult; validation: OutcomeObservationValidation }>;
