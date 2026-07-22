export type AssuranceEvaluationLifecycle = "REGISTERED" | "READY" | "EVALUATING" | "PASS" | "FAIL" | "PRUNED";
export type AssuranceTerminalOutcome = "PASS" | "FAIL" | "PRUNED";
export type AssuranceEvaluationFailure =
  | "CONTRACT_INCOMPLETE"
  | "INPUTS_NONDETERMINISTIC"
  | "ORDERING_NONDETERMINISTIC"
  | "EVIDENCE_QUALIFICATION_NONDETERMINISTIC"
  | "VOCABULARY_OPEN"
  | "PASS_SEMANTICS_INVALID"
  | "FAIL_SEMANTICS_INVALID"
  | "PRUNED_SEMANTICS_INVALID"
  | "CUSTOM_TERMINAL_OUTCOME_ACCEPTED"
  | "EXPLANATION_NONDETERMINISTIC"
  | "LEDGER_MUTABLE"
  | "REPLAY_EXPLANATION_MISMATCH"
  | "REPLAY_OUTCOME_MISMATCH"
  | "TENANT_ISOLATION_FAILURE"
  | "INTEGRITY_FAILURE";
export type AssuranceEvaluationScenario = "BASELINE" | AssuranceEvaluationFailure;
export type AssuranceEvaluationInput = Readonly<{ scenario?: AssuranceEvaluationScenario; tenant_id?: string }>;

export type AssuranceEvaluationContract = Readonly<{ contract_id: string; lifecycle: readonly AssuranceEvaluationLifecycle[]; terminal_outcomes: readonly AssuranceTerminalOutcome[]; evaluation_identity_deterministic: boolean; one_engine_per_evaluation: boolean; immutable_after_completion: boolean; one_terminal_outcome: boolean; replay_metadata_complete: boolean; integrity_hash: string }>;
export type DeterministicEvaluationInputs = Readonly<{ input_id: string; policy_refs: readonly string[]; governance_refs: readonly string[]; constitutional_refs: readonly string[]; dependency_results: readonly string[]; evidence_refs: readonly string[]; configuration_version: string; assurance_version: string; evaluation_context: string; complete: boolean; immutable: boolean; versioned: boolean; replayable: boolean; tenant_isolated: boolean; hidden_runtime_state_prohibited: boolean; integrity_hash: string }>;
export type EvidenceQualificationReport = Readonly<{ report_id: string; complete: boolean; integrity_valid: boolean; authenticity_valid: boolean; provenance_valid: boolean; policy_eligible: boolean; constitutional_eligible: boolean; temporal_valid: boolean; dependencies_satisfied: boolean; qualified_before_evaluation: boolean; rejected_evidence_reasons: readonly string[]; missing_evidence_inferred: false; deterministic: boolean; integrity_hash: string }>;
export type ResultVocabularyReport = Readonly<{ report_id: string; terminal_outcomes: readonly AssuranceTerminalOutcome[]; closed: boolean; implementation_extensions_rejected: boolean; intermediate_states_not_terminal: boolean; pass_semantics: string; fail_semantics: string; pruned_semantics: string; integrity_hash: string }>;
export type EvaluationExecutionReport = Readonly<{ report_id: string; sequence: readonly string[]; deterministic_inputs: boolean; deterministic_ordering: boolean; deterministic_dependencies: boolean; deterministic_evidence: boolean; deterministic_policy_evaluation: boolean; deterministic_completion: boolean; deterministic_outputs: boolean; integrity_hash: string }>;
export type AssuranceEvaluationExplanation = Readonly<{ explanation_id: string; evaluated_requirement: string; governing_policy: string; governing_constitutional_rule: string; evidence_used: readonly string[]; evidence_rejected: readonly string[]; dependency_results: readonly string[]; evaluation_path: readonly string[]; result_determination: AssuranceTerminalOutcome; rationale: string; replay_references: readonly string[]; deterministic: boolean; complete: boolean; integrity_hash: string }>;
export type AssuranceEvaluationLedgerEntry = Readonly<{ entry_id: string; evaluation_identifier: string; assurance_engine: string; evaluation_version: string; dependency_graph_version: string; evidence_manifest: string; evaluation_inputs: string; evaluation_outcome: AssuranceTerminalOutcome; explanation_reference: string; execution_timestamp: string; replay_reference: string; integrity_hash: string }>;
export type AssuranceEvaluationLedger = Readonly<{ ledger_id: string; entries: readonly AssuranceEvaluationLedgerEntry[]; append_only: boolean; immutable: boolean; replayable: boolean; tenant_isolated: boolean; cryptographically_verifiable: boolean; integrity_hash: string }>;
export type AssuranceEvaluationReplayReport = Readonly<{ report_id: string; inputs_reproduced: boolean; dependency_ordering_reproduced: boolean; evidence_qualification_reproduced: boolean; policy_bindings_reproduced: boolean; execution_path_reproduced: boolean; explanations_reproduced: boolean; outcomes_reproduced: boolean; divergence_detected: boolean; integrity_hash: string }>;
export type AssuranceEvaluationCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: AssuranceEvaluationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AssuranceEvaluationCertification = Readonly<{ certification_id: string; status: "PASS" | "FAIL"; certified: boolean; failures: readonly AssuranceEvaluationFailure[]; tests: readonly AssuranceEvaluationCertificationTest[]; integrity_hash: string }>;
export type AssuranceEvaluationContractResult = Readonly<{ phase_version: "assurance-evaluation-contract/v13.3"; phase_identifier: "AssuranceEvaluationContract"; contract: AssuranceEvaluationContract; inputs: DeterministicEvaluationInputs; evidence: EvidenceQualificationReport; vocabulary: ResultVocabularyReport; execution: EvaluationExecutionReport; explanation: AssuranceEvaluationExplanation; ledger: AssuranceEvaluationLedger; replay: AssuranceEvaluationReplayReport; certification: AssuranceEvaluationCertification; replay_hash: string; integrity_hash: string }>;
export type AssuranceEvaluationValidation = Readonly<{ valid: boolean; status: "PASS" | "FAIL"; certified: boolean; failures: readonly AssuranceEvaluationFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; vocabulary_valid: boolean; ledger_valid: boolean; replay_valid: boolean; validation_hash: string }>;
export type AssuranceEvaluationContractBundle = Readonly<{ doctrine: Readonly<{ version: "assurance-evaluation-contract/v13.3"; closed_terminal_vocabulary: true; deterministic_inputs_required: true; deterministic_evidence_required: true; immutable_evaluation_ledger_required: true; reproducible_explanations_required: true; replay_required: true }>; result: AssuranceEvaluationContractResult; validation: AssuranceEvaluationValidation }>;
