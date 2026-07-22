export type ReplayValidationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "FAIL_CLOSED" | "REQUIRES_INVESTIGATION" | "REQUIRES_RECERTIFICATION";
export type ReplayCertificationStatus = "NOT_STARTED" | "REPLAYING" | "COMPARING" | "ANALYZING" | "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "FAILED" | "REQUIRES_REVIEW";
export type ReplayDivergenceType = "NONE" | "INPUT" | "POLICY" | "CONFIGURATION" | "SOFTWARE_VERSION" | "ENVIRONMENT" | "DATA" | "EVENT_ORDERING" | "TIMING" | "EXECUTION_PATH" | "OUTPUT" | "EVIDENCE" | "STATE" | "MODEL" | "NONDETERMINISTIC" | "UNKNOWN";
export type ReplayDivergenceSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL";
export type ReplayValidationFailure =
  | "P6_5_SIMULATION_INVALID"
  | "REPLAY_EXECUTION_ENGINE_MISSING"
  | "REPLAY_INPUT_RECONSTRUCTION_MISSING"
  | "DETERMINISTIC_REPLAY_VALIDATION_FAILED"
  | "REPLAY_COMPARISON_ENGINE_MISSING"
  | "DIVERGENCE_DETECTION_MISSING"
  | "DIVERGENCE_CLASSIFICATION_MISSING"
  | "ROOT_CAUSE_ANALYSIS_MISSING"
  | "REPLAY_EXPLAINABILITY_MISSING"
  | "REPLAY_CERTIFICATION_MISSING"
  | "REPLAY_EVIDENCE_REGISTRY_MISSING"
  | "REPLAY_INPUTS_INCOMPLETE"
  | "REPLAY_EVIDENCE_UNAVAILABLE"
  | "REPLAY_NOT_EXECUTABLE"
  | "REPLAY_OUTPUT_MISMATCH"
  | "REPLAY_DECISION_MISMATCH"
  | "REPLAY_ORDERING_MISMATCH"
  | "REPLAY_TIMESTAMP_MISMATCH"
  | "REPLAY_EVIDENCE_MISMATCH"
  | "COMPARISON_INCOMPLETE"
  | "EVIDENCE_MATCHING_INACCURATE"
  | "DIVERGENCE_ROOT_CAUSE_UNKNOWN"
  | "DIVERGENCE_SEVERITY_MISSING"
  | "REPLAY_CERTIFIED_BEFORE_VALIDATION"
  | "REPLAY_EVIDENCE_MUTATED"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "DOWNSTREAM_CONSUMPTION_NOT_READY"
  | "PLATFORM_REPLAY_INFRASTRUCTURE_OWNERSHIP_VIOLATION"
  | "BEHAVIORAL_REPLAY_OWNERSHIP_VIOLATION"
  | "TRUST_EVALUATION_ATTEMPTED"
  | "RUNTIME_EXECUTION_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";
export type ReplayValidationScenario = "BASELINE" | "DOCUMENTED_INFORMATIONAL_DIVERGENCE" | ReplayValidationFailure;
export type ReplayValidationInput = Readonly<{ scenario?: ReplayValidationScenario }>;
export type ReplayInputs = Readonly<{ input_id: string; identities: readonly string[]; scenarios: readonly string[]; environments: readonly string[]; datasets: readonly string[]; policies: readonly string[]; configurations: readonly string[]; software_versions: readonly string[]; complete: boolean; integrity_hash: string }>;
export type ReplayExecution = Readonly<{ replay_execution_id: string; original_execution_id: string; reconstruction: boolean; state_restoration: boolean; event_restoration: boolean; ordering_reconstruction: boolean; timing_reconstruction: boolean; replay_outputs: readonly string[]; replay_decisions: readonly string[]; replay_evidence: readonly string[]; executable: boolean; integrity_hash: string }>;
export type DeterministicReplayResult = Readonly<{ result_id: string; identical_outputs: boolean; identical_decisions: boolean; identical_ordering: boolean; identical_logical_timestamps: boolean; identical_evidence: boolean; passed: boolean; integrity_hash: string }>;
export type ReplayComparisonReport = Readonly<{ report_id: string; original_execution: string; replay_execution: string; events_match: boolean; decisions_match: boolean; outputs_match: boolean; evidence_match: boolean; state_match: boolean; metrics_match: boolean; timelines_match: boolean; complete: boolean; integrity_hash: string }>;
export type ReplayDivergence = Readonly<{ divergence_id: string; divergence_type: ReplayDivergenceType; severity: ReplayDivergenceSeverity; source: string; cause: string; dependency: string; propagation: readonly string[]; impact_assessment: string; affected_evidence: readonly string[]; explained: boolean; integrity_hash: string }>;
export type ReplayCertification = Readonly<{ certification_id: string; status: ReplayCertificationStatus; outcome: ReplayValidationOutcome; replay_validation_completed: boolean; evidence_stored: boolean; lineage_complete: boolean; immutable: boolean; certified_before_validation: boolean; integrity_hash: string }>;
export type ReplayEvidenceRegistry = Readonly<{ registry_id: string; replay_artifacts: readonly string[]; comparison_reports: readonly string[]; divergence_reports: readonly string[]; replay_lineage: readonly string[]; replay_certifications: readonly string[]; immutable: boolean; complete: boolean; downstream_ready: boolean; integrity_hash: string }>;
export type ReplayValidationGates = Readonly<{ gate_id: string; replay_completeness: boolean; deterministic_validation: boolean; comparison_validation: boolean; divergence_validation: boolean; replay_certification: boolean; passed: boolean; integrity_hash: string }>;
export type ReplayValidationBoundary = Readonly<{ boundary_id: string; owns_runtime_execution: false; owns_scenario_definition: false; owns_synthetic_generation: false; owns_trust_evaluation: false; owns_behavioral_replay: false; owns_platform_replay_infrastructure: false; integrity_hash: string }>;
export type ReplayValidationReadiness = Readonly<{ readiness_id: string; outcome: ReplayValidationOutcome; phase_ready: boolean; replay_execution_ready: boolean; input_reconstruction_ready: boolean; deterministic_validation_ready: boolean; comparison_ready: boolean; divergence_ready: boolean; explainability_ready: boolean; certification_ready: boolean; evidence_registry_ready: boolean; gates_passed: boolean; boundaries_respected: boolean; failures: readonly ReplayValidationFailure[]; integrity_hash: string }>;
export type ReplayValidationResult = Readonly<{ phase_version: "proving-replay-validation-framework/v6.6"; phase_identifier: "ProvingReplayValidationFramework"; simulation_ref: "proving-simulation-framework/v6.5"; inputs: ReplayInputs; execution: ReplayExecution; deterministic_result: DeterministicReplayResult; comparison: ReplayComparisonReport; divergences: readonly ReplayDivergence[]; certification: ReplayCertification; evidence_registry: ReplayEvidenceRegistry; gates: ReplayValidationGates; boundaries: ReplayValidationBoundary; readiness: ReplayValidationReadiness; replay_hash: string; integrity_hash: string }>;
export type ReplayValidationValidation = Readonly<{ valid: boolean; outcome: ReplayValidationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; inputs_valid: boolean; execution_valid: boolean; deterministic_valid: boolean; comparison_valid: boolean; divergence_valid: boolean; certification_valid: boolean; evidence_registry_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly ReplayValidationFailure[]; integrity_hash: string }>;
export type ReplayValidationBundle = Readonly<{ doctrine: Readonly<{ version: "proving-replay-validation-framework/v6.6"; owns_replay_validation: true; owns_deterministic_replay: true; owns_replay_comparison: true; owns_divergence_analysis: true; owns_replay_certification: true; owns_runtime_execution: false; owns_scenario_definition: false; owns_synthetic_generation: false; owns_trust_evaluation: false; owns_behavioral_replay: false; owns_platform_replay_infrastructure: false }>; result: ReplayValidationResult; validation: ReplayValidationValidation }>;
