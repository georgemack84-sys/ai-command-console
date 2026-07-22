export type OperationalLearningOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type LearningDecisionOutcome = "APPROVED" | "REJECTED" | "REQUIRES_MORE_EVIDENCE" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_CERTIFICATION" | "DEFERRED";
export type LearningLifecycleState = "IDENTIFIED" | "ELIGIBILITY_VALIDATED" | "GOVERNANCE_VALIDATED" | "LEARNING_IN_PROGRESS" | "PATTERN_QUALIFIED" | "MEMORY_COMMITTED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type LearningSource =
  | "OPERATIONAL_EVENTS"
  | "CONFIGURATION_HISTORY"
  | "INCIDENT_HISTORY"
  | "PERFORMANCE_HISTORY"
  | "CAPACITY_HISTORY"
  | "CERTIFICATION_HISTORY"
  | "GOVERNANCE_DECISIONS"
  | "POLICY_EVOLUTION"
  | "OPERATIONAL_CHANGE_HISTORY"
  | "VALIDATED_RECOVERY_EVENTS"
  | "REPLAY_VALIDATION_HISTORY"
  | "OPERATIONAL_OUTCOMES";
export type LearningPatternType = "INCIDENT" | "RECOVERY" | "PERFORMANCE" | "CAPACITY" | "INFRASTRUCTURE" | "GOVERNANCE" | "POLICY" | "CERTIFICATION" | "ANOMALY" | "BEST_PRACTICE";
export type LearningFailure =
  | "LEARNING_NOT_DETERMINISTIC"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "ELIGIBILITY_NOT_GOVERNED"
  | "OPERATIONAL_MEMORY_MUTABLE"
  | "PATTERN_QUALIFICATION_NOT_OPERATIONAL"
  | "GOVERNANCE_ENFORCEMENT_NOT_VALIDATED"
  | "TENANT_ISOLATION_NOT_PRESERVED"
  | "AUTHORITY_BOUNDARY_NOT_ENFORCED"
  | "LEARNING_LINEAGE_INCOMPLETE"
  | "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE"
  | "CERTIFICATION_INTEGRATION_NOT_VERIFIED"
  | "OPERATIONAL_LEARNING_NOT_CERTIFIED"
  | "HISTORICAL_RECORD_MODIFIED"
  | "VALIDATION_STAGE_BYPASSED"
  | "PHASE_18_2_MONITORING_NOT_VALID"
  | "NON_CONSTITUTIONAL_LEARNING_WARNING";
export type OperationalLearningScenario = "BASELINE" | LearningFailure;
export type OperationalLearningInput = Readonly<{ scenario?: OperationalLearningScenario; tenant_id?: string; operator_id?: string; mission_id?: string; learning_id?: string; candidate_id?: string; pattern_id?: string }>;

export type OperationalLearningEngine = Readonly<{ engine_id: string; learning_orchestration: boolean; learning_scheduling: boolean; deterministic_execution: boolean; replay_preservation: boolean; governance_enforcement: boolean; eligibility_validation: boolean; learning_lineage: boolean; certification_integration: boolean; advisory_only: boolean; stages_ordered: boolean; integrity_hash: string }>;
export type LearningEligibilityRules = Readonly<{ rules_id: string; eligible_evidence: boolean; evidence_maturity_required: boolean; governance_approval_requirements: boolean; replay_qualification: boolean; tenant_scope_enforced: boolean; cross_domain_permissions: boolean; certification_requirements: boolean; constitutional_constraints: boolean; deterministic_decisions: boolean; integrity_hash: string }>;
export type LearningCandidate = Readonly<{ candidate_id: string; source: LearningSource; tenant_scope: string; originating_evidence: readonly string[]; validation_status: "VALIDATED" | "REJECTED"; replay_status: "REPLAY_VALIDATED" | "REPLAY_FAILED"; governance_status: "GOVERNANCE_VALIDATED" | "GOVERNANCE_REJECTED"; qualification_state: "QUALIFIED" | "UNQUALIFIED"; approval_history: readonly string[]; rejection_reasons: readonly string[]; integrity_hash: string }>;
export type LearningCandidateRegistry = Readonly<{ registry_id: string; candidates: readonly LearningCandidate[]; pending_candidates_tracked: boolean; validation_status_tracked: boolean; replay_status_tracked: boolean; governance_status_tracked: boolean; approval_history_tracked: boolean; rejection_reasons_tracked: boolean; integrity_hash: string }>;
export type PatternLearningService = Readonly<{ service_id: string; pattern_types: readonly LearningPatternType[]; deterministic_discovery: boolean; recurring_incidents: boolean; successful_recoveries: boolean; performance_trends: boolean; capacity_trends: boolean; infrastructure_behaviors: boolean; governance_patterns: boolean; policy_evolution: boolean; certification_outcomes: boolean; operational_anomalies: boolean; operational_best_practices: boolean; integrity_hash: string }>;
export type OperationalPattern = Readonly<{ pattern_id: string; pattern_type: LearningPatternType; confidence: number; applicability: string; evidence_refs: readonly string[]; governance_approvals: readonly string[]; replay_refs: readonly string[]; certification_lineage: readonly string[]; supersession_history: readonly string[]; immutable_after_approval: boolean; qualification_status: "QUALIFIED" | "UNQUALIFIED"; integrity_hash: string }>;
export type OperationalMemory = Readonly<{ memory_id: string; validated_patterns: readonly string[]; operational_outcomes: readonly string[]; incident_relationships: readonly string[]; recovery_knowledge: readonly string[]; governance_precedents: readonly string[]; configuration_evolution: readonly string[]; capacity_evolution: readonly string[]; performance_evolution: readonly string[]; operational_intelligence: readonly string[]; certification_lineage: readonly string[]; append_only: boolean; historical_records_modified: boolean; integrity_hash: string }>;
export type OperationalPatternRegistry = Readonly<{ registry_id: string; patterns: readonly OperationalPattern[]; approved_patterns_tracked: boolean; confidence_tracked: boolean; applicability_tracked: boolean; evidence_references_tracked: boolean; governance_approvals_tracked: boolean; replay_references_tracked: boolean; certification_lineage_tracked: boolean; supersession_history_tracked: boolean; immutable_patterns: boolean; integrity_hash: string }>;
export type LearningDecisionEngine = Readonly<{ engine_id: string; possible_outcomes: readonly LearningDecisionOutcome[]; deterministic_evaluation: boolean; candidate_outcome: LearningDecisionOutcome; evidence_sufficient: boolean; governance_review_required: boolean; certification_required: boolean; integrity_hash: string }>;
export type LearningReplayValidator = Readonly<{ validator_id: string; identical_candidate_selection: boolean; deterministic_evaluation: boolean; identical_learned_patterns: boolean; governance_consistency: boolean; replay_integrity: boolean; memory_consistency: boolean; mandatory_validation: boolean; integrity_hash: string }>;
export type LearningGovernanceValidator = Readonly<{ validator_id: string; governance_authority: boolean; policy_compliance: boolean; constitutional_compliance: boolean; tenant_isolation: boolean; certification_eligibility: boolean; authority_boundaries: boolean; learning_allowed: boolean; integrity_hash: string }>;
export type LearningRecord = Readonly<{ learning_id: string; candidate_id: string; pattern_id: string; tenant_scope: string; operational_scope: string; evidence_refs: readonly string[]; replay_refs: readonly string[]; governance_refs: readonly string[]; eligibility_result: "ELIGIBLE" | "INELIGIBLE"; learning_outcome: LearningDecisionOutcome; qualification_status: "QUALIFIED" | "UNQUALIFIED"; certification_refs: readonly string[]; supersession_ref: string | null; integrity_hash: string }>;
export type LearningLineageLedger = Readonly<{ ledger_id: string; records: readonly LearningRecord[]; append_only: boolean; learning_requests_recorded: boolean; evidence_lineage_recorded: boolean; eligibility_decisions_recorded: boolean; governance_decisions_recorded: boolean; learning_outcomes_recorded: boolean; replay_references_recorded: boolean; certification_references_recorded: boolean; supersession_lineage_recorded: boolean; integrity_hash: string }>;
export type CrossOperationalPatternAnalyzer = Readonly<{ analyzer_id: string; operational_similarity: boolean; recovery_similarity: boolean; infrastructure_similarity: boolean; capacity_similarity: boolean; performance_similarity: boolean; governance_similarity: boolean; cross_tenant_learning_authorized: boolean; tenant_isolation_policy_applied: boolean; integrity_hash: string }>;
export type LearningObservabilityDashboard = Readonly<{ dashboard_id: string; learning_throughput_visible: boolean; eligibility_decisions_visible: boolean; replay_validation_visible: boolean; governance_status_visible: boolean; candidate_backlog_visible: boolean; learned_patterns_visible: boolean; rejected_candidates_visible: boolean; intelligence_growth_visible: boolean; opaque_learning_prevented: boolean; integrity_hash: string }>;
export type OperationalLearningCertificationPackage = Readonly<{ package_id: string; deterministic_learning: boolean; replay_reproducible: boolean; eligibility_governed: boolean; immutable_operational_memory_verified: boolean; pattern_qualification_operational: boolean; governance_enforcement_validated: boolean; tenant_isolation_preserved: boolean; authority_boundaries_enforced: boolean; learning_lineage_complete: boolean; operational_intelligence_reproducible: boolean; certification_integration_verified: boolean; operational_learning_certified: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type OperationalLearningTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: OperationalLearningOutcome; passed: boolean; failure_reason: LearningFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type OperationalLearningResult = Readonly<{ phase_version: "operational-learning-engine/v18.3"; phase_identifier: "OperationalLearningEngine"; continuous_monitoring_intelligence_ref: string; learning_engine: OperationalLearningEngine; eligibility_rules: LearningEligibilityRules; candidate_registry: LearningCandidateRegistry; pattern_learning_service: PatternLearningService; operational_memory: OperationalMemory; pattern_registry: OperationalPatternRegistry; decision_engine: LearningDecisionEngine; replay_validator: LearningReplayValidator; governance_validator: LearningGovernanceValidator; lineage_ledger: LearningLineageLedger; cross_operational_analyzer: CrossOperationalPatternAnalyzer; observability_dashboard: LearningObservabilityDashboard; lifecycle: readonly LearningLifecycleState[]; certification_package: OperationalLearningCertificationPackage; certification_tests: readonly OperationalLearningTest[]; failures: readonly LearningFailure[]; outcome: OperationalLearningOutcome; replay_hash: string; integrity_hash: string }>;
export type OperationalLearningValidation = Readonly<{ valid: boolean; outcome: OperationalLearningOutcome; engine_valid: boolean; eligibility_valid: boolean; candidate_registry_valid: boolean; pattern_service_valid: boolean; memory_valid: boolean; pattern_registry_valid: boolean; decision_valid: boolean; replay_valid: boolean; governance_valid: boolean; lineage_valid: boolean; analyzer_valid: boolean; dashboard_valid: boolean; lifecycle_valid: boolean; certification_package_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly LearningFailure[]; integrity_hash: string }>;
export type OperationalLearningBundle = Readonly<{ doctrine: Readonly<{ version: "operational-learning-engine/v18.3"; upstream_phase: "continuous-monitoring-intelligence/v18.2"; lifecycle_states: readonly LearningLifecycleState[]; learning_sources: readonly LearningSource[]; pattern_types: readonly LearningPatternType[]; decision_outcomes: readonly LearningDecisionOutcome[]; certification_outcomes: readonly OperationalLearningOutcome[] }>; result: OperationalLearningResult; validation: OperationalLearningValidation }>;
