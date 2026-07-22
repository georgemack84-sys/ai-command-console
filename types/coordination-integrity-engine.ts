export type IntegrityArtifactType = "GENESIS" | "PLANNING" | "DELEGATION" | "COMMUNICATION" | "COORDINATION_EVENT" | "SHARED_STATE" | "REPLAY" | "CERTIFICATION";
export type IntegrityVerificationState = "INITIALIZING" | "REGISTERING" | "HASHING" | "CHAINING" | "VERIFYING" | "MONITORING" | "VALID" | "DEGRADED" | "CORRUPTED" | "UNVERIFIED" | "CERTIFIED";
export type IntegrityStatusState = "VALID" | "DEGRADED" | "CORRUPTED" | "UNVERIFIED";
export type CoordinationEventCategory = "SESSION_CREATED" | "PLAN_GENERATED" | "TASK_DELEGATED" | "MESSAGE_SENT" | "STATE_UPDATED" | "CONFLICT_DETECTED" | "ESCALATION_REQUESTED" | "GOVERNANCE_VALIDATED" | "MISSION_COMPLETED";
export type IntegrityScenario = "BASELINE" | "COMMUNICATION_HASH_MISMATCH" | "DELEGATION_HASH_MISMATCH" | "PLAN_HASH_CORRUPTION" | "EVENT_HASH_MISMATCH" | "MISSING_COORDINATION_EVENT" | "SHARED_STATE_CORRUPTION" | "REPLAY_REFERENCE_CORRUPTION" | "ALTERED_MESSAGE" | "UNAUTHORIZED_COMMUNICATION_CHANGE" | "BROKEN_HASH_CHAIN" | "INVALID_SIGNATURE" | "REPLAY_MISMATCH" | "CROSS_TENANT_CONTAMINATION";
export type IntegrityFailure = "COMMUNICATION_HASH_MISMATCH_DETECTED" | "DELEGATION_HASH_MISMATCH_DETECTED" | "PLAN_HASH_CORRUPTION_DETECTED" | "COORDINATION_EVENT_HASH_MISMATCH_DETECTED" | "MISSING_COORDINATION_EVENT_DETECTED" | "CORRUPTED_SHARED_STATE_DETECTED" | "REPLAY_REFERENCE_CORRUPTION_DETECTED" | "ALTERED_MESSAGE_DETECTED" | "UNAUTHORIZED_COMMUNICATION_CHANGE_DETECTED" | "BROKEN_HASH_CHAIN_DETECTED" | "INTEGRITY_SIGNATURE_INVALID" | "REPLAY_MISMATCH_DETECTED" | "CROSS_TENANT_INTEGRITY_CONTAMINATION_DETECTED";

export type CoordinationIntegrityContract = Readonly<{
  coordination_integrity_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  integrity_policy_version: "coordination-integrity-policy/v8ALT.7.6";
  hash_algorithm: "SHA-256-CANONICAL";
  hash_chain_version: "coordination-hash-chain/v8ALT.7.6";
  replay_reference_policy: readonly string[];
  retention_policy: readonly string[];
  verification_policy: readonly string[];
  created_timestamp: string;
  immutable: true;
  append_only: true;
  governance_bound: true;
  tenant_isolated: true;
  integrity_hash: string;
}>;

export type IntegrityLedgerEntry = Readonly<{
  coordination_integrity_entry_id: string;
  coordination_session_id: string;
  artifact_type: IntegrityArtifactType;
  artifact_reference: string;
  artifact_hash: string;
  expected_hash: string;
  parent_hash: string;
  lineage_reference: string;
  replay_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  tenant_id: string;
  verification_status: "VERIFIED" | "FAILED" | "MISSING";
  timestamp: string;
  integrity_signature: string;
}>;

export type HashVerificationRecord = Readonly<{
  verification_id: string;
  artifact_reference: string;
  expected_hash: string;
  computed_hash: string;
  verification_result: "MATCH" | "MISMATCH" | "MISSING";
  verification_timestamp: string;
}>;

export type ReplayReferenceRecord = Readonly<{
  replay_reference_id: string;
  coordination_session_id: string;
  artifact_reference: string;
  hash_reference: string;
  lineage_reference: string;
  verification_status: "VALID" | "CORRUPTED";
  timestamp: string;
}>;

export type SharedStateRecord = Readonly<{
  shared_state_id: string;
  coordination_session_id: string;
  mission_state: string;
  planning_state: string;
  delegation_state: string;
  governance_state: string;
  authority_state: string;
  runtime_state: string;
  state_hash: string;
  timestamp: string;
}>;

export type TamperDetectionReport = Readonly<{
  tamper_report_id: string;
  coordination_session_id: string;
  artifact_reference: string;
  tamper_type: IntegrityFailure;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detected_timestamp: string;
  recommended_action: string;
}>;

export type IntegrityStatus = Readonly<{
  state: IntegrityStatusState;
  verification_score: number;
  replay_ready: boolean;
  certification_ready: boolean;
  integrity_confidence: number;
}>;

export type IntegrityOperationEvent = Readonly<{
  event_id: string;
  coordination_session_id: string;
  artifact_reference: string;
  operation_type: "REGISTER" | "COMPUTE_HASH" | "VERIFY_CHAIN" | "VALIDATE_REPLAY" | "DETECT_TAMPERING" | "REPORT";
  verification_state: IntegrityVerificationState;
  previous_hash: string;
  new_hash: string;
  verification_result: "PASS" | "FAIL";
  timestamp: string;
  integrity_signature: string;
}>;

export type CoordinationIntegrityEvidence = Readonly<{
  integrity_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  artifact_references: readonly string[];
  communication_hashes: readonly string[];
  delegation_hashes: readonly string[];
  plan_hashes: readonly string[];
  event_hashes: readonly string[];
  shared_state_hashes: readonly string[];
  replay_hashes: readonly string[];
  verification_results: readonly HashVerificationRecord[];
  lineage_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type CoordinationIntegrityLedger = Readonly<{
  contract: CoordinationIntegrityContract;
  entries: readonly IntegrityLedgerEntry[];
  verifications: readonly HashVerificationRecord[];
  replay_references: readonly ReplayReferenceRecord[];
  shared_state: SharedStateRecord;
  tamper_reports: readonly TamperDetectionReport[];
  status: IntegrityStatus;
  events: readonly IntegrityOperationEvent[];
  evidence: CoordinationIntegrityEvidence;
  version: "coordination-integrity-engine/v8ALT.7.6";
  contract_hash: string;
}>;

export type CoordinationIntegrityInput = Readonly<{
  scenario?: IntegrityScenario;
  tenant_id?: string;
  mission_id?: string;
  ledger?: CoordinationIntegrityLedger;
  artifact?: unknown;
}>;

export type CoordinationIntegrityValidationResult = Readonly<{
  coordination_integrity_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  communication_hashes_valid: boolean;
  delegation_hashes_valid: boolean;
  plan_hashes_valid: boolean;
  event_hashes_valid: boolean;
  shared_state_hashes_valid: boolean;
  replay_references_valid: boolean;
  hash_chain_complete: boolean;
  lineage_preserved: boolean;
  deterministic_replay: boolean;
  immutable_ledger: boolean;
  governance_references_preserved: boolean;
  constitutional_references_preserved: boolean;
  signatures_valid: boolean;
  operator_visible: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  failures: readonly IntegrityFailure[];
  validation_hash: string;
}>;

export type CoordinationIntegrityReplayResult = Readonly<{
  replay_reference: string;
  coordination_integrity_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type CoordinationIntegrityObservabilitySurface = Readonly<{
  coordination_integrity_id: string;
  tenant_id: string;
  mission_id: string;
  ledger_entry_count: number;
  verification_count: number;
  tamper_report_count: number;
  status: IntegrityStatusState;
  contract_hash: string;
}>;

export type CoordinationIntegrityEngineBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "coordination-integrity-engine/v8ALT.7.6";
    final_state: "COORDINATION_INTEGRITY_ENGINE_CERTIFIED";
    states: readonly IntegrityVerificationState[];
    artifact_types: readonly IntegrityArtifactType[];
    principles: readonly string[];
  }>;
  ledger: CoordinationIntegrityLedger;
  validation: CoordinationIntegrityValidationResult;
  replay: CoordinationIntegrityReplayResult;
  observability: CoordinationIntegrityObservabilitySurface;
}>;
