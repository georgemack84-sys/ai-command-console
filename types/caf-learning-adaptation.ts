export type LearningLifecycleState = "CANDIDATE_IDENTIFIED" | "EVIDENCE_COLLECTED" | "PROPOSED" | "GOVERNANCE_REVIEW" | "REPLAY_VALIDATION" | "SAFETY_VALIDATION" | "QUALIFICATION" | "APPROVED" | "ACTIVATED" | "SUPERSEDED" | "RETIRED";
export type AdaptationProposalType = "BEHAVIORAL_REFINEMENT" | "OPTIMIZATION_CANDIDATE" | "RECOMMENDATION_SYNTHESIS" | "PROPOSAL_PRIORITIZATION";
export type AdaptationDecision = "QUALIFIED" | "REQUIRES_APPROVAL" | "REJECTED" | "FAIL_CLOSED";
export type LearningCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type LearningAdaptationFailure =
  | "P3_5_PLANNING_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "P3_8_SAFETY_INVALID"
  | "P3_10_OBSERVABILITY_INVALID"
  | "P3_11_REPLAY_INVALID"
  | "CCI_REPLAY_NOT_CONSUMED"
  | "CCI_REPLAY_DUPLICATED"
  | "LEARNING_LIFECYCLE_NON_DETERMINISTIC"
  | "ADAPTATION_PROPOSAL_MISSING"
  | "ADAPTATION_QUALIFICATION_INVALID"
  | "AUTHORITY_GATE_BYPASSED"
  | "POLICY_GATE_BYPASSED"
  | "SAFETY_GATE_BYPASSED"
  | "REPLAY_VALIDATION_MISSING"
  | "ADAPTATION_EVIDENCE_MISSING"
  | "LEARNING_REGISTRY_INCOMPLETE"
  | "BOUNDED_IMPROVEMENT_VIOLATED"
  | "AUTHORITY_EXPANSION_ATTEMPTED"
  | "CONSTITUTIONAL_GOVERNANCE_MODIFIED"
  | "ADAPTATION_NOT_EXPLAINABLE"
  | "ADAPTATION_LINEAGE_INCOMPLETE"
  | "ADAPTATION_OBSERVABILITY_INCOMPLETE"
  | "APPROVAL_INTEGRATION_MISSING"
  | "REPLAY_DIVERGENCE"
  | "CERTIFICATION_PRUNED";

export type LearningAdaptationScenario = "BASELINE" | LearningAdaptationFailure;
export type LearningAdaptationInput = Readonly<{ scenario?: LearningAdaptationScenario; tenant_id?: string }>;

export type AdaptationProposal = Readonly<{
  proposal_id: string;
  agent_id: string;
  proposal_type: AdaptationProposalType;
  rationale: string;
  expected_improvement: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  safety_refs: readonly string[];
  created_at: string;
  explainable: boolean;
  integrity_hash: string;
}>;

export type AdaptationAssessment = Readonly<{
  assessment_id: string;
  proposal_id: string;
  replay_result: "VALIDATED" | "MISSING" | "DIVERGED";
  governance_result: "COMPLIANT" | "BYPASSED" | "VIOLATION";
  safety_result: "SAFE" | "BYPASSED" | "UNSAFE";
  qualification_result: AdaptationDecision;
  bounded_improvement_result: "WITHIN_LIMITS" | "VIOLATED";
  approval_required: boolean;
  assessment_summary: string;
  integrity_hash: string;
}>;

export type LearningLifecycle = Readonly<{
  lifecycle_id: string;
  states: readonly LearningLifecycleState[];
  deterministic: boolean;
  current_state: LearningLifecycleState;
  integrity_hash: string;
}>;

export type LearningRecord = Readonly<{
  learning_record_id: string;
  agent_id: string;
  lifecycle_state: LearningLifecycleState;
  proposal_refs: readonly string[];
  adaptation_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  approval_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type AdaptationEvidenceRecord = Readonly<{
  evidence_id: string;
  proposal_id: string;
  evidence_type: "PROPOSAL" | "REPLAY" | "GOVERNANCE" | "SAFETY" | "QUALIFICATION" | "APPROVAL" | "ACTIVATION";
  source_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  timestamp: string;
  immutable: boolean;
  integrity_hash: string;
}>;

export type BoundedImprovementContract = Readonly<{
  bounded_contract_id: string;
  improvement_ceiling_ref: string;
  optimization_limit_refs: readonly string[];
  authority_preserved: boolean;
  behavioral_boundaries_preserved: boolean;
  constitutional_limits_preserved: boolean;
  rollback_eligible: boolean;
  integrity_hash: string;
}>;

export type LearningGovernanceWorkflow = Readonly<{
  workflow_id: string;
  policy_review_ref: string;
  authority_validation_ref: string;
  safety_validation_ref: string;
  approval_workflow_ref: string;
  activation_ref: string;
  authority_gate_enforced: boolean;
  policy_gate_enforced: boolean;
  safety_gate_enforced: boolean;
  approval_integrated: boolean;
  integrity_hash: string;
}>;

export type AdaptationTelemetry = Readonly<{
  telemetry_id: string;
  metrics: readonly string[];
  dashboard_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type AdaptationReplayValidation = Readonly<{
  replay_validation_id: string;
  p3_11_replay_ref: string;
  cci_replay_ref: string;
  replay_validated: boolean;
  deterministic: boolean;
  duplicates_replay_infrastructure: boolean;
  integrity_hash: string;
}>;

export type LearningAdaptationCertification = Readonly<{
  certification_id: string;
  outcome: LearningCertificationOutcome;
  certified: boolean;
  governed_adaptation: boolean;
  lifecycle_deterministic: boolean;
  proposal_present: boolean;
  qualification_valid: boolean;
  replay_validated: boolean;
  cci_replay_consumed_without_duplication: boolean;
  gates_enforced: boolean;
  evidence_immutable: boolean;
  registry_complete: boolean;
  bounded_improvement: boolean;
  no_authority_expansion: boolean;
  no_constitutional_modification: boolean;
  explainable: boolean;
  lineage_complete: boolean;
  observability_complete: boolean;
  approval_integrated: boolean;
  replay_reproducible: boolean;
  failures: readonly LearningAdaptationFailure[];
  integrity_hash: string;
}>;

export type LearningAdaptationResult = Readonly<{
  phase_version: "caf-learning-adaptation/v3.12";
  phase_identifier: "CafLearningAdaptation";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  observability_telemetry_ref: "caf-observability-telemetry/v3.10";
  behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11";
  cci_replay_ref: "Program 2 - CCI Replay Infrastructure";
  cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure";
  cci_registry_ref: "Program 2 - CCI Registry";
  cci_storage_ref: "Program 2 - CCI Storage";
  lifecycle: LearningLifecycle;
  proposal: AdaptationProposal;
  assessment: AdaptationAssessment;
  learning_record: LearningRecord;
  evidence_records: readonly AdaptationEvidenceRecord[];
  bounded_improvement: BoundedImprovementContract;
  governance_workflow: LearningGovernanceWorkflow;
  telemetry: AdaptationTelemetry;
  replay_validation: AdaptationReplayValidation;
  certification: LearningAdaptationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type LearningAdaptationValidation = Readonly<{
  valid: boolean;
  outcome: LearningCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  lifecycle_valid: boolean;
  proposal_valid: boolean;
  assessment_valid: boolean;
  registry_valid: boolean;
  evidence_valid: boolean;
  bounded_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  certification_valid: boolean;
  failures: readonly LearningAdaptationFailure[];
  integrity_hash: string;
}>;

export type LearningAdaptationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-learning-adaptation/v3.12";
    owns_governed_learning: true;
    owns_adaptation_proposals: true;
    owns_learning_registry: true;
    owns_adaptation_evidence: true;
    owns_runtime_execution: false;
    owns_replay_infrastructure: false;
    owns_certification: false;
    may_expand_authority: false;
    may_modify_constitutional_governance: false;
  }>;
  result: LearningAdaptationResult;
  validation: LearningAdaptationValidation;
}>;
