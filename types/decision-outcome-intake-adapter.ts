import type {
  ActualResultCaptureContractResult,
  OutcomeObservationRecord,
  OutcomeValidationState,
} from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OutcomeIntakeSourceType = "OPERATOR_WORKFLOW" | "EXECUTION_ENGINE" | "GOVERNANCE_ENGINE" | "ROLLBACK_ENGINE" | "MISSION_SYSTEM" | "SIMULATION_ENGINE";
export type OutcomeIntakeRoute = "OUTCOME_OBSERVATION_ENGINE" | "VALIDATION_REPORT" | "DUPLICATE_LEDGER" | "GOVERNANCE_ALERT";
export type OutcomeIntakeTrustLevel = "INTERNAL_CERTIFIED" | "EXTERNAL_CERTIFIED" | "RESTRICTED";

export type OutcomeIntakeFailure =
  | "UNSUPPORTED_SOURCE_ACCEPTED"
  | "INVALID_PAYLOAD_ACCEPTED"
  | "MALFORMED_SCHEMA_ACCEPTED"
  | "UNAUTHORIZED_SOURCE_ACCEPTED"
  | "DUPLICATE_HANDLING_NONDETERMINISTIC"
  | "EVIDENCE_REFERENCES_ALTERED"
  | "GOVERNANCE_METADATA_LOST"
  | "REPLAY_REFERENCES_REMOVED"
  | "TIMESTAMP_MODIFIED_INCORRECTLY"
  | "NORMALIZATION_INCONSISTENT"
  | "TENANT_BOUNDARY_VIOLATED"
  | "CONFLICTING_PAYLOADS_MERGED"
  | "INTEGRITY_VERIFICATION_BYPASSED"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_IDENTIFIER"
  | "INVALID_TIMESTAMP"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY_REFERENCES"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "ANALYSIS_ATTEMPTED"
  | "FAIL_OPEN_INTAKE_BEHAVIOR";

export type OutcomeIntakeCheck =
  | "SOURCE_REGISTRY"
  | "SOURCE_NORMALIZATION"
  | "CANONICAL_MAPPING"
  | "STRUCTURAL_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "DUPLICATE_DETECTION"
  | "PAYLOAD_ROUTING"
  | "TENANT_ISOLATION"
  | "REPLAY_DETERMINISM";

export type OutcomeIntakeRecord = Readonly<{
  intake_id: string;
  source_type: OutcomeIntakeSourceType;
  source_system: string;
  source_record_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  event_timestamp: string;
  received_timestamp: string;
  payload_version: string;
  normalized_payload: Readonly<Record<string, unknown>>;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeSourceRegistryEntry = Readonly<{
  source_id: string;
  source_name: string;
  source_type: OutcomeIntakeSourceType;
  supported_schema_versions: readonly string[];
  trust_level: OutcomeIntakeTrustLevel;
  tenant_scope: readonly string[];
  enabled: boolean;
  certification_status: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeSourceRegistry = Readonly<{
  registry_id: string;
  entries: readonly OutcomeSourceRegistryEntry[];
  default_schema_version: string;
  immutable: boolean;
  integrity_hash: string;
}>;

export type OutcomeSourceNormalization = Readonly<{
  normalization_id: string;
  source_type: OutcomeIntakeSourceType;
  field_names_normalized: boolean;
  timestamps_normalized: boolean;
  identifiers_normalized: boolean;
  enumerations_normalized: boolean;
  references_normalized: boolean;
  evidence_preserved: boolean;
  replay_preserved: boolean;
  source_specific_semantics_removed: boolean;
  normalized_output_hash: string;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeMappingResult = Readonly<{
  mapping_id: string;
  mission_refs_resolved: boolean;
  decision_refs_resolved: boolean;
  operator_refs_resolved: boolean;
  governance_refs_resolved: boolean;
  evidence_refs_resolved: boolean;
  replay_refs_resolved: boolean;
  mandatory_contract_fields_populated: boolean;
  canonical_outcome: OutcomeObservationRecord;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeIntakeValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED" | "DUPLICATE";
  source_supported: boolean;
  source_authorized: boolean;
  schema_valid: boolean;
  identifiers_valid: boolean;
  timestamps_valid: boolean;
  tenant_isolated: boolean;
  evidence_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  integrity_verified: boolean;
  duplicate_handled_deterministically: boolean;
  canonical_mapping_valid: boolean;
  analysis_absent: boolean;
  authorization_valid: boolean;
  failures: readonly OutcomeIntakeFailure[];
  integrity_hash: string;
}>;

export type OutcomeDuplicateDetection = Readonly<{
  detection_id: string;
  duplicate_key: string;
  duplicate_detected: boolean;
  identical_payload: boolean;
  conflicting_payload: boolean;
  deterministic_action: "ACCEPT" | "IGNORE_DUPLICATE" | "REJECT_CONFLICT";
  escalated: boolean;
  integrity_hash: string;
}>;

export type OutcomePayloadRouting = Readonly<{
  routing_id: string;
  route: OutcomeIntakeRoute;
  routed_to_observation_engine: boolean;
  routed_to_validation_report: boolean;
  routed_to_duplicate_ledger: boolean;
  routed_to_governance_alert: boolean;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeIntakeAuditLogRecord = Readonly<{
  audit_id: string;
  intake_id: string;
  source_type: OutcomeIntakeSourceType;
  route: OutcomeIntakeRoute;
  validation_status: "VALID" | "BLOCKED" | "DUPLICATE";
  failures: readonly OutcomeIntakeFailure[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OutcomeIntakeMetrics = Readonly<{
  metrics_id: string;
  total_payloads_received: number;
  payloads_normalized: number;
  payloads_rejected: number;
  duplicate_submissions_detected: number;
  unauthorized_source_attempts: number;
  validation_failures: number;
  normalization_latency_ms: number;
  supported_source_utilization: readonly OutcomeIntakeSourceType[];
  replay_consistency_rate: number;
  integrity_verification_failures: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeIntakeCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeIntakeCheck[];
  source_normalizer_operational: boolean;
  mapping_engine_operational: boolean;
  validation_layer_enforced: boolean;
  duplicate_detection_deterministic: boolean;
  invalid_payloads_rejected: boolean;
  unauthorized_sources_rejected: boolean;
  evidence_lineage_preserved: boolean;
  governance_lineage_preserved: boolean;
  replay_references_preserved: boolean;
  tenant_isolation_maintained: boolean;
  replay_reconstructs_identically: boolean;
  analysis_logic_absent: boolean;
  failure_analysis: readonly OutcomeIntakeFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type DecisionOutcomeIntakeAdapterInput = Readonly<{
  capture_contract?: ActualResultCaptureContractResult;
  role?: VisibilityRole;
  source_type?: OutcomeIntakeSourceType;
  scenario?:
    | "BASELINE"
    | "UNSUPPORTED_SOURCE"
    | "INVALID_PAYLOAD"
    | "MALFORMED_SCHEMA"
    | "UNAUTHORIZED_SOURCE"
    | "IDENTICAL_DUPLICATE"
    | "CONFLICTING_DUPLICATE"
    | "NONDETERMINISTIC_DUPLICATE"
    | "EVIDENCE_ALTERED"
    | "GOVERNANCE_LOST"
    | "REPLAY_REMOVED"
    | "TIMESTAMP_MODIFIED"
    | "NORMALIZATION_INCONSISTENT"
    | "TENANT_VIOLATION"
    | "INTEGRITY_BYPASS"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_IDENTIFIER"
    | "INVALID_TIMESTAMP"
    | "UNSUPPORTED_SCHEMA_VERSION"
    | "MISSING_EVIDENCE"
    | "MISSING_REPLAY_REFS"
    | "MISSING_GOVERNANCE_REFS"
    | "REPLAY_RECONSTRUCTION_FAILED"
    | "ANALYSIS_ATTEMPTED"
    | "FAIL_OPEN";
}>;

export type DecisionOutcomeIntakeAdapterResult = Readonly<{
  intake_adapter_version: "decision-outcome-intake-adapter/v1";
  capture_contract: ActualResultCaptureContractResult;
  source_registry: OutcomeSourceRegistry;
  intake_record: OutcomeIntakeRecord;
  normalization: OutcomeSourceNormalization;
  mapping: OutcomeMappingResult;
  duplicate_detection: OutcomeDuplicateDetection;
  validation: OutcomeIntakeValidation;
  routing: OutcomePayloadRouting;
  audit_log: readonly OutcomeIntakeAuditLogRecord[];
  metrics: OutcomeIntakeMetrics;
  certification_report: OutcomeIntakeCertificationReport;
  deterministic: true;
  replayable: true;
  structural_only: true;
  permits_analysis: false;
  permits_learning: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionOutcomeIntakeAdapterFoundation = Readonly<{
  intake_adapter_version: "decision-outcome-intake-adapter/v1";
  checks: readonly OutcomeIntakeCheck[];
  supported_sources: readonly OutcomeIntakeSourceType[];
  result: DecisionOutcomeIntakeAdapterResult;
}>;
