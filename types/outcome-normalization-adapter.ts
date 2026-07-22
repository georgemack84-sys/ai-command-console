import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeObservationLedgerResult } from "@/types/outcome-observation-ledger";

export type OutcomeNormalizationSourceSystem =
  | "MISSION_CONTROL_OUTCOMES"
  | "OPERATOR_WORKFLOW_RESULTS"
  | "GOVERNANCE_RESULTS"
  | "ROLLBACK_REPORTS"
  | "CERTIFICATION_RESULTS"
  | "REPLAY_OBSERVATIONS"
  | "EVIDENCE_REGISTRIES"
  | "FUTURE_CERTIFIED_SUBSYSTEM_OUTCOMES";

export type OutcomeNormalizationValidationOutcome = "PASS" | "WARNING" | "FAIL";

export type OutcomeNormalizationCheck =
  | "SOURCE_VALIDATION"
  | "SCHEMA_DETECTION"
  | "FIELD_TRANSLATION"
  | "CANONICAL_MAPPING"
  | "RULE_VERSIONING"
  | "REFERENCE_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "REPLAY_VALIDATION"
  | "TENANT_ISOLATION"
  | "SOURCE_IMMUTABILITY"
  | "TRACEABILITY";

export type OutcomeNormalizationFailure =
  | "UNSUPPORTED_SOURCE_REJECTED"
  | "UNKNOWN_SCHEMA_FAILED_CLOSED"
  | "UNSUPPORTED_FIELDS_REJECTED"
  | "MISSING_IDENTIFIERS_REJECTED"
  | "INVALID_TIMESTAMPS_REJECTED"
  | "DUPLICATE_CANONICAL_IDENTIFIER_REJECTED"
  | "MALFORMED_REFERENCES_REJECTED"
  | "INVALID_ENUMERATIONS_REJECTED"
  | "TENANT_MISMATCH_REJECTED"
  | "UNSUPPORTED_NORMALIZATION_VERSION_REJECTED"
  | "AMBIGUOUS_MAPPING_REJECTED"
  | "RULE_EXECUTION_NONDETERMINISTIC"
  | "SOURCE_RECORD_MUTATED"
  | "EVIDENCE_OR_REPLAY_LINEAGE_LOST"
  | "REPLAY_RECONSTRUCTION_DIFFERED"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_NORMALIZATION_BEHAVIOR";

export type NormalizationRule = Readonly<{
  rule_id: string;
  rule_name: string;
  source_schema: string;
  target_field: keyof CanonicalOutcome;
  transformation_type:
    | "IDENTIFIER_NORMALIZATION"
    | "TIMESTAMP_NORMALIZATION"
    | "ENUMERATION_MAPPING"
    | "OUTCOME_CLASSIFICATION"
    | "GOVERNANCE_NORMALIZATION"
    | "OPERATOR_NORMALIZATION"
    | "ROLLBACK_NORMALIZATION"
    | "EVIDENCE_REFERENCE_NORMALIZATION"
    | "REPLAY_REFERENCE_NORMALIZATION";
  rule_version: "10.2.1";
  effective_date: string;
  deprecated_date: null;
  status: "ACTIVE" | "DEPRECATED";
  integrity_hash: string;
}>;

export type CanonicalOutcome = Readonly<{
  normalized_outcome_id: string;
  source_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  outcome_type: string;
  outcome_timestamp: string;
  mission_impact: readonly string[];
  governance_result: string;
  operator_result: string;
  rollback_result: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  normalization_version: "10.2.1";
  source_system: OutcomeNormalizationSourceSystem;
  source_schema_version: string;
  integrity_hash: string;
}>;

export type FieldTranslationTrace = Readonly<{
  trace_id: string;
  source_field: string;
  canonical_field: keyof CanonicalOutcome;
  transformation_rule_id: string;
  validation_rule: string;
  normalization_version: "10.2.1";
  source_schema: string;
  integrity_hash: string;
}>;

export type SourceIntakeResult = Readonly<{
  intake_id: string;
  source_system: OutcomeNormalizationSourceSystem | "UNKNOWN_SOURCE";
  source_schema_version: string;
  source_identity_verified: boolean;
  original_payload_hash: string;
  original_payload_preserved: boolean;
  unknown_source_rejected: boolean;
  unsupported_fields: readonly string[];
  integrity_hash: string;
}>;

export type SchemaDetectionResult = Readonly<{
  detector_id: string;
  detected_schema: string;
  schema_version_supported: boolean;
  required_fields_present: boolean;
  translation_profile: string;
  schema_lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type NormalizationValidation = Readonly<{
  validation_id: string;
  validation_outcome: OutcomeNormalizationValidationOutcome;
  source_valid: boolean;
  fields_valid: boolean;
  normalization_valid: boolean;
  references_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  source_immutable: boolean;
  replay_consistent: boolean;
  traceability_complete: boolean;
  failures: readonly OutcomeNormalizationFailure[];
  integrity_hash: string;
}>;

export type NormalizationMetadata = Readonly<{
  metadata_id: string;
  normalization_version: "10.2.1";
  source_system: OutcomeNormalizationSourceSystem | "UNKNOWN_SOURCE";
  source_schema_version: string;
  rule_version: "10.2.1";
  applied_rule_ids: readonly string[];
  field_traces: readonly FieldTranslationTrace[];
  original_payload_hash: string;
  canonical_payload_hash: string;
  replay_reconstruction_hash: string;
  integrity_hash: string;
}>;

export type NormalizationApiSurface = Readonly<{
  api_id: string;
  normalize_outcome: "POST /normalization/outcomes";
  validate_outcome: "POST /normalization/validate";
  retrieve_rule_version: "GET /normalization/rules/{version}";
  list_supported_schemas: "GET /normalization/schemas";
  deterministic: true;
  persistence_required: false;
  integrity_hash: string;
}>;

export type NormalizationMetrics = Readonly<{
  metrics_id: string;
  outcomes_normalized: number;
  normalization_latency_ms: number;
  normalization_failures: number;
  schema_mismatches: number;
  rejected_fields: number;
  unsupported_sources: number;
  rule_version_usage: readonly string[];
  validation_failures: number;
  replay_consistency: number;
  tenant_isolation_violations: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type NormalizationAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeNormalizationCheck[];
  outcome_normalizer_operational: boolean;
  canonical_schema_produced: boolean;
  field_translation_deterministic: boolean;
  rule_versions_complete: boolean;
  validation_pipeline_passed: boolean;
  source_payload_preserved: boolean;
  evidence_lineage_preserved: boolean;
  replay_lineage_preserved: boolean;
  no_semantic_reinterpretation: boolean;
  certification_decision: OutcomeValidationState;
  failure_analysis: readonly OutcomeNormalizationFailure[];
  integrity_hash: string;
}>;

export type OutcomeNormalizationAdapterInput = Readonly<{
  outcome_ledger?: OutcomeObservationLedgerResult;
  role?: VisibilityRole;
  source_system?: OutcomeNormalizationSourceSystem;
  scenario?:
    | "BASELINE"
    | "MISSION_CONTROL_OUTCOMES"
    | "OPERATOR_WORKFLOW_RESULTS"
    | "GOVERNANCE_RESULTS"
    | "ROLLBACK_REPORTS"
    | "CERTIFICATION_RESULTS"
    | "REPLAY_OBSERVATIONS"
    | "EVIDENCE_REGISTRIES"
    | "FUTURE_CERTIFIED_SUBSYSTEM_OUTCOMES"
    | "UNSUPPORTED_SOURCE"
    | "UNKNOWN_SCHEMA"
    | "UNSUPPORTED_FIELD"
    | "MISSING_IDENTIFIER"
    | "INVALID_TIMESTAMP"
    | "DUPLICATE_CANONICAL_ID"
    | "MALFORMED_REFERENCE"
    | "INVALID_ENUMERATION"
    | "TENANT_MISMATCH"
    | "UNSUPPORTED_VERSION"
    | "AMBIGUOUS_MAPPING"
    | "NONDETERMINISTIC_RULE"
    | "SOURCE_MUTATION"
    | "LINEAGE_LOST"
    | "REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "FAIL_OPEN";
}>;

export type OutcomeNormalizationAdapterResult = Readonly<{
  outcome_normalization_adapter_version: "outcome-normalization-adapter/v1";
  outcome_ledger: OutcomeObservationLedgerResult;
  api_surface: NormalizationApiSurface;
  source_intake: SourceIntakeResult;
  schema_detection: SchemaDetectionResult;
  normalization_rules: readonly NormalizationRule[];
  canonical_outcome: CanonicalOutcome;
  metadata: NormalizationMetadata;
  validation: NormalizationValidation;
  metrics: NormalizationMetrics;
  audit_report: NormalizationAuditReport;
  deterministic: true;
  replayable: true;
  field_translation_only: true;
  interprets_meaning: false;
  infers_values: false;
  predicts_values: false;
  modifies_source: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeNormalizationAdapterFoundation = Readonly<{
  outcome_normalization_adapter_version: "outcome-normalization-adapter/v1";
  checks: readonly OutcomeNormalizationCheck[];
  supported_sources: readonly OutcomeNormalizationSourceSystem[];
  api_surface: NormalizationApiSurface;
  result: OutcomeNormalizationAdapterResult;
}>;
