export type GovernanceIntelligenceState = "CREATED" | "ANALYZING" | "CORRELATED" | "RECOMMENDING" | "ESCALATED" | "CERTIFIED" | "ARCHIVED";
export type GovernanceIntelligenceCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "UNCERTIFIED";
export type GovernanceIntelligenceValidationState = "PASS" | "FAIL";
export type GovernanceIntelligenceFailureCategory = "CONTRACT_VALIDATION" | "GOVERNANCE_BOUNDARY" | "EVIDENCE" | "CONFIDENCE" | "LINEAGE" | "REPLAY" | "RECOMMENDATION" | "CERTIFICATION" | "HASH_INTEGRITY";
export type GovernanceIntelligenceTransitionValidationState = "PASS" | "FAIL";
export type GovernanceIntelligenceEscalationReason = "POLICY_CONFLICT" | "AUTHORITY_RISK" | "LOW_CONFIDENCE" | "MISSING_EVIDENCE" | "LINEAGE_GAP" | "REPLAY_GAP" | "TENANT_BOUNDARY_RISK" | "OPERATOR_REVIEW_REQUIRED" | "CERTIFICATION_REVIEW_REQUIRED";
export type GovernanceIntelligenceTransitionFailureReason =
  | "UNKNOWN_STATE"
  | "INVALID_STATE_VALUE"
  | "MISSING_CURRENT_STATE"
  | "MISSING_TARGET_STATE"
  | "MISSING_TRANSITION_EVENT"
  | "TRANSITION_NOT_ALLOWED"
  | "STATE_SKIP_DETECTED"
  | "STATE_REGRESSION_DETECTED"
  | "ARCHIVED_REACTIVATION_ATTEMPTED"
  | "CERTIFIED_MUTATION_ATTEMPTED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "GOVERNANCE_SCOPE_MISSING"
  | "POLICY_SCOPE_MISSING"
  | "OPERATOR_SUPREMACY_MISSING"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "EVIDENCE_REF_MISSING"
  | "POLICY_REF_MISSING"
  | "LINEAGE_REF_MISSING"
  | "REPLAY_REF_MISSING"
  | "ESCALATION_REF_MISSING"
  | "ESCALATION_REASON_MISSING"
  | "LINEAGE_BREAK_DETECTED"
  | "CERTIFICATION_STATUS_INVALID"
  | "STATE_HASH_MISSING"
  | "STATE_HASH_MISMATCH"
  | "TRANSITION_HASH_MISSING"
  | "TRANSITION_HASH_MISMATCH"
  | "REPLAY_PATH_MISMATCH"
  | "FINAL_STATE_MISMATCH";
export type GovernanceIntelligenceIdentityFailureReason =
  | "IDENTITY_MISSING"
  | "GOVERNANCE_INTELLIGENCE_ID_MISSING"
  | "GOVERNANCE_INTELLIGENCE_ID_DUPLICATE"
  | "IDENTITY_COLLISION"
  | "IDENTITY_REUSE_DETECTED"
  | "TENANT_ID_MISSING"
  | "TENANT_ID_MUTATION_DETECTED"
  | "MISSION_ID_MISSING"
  | "MISSION_NOT_FOUND"
  | "MISSION_TENANT_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATION"
  | "PARENT_INTELLIGENCE_MISSING"
  | "PARENT_INTELLIGENCE_NOT_FOUND"
  | "CHILD_PARENT_MISMATCH"
  | "ROOT_INTELLIGENCE_MISSING"
  | "ROOT_INTELLIGENCE_MUTATION_DETECTED"
  | "LINEAGE_BREAK_DETECTED"
  | "SUPERSESSION_HISTORY_MISSING"
  | "SUPERSESSION_BY_MUTATION_DETECTED"
  | "CROSS_TENANT_PARENT_LINKAGE"
  | "CROSS_TENANT_CHILD_LINKAGE"
  | "CROSS_TENANT_ROOT_LINKAGE"
  | "CROSS_TENANT_SUPERSESSION"
  | "CROSS_TENANT_REPLAY_REFERENCE"
  | "REPLAY_ID_MISSING"
  | "RECONSTRUCTION_HASH_MISSING"
  | "RECONSTRUCTION_HASH_MISMATCH"
  | "IDENTITY_HASH_MISSING"
  | "IDENTITY_HASH_MISMATCH"
  | "IDENTITY_REPLAY_FAILED"
  | "LINEAGE_REPLAY_FAILED"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "PROTECTED_FIELD_MUTATION"
  | "GOVERNANCE_INTELLIGENCE_ID_MUTATION"
  | "TENANT_ID_MUTATION"
  | "CREATED_TIMESTAMP_MUTATION"
  | "ROOT_INTELLIGENCE_ID_MUTATION"
  | "MUTATION_ATTEMPT_NOT_LEDGER_RECORDED";
export type GovernanceLifecycleStage = "Creation" | "Analysis" | "Correlation" | "Recommendation Generation" | "Escalation" | "Certification" | "Archival";
export type GovernanceLifecycleActivityType = "CREATION" | "ANALYSIS" | "CORRELATION" | "RECOMMENDATION_GENERATION" | "ESCALATION" | "CERTIFICATION" | "ARCHIVAL";
export type GovernanceLifecycleFailureReason =
  | "INVALID_LIFECYCLE_STAGE"
  | "LIFECYCLE_STAGE_MISSING"
  | "LIFECYCLE_STAGE_OUT_OF_ORDER"
  | "LIFECYCLE_STAGE_SKIPPED"
  | "LIFECYCLE_STAGE_REGRESSION"
  | "INVALID_STATE_TRANSITION"
  | "TRANSITION_EVENT_MISSING"
  | "TRANSITION_TIMESTAMP_MISSING"
  | "TRANSITION_ACTOR_MISSING"
  | "TRANSITION_REASON_MISSING"
  | "TRANSITION_NOT_LEDGER_RECORDED"
  | "EVIDENCE_REFS_MISSING"
  | "POLICY_REFS_MISSING"
  | "EVIDENCE_POLICY_CORRELATION_MISSING"
  | "UNSUPPORTED_RECOMMENDATION"
  | "POLICY_CONFLICT_UNESCALATED"
  | "LINEAGE_REFS_MISSING"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "LIFECYCLE_REPLAY_MISMATCH"
  | "CERTIFICATION_PRECONDITION_FAILED"
  | "LINEAGE_VERIFICATION_FAILED"
  | "REPLAY_VERIFICATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "ARCHIVAL_BEFORE_CERTIFICATION"
  | "ARCHIVED_RECORD_MUTATION";
export type GovernanceFoundationCertificationComponent = "contract" | "state_machine" | "identity" | "tenant_isolation" | "lifecycle" | "lineage" | "replay" | "immutability" | "auditability";
export type GovernanceFoundationCertificationFailureReason =
  | "CONTRACT_MISSING"
  | "CONTRACT_SCHEMA_INVALID"
  | "REQUIRED_FIELDS_NOT_ENFORCED"
  | "POLICY_SCOPE_MISSING"
  | "EVIDENCE_REQUIREMENTS_MISSING"
  | "LINEAGE_REQUIREMENTS_MISSING"
  | "REPLAY_REQUIREMENTS_MISSING"
  | "STATE_MACHINE_MISSING"
  | "STATE_NON_DETERMINISTIC"
  | "INVALID_TRANSITION_ALLOWED"
  | "VALID_TRANSITION_BLOCKED"
  | "STATE_SKIP_ALLOWED"
  | "STATE_REGRESSION_ALLOWED"
  | "ARCHIVED_REACTIVATION_ALLOWED"
  | "IDENTITY_MISSING"
  | "IDENTITY_DUPLICATE"
  | "IDENTITY_NOT_IMMUTABLE"
  | "ROOT_ID_MUTATED"
  | "TENANT_ID_MUTATED"
  | "CREATED_TIMESTAMP_MUTATED"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_LINKAGE_ALLOWED"
  | "CROSS_TENANT_LINEAGE_ALLOWED"
  | "CROSS_TENANT_REPLAY_ALLOWED"
  | "TENANT_MISMATCH_UNDETECTED"
  | "LIFECYCLE_ENGINE_MISSING"
  | "LIFECYCLE_NOT_REPRODUCIBLE"
  | "LIFECYCLE_EVENT_MISSING"
  | "LIFECYCLE_MISMATCH_UNDETECTED"
  | "RECOMMENDATION_HISTORY_NOT_PRESERVED"
  | "ARCHIVAL_FINALITY_FAILURE"
  | "LINEAGE_REFS_MISSING"
  | "LINEAGE_NOT_RECONSTRUCTABLE"
  | "LINEAGE_BREAK_UNDETECTED"
  | "ROOT_LINEAGE_MISSING"
  | "SUPERSESSION_HISTORY_MISSING"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "REPLAY_MISMATCH_UNDETECTED"
  | "RECONSTRUCTION_HASH_MISSING"
  | "REPLAY_OUTPUT_HASH_MISMATCH"
  | "IDENTIFIER_MUTATION_ALLOWED"
  | "MUTATION_ATTEMPT_NOT_RECORDED"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "TRUTH_LEDGER_REF_MISSING"
  | "FAILED_TEST_NOT_RETAINED"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "OPERATOR_VISIBILITY_INCOMPLETE";

export type GovernancePolicyScope = Readonly<{
  policy_refs: readonly string[];
  policy_domains: readonly ("runtime_policy" | "tenant_policy" | "mission_policy" | "evidence_policy" | "escalation_policy" | "recommendation_policy")[];
  policy_version_refs: readonly string[];
}>;

export type GovernanceScope = Readonly<{
  authority_mode: "advisory_only";
  execution_authority: "prohibited";
  operator_supremacy: "required";
  tenant_isolation: "required";
  fail_closed: "required";
}>;

export type GovernanceEvidenceRequirements = Readonly<{
  evidence_refs_required: boolean;
  minimum_evidence_count: number;
  evidence_integrity_required: boolean;
  evidence_lineage_required: boolean;
  unsupported_claims_allowed: boolean;
}>;

export type GovernanceConfidenceRequirements = Readonly<{
  confidence_score_required: boolean;
  confidence_lineage_required: boolean;
  minimum_confidence_threshold: number;
  uncertainty_required: boolean;
  confidence_replay_required: boolean;
}>;

export type GovernanceLineageRequirements = Readonly<{
  parent_refs_required: boolean;
  evidence_lineage_required: boolean;
  policy_lineage_required: boolean;
  recommendation_lineage_required: boolean;
  truth_ledger_link_required: boolean;
}>;

export type GovernanceReplayRequirements = Readonly<{
  replay_refs_required: boolean;
  replay_inputs_required: boolean;
  replay_policy_snapshot_required: boolean;
  replay_evidence_snapshot_required: boolean;
  replay_output_hash_required: boolean;
  deterministic_replay_required: boolean;
}>;

export type GovernanceRecommendationRequirements = Readonly<{
  recommendation_allowed: boolean;
  advisory_only_required: boolean;
  evidence_required: boolean;
  confidence_required: boolean;
  policy_support_required: boolean;
  escalation_required_on_conflict: boolean;
}>;

export type GovernanceIntelligenceMetadata = Readonly<{
  schema_version: "governance-intelligence-contract/v7A.1";
  contract_hash?: string;
  created_by: string;
  source_system: "mission-control";
  truth_ledger_baseline_ref: string;
}>;

export type GovernanceIntelligenceRecord = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  created_timestamp: string;
  updated_timestamp: string;
  metadata: GovernanceIntelligenceMetadata;
  policy_scope: GovernancePolicyScope;
  governance_scope: GovernanceScope;
  evidence_requirements: GovernanceEvidenceRequirements;
  confidence_requirements: GovernanceConfidenceRequirements;
  lineage_requirements: GovernanceLineageRequirements;
  replay_requirements: GovernanceReplayRequirements;
  recommendation_requirements: GovernanceRecommendationRequirements;
  intelligence_state: GovernanceIntelligenceState;
  confidence_score: number;
  uncertainty_summary: string;
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  recommendation_refs: readonly string[];
  escalation_refs: readonly string[];
  certification_status: GovernanceIntelligenceCertificationStatus;
}>;

export type GovernanceIntelligenceValidationFailure = Readonly<{
  failure_id: string;
  category: GovernanceIntelligenceFailureCategory;
  field_path: string;
  reason: string;
  fail_closed: true;
}>;

export type GovernanceIntelligenceValidationResult = Readonly<{
  validation_id: string;
  governance_intelligence_id?: string;
  state: GovernanceIntelligenceValidationState;
  contract_hash?: string;
  failures: readonly GovernanceIntelligenceValidationFailure[];
  warnings: readonly string[];
  deterministic: true;
  advisoryOnly: true;
  executionAllowed: false;
  governanceOverrideAllowed: false;
}>;

export type GovernanceIntelligenceContractDoctrine = Readonly<{
  principles: readonly ("advisory-only" | "evidence-bound" | "policy-scoped" | "tenant-isolated" | "lineage-preserving" | "replayable" | "auditable" | "certification-ready" | "fail-closed")[];
  allowed_behaviors: readonly string[];
  prohibited_behaviors: readonly string[];
}>;

export type GovernanceIntelligenceStateDoctrine = Readonly<{
  principles: readonly ("explicit-states" | "validated-transitions" | "ledger-recorded" | "replayable-transitions" | "no-state-skipping" | "no-state-regression" | "archival-finality" | "fail-closed")[];
  allowed_transitions: Readonly<Record<GovernanceIntelligenceState, readonly GovernanceIntelligenceState[]>>;
  blocked_behaviors: readonly string[];
}>;

export type GovernanceStateTransitionEvent = Readonly<{
  transition_event_id: string;
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  from_state: GovernanceIntelligenceState;
  to_state: GovernanceIntelligenceState;
  transition_timestamp: string;
  transition_reason: string;
  transition_actor: string;
  transition_source: "mission-control-state-machine";
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  recommendation_refs: readonly string[];
  escalation_refs: readonly string[];
  previous_state_hash: string;
  new_state_hash: string;
  transition_hash: string;
  validation_result: GovernanceIntelligenceTransitionValidationState;
  failure_reason: GovernanceIntelligenceTransitionFailureReason | null;
  ledger_recorded: true;
}>;

export type GovernanceStateTransitionResult = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  previous_state: GovernanceIntelligenceState;
  requested_state: GovernanceIntelligenceState;
  final_state: GovernanceIntelligenceState;
  transition_allowed: boolean;
  validation_result: GovernanceIntelligenceTransitionValidationState;
  failure_reason: GovernanceIntelligenceTransitionFailureReason | null;
  state_hash: string;
  transition_hash: string;
  replay_ref: string;
  lineage_ref: string;
  certification_impact: GovernanceIntelligenceCertificationStatus;
  recorded_to_ledger: true;
}>;

export type GovernanceStateTransitionRecord = Readonly<{
  result: GovernanceStateTransitionResult;
  event: GovernanceStateTransitionEvent;
  record: GovernanceIntelligenceRecord;
}>;

export type GovernanceStateReplayResult = Readonly<{
  replay_id: string;
  governance_intelligence_id: string;
  reconstructed_state_path: readonly GovernanceIntelligenceState[];
  final_reconstructed_state: GovernanceIntelligenceState;
  validation_result: GovernanceIntelligenceTransitionValidationState;
  failure_reason: GovernanceIntelligenceTransitionFailureReason | null;
  transition_hashes: readonly string[];
  state_hashes: readonly string[];
  replay_certification_result: GovernanceIntelligenceCertificationStatus;
}>;

export type GovernanceStateObservabilitySurface = Readonly<{
  governance_intelligence_id: string;
  current_state: GovernanceIntelligenceState;
  previous_state: GovernanceIntelligenceState | null;
  allowed_next_states: readonly GovernanceIntelligenceState[];
  blocked_transitions: readonly GovernanceIntelligenceState[];
  transition_history: readonly GovernanceStateTransitionEvent[];
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  recommendation_refs: readonly string[];
  escalation_refs: readonly string[];
  certification_status: GovernanceIntelligenceCertificationStatus;
  failure_reason: GovernanceIntelligenceTransitionFailureReason | null;
}>;

export type GovernanceIntelligenceIdentityDoctrine = Readonly<{
  principles: readonly ("unique" | "immutable" | "tenant-scoped" | "mission-bound" | "lineage-aware" | "replay-linked" | "truth-ledger-anchored" | "version-aware" | "certification-ready" | "fail-closed")[];
  protected_fields: readonly ("governance_intelligence_id" | "tenant_id" | "created_timestamp" | "root_intelligence_id")[];
  allowed_identity_events: readonly string[];
  prohibited_identity_events: readonly string[];
}>;

export type GovernanceIntelligenceIdentity = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  parent_intelligence_id: string | null;
  root_intelligence_id: string;
  child_intelligence_ids: readonly string[];
  superseded_intelligence_ids: readonly string[];
  superseded_by_intelligence_id: string | null;
  version: number;
  created_timestamp: string;
  replay_id: string;
  reconstruction_hash: string;
  truth_ledger_reference: string;
  identity_hash: string;
  previous_identity_hash: string | null;
  certification_status: GovernanceIntelligenceCertificationStatus;
}>;

export type GovernanceIdentityValidationFailure = Readonly<{
  failure_id: string;
  reason: GovernanceIntelligenceIdentityFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
  ledger_recorded: true;
}>;

export type GovernanceIdentityValidationResult = Readonly<{
  validation_id: string;
  governance_intelligence_id?: string;
  validation_result: GovernanceIntelligenceValidationState;
  failures: readonly GovernanceIdentityValidationFailure[];
  identity_hash?: string;
  reconstruction_hash?: string;
  tenant_scoped: boolean;
  mission_bound: boolean;
  immutable: boolean;
  ledger_recorded: true;
}>;

export type GovernanceIdentityLineageReconstructionResult = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  root_intelligence_id: string;
  parent_chain: readonly string[];
  child_records: readonly string[];
  superseded_records: readonly string[];
  superseded_by: string | null;
  lineage_complete: boolean;
  lineage_breaks: readonly GovernanceIntelligenceIdentityFailureReason[];
  cross_tenant_violations: readonly GovernanceIntelligenceIdentityFailureReason[];
  lineage_hash: string;
  replay_ref: string;
  truth_ledger_reference: string;
}>;

export type GovernanceIdentityReplayPackage = Readonly<{
  replay_id: string;
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  identity_snapshot: GovernanceIntelligenceIdentity;
  lineage_snapshot: Readonly<{
    parent_intelligence_id: string | null;
    child_intelligence_ids: readonly string[];
    root_intelligence_id: string;
    superseded_intelligence_ids: readonly string[];
    superseded_by_intelligence_id: string | null;
  }>;
  reconstruction_hash: string;
  identity_hash: string;
  lineage_hash: string;
  truth_ledger_reference: string;
}>;

export type GovernanceIdentityReplayResult = Readonly<{
  replay_id: string;
  governance_intelligence_id: string;
  validation_result: GovernanceIntelligenceValidationState;
  failure_reason: GovernanceIntelligenceIdentityFailureReason | null;
  reconstructed_identity_hash: string;
  reconstructed_lineage_hash: string;
  reconstructed_reconstruction_hash: string;
  truth_ledger_reference: string;
}>;

export type GovernanceIdentityObservabilitySurface = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  parent_intelligence_id: string | null;
  root_intelligence_id: string;
  child_intelligence_ids: readonly string[];
  superseded_intelligence_ids: readonly string[];
  superseded_by_intelligence_id: string | null;
  version: number;
  created_timestamp: string;
  identity_hash: string;
  replay_id: string;
  reconstruction_hash: string;
  truth_ledger_reference: string;
  certification_status: GovernanceIntelligenceCertificationStatus;
  validation_result: GovernanceIntelligenceValidationState;
  failure_reason: GovernanceIntelligenceIdentityFailureReason | null;
}>;

export type GovernanceLifecycleDoctrine = Readonly<{
  principles: readonly ("deterministic" | "state-driven" | "identity-bound" | "tenant-scoped" | "evidence-aware" | "policy-scoped" | "lineage-preserving" | "replay-compatible" | "ledger-recorded" | "observable" | "fail-closed")[];
  stage_to_state: Readonly<Record<GovernanceLifecycleStage, GovernanceIntelligenceState>>;
  allowed_paths: readonly (readonly GovernanceLifecycleStage[])[];
  prohibited_behaviors: readonly string[];
}>;

export type GovernanceLifecycleEvent = Readonly<{
  lifecycle_event_id: string;
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  lifecycle_stage: GovernanceLifecycleStage;
  from_state: GovernanceIntelligenceState;
  to_state: GovernanceIntelligenceState;
  timestamp: string;
  actor: string;
  actor_type: "operator" | "system" | "certifier";
  event_source: "mission-control-lifecycle-engine";
  activity_type: GovernanceLifecycleActivityType;
  activity_summary: string;
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  recommendation_refs: readonly string[];
  escalation_refs: readonly string[];
  certification_refs: readonly string[];
  previous_lifecycle_hash: string;
  lifecycle_event_hash: string;
  resulting_state_hash: string;
  validation_status: GovernanceIntelligenceValidationState;
  failure_reason: GovernanceLifecycleFailureReason | null;
  recorded_to_truth_ledger: true;
  truth_ledger_reference: string;
}>;

export type GovernanceLifecycleTransitionResult = Readonly<{
  governance_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  from_lifecycle_stage: GovernanceLifecycleStage | null;
  to_lifecycle_stage: GovernanceLifecycleStage;
  from_state: GovernanceIntelligenceState;
  to_state: GovernanceIntelligenceState;
  final_state: GovernanceIntelligenceState;
  validation_status: GovernanceIntelligenceValidationState;
  failure_reason: GovernanceLifecycleFailureReason | null;
  lifecycle_event_hash: string;
  previous_lifecycle_event_hash: string;
  state_hash: string;
  replay_id: string;
  truth_ledger_reference: string;
  recorded_to_truth_ledger: true;
}>;

export type GovernanceLifecycleTransitionRecord = Readonly<{
  result: GovernanceLifecycleTransitionResult;
  event: GovernanceLifecycleEvent;
  record: GovernanceIntelligenceRecord;
  identity: GovernanceIntelligenceIdentity;
}>;

export type GovernanceLifecycleReplayResult = Readonly<{
  replay_id: string;
  governance_intelligence_id: string;
  reconstructed_lifecycle_path: readonly GovernanceLifecycleStage[];
  reconstructed_state_path: readonly GovernanceIntelligenceState[];
  reconstructed_recommendation_history: readonly string[];
  reconstructed_escalation_history: readonly string[];
  reconstructed_certification_status: GovernanceIntelligenceCertificationStatus;
  reconstructed_archive_status: "ACTIVE" | "ARCHIVED";
  validation_result: GovernanceIntelligenceValidationState;
  failure_reason: GovernanceLifecycleFailureReason | null;
  event_hashes: readonly string[];
  final_state: GovernanceIntelligenceState;
}>;

export type GovernanceLifecycleObservabilitySurface = Readonly<{
  governance_intelligence_id: string;
  current_lifecycle_stage: GovernanceLifecycleStage;
  current_state: GovernanceIntelligenceState;
  stage_timeline: readonly GovernanceLifecycleStage[];
  state_path: readonly GovernanceIntelligenceState[];
  actor_timeline: readonly string[];
  evidence_trace: readonly string[];
  policy_trace: readonly string[];
  lineage_trace: readonly string[];
  replay_trace: readonly string[];
  recommendation_history: readonly string[];
  escalation_history: readonly string[];
  certification_result: GovernanceIntelligenceCertificationStatus;
  archive_status: "ACTIVE" | "ARCHIVED";
  failure_reasons: readonly GovernanceLifecycleFailureReason[];
}>;

export type GovernanceFoundationCertificationCategoryResult = Readonly<{
  component: GovernanceFoundationCertificationComponent;
  validation_status: GovernanceIntelligenceCertificationStatus;
  tests_passed: readonly string[];
  tests_failed: readonly GovernanceFoundationCertificationFailureReason[];
  failure_reasons: readonly GovernanceFoundationCertificationFailureReason[];
  evidence_refs: readonly string[];
  critical: boolean;
}>;

export type GovernanceFoundationCertificationInputPackage = Readonly<{
  certification_package_id: string;
  contract_record?: GovernanceIntelligenceRecord;
  identity?: GovernanceIntelligenceIdentity;
  identity_registry: readonly GovernanceIntelligenceIdentity[];
  lifecycle_events: readonly GovernanceLifecycleEvent[];
  state_transition_events: readonly GovernanceStateTransitionEvent[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  certification_refs: readonly string[];
  conditional_findings: readonly string[];
  audit_evidence_refs: readonly string[];
}>;

export type GovernanceFoundationCertificationDecision = Readonly<{
  certification_gate_id: string;
  phase: "Phase 7A";
  gate_name: "Governance Intelligence Foundation Certification Gate";
  certification_state: GovernanceIntelligenceCertificationStatus;
  tested_components: readonly GovernanceFoundationCertificationComponent[];
  result_summary: string;
  failure_reasons: readonly GovernanceFoundationCertificationFailureReason[];
  conditional_findings: readonly string[];
  remediation_required: boolean;
  phase_7b_readiness: boolean;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  certified_by: string;
  certification_timestamp: string;
  certification_hash: string;
}>;

export type GovernanceFoundationCertificationResult = Readonly<{
  phase: "7A";
  gate: "7A.5 Foundation Certification Gate";
  certification_state: GovernanceIntelligenceCertificationStatus;
  phase_7b_ready: boolean;
  contract_result: GovernanceFoundationCertificationCategoryResult;
  state_machine_result: GovernanceFoundationCertificationCategoryResult;
  identity_result: GovernanceFoundationCertificationCategoryResult;
  tenant_isolation_result: GovernanceFoundationCertificationCategoryResult;
  lifecycle_result: GovernanceFoundationCertificationCategoryResult;
  lineage_result: GovernanceFoundationCertificationCategoryResult;
  replay_result: GovernanceFoundationCertificationCategoryResult;
  immutability_result: GovernanceFoundationCertificationCategoryResult;
  auditability_result: GovernanceFoundationCertificationCategoryResult;
  passed_tests: readonly string[];
  failed_tests: readonly string[];
  conditional_findings: readonly string[];
  critical_failures: readonly GovernanceFoundationCertificationFailureReason[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  certification_timestamp: string;
  certification_actor: string;
  certification_hash: string;
  decision: GovernanceFoundationCertificationDecision;
}>;
