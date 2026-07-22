import type { FeedbackDuplicateStatus, FeedbackIntakeEngineInput, FeedbackIntakeEngineResult } from "@/types/feedback-intake-engine";
import type { OperatorFeedbackRecord, OperatorFeedbackType } from "@/types/operator-feedback-contract";

export type NormalizedFeedbackType =
  | "APPROVAL_FEEDBACK"
  | "REJECTION_FEEDBACK"
  | "OVERRIDE_FEEDBACK"
  | "CLARITY_FEEDBACK"
  | "EVIDENCE_FEEDBACK"
  | "RISK_FEEDBACK"
  | "CONFIDENCE_FEEDBACK"
  | "GOVERNANCE_FEEDBACK"
  | "SIMULATION_FEEDBACK"
  | "ROLLBACK_FEEDBACK";

export type NormalizedConfidenceLevel = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "UNKNOWN";
export type DuplicateResolutionStatus = "UNIQUE" | "EXACT_DUPLICATE_REFERENCED" | "SEMANTIC_DUPLICATE_MERGED" | "INDEPENDENT_FEEDBACK";
export type FeedbackNormalizationState = "NORMALIZED" | "REJECTED";

export type FeedbackNormalizationFailure =
  | "UNSUPPORTED_FEEDBACK_CLASSIFICATION"
  | "MISSING_NORMALIZATION_RULE"
  | "INVALID_SEMANTIC_MAPPING_VERSION"
  | "CORRUPTED_FEEDBACK_RECORD"
  | "REPLAY_REFERENCE_MISSING"
  | "CONFIDENCE_MAPPING_UNDEFINED"
  | "DUPLICATE_RESOLUTION_CONFLICT"
  | "INTAKE_NOT_ACCEPTED"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_METADATA_INVALID";

export type FeedbackNormalizationScenario =
  | FeedbackIntakeEngineInput["scenario"]
  | "BASELINE"
  | "RAW_EVIDENCE_WORDING"
  | "RAW_CLARITY_WORDING"
  | "RAW_RISK_LOW_WORDING"
  | "RAW_CONFIDENCE_HIGH_WORDING"
  | "RAW_GOVERNANCE_WORDING"
  | "RAW_SIMULATION_WORDING"
  | "EXACT_DUPLICATE"
  | "SEMANTIC_DUPLICATE"
  | "INDEPENDENT_FEEDBACK"
  | "UNSUPPORTED_FEEDBACK_CLASSIFICATION"
  | "MISSING_NORMALIZATION_RULE"
  | "INVALID_SEMANTIC_MAPPING_VERSION"
  | "CORRUPTED_FEEDBACK_RECORD"
  | "REPLAY_REFERENCE_MISSING"
  | "CONFIDENCE_MAPPING_UNDEFINED"
  | "DUPLICATE_RESOLUTION_CONFLICT";

export type NormalizedFeedbackRecord = Readonly<{
  normalized_feedback_id: string;
  original_feedback_id: string;
  canonical_feedback_type: NormalizedFeedbackType;
  canonical_issue: string;
  normalized_summary: string;
  normalized_confidence: NormalizedConfidenceLevel;
  semantic_mapping_version: "feedback-semantic-map/v1";
  normalization_version: "feedback-normalization/v1";
  duplicate_resolution_status: DuplicateResolutionStatus;
  normalization_timestamp: string;
  replay_reference: string;
  original_operator_wording: string;
  preserved_evidence_refs: readonly string[];
  preserved_replay_refs: readonly string[];
  governance_metadata_hash: string;
  integrity_hash: string;
}>;

export type FeedbackNormalizationExplanation = Readonly<{
  explanation_id: string;
  original_wording: string;
  normalization_rule: string;
  semantic_mapping: string;
  classification_decision: string;
  confidence_calibration: string;
  duplicate_resolution: string;
  integrity_hash: string;
}>;

export type FeedbackNormalizationAuditEvent = Readonly<{
  audit_event_id: string;
  event_type: "PREPROCESSING" | "NORMALIZATION_RULE" | "CLASSIFICATION" | "SEMANTIC_MAPPING" | "DUPLICATE_RESOLUTION" | "CONFIDENCE_CALIBRATION" | "NORMALIZED_RECORD" | "REJECTION";
  outcome: string;
  recorded_at: string;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type FeedbackNormalizationApiSurface = Readonly<{
  api_id: string;
  normalize_feedback: "POST /feedback-normalization-engine/normalize";
  retrieve_record: "POST /feedback-normalization-engine/record";
  retrieve_explanation: "POST /feedback-normalization-engine/explanation";
  retrieve_audit: "POST /feedback-normalization-engine/audit";
  retrieve_vocabulary: "GET /feedback-normalization-engine/vocabulary";
  replay_normalization: "POST /feedback-normalization-engine/replay";
  retrieve_contract: "GET /feedback-normalization-engine/contract";
  adaptation_generation_supported: false;
  learning_supported: false;
  production_mutation_supported: false;
  governance_override_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackNormalizationEngineInput = Readonly<{
  scenario?: FeedbackNormalizationScenario;
  intake_result?: FeedbackIntakeEngineResult;
  feedback?: Partial<OperatorFeedbackRecord>;
}>;

export type FeedbackNormalizationEngineResult = Readonly<{
  feedback_normalization_engine_version: "feedback-normalization-engine/v1";
  api_surface: FeedbackNormalizationApiSurface;
  intake_result: FeedbackIntakeEngineResult;
  normalized_record: NormalizedFeedbackRecord | null;
  explanation: FeedbackNormalizationExplanation;
  audit_events: readonly FeedbackNormalizationAuditEvent[];
  canonical_vocabulary: readonly string[];
  duplicate_status: FeedbackDuplicateStatus;
  normalization_state: FeedbackNormalizationState;
  failures: readonly FeedbackNormalizationFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  evidence_only: true;
  immutable_history: true;
  append_only_audit: true;
}>;

export type FeedbackNormalizationEngineFoundation = Readonly<{
  feedback_normalization_engine_version: "feedback-normalization-engine/v1";
  api_surface: FeedbackNormalizationApiSurface;
  result: FeedbackNormalizationEngineResult;
}>;
