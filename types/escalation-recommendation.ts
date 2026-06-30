import type { EscalationConfidenceLevel, EscalationReplayState } from "./escalation-contract";
import type { EscalationPrioritizationResult, EscalationPrioritizationScenario, EscalationPriorityLevel } from "./escalation-prioritization";

export type EscalationRecommendationType =
  | "OPERATOR_NOTIFICATION"
  | "GOVERNANCE_REVIEW"
  | "POLICY_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "AUTHORITY_REVIEW"
  | "EMERGENCY_GOVERNANCE_REVIEW";

export type EscalationRecommendationScenario =
  | EscalationPrioritizationScenario
  | "MISSING_PRIORITY_ASSIGNMENT"
  | "UNSUPPORTED_RECOMMENDATION"
  | "MISSING_RECOMMENDATION_EVIDENCE"
  | "INCOMPLETE_RECOMMENDATION_CONTEXT"
  | "RECOMMENDATION_REPLAY_MISMATCH"
  | "BROKEN_RECOMMENDATION_LINEAGE"
  | "CROSS_TENANT_RECOMMENDATION"
  | "HIDDEN_RECOMMENDATION_STATE"
  | "RECOMMENDATION_HASH_MISMATCH"
  | "RECOMMENDATION_RESULT_HASH_MISMATCH";

export type EscalationRecommendationGovernanceContext = Readonly<{
  constitutional_context: readonly string[];
  authority_context: readonly string[];
  policy_context: readonly string[];
  compliance_context: readonly string[];
  risk_context: readonly string[];
  operational_context: readonly string[];
}>;

export type EscalationRecommendationEvidence = Readonly<{
  escalation_id: string;
  priority_id: string;
  evidence_ids: readonly string[];
  truth_record_ids: readonly string[];
  policy_ids: readonly string[];
  compliance_ids: readonly string[];
  risk_ids: readonly string[];
  authority_ids: readonly string[];
}>;

export type EscalationRecommendationConfidence = Readonly<{
  confidence_score: number;
  confidence_level: EscalationConfidenceLevel;
  confidence_reason: string;
  confidence_inputs: readonly string[];
  confidence_hash: string;
}>;

export type EscalationRecommendationLineage = Readonly<{
  recommendation_lineage_id: string;
  parent_recommendation: string | null;
  root_recommendation: string;
  related_escalations: readonly string[];
  recommendation_history: readonly string[];
  trigger_chain: readonly string[];
}>;

export type EscalationRecommendationRecord = Readonly<{
  recommendation_id: string;
  recommendation_type: EscalationRecommendationType;
  recommended_action: string;
  recommended_review: string;
  priority_level: EscalationPriorityLevel;
  priority_id: string;
  escalation_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_reason: string;
  recommendation_timestamp: string;
  governance_context: EscalationRecommendationGovernanceContext;
  evidence: EscalationRecommendationEvidence;
  confidence: EscalationRecommendationConfidence;
  lineage: EscalationRecommendationLineage;
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  explainability: Readonly<{
    why_generated: string;
    triggering_escalation: string;
    priority_influence: string;
    constitutional_basis: readonly string[];
    authority_basis: readonly string[];
    policy_basis: readonly string[];
    compliance_basis: readonly string[];
    evidence_basis: readonly string[];
    alternatives_not_selected: readonly string[];
    confidence_explanation: string;
  }>;
  certification_metadata: Readonly<{
    recommendation_version: "ESCALATION-RECOMMENDATION-V1";
    validation_state: EscalationRecommendationValidationState;
    certification_prerequisite: "ESCALATION-CERTIFICATION-PREREQ-V1";
  }>;
  advisory_boundary: Readonly<{
    advisory_only: true;
    execution_authority: false;
    mutation_authority: false;
    policy_modification_authority: false;
    approval_authority: false;
    operator_override_authority: false;
  }>;
  recommendation_hash: string;
}>;

export type EscalationRecommendationLedgerRecord = Readonly<{
  recommendation_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  source_prioritization_hash: string;
  recommendation_ids: readonly string[];
  escalation_ids: readonly string[];
  priority_ids: readonly string[];
  recommendation_types: readonly EscalationRecommendationType[];
  evidence_refs: readonly string[];
  governance_context_refs: readonly string[];
  confidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  recommendation_hash: string;
  recorded_timestamp: string;
}>;

export type EscalationRecommendationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type EscalationRecommendationResult = Readonly<{
  contract_version: "ESCALATION-RECOMMENDATION-V1";
  tenant_id: string;
  mission_id: string;
  recommender_version: "ESCALATION-RECOMMENDATION-V1";
  source_prioritization: EscalationPrioritizationResult;
  recommendation_records: readonly EscalationRecommendationRecord[];
  recommended_escalation_ids: readonly string[];
  ledger_record: EscalationRecommendationLedgerRecord;
  validation_state: EscalationRecommendationValidationState;
  replay_state: EscalationReplayState;
  recommendation_hash: string;
}>;

export type EscalationRecommendationFailureReason =
  | "RECOMMENDATION_RESULT_MISSING"
  | "SOURCE_PRIORITIZATION_INVALID"
  | "INVALID_ESCALATION_RECORD"
  | "MISSING_PRIORITY_ASSIGNMENT"
  | "ESCALATION_NOT_RECOMMENDED"
  | "DUPLICATE_RECOMMENDATION_RECORD"
  | "UNSUPPORTED_RECOMMENDATION_TYPE"
  | "INCOMPLETE_GOVERNANCE_CONTEXT"
  | "INCOMPLETE_EVIDENCE"
  | "CONFIDENCE_INVALID"
  | "CONFIDENCE_HASH_MISMATCH"
  | "REPLAY_MISMATCH_ACCEPTED"
  | "BROKEN_LINEAGE"
  | "MUTABLE_RECOMMENDATION_IDENTIFIER"
  | "CROSS_TENANT_RECOMMENDATION"
  | "HIDDEN_RECOMMENDATION_STATE"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "TRUTH_LEDGER_RECORD_MISSING"
  | "RECOMMENDATION_HASH_MISMATCH"
  | "RECOMMENDATION_RESULT_HASH_MISMATCH";

export type EscalationRecommendationValidationFailure = Readonly<{
  failure_id: string;
  reason: EscalationRecommendationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type EscalationRecommendationValidationResult = Readonly<{
  validation_state: EscalationRecommendationValidationState;
  validator_version: "ESCALATION-RECOMMENDATION-VALIDATOR-V1";
  checks: Readonly<{
    source_prioritization_valid: boolean;
    escalation_records_valid: boolean;
    priority_assignments_present: boolean;
    every_priority_recommended: boolean;
    recommendation_types_supported: boolean;
    governance_context_complete: boolean;
    evidence_complete: boolean;
    confidence_reproducible: boolean;
    lineage_reconstructable: boolean;
    replay_ready: boolean;
    truth_ledger_recorded: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly EscalationRecommendationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type EscalationRecommendationReplayResult = Readonly<{
  replay_id: string;
  replay_state: EscalationReplayState;
  reconstructed_recommendation_hash: string;
  expected_recommendation_hash: string;
  reconstructed_recommendation_ids: readonly string[];
  expected_recommendation_ids: readonly string[];
  failure_reason: EscalationRecommendationFailureReason | null;
}>;

export type EscalationRecommendationMetrics = Readonly<{
  recommendations_generated: number;
  recommendation_distribution: Readonly<Record<EscalationRecommendationType, number>>;
  recommendation_acceptance_rate: number;
  recommendation_confidence_distribution: Readonly<Record<EscalationConfidenceLevel, number>>;
  constitutional_review_frequency: number;
  authority_review_frequency: number;
  policy_review_frequency: number;
  compliance_review_frequency: number;
  emergency_governance_review_frequency: number;
  replay_success_rate: number;
  evidence_completeness: number;
  recommendation_generation_latency_ms: number;
}>;

export type EscalationRecommendationObservabilitySurface = Readonly<{
  recommendation_count: number;
  recommendation_ids: readonly string[];
  recommendation_types: readonly EscalationRecommendationType[];
  recommended_reviews: readonly string[];
  recommendation_reasons: readonly string[];
  priorities: readonly EscalationPriorityLevel[];
  confidence: readonly Readonly<{ score: number; level: EscalationConfidenceLevel }>[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  ledger_refs: readonly string[];
  replay_state: EscalationReplayState;
  advisory_only_notice: string;
  metrics: EscalationRecommendationMetrics;
  validation_failures: readonly EscalationRecommendationFailureReason[];
}>;

export type EscalationRecommendationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "priority-driven" | "evidence-backed" | "governance-policy-evaluated" | "confidence-reproducible" | "lineage-preserving" | "truth-ledger-recorded" | "replayable" | "explainable" | "constitutional-supremacy" | "authority-preserving" | "advisory-only" | "tenant-safe" | "certification-ready" | "fail-closed")[];
  supported_recommendation_types: readonly EscalationRecommendationType[];
  decision_matrix: Readonly<Record<EscalationPriorityLevel, readonly EscalationRecommendationType[]>>;
  recommender_version: "ESCALATION-RECOMMENDATION-V1";
}>;
