export type AssuranceLifecycleState = "READY" | "EXECUTING" | "PASS" | "FAIL" | "PRUNED";
export type DependencyClassification = "REQUIRED" | "OPTIONAL" | "GOVERNANCE_REQUIRED" | "CONSTITUTIONAL_REQUIRED" | "EVIDENCE_REQUIRED" | "POLICY_REQUIRED" | "AUTHORITY_REQUIRED" | "CERTIFICATION_REQUIRED";
export type DependencyStrength = "BLOCKING" | "NON_BLOCKING";
export type AssuranceDependencyFailure =
  | "MISSING_DEPENDENCY"
  | "DUPLICATE_DEPENDENCY"
  | "CIRCULAR_DEPENDENCY"
  | "INVALID_REFERENCE"
  | "ORPHAN_DEPENDENCY"
  | "INCOMPATIBLE_DEPENDENCY_TYPE"
  | "POLICY_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "ORDERING_NONDETERMINISTIC"
  | "EXECUTION_PLAN_MUTATED"
  | "PRUNED_EXECUTED"
  | "FAILURE_PROPAGATION_INVALID"
  | "INDEPENDENT_BRANCH_PRUNED"
  | "REPLAY_MISMATCH"
  | "EXPLAINABILITY_INCOMPLETE"
  | "INTEGRITY_FAILURE"
  | "AUDIT_LEDGER_MUTABLE";
export type AssuranceDependencyScenario = "BASELINE" | AssuranceDependencyFailure;
export type AssuranceDependencyInput = Readonly<{ scenario?: AssuranceDependencyScenario; tenant_id?: string }>;

export type AssuranceDependencyContract = Readonly<{ contract_id: string; lifecycle_states: readonly AssuranceLifecycleState[]; classifications: readonly DependencyClassification[]; pruning_semantics_distinguish_failure: boolean; implicit_dependencies_prohibited: true; replay_required: true; integrity_hash: string }>;
export type AssuranceDependencyRecord = Readonly<{ dependency_id: string; assurance_engine_id: string; prerequisite_engine_refs: readonly string[]; dependency_type: DependencyClassification; dependency_strength: DependencyStrength; evaluation_order: number; execution_policy: "EXECUTE_WHEN_READY"; pruning_policy: "PRUNE_ON_BLOCKING_PREREQUISITE_FAILURE"; dependency_status: AssuranceLifecycleState; replay_ref: string; integrity_hash: string }>;
export type DependencyGraphEdge = Readonly<{ source_engine: string; destination_engine: string; classification: DependencyClassification; strength: DependencyStrength; evaluation_constraint: "SOURCE_BEFORE_DESTINATION"; integrity_hash: string }>;
export type DependencyGraph = Readonly<{ graph_id: string; nodes: readonly string[]; edges: readonly DependencyGraphEdge[]; directed: boolean; acyclic: boolean; deterministic: boolean; immutable_during_execution: boolean; replayable: boolean; integrity_hash: string }>;
export type DependencyRegistry = Readonly<{ registry_id: string; dependencies: readonly AssuranceDependencyRecord[]; classifications_registered: boolean; duplicate_free: boolean; complete: boolean; integrity_hash: string }>;
export type DependencyValidationReport = Readonly<{ report_id: string; missing_dependencies: readonly string[]; duplicate_dependencies: readonly string[]; circular_dependencies: readonly string[]; invalid_references: readonly string[]; orphaned_dependencies: readonly string[]; incompatible_types: readonly string[]; policy_violations: readonly string[]; authority_violations: readonly string[]; planning_allowed: boolean; integrity_hash: string }>;
export type EvaluationOrdering = Readonly<{ ordering_id: string; order: readonly string[]; dependency_first: boolean; stable: boolean; replay_identical: boolean; timing_independent: boolean; integrity_hash: string }>;
export type AssuranceExecutionPlan = Readonly<{ plan_id: string; execution_sequence: readonly string[]; prerequisite_chains: readonly string[]; dependency_groups: readonly string[]; pruning_rules: readonly string[]; replay_ordering: readonly string[]; immutable_once_started: boolean; integrity_hash: string }>;
export type AssuranceExecutionRecord = Readonly<{ engine_id: string; lifecycle_state: AssuranceLifecycleState; ordering_position: number; executed: boolean; prerequisite_results: readonly string[]; pruning_reason: string | null; violations: readonly string[]; integrity_hash: string }>;
export type DependencyPropagationReport = Readonly<{ report_id: string; downstream_pruning: readonly string[]; propagation_boundaries: readonly string[]; independent_branches_continued: boolean; declared_relationships_only: boolean; deterministic: boolean; integrity_hash: string }>;
export type DependencyReplayReport = Readonly<{ report_id: string; graph_replayed: boolean; ordering_replayed: boolean; pruning_replayed: boolean; pass_fail_replayed: boolean; propagation_replayed: boolean; timestamps_replayed: boolean; execution_plan_replayed: boolean; identical_outcomes: boolean; integrity_hash: string }>;
export type DependencyExplanation = Readonly<{ explanation_id: string; decisions_explained: number; execution_rationale: readonly string[]; pruning_rationale: readonly string[]; prerequisite_engines: readonly string[]; dependency_chains: readonly string[]; ordering_rationale: string; propagation_decisions: readonly string[]; complete: boolean; integrity_hash: string }>;
export type DependencyIntegrityReport = Readonly<{ report_id: string; graph_complete: boolean; edge_integrity_valid: boolean; dependency_unique: boolean; execution_consistent: boolean; pruning_consistent: boolean; replay_integrity_valid: boolean; ordering_deterministic: boolean; execution_plan_immutable: boolean; integrity_hash: string }>;
export type DependencyAuditLedgerEntry = Readonly<{ entry_id: string; dependency_identifier: string; assurance_engine: string; dependency_chain: readonly string[]; execution_state: AssuranceLifecycleState; ordering_position: number; prerequisite_results: readonly string[]; pruning_decisions: readonly string[]; replay_reference: string; timestamp: string; integrity_hash: string }>;
export type DependencyAuditLedger = Readonly<{ ledger_id: string; entries: readonly DependencyAuditLedgerEntry[]; append_only: boolean; immutable: boolean; integrity_hash: string }>;
export type AssuranceDependencyCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: AssuranceDependencyFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AssuranceDependencyCertification = Readonly<{ certification_id: string; status: "PASS" | "FAIL"; certified: boolean; failures: readonly AssuranceDependencyFailure[]; tests: readonly AssuranceDependencyCertificationTest[]; integrity_hash: string }>;
export type AssuranceDependencyResult = Readonly<{ phase_version: "assurance-dependency-evaluation/v13.2"; phase_identifier: "AssuranceDependencyEvaluation"; contract: AssuranceDependencyContract; graph: DependencyGraph; registry: DependencyRegistry; validation: DependencyValidationReport; ordering: EvaluationOrdering; execution_plan: AssuranceExecutionPlan; execution_records: readonly AssuranceExecutionRecord[]; propagation: DependencyPropagationReport; replay: DependencyReplayReport; explainability: DependencyExplanation; integrity: DependencyIntegrityReport; audit_ledger: DependencyAuditLedger; certification: AssuranceDependencyCertification; replay_hash: string; integrity_hash: string }>;
export type AssuranceDependencyValidation = Readonly<{ valid: boolean; status: "PASS" | "FAIL"; certified: boolean; failures: readonly AssuranceDependencyFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; graph_valid: boolean; plan_valid: boolean; ledger_valid: boolean; validation_hash: string }>;
export type AssuranceDependencyContractBundle = Readonly<{ doctrine: Readonly<{ version: "assurance-dependency-evaluation/v13.2"; deterministic_dependency_graph: true; immutable_execution_plan: true; pruned_is_not_failure: true; dependency_first_ordering: true; replay_required: true; audit_ledger_required: true }>; result: AssuranceDependencyResult; validation: AssuranceDependencyValidation }>;
