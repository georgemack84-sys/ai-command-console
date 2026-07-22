export type CertificationDecisionOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type AssuranceInputOutcome = "PASS" | "FAIL" | "PRUNED";
export type CertificationDecisionFailure =
  | "CONTRACT_INVALID"
  | "AGGREGATION_NONDETERMINISTIC"
  | "MULTIPLE_DECISIONS"
  | "VOCABULARY_OPEN"
  | "REQUIRED_ASSURANCE_FAILED"
  | "PRUNED_NORMALIZED_TO_FAIL"
  | "OPTIONAL_OVERRIDES_REQUIRED"
  | "CONDITIONS_IMPLICIT"
  | "GOVERNANCE_REVIEW_BYPASSED"
  | "OPERATOR_REVIEW_BYPASSED"
  | "EVIDENCE_MUTABLE"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "EXPLANATION_INCOMPLETE"
  | "REPLAY_MISMATCH"
  | "LEDGER_MUTABLE"
  | "TENANT_ISOLATION_FAILURE"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "INTEGRITY_FAILURE";
export type CertificationDecisionScenario = "BASELINE" | CertificationDecisionFailure;
export type CertificationDecisionInput = Readonly<{ scenario?: CertificationDecisionScenario; tenant_id?: string }>;

export type CertificationDecisionContract = Readonly<{ contract_id: string; certification_decision_id: string; assessment_id: string; certification_cycle_id: string; evaluated_scope: string; assurance_result_refs: readonly string[]; required_assurance_refs: readonly string[]; optional_assurance_refs: readonly string[]; aggregation_policy_ref: string; certification_outcome: CertificationDecisionOutcome; governance_review_required: boolean; operator_review_required: boolean; evidence_binder_ref: string; explanation_ref: string; replay_ref: string; decision_timestamp: string; schema_immutable: boolean; identity_deterministic: boolean; replayable: boolean; evidence_linked: boolean; integrity_hash: string }>;
export type CertificationAggregationRules = Readonly<{ rules_id: string; required_outcomes: readonly AssuranceInputOutcome[]; optional_outcomes: readonly AssuranceInputOutcome[]; aggregation_order: readonly string[]; no_implicit_weighting: boolean; deterministic_ordering: boolean; closed_vocabulary: boolean; policy_binding_immutable: boolean; optional_cannot_override_required: boolean; pruned_preserved_distinct: boolean; constitutional_constraints_enforced: boolean; integrity_hash: string }>;
export type CertificationEvidenceBinder = Readonly<{ binder_id: string; assurance_evaluations: readonly string[]; dependency_graph_refs: readonly string[]; evaluation_ordering_refs: readonly string[]; qualified_evidence_refs: readonly string[]; policy_manifest_refs: readonly string[]; governance_approval_refs: readonly string[]; operator_review_refs: readonly string[]; constitutional_constraint_refs: readonly string[]; integrity_validation_refs: readonly string[]; replay_refs: readonly string[]; immutable: boolean; lineage_complete: boolean; independently_verifiable: boolean; qualification_explicit: boolean; integrity_hash: string }>;
export type CertificationExplanation = Readonly<{ explanation_id: string; outcome: CertificationDecisionOutcome; succeeded_reason: string | null; failed_reason: string | null; conditional_reason: string | null; governance_review_reason: string | null; operator_review_reason: string | null; contributing_assurance_outcomes: readonly string[]; dependency_influence: readonly string[]; evidence_qualification: string; applied_aggregation_rules: readonly string[]; constitutional_constraints: readonly string[]; deterministic: boolean; hidden_reasoning_eliminated: boolean; replay_identical: boolean; integrity_hash: string }>;
export type CertificationReplayReport = Readonly<{ report_id: string; assurance_ordering_replayed: boolean; dependency_evaluation_replayed: boolean; aggregation_sequence_replayed: boolean; evidence_qualification_replayed: boolean; aggregation_rules_replayed: boolean; outcome_reproduced: boolean; explanation_reproduced: boolean; integrity_validated: boolean; evidence_preserved: boolean; integrity_hash: string }>;
export type CertificationDecisionLedgerEntry = Readonly<{ entry_id: string; certification_decision: string; assurance_references: readonly string[]; aggregation_policy: string; evidence_binder: string; governance_actions: readonly string[]; operator_actions: readonly string[]; replay_references: readonly string[]; integrity_verification: string; timestamp: string; integrity_hash: string }>;
export type CertificationDecisionLedger = Readonly<{ ledger_id: string; entries: readonly CertificationDecisionLedgerEntry[]; append_only: boolean; immutable: boolean; tenant_isolated: boolean; cryptographically_verifiable: boolean; replayable: boolean; integrity_hash: string }>;
export type CertificationDecisionTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: CertificationDecisionFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type CertificationDecisionCertification = Readonly<{ certification_id: string; status: "PASS" | "FAIL"; certified: boolean; failures: readonly CertificationDecisionFailure[]; tests: readonly CertificationDecisionTest[]; integrity_hash: string }>;
export type CertificationDecisionResult = Readonly<{ phase_version: "certification-decision-framework/v13.4"; phase_identifier: "CertificationDecisionFramework"; contract: CertificationDecisionContract; aggregation_rules: CertificationAggregationRules; evidence_binder: CertificationEvidenceBinder; explanation: CertificationExplanation; replay: CertificationReplayReport; ledger: CertificationDecisionLedger; certification: CertificationDecisionCertification; replay_hash: string; integrity_hash: string }>;
export type CertificationDecisionValidation = Readonly<{ valid: boolean; status: "PASS" | "FAIL"; certified: boolean; failures: readonly CertificationDecisionFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; single_decision_valid: boolean; evidence_valid: boolean; ledger_valid: boolean; advisory_only: boolean; validation_hash: string }>;
export type CertificationDecisionContractBundle = Readonly<{ doctrine: Readonly<{ version: "certification-decision-framework/v13.4"; single_decision_required: true; closed_outcome_vocabulary: true; deterministic_aggregation_required: true; evidence_binding_required: true; governance_supremacy_required: true; advisory_only: true; replay_required: true }>; result: CertificationDecisionResult; validation: CertificationDecisionValidation }>;
