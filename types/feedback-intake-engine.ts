import type { OperatorFeedbackContractInput, OperatorFeedbackContractResult, OperatorFeedbackFailure, OperatorFeedbackRecord } from "@/types/operator-feedback-contract";

export type FeedbackIntakeDecision = "ACCEPTED" | "REJECTED" | "IGNORED_DUPLICATE" | "FLAGGED_FOR_REVIEW" | "RETRY_SCHEDULED";
export type FeedbackDuplicateStatus = "UNIQUE" | "EXACT_DUPLICATE" | "NEAR_DUPLICATE";
export type FeedbackAuthenticationStatus = "AUTHENTICATED" | "FAILED";
export type FeedbackAuthorizationStatus = "AUTHORIZED" | "DENIED";
export type FeedbackErrorClass = "NONE" | "RECOVERABLE" | "NON_RECOVERABLE";

export type FeedbackIntakeFailure =
  | "ANONYMOUS_FEEDBACK"
  | "INVALID_OPERATOR"
  | "UNAUTHORIZED_OPERATOR"
  | "MALFORMED_RECORD"
  | "CROSS_TENANT_FEEDBACK"
  | "MISSING_MISSION_REFERENCE"
  | "MISSING_DECISION_REFERENCE"
  | "MISSING_PACKAGE_REFERENCE"
  | "MISSING_REPLAY_LINEAGE"
  | "INVALID_REPLAY_REFERENCE"
  | "INVALID_EVIDENCE_REFERENCE"
  | "DUPLICATE_IMMUTABLE_IDENTIFIER"
  | "INVALID_SCHEMA_VERSION"
  | "CORRUPTED_INTEGRITY_HASH"
  | "GOVERNANCE_VIOLATION"
  | "QUEUE_UNAVAILABLE"
  | "TRANSIENT_SERVICE_TIMEOUT";

export type FeedbackIntakeScenario =
  | OperatorFeedbackContractInput["scenario"]
  | "BASELINE"
  | "ANONYMOUS"
  | "UNAUTHORIZED_OPERATOR"
  | "MISSING_PACKAGE_REFERENCE"
  | "INVALID_REPLAY_REFERENCE"
  | "INVALID_EVIDENCE_REFERENCE"
  | "EXACT_DUPLICATE"
  | "NEAR_DUPLICATE"
  | "QUEUE_UNAVAILABLE"
  | "TRANSIENT_SERVICE_TIMEOUT";

export type FeedbackAuthenticationResult = Readonly<{
  authentication_id: string;
  operator_id: string;
  status: FeedbackAuthenticationStatus;
  authentication_method: string;
  authentication_strength: "LOW" | "STANDARD" | "STRONG";
  credential_fresh: boolean;
  integrity_hash: string;
}>;

export type FeedbackAuthorizationResult = Readonly<{
  authorization_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  status: FeedbackAuthorizationStatus;
  role_permissions: readonly string[];
  governance_restrictions: readonly string[];
  integrity_hash: string;
}>;

export type FeedbackReplayRegistration = Readonly<{
  replay_registration_id: string;
  replay_id: string;
  intake_timestamp: string;
  validation_ref: string;
  operator_id: string;
  submission_sequence: number;
  routing_history: readonly string[];
  replayable: boolean;
  integrity_hash: string;
}>;

export type FeedbackQueueEntry = Readonly<{
  queue_entry_id: string;
  queue_name: "feedback-normalization";
  queue_sequence: number;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  validation_status: FeedbackIntakeDecision;
  replay_id: string;
  append_only: true;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type FeedbackIntakeAuditEvent = Readonly<{
  audit_event_id: string;
  event_type: "SUBMISSION_RECEIVED" | "AUTHENTICATION" | "AUTHORIZATION" | "VALIDATION" | "DUPLICATE_DETECTION" | "REPLAY_REGISTRATION" | "QUEUE_PLACEMENT" | "REJECTION";
  outcome: string;
  rejection_reasons: readonly FeedbackIntakeFailure[];
  recorded_at: string;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type FeedbackIntakeApiSurface = Readonly<{
  api_id: string;
  submit_feedback: "POST /feedback-intake-engine/submit";
  retrieve_authentication: "POST /feedback-intake-engine/authentication";
  retrieve_authorization: "POST /feedback-intake-engine/authorization";
  retrieve_validation: "POST /feedback-intake-engine/validation";
  retrieve_duplicate_status: "POST /feedback-intake-engine/duplicates";
  retrieve_queue: "POST /feedback-intake-engine/queue";
  retrieve_audit: "POST /feedback-intake-engine/audit";
  replay_intake: "POST /feedback-intake-engine/replay";
  retrieve_contract: "GET /feedback-intake-engine/contract";
  normalization_supported: false;
  analysis_supported: false;
  adaptation_generation_supported: false;
  production_mutation_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackIntakeEngineInput = Readonly<{
  scenario?: FeedbackIntakeScenario;
  feedback?: Partial<OperatorFeedbackRecord>;
  contract_result?: OperatorFeedbackContractResult;
}>;

export type FeedbackIntakeEngineResult = Readonly<{
  feedback_intake_engine_version: "feedback-intake-engine/v1";
  api_surface: FeedbackIntakeApiSurface;
  intake_id: string;
  feedback_record: OperatorFeedbackRecord;
  authentication: FeedbackAuthenticationResult;
  authorization: FeedbackAuthorizationResult;
  contract_validation: OperatorFeedbackContractResult;
  duplicate_status: FeedbackDuplicateStatus;
  duplicate_reference: string;
  replay_registration: FeedbackReplayRegistration;
  queue_entry: FeedbackQueueEntry | null;
  audit_events: readonly FeedbackIntakeAuditEvent[];
  intake_decision: FeedbackIntakeDecision;
  failures: readonly FeedbackIntakeFailure[];
  error_class: FeedbackErrorClass;
  retry_policy: "NONE" | "DETERMINISTIC_BACKOFF";
  evidence_only: true;
  immutable_request_preserved: true;
  append_only_audit: true;
  deterministic: true;
  replayable: boolean;
  tenant_isolated: boolean;
  governance_compliant: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type FeedbackIntakeEngineFoundation = Readonly<{
  feedback_intake_engine_version: "feedback-intake-engine/v1";
  api_surface: FeedbackIntakeApiSurface;
  result: FeedbackIntakeEngineResult;
}>;
