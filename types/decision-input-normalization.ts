import type { DecisionCandidatePayload, DecisionIntakeFailureReason } from "@/types/decision-intake-engine";
import type { IntegrityVerificationResult } from "@/types/decision-candidate-integrity-verification";

export type NormalizationState =
  | "PENDING"
  | "TERMINOLOGY_NORMALIZED"
  | "IDENTIFIERS_NORMALIZED"
  | "REFERENCES_NORMALIZED"
  | "EVIDENCE_NORMALIZED"
  | "GOVERNANCE_NORMALIZED"
  | "REPLAY_NORMALIZED"
  | "AUTHORITY_NORMALIZED"
  | "ADVISORY_NORMALIZED"
  | "REGISTERED"
  | "DUPLICATE_EVALUATED"
  | "LEDGER_RECORDED"
  | "PASSED"
  | "FAILED_VALIDATION"
  | "FAILED_NORMALIZATION"
  | "FAILED_AUTHORITY"
  | "FAILED_DUPLICATE"
  | "FAILED_LEDGER";

export type NormalizationFailureReason =
  | "SOURCE_VALIDATION_FAILED"
  | "SCHEMA_VALIDATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "MALFORMED_PAYLOAD"
  | "UNKNOWN_SOURCE"
  | "TENANT_MISMATCH"
  | "GOVERNANCE_OMISSION"
  | "REPLAY_MISMATCH"
  | "AUTHORITY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "DUPLICATE_REPLAY_IDENTIFIER"
  | "REGISTRY_WRITE_REJECTED"
  | "LEDGER_WRITE_REJECTED";

export type DuplicateDecisionStatus = "NEW" | "DUPLICATE" | "UPDATED" | "SUPERSEDED" | "MERGED";

export type DecisionCandidate = Readonly<{
  candidate_id: string;
  source_system: string;
  source_record_ref: string;
  tenant_id: string;
  mission_id: string;
  decision_type: string;
  proposed_action: string;
  rationale_summary: string;
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  authority_required: boolean;
  operator_required: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type NormalizationRule = Readonly<{
  rule_id: string;
  stage: NormalizationState;
  description: string;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type InputNormalizationRequest = Readonly<{
  normalization_id: string;
  intake_id: string;
  source_system: string;
  tenant_id: string;
  mission_id: string;
  source_payload: DecisionCandidatePayload;
  integrity_verification?: IntegrityVerificationResult;
  existing_registry?: readonly DecisionCandidateRecord[];
  normalization_version: "decision-candidate-normalization/v1";
}>;

export type DecisionCandidateRecord = Readonly<{
  candidate_id: string;
  source_system: string;
  source_record_ref: string;
  normalized_version: "decision-candidate-normalization/v1";
  intake_timestamp: string;
  tenant_id: string;
  mission_id: string;
  validation_state: NormalizationState;
  duplicate_status: DuplicateDecisionStatus;
  integrity_hash: string;
  replay_ref: string;
}>;

export type DuplicateDecisionRecord = Readonly<{
  duplicate_id: string;
  candidate_id: string;
  duplicate_status: DuplicateDecisionStatus;
  matched_candidate_id?: string;
  duplicate_basis: readonly string[];
  orchestration_blocked: boolean;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type DecisionIntakeRecord = Readonly<{
  intake_id: string;
  candidate_id: string;
  source_system: string;
  validation_result: "ACCEPTED" | "REJECTED";
  normalization_version: "decision-candidate-normalization/v1";
  duplicate_status: DuplicateDecisionStatus;
  replay_ref: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type NormalizationAuditRecord = Readonly<{
  audit_id: string;
  normalization_id: string;
  normalization_stage: NormalizationState;
  audit_event:
    | "NORMALIZATION_STARTED"
    | "TERMINOLOGY_NORMALIZED"
    | "IDENTIFIERS_NORMALIZED"
    | "REFERENCES_NORMALIZED"
    | "GOVERNANCE_NORMALIZED"
    | "REPLAY_NORMALIZED"
    | "AUTHORITY_NORMALIZED"
    | "ADVISORY_METADATA_NORMALIZED"
    | "REGISTRY_UPDATED"
    | "DUPLICATE_EVALUATION_COMPLETED"
    | "LEDGER_ENTRY_CREATED"
    | "NORMALIZATION_REJECTED";
  result: "PASS" | "FAIL";
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type InputNormalizationResult = Readonly<{
  normalization_id: string;
  intake_id: string;
  normalization_status: "PASS" | "FAIL";
  normalization_state: NormalizationState;
  failure_reason?: NormalizationFailureReason;
  failure_reasons: readonly NormalizationFailureReason[];
  candidate?: DecisionCandidate;
  candidate_record?: DecisionCandidateRecord;
  duplicate_record?: DuplicateDecisionRecord;
  intake_record: DecisionIntakeRecord;
  normalization_rules: readonly NormalizationRule[];
  audit_records: readonly NormalizationAuditRecord[];
  registry_size: number;
  forwarded_to_orchestration: boolean;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type InputNormalizationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  normalization_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: NormalizationState;
  duplicate_status?: DuplicateDecisionStatus;
  failures: readonly NormalizationFailureReason[];
  integrity_hash: string;
}>;

export type InputNormalizationIntakeBridge = Readonly<{
  normalization: InputNormalizationResult;
  intake_failure_reasons: readonly DecisionIntakeFailureReason[];
  normalization_allowed: boolean;
}>;

export type DecisionIntakeMetrics = Readonly<{
  candidates_received: number;
  accepted_candidates: number;
  rejected_candidates: number;
  normalization_latency: number;
  duplicate_rate: number;
  validation_failures: number;
  integrity_failures: number;
  replay_validation_success: number;
  tenant_distribution: Readonly<Record<string, number>>;
  subsystem_distribution: Readonly<Record<string, number>>;
  normalization_throughput: number;
  registry_growth: number;
  ledger_write_latency: number;
}>;
