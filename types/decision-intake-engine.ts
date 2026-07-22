export type DecisionIntakeMode = "SYNCHRONOUS" | "ASYNCHRONOUS" | "BATCH" | "REPLAY";

export type DecisionIntakeState =
  | "RECEIVED"
  | "AUTHENTICATED"
  | "VALIDATING"
  | "VALIDATED"
  | "RECORDED"
  | "FORWARDED"
  | "REJECTED"
  | "INVALID_SCHEMA"
  | "INVALID_SOURCE"
  | "INVALID_TENANT"
  | "INVALID_MISSION"
  | "INVALID_AUTHORITY"
  | "INTEGRITY_FAILURE";

export type DecisionIntakeFailureReason =
  | "UNKNOWN_SUBSYSTEM"
  | "REVOKED_SUBSYSTEM"
  | "UNSUPPORTED_SOURCE_VERSION"
  | "EXPIRED_CERTIFICATION"
  | "INACTIVE_COMPONENT"
  | "UNKNOWN_TENANT"
  | "INACTIVE_TENANT"
  | "TENANT_MISMATCH"
  | "CROSS_TENANT_SUBMISSION"
  | "UNKNOWN_MISSION"
  | "ARCHIVED_MISSION"
  | "COMPLETED_MISSION"
  | "MISSION_TENANT_MISMATCH"
  | "MISSION_NOT_ACCEPTING_ORCHESTRATION"
  | "MISSING_IDENTIFIER"
  | "MISSING_DECISION_TYPE"
  | "MISSING_PROPOSED_ACTION"
  | "MISSING_EVIDENCE_REFERENCES"
  | "MISSING_REPLAY_REFERENCES"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_AUTHORITY_METADATA"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "UNAUTHORIZED_SUBSYSTEM"
  | "INVALID_APPROVAL_LEVEL"
  | "POLICY_VIOLATION"
  | "HASH_MISMATCH"
  | "REPLAY_CORRUPTION"
  | "LINEAGE_INCONSISTENCY"
  | "DUPLICATE_REQUEST_IDENTIFIER"
  | "FOUNDATION_NOT_CERTIFIED";

export type DecisionCandidatePayload = Readonly<{
  candidate_id: string;
  decision_type: string;
  proposed_action: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  authority_metadata: Readonly<{
    authority_level: "ADVISORY" | "OPERATOR_APPROVAL_REQUIRED" | "GOVERNANCE_APPROVAL_REQUIRED";
    advisory_only: boolean;
    execution_authorized: boolean;
    requested_operations: readonly string[];
  }>;
  source_record_id: string;
  source_priority: number;
  payload_timestamp: string;
  tenant_id: string;
  mission_id: string;
  integrity_hash?: string;
}>;

export type DecisionIntakeRequest = Readonly<{
  request_id: string;
  source_system: string;
  source_version: string;
  tenant_id: string;
  mission_id: string;
  submission_mode: DecisionIntakeMode;
  candidate_payload: DecisionCandidatePayload;
  submission_timestamp: string;
}>;

export type IntakeValidationRecord = Readonly<{
  validation_id: string;
  request_id: string;
  source_result: "PASS" | "FAIL";
  tenant_result: "PASS" | "FAIL";
  mission_result: "PASS" | "FAIL";
  schema_result: "PASS" | "FAIL";
  authority_result: "PASS" | "FAIL";
  integrity_result: "PASS" | "FAIL";
  overall_result: "ACCEPTED" | "REJECTED";
  failure_reasons: readonly DecisionIntakeFailureReason[];
  integrity_hash: string;
}>;

export type IntakeSequenceRecord = Readonly<{
  sequence_id: string;
  mission_id: string;
  tenant_id: string;
  intake_sequence: number;
  ordering_basis: readonly string[];
  replay_reference: string;
  integrity_hash: string;
}>;

export type IntakeAuditRecord = Readonly<{
  audit_id: string;
  intake_id: string;
  processing_stage: DecisionIntakeState;
  timestamp: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type DecisionIntakeResult = Readonly<{
  intake_id: string;
  candidate_id: string;
  validation_result: "ACCEPTED" | "REJECTED";
  failure_reason?: DecisionIntakeFailureReason;
  failure_reasons: readonly DecisionIntakeFailureReason[];
  intake_sequence?: number;
  processing_mode: DecisionIntakeMode;
  state: DecisionIntakeState;
  replay_reference: string;
  forwarded_to_normalization: boolean;
  validation_record: IntakeValidationRecord;
  sequence_record?: IntakeSequenceRecord;
  audit_records: readonly IntakeAuditRecord[];
  integrity_hash: string;
  timestamp: string;
}>;

export type DecisionIntakeBatchResult = Readonly<{
  batch_id: string;
  validation_result: "ACCEPTED" | "REJECTED";
  partial_acceptance_allowed: boolean;
  results: readonly DecisionIntakeResult[];
  accepted_count: number;
  rejected_count: number;
  integrity_hash: string;
}>;

export type DecisionIntakeReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  original_hash: string;
  replayed_hash: string;
  reconstructed_sequences: readonly number[];
  failures: readonly DecisionIntakeFailureReason[];
  integrity_hash: string;
}>;

export type RegisteredDecisionSource = Readonly<{
  source_system: string;
  supported_versions: readonly string[];
  trusted_identity: string;
  certified: boolean;
  certification_expires_at: string;
  active: boolean;
  revoked: boolean;
  authority_levels: readonly string[];
  priority: number;
}>;

export type DecisionIntakeObservability = Readonly<{
  candidates_received: number;
  accepted_candidates: number;
  rejected_candidates: number;
  validation_failures: number;
  intake_latency: number;
  queue_depth: number;
  replay_accuracy: number;
  throughput: number;
  source_distribution: Readonly<Record<string, number>>;
  mission_distribution: Readonly<Record<string, number>>;
  tenant_distribution: Readonly<Record<string, number>>;
  processing_mode_distribution: Readonly<Record<DecisionIntakeMode, number>>;
}>;
