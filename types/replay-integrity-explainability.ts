export type ReplayLifecycleState = "REGISTERED" | "PREPARED" | "EXECUTING" | "VERIFYING" | "COMPLETED" | "FAILED" | "DIVERGED" | "INVALID" | "CANCELLED";
export type ReplayIntegrityOutcome = "IDENTICAL" | "ACCEPTABLE_VARIANCE" | "DIVERGED" | "INVALID";
export type ArtifactIntegrityState = "VERIFIED" | "WARNING" | "FAILED";
export type ReplayDivergenceCategory = "INPUT_DIVERGENCE" | "DATASET_DIVERGENCE" | "ENVIRONMENT_DIVERGENCE" | "DEPENDENCY_DIVERGENCE" | "EXECUTION_DIVERGENCE" | "OUTPUT_DIVERGENCE" | "GOVERNANCE_DIVERGENCE" | "CERTIFICATION_DIVERGENCE" | "UNEXPLAINED_DIVERGENCE";
export type ReplayCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReplayIntegrityFailure = "LINEAGE_NOT_APPROVED" | "REPLAY_CONTRACT_FAILURE" | "REPLAY_NON_DETERMINISTIC" | "ORDERING_NOT_REPRODUCIBLE" | "INPUT_RECONSTRUCTION_FAILED" | "OUTPUT_REPRODUCTION_FAILED" | "DEPENDENCY_GRAPH_LOST" | "ENVIRONMENT_RESTORE_FAILED" | "INTEGRITY_VALIDATION_NON_DETERMINISTIC" | "ARTIFACT_HASH_FAILURE" | "LINEAGE_LOST" | "EXPLAINABILITY_NON_DETERMINISTIC" | "EVIDENCE_CHAIN_INCOMPLETE" | "GOVERNANCE_REASONING_NOT_REPRODUCIBLE" | "CERTIFICATION_REASONING_NOT_REPRODUCIBLE" | "LEDGER_MUTABLE" | "REPLAY_HISTORY_INCOMPLETE" | "DIVERGENCE_DETECTION_NON_DETERMINISTIC" | "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED" | "AUDIT_MUTABLE" | "CONSTITUTIONAL_OWNERSHIP_LOST" | "NON_CONSTITUTIONAL_EXPLANATION_WARNING";
export type ReplayIntegrityScenario = "BASELINE" | ReplayIntegrityFailure;

export type ReplayIntegrityExplainabilityInput = Readonly<{ scenario?: ReplayIntegrityScenario }>;

export type ReplayContract = Readonly<{
  contract_version: "replay-integrity-explainability/v14.10";
  certification_lineage_ref: string;
  lifecycle: readonly ReplayLifecycleState[];
  failure_states: readonly ReplayLifecycleState[];
  preserves_execution_ordering: boolean;
  preserves_identities: boolean;
  preserves_evidence: boolean;
  preserves_governance_state: boolean;
  preserves_dependency_ordering: boolean;
  preserves_environment_configuration: boolean;
  never_modifies_history: boolean;
  original_execution_canonical: boolean;
  integrity_hash: string;
}>;

export type ReplayExecutionRecord = Readonly<{
  replay_id: string;
  execution_reference: string;
  replay_status: ReplayLifecycleState;
  replay_environment: string;
  replay_inputs: readonly string[];
  replay_outputs: readonly string[];
  divergence_detected: boolean;
  explanation_reference: string;
  integrity_status: ReplayIntegrityOutcome;
  completion_timestamp: string;
  integrity_hash: string;
}>;

export type ReplayIntegrityReport = Readonly<{
  integrity_report_id: string;
  outcome: ReplayIntegrityOutcome;
  execution_ordering_valid: boolean;
  outputs_valid: boolean;
  evidence_valid: boolean;
  dependency_graph_valid: boolean;
  governance_decisions_valid: boolean;
  certification_outcomes_valid: boolean;
  environment_state_valid: boolean;
  differences_classified: boolean;
  integrity_hash: string;
}>;

export type ReplayExplanation = Readonly<{
  explanation_id: string;
  execution_summary: string;
  decision_sequence: readonly string[];
  evidence_chain: readonly string[];
  dependency_graph: readonly string[];
  governance_references: readonly string[];
  replay_references: readonly string[];
  integrity_references: readonly string[];
  deterministic: boolean;
  reproducible: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReplayLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "REPLAY_REQUESTED" | "REPLAY_EXECUTED" | "INTEGRITY_REPORTED" | "EXPLANATION_REGISTERED" | "DIVERGENCE_CHECKED" | "CERTIFICATION_REFERENCED";
  replay_id: string;
  sequence: number;
  immutable: boolean;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ReplayDivergenceRecord = Readonly<{
  divergence_id: string;
  replay_id: string;
  category: ReplayDivergenceCategory;
  detected: boolean;
  explained: boolean;
  certification_blocked: boolean;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationReport = Readonly<{
  verification_id: string;
  artifact_hashes_verified: boolean;
  signatures_verified: boolean;
  lineage_validated: boolean;
  dependency_references_validated: boolean;
  replay_evidence_validated: boolean;
  certification_lineage_validated: boolean;
  audit_chain_validated: boolean;
  integrity_state: ArtifactIntegrityState;
  integrity_hash: string;
}>;

export type ReplayCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ReplayCertificationOutcome;
  passed: boolean;
  failure_reason: ReplayIntegrityFailure | null;
  integrity_hash: string;
}>;

export type ReplayIntegrityExplainabilityResult = Readonly<{
  phase_version: "replay-integrity-explainability/v14.10";
  phase_identifier: "ReplayIntegrityExplainability";
  certification_lineage_ref: string;
  contract: ReplayContract;
  execution: ReplayExecutionRecord;
  replay_integrity: ReplayIntegrityReport;
  explanation: ReplayExplanation;
  replay_ledger: readonly ReplayLedgerEntry[];
  divergences: readonly ReplayDivergenceRecord[];
  artifact_integrity: IntegrityVerificationReport;
  certification_tests: readonly ReplayCertificationTest[];
  failures: readonly ReplayIntegrityFailure[];
  outcome: ReplayCertificationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReplayIntegrityExplainabilityValidation = Readonly<{
  valid: boolean;
  outcome: ReplayCertificationOutcome;
  contract_valid: boolean;
  execution_valid: boolean;
  replay_integrity_valid: boolean;
  explanation_valid: boolean;
  ledger_valid: boolean;
  divergence_valid: boolean;
  artifact_integrity_valid: boolean;
  certification_valid: boolean;
  failures: readonly ReplayIntegrityFailure[];
  integrity_hash: string;
}>;

export type ReplayIntegrityExplainabilityBundle = Readonly<{
  doctrine: Readonly<{
    version: "replay-integrity-explainability/v14.10";
    certification_lineage_phase: "certification-lineage-supersession/v14.9";
    replay_lifecycle: readonly ReplayLifecycleState[];
    integrity_outcomes: readonly ReplayIntegrityOutcome[];
    divergence_categories: readonly ReplayDivergenceCategory[];
    certification_outcomes: readonly ReplayCertificationOutcome[];
  }>;
  result: ReplayIntegrityExplainabilityResult;
  validation: ReplayIntegrityExplainabilityValidation;
}>;
