import type { MultiDomainImpactResult } from "@/types/multi-domain-impact-simulation-engine";

export type ReplayDivergenceOutcome = "PASS" | "NON_PASSING";

export type ReplayDivergenceComparisonScope =
  | "REPLAY_INPUTS"
  | "REPLAY_POLICIES"
  | "REPLAY_MODELS"
  | "REPLAY_EXECUTION_ORDERING"
  | "REPLAY_OUTPUTS"
  | "REPLAY_EVIDENCE";

export type ReplayDivergenceCategory =
  | "INPUT_DIVERGENCE"
  | "POLICY_DIVERGENCE"
  | "MODEL_DIVERGENCE"
  | "ORDERING_DIVERGENCE"
  | "OUTPUT_DIVERGENCE"
  | "UNEXPLAINED_DIVERGENCE";

export type ReplayDivergenceType = ReplayDivergenceCategory;

export type ReplayDivergenceStatus = "EXPLAINED" | "UNEXPLAINED" | "ENFORCED";

export type ReplayDivergenceSeverity = "INFORMATIONAL" | "CRITICAL";

export type ReplayDivergenceFailure =
  | "INPUT_DIVERGENCE_UNEXPLAINED"
  | "POLICY_DIVERGENCE_UNEXPLAINED"
  | "MODEL_DIVERGENCE_UNEXPLAINED"
  | "ORDERING_DIVERGENCE_UNEXPLAINED"
  | "OUTPUT_DIVERGENCE_UNEXPLAINED"
  | "UNEXPLAINED_REPLAY_DIVERGENCE"
  | "EVIDENCE_REGISTRY_INCOMPLETE"
  | "REPLAY_NONDETERMINISTIC"
  | "LEDGER_INTEGRITY_FAILURE";

export type ReplayDivergenceScenario =
  | "BASELINE"
  | "INPUT_DIVERGENCE"
  | "POLICY_DIVERGENCE"
  | "MODEL_DIVERGENCE"
  | "ORDERING_DIVERGENCE"
  | "OUTPUT_DIVERGENCE"
  | "UNEXPLAINED_DIVERGENCE"
  | "EVIDENCE_REGISTRY_INCOMPLETE"
  | "REPLAY_NONDETERMINISTIC"
  | "LEDGER_INTEGRITY_FAILURE";

export type ReplayDivergenceContract = Readonly<{
  contract_id: "mission-control-replay-divergence-contract";
  contract_version: "13.6.1";
  replay_contract_versioned: true;
  identity_deterministic: true;
  vocabulary_immutable: true;
  closed_classification_vocabulary: readonly ReplayDivergenceCategory[];
  integrity_requirements: readonly string[];
  lifecycle: readonly ReplayDivergenceStatus[];
  integrity_hash: string;
}>;

export type DivergenceComparison = Readonly<{
  scope: ReplayDivergenceComparisonScope;
  compared_fields: readonly string[];
  validation_requirements: readonly string[];
  divergence_detected: boolean;
  divergence_category: ReplayDivergenceCategory;
  divergence_type: ReplayDivergenceType;
  deterministic: boolean;
  explainable: boolean;
  failures: readonly ReplayDivergenceFailure[];
  original_state_hash: string;
  replay_state_hash: string;
  integrity_hash: string;
}>;

export type ReplayDivergenceEvidenceRecord = Readonly<{
  evidence_record_id: string;
  replay_divergence_id: string;
  original_execution_refs: readonly string[];
  replay_refs: readonly string[];
  comparison_evidence_refs: readonly string[];
  explanation_refs: readonly string[];
  policy_references: readonly string[];
  model_references: readonly string[];
  ordering_references: readonly string[];
  certification_references: readonly string[];
  evidence_hashes: readonly string[];
  lineage_complete: boolean;
  immutable: true;
  integrity_hash: string;
}>;

export type ReplayDivergenceRecord = Readonly<{
  replay_divergence_id: string;
  divergence_id: string;
  assessment_id: string;
  certification_id: string;
  replay_session_id: string;
  assurance_engine_ref: string;
  evaluation_stage: ReplayDivergenceComparisonScope;
  divergence_category: ReplayDivergenceCategory;
  divergence_type: ReplayDivergenceType;
  divergence_status: ReplayDivergenceStatus;
  expected_state: string;
  observed_state: string;
  affected_artifacts: readonly string[];
  affected_evidence_refs: readonly string[];
  policy_manifest_ref: string;
  model_version_ref: string;
  ordering_manifest_ref: string;
  explanation: string;
  constitutional_impact: string;
  certification_impact: ReplayDivergenceOutcome;
  detected_timestamp: string;
  origin_ref: string;
  integrity_hash: string;
  proposal_id: string;
  tenant_id: string;
  baseline_replay_reference: string;
  adapted_replay_reference: string;
  cause: string;
  source_proposal: string;
  affected_subsystem: readonly string[];
  replay_location: string;
  governance_impact: string;
  confidence_impact: string;
  recommendation_impact: string;
  operator_impact: string;
  severity: ReplayDivergenceSeverity;
  certification_effect: ReplayDivergenceOutcome;
}>;

export type ReplayDivergenceValidation = Readonly<{
  validation_id: string;
  replay_determinism_valid: boolean;
  evidence_equivalence_valid: boolean;
  policy_equivalence_valid: boolean;
  model_equivalence_valid: boolean;
  ordering_equivalence_valid: boolean;
  output_equivalence_valid: boolean;
  explanation_complete: boolean;
  constitutional_compliance_valid: boolean;
  every_divergence_evaluated: boolean;
  replay_validation_ignored_no_divergence: false;
  constitutionally_valid: boolean;
  certification_outcome: ReplayDivergenceOutcome;
  failures: readonly ReplayDivergenceFailure[];
  integrity_hash: string;
}>;

export type ReplayDivergenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  replay_divergence_id: string;
  tenant_id: string;
  classification: ReplayDivergenceCategory;
  supporting_evidence_refs: readonly string[];
  explanation: string;
  constitutional_assessment: string;
  validation_outcome: ReplayDivergenceOutcome;
  certification_outcome: ReplayDivergenceOutcome;
  event_timestamp: string;
  lineage_refs: readonly string[];
  sequence_number: number;
  append_only: true;
  immutable: true;
  replayable: true;
  integrity_hash: string;
}>;

export type ReplayDivergenceReplayService = Readonly<{
  replay_service_id: string;
  reconstructed_original_execution: string;
  reconstructed_replay_execution: string;
  reconstructed_replay_ordering: string;
  reconstructed_policy_versions: readonly string[];
  reconstructed_model_versions: readonly string[];
  reconstructed_evidence_refs: readonly string[];
  reproduced_divergence_ids: readonly string[];
  reproduced_classifications: readonly ReplayDivergenceCategory[];
  reproduced_validation_decision: ReplayDivergenceOutcome;
  reproduced_certification_behavior: ReplayDivergenceOutcome;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ReplayDivergenceMetrics = Readonly<{
  comparison_scopes_evaluated: number;
  divergences_detected: number;
  divergence_records_generated: number;
  input_divergences: number;
  policy_divergences: number;
  model_divergences: number;
  ordering_divergences: number;
  output_divergences: number;
  unexplained_divergences: number;
  explainability_rate: number;
  deterministic_analysis_rate: number;
  certification_blocking_failures: readonly ReplayDivergenceFailure[];
  integrity_hash: string;
}>;

export type ReplayDivergenceApiSurface = Readonly<{
  api_id: string;
  detect_divergence: "POST /replay-divergence-detection-engine/detect";
  retrieve_comparisons: "POST /replay-divergence-detection-engine/comparisons";
  retrieve_records: "POST /replay-divergence-detection-engine/records";
  retrieve_metrics: "POST /replay-divergence-detection-engine/metrics";
  replay_detection: "POST /replay-divergence-detection-engine/replay";
  inspect_engine: "POST /replay-divergence-detection-engine/inspect";
  retrieve_contract: "GET /replay-divergence-detection-engine/contract";
  hidden_behavior_supported: false;
  unexplained_divergence_supported: false;
  nondeterministic_divergence_supported: false;
  governance_regression_supported: false;
  advisory_only: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ReplayDivergenceInput = Readonly<{
  scenario?: ReplayDivergenceScenario;
  proposal_id?: string;
  tenant_id?: string;
  assessment_id?: string;
  certification_id?: string;
  replay_session_id?: string;
  multi_domain_impact?: MultiDomainImpactResult;
}>;

export type ReplayDivergenceResult = Readonly<{
  replay_divergence_detection_engine_version: "replay-divergence-detection-engine/v2";
  engine_identifier: "ReplayDivergenceDetectionEngine";
  contract: ReplayDivergenceContract;
  api_surface: ReplayDivergenceApiSurface;
  multi_domain_impact: MultiDomainImpactResult;
  comparison_scopes: readonly ReplayDivergenceComparisonScope[];
  divergence_categories: readonly ReplayDivergenceCategory[];
  divergence_types: readonly ReplayDivergenceType[];
  comparisons: readonly DivergenceComparison[];
  records: readonly ReplayDivergenceRecord[];
  evidence_registry: readonly ReplayDivergenceEvidenceRecord[];
  replay_validation: ReplayDivergenceValidation;
  divergence_ledger: readonly ReplayDivergenceLedgerEntry[];
  replay_service: ReplayDivergenceReplayService;
  metrics: ReplayDivergenceMetrics;
  outcome: ReplayDivergenceOutcome;
  failures: readonly ReplayDivergenceFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  every_divergence_detected: boolean;
  every_divergence_classified: boolean;
  every_divergence_attributed: boolean;
  every_divergence_evaluated: boolean;
  unexplained_divergence_fail_closed: boolean;
  governance_safe: boolean;
  constitutional_safe: boolean;
  tenant_isolated: boolean;
  immutable_evidence_recorded: true;
  advisory_only: false;
  authorizes_certification: boolean;
  divergence_classification_report_hash: string;
  governance_divergence_report_hash: string;
  recommendation_divergence_report_hash: string;
  confidence_divergence_report_hash: string;
  risk_divergence_report_hash: string;
  operator_workflow_divergence_report_hash: string;
  rollback_divergence_report_hash: string;
  replay_integrity_report_hash: string;
  simulation_validation_ledger_entry_hash: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReplayDivergenceFoundation = Readonly<{
  replay_divergence_detection_engine_version: "replay-divergence-detection-engine/v2";
  contract: ReplayDivergenceContract;
  comparison_scopes: readonly ReplayDivergenceComparisonScope[];
  divergence_categories: readonly ReplayDivergenceCategory[];
  divergence_types: readonly ReplayDivergenceType[];
  api_surface: ReplayDivergenceApiSurface;
  result: ReplayDivergenceResult;
}>;
