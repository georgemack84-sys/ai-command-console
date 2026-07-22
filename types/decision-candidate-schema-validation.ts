import type { DecisionIntakeFailureReason } from "@/types/decision-intake-engine";

export type CandidateSchemaValidationState =
  | "PENDING"
  | "STRUCTURE_VALIDATED"
  | "FIELDS_VALIDATED"
  | "IDENTIFIERS_VALIDATED"
  | "REFERENCES_VALIDATED"
  | "LINEAGE_VALIDATED"
  | "SERIALIZATION_VALIDATED"
  | "PASSED"
  | "FAILED_STRUCTURE"
  | "FAILED_REQUIRED_FIELDS"
  | "FAILED_IDENTIFIERS"
  | "FAILED_REFERENCES"
  | "FAILED_LINEAGE"
  | "FAILED_SERIALIZATION";

export type CandidateSchemaFailureReason =
  | "MALFORMED_OBJECT"
  | "UNSUPPORTED_ROOT_STRUCTURE"
  | "INVALID_NESTED_STRUCTURE"
  | "UNSUPPORTED_FIELD_TYPE"
  | "HIDDEN_EXECUTABLE_LOGIC"
  | "MISSING_SOURCE_SYSTEM"
  | "MISSING_TENANT_ID"
  | "MISSING_MISSION_ID"
  | "MISSING_DECISION_TYPE"
  | "MISSING_PROPOSED_ACTION"
  | "MISSING_EVIDENCE_REFS"
  | "MISSING_REPLAY_REFS"
  | "EMPTY_REQUIRED_FIELD"
  | "MALFORMED_IDENTIFIER"
  | "NON_CANONICAL_IDENTIFIER"
  | "UNSTABLE_IDENTIFIER"
  | "INVALID_EVIDENCE_REF"
  | "INVALID_REPLAY_REF"
  | "DUPLICATE_REFERENCE"
  | "REFERENCE_ORDER_NONDETERMINISTIC"
  | "INCOMPLETE_LINEAGE"
  | "ORPHANED_CANDIDATE"
  | "MISSING_SOURCE_RECORD"
  | "MISSING_REPLAY_PATH"
  | "BROKEN_EVIDENCE_CHAIN"
  | "NON_CANONICAL_PAYLOAD"
  | "NONDETERMINISTIC_FIELD"
  | "UNSERIALIZABLE_VALUE";

export type SchemaValidationRequest = Readonly<{
  validation_id: string;
  intake_id: string;
  source_system?: string;
  tenant_id?: string;
  mission_id?: string;
  raw_candidate_payload: unknown;
  schema_version: "decision-candidate-schema/v1";
  validation_policy_ref: string;
}>;

export type RequiredFieldValidationRecord = Readonly<{
  record_id: string;
  validation_id: string;
  required_fields_checked: readonly string[];
  missing_fields: readonly string[];
  empty_fields: readonly string[];
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type ReferenceValidationRecord = Readonly<{
  record_id: string;
  validation_id: string;
  evidence_refs_status: "PASS" | "FAIL";
  replay_refs_status: "PASS" | "FAIL";
  invalid_refs: readonly string[];
  duplicate_refs: readonly string[];
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type LineageValidationRecord = Readonly<{
  record_id: string;
  validation_id: string;
  source_lineage_status: "PASS" | "FAIL";
  evidence_lineage_status: "PASS" | "FAIL";
  replay_lineage_status: "PASS" | "FAIL";
  missing_lineage_refs: readonly string[];
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type CandidateSchemaAuditRecord = Readonly<{
  audit_id: string;
  validation_id: string;
  validation_stage: CandidateSchemaValidationState;
  validation_result: "PASS" | "FAIL";
  replay_ref: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type SchemaValidationResult = Readonly<{
  validation_id: string;
  intake_id: string;
  validation_status: "PASS" | "FAIL";
  validation_state: CandidateSchemaValidationState;
  failure_reason?: CandidateSchemaFailureReason;
  failure_reasons: readonly CandidateSchemaFailureReason[];
  missing_fields: readonly string[];
  malformed_fields: readonly string[];
  invalid_references: readonly string[];
  lineage_status: "COMPLETE" | "INCOMPLETE";
  schema_version: "decision-candidate-schema/v1";
  replay_ref: string;
  required_field_record: RequiredFieldValidationRecord;
  reference_record: ReferenceValidationRecord;
  lineage_record: LineageValidationRecord;
  audit_records: readonly CandidateSchemaAuditRecord[];
  downstream_allowed: boolean;
  integrity_hash: string;
  timestamp: string;
}>;

export type SchemaValidationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  validation_id: string;
  reconstructed_state: CandidateSchemaValidationState;
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly CandidateSchemaFailureReason[];
  integrity_hash: string;
}>;

export type CandidateSchemaIntakeBridge = Readonly<{
  schema_validation: SchemaValidationResult;
  intake_failure_reasons: readonly DecisionIntakeFailureReason[];
  intake_allowed: boolean;
}>;

export type CandidateSchemaObservability = Readonly<{
  schema_validation_attempts: number;
  schema_validation_passes: number;
  schema_validation_failures: number;
  missing_field_failures: number;
  malformed_object_failures: number;
  invalid_reference_failures: number;
  incomplete_lineage_failures: number;
  serialization_failures: number;
}>;
