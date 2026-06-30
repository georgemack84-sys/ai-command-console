import type { PolicyAnalysisPolicyType, PolicyAnalysisRecord } from "@/types/policy-analysis";

export type PolicyCorrelationType = "DIRECT" | "INDIRECT" | "CASCADING" | "HISTORICAL" | "CONDITIONAL";

export type PolicyCorrelationRelationshipType =
  | "POLICY_TO_RECOMMENDATION"
  | "POLICY_TO_DECISION"
  | "POLICY_TO_RUNTIME"
  | "POLICY_TO_VIOLATION"
  | "POLICY_TO_OUTCOME"
  | "POLICY_TO_AUTHORITY"
  | "POLICY_TO_MISSION"
  | "POLICY_TO_GOVERNANCE_ACTION"
  | "POLICY_TO_CERTIFICATION"
  | "POLICY_TO_REPLAY";

export type PolicyCorrelationLedgerSource =
  | "TRUTH_LEDGER"
  | "RECOMMENDATION_LEDGER"
  | "DECISION_HISTORY"
  | "GOVERNANCE_EVENTS"
  | "AUTHORITY_DECISIONS"
  | "VIOLATION_RECORDS"
  | "REPLAY_HISTORY"
  | "CERTIFICATION_HISTORY";

export type PolicyCorrelationState =
  | "CREATED"
  | "SOURCE_VALIDATED"
  | "CORRELATED"
  | "CONSISTENCY_VERIFIED"
  | "REPLAYABLE"
  | "RESTRICTED"
  | "INCONSISTENT"
  | "INVALID"
  | "ARCHIVED";

export type PolicyCorrelationValidationState = "PASS" | "FAIL";

export type PolicyCorrelationFailureReason =
  | "POLICY_ANALYSIS_MISSING"
  | "POLICY_ANALYSIS_INVALID"
  | "POLICY_ANALYSIS_STATE_BLOCKED"
  | "POLICY_IDENTITY_MISSING"
  | "POLICY_VERSION_MISSING"
  | "UNKNOWN_LEDGER_SOURCE"
  | "SOURCE_RECORDS_MISSING"
  | "TARGET_RECORDS_MISSING"
  | "HISTORICAL_RECORDS_MISSING"
  | "TENANT_MISMATCH"
  | "POLICY_VERSION_MISMATCH"
  | "FUTURE_POLICY_INFLUENCE"
  | "EVIDENCE_MISSING"
  | "UNSUPPORTED_INFLUENCE_CLAIM"
  | "LINEAGE_BREAK_DETECTED"
  | "CROSS_LEDGER_INCONSISTENCY"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_HASH_MISMATCH"
  | "INVALID_CORRELATION_TYPE"
  | "INVALID_RELATIONSHIP_TYPE"
  | "INVALID_CORRELATION_STATE"
  | "INVALID_STATE_TRANSITION"
  | "IDENTIFIER_MUTATION"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "ENFORCEMENT_ATTEMPT_DETECTED";

export type PolicyCorrelationSourceDefinition = Readonly<{
  source_ledger: PolicyCorrelationLedgerSource;
  display_name: string;
  allowed_event_types: readonly string[];
  trust_requirement: "TRUTH_ANCHORED" | "GOVERNANCE_ANCHORED" | "REPLAY_ANCHORED" | "CERTIFICATION_ANCHORED";
  tenant_scoped: true;
  replay_required: true;
  integrity_required: true;
}>;

export type PolicyCorrelationHistoricalRecord = Readonly<{
  record_id: string;
  source_ledger: PolicyCorrelationLedgerSource;
  event_type: string;
  tenant_id: string;
  mission_id: string;
  policy_analysis_id: string;
  policy_id: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  occurred_at: string;
  ledger_sequence: number;
  source_record_refs: readonly string[];
  target_record_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  authority_refs: readonly string[];
  governance_refs: readonly string[];
  relationship_type: PolicyCorrelationRelationshipType;
  correlation_type: PolicyCorrelationType;
  influence_marker: string;
  condition_ref: string | null;
  record_hash: string;
}>;

export type PolicyCorrelationReplayRefs = Readonly<{
  policy_snapshot_ref: string;
  ledger_snapshot_refs: readonly string[];
  correlation_algorithm_version: "policy-correlation-engine/v7B.2";
  input_record_set_hash: string;
  output_correlation_hash: string;
  replay_execution_ref: string;
}>;

export type PolicyCorrelationContext = Readonly<{
  summary: string;
  refs: readonly string[];
}>;

export type PolicyCorrelationRecord = Readonly<{
  schema_version: "policy-correlation/v7B.2";
  policy_correlation_id: string;
  tenant_id: string;
  policy_analysis_id: string;
  policy_id: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  correlation_type: PolicyCorrelationType;
  relationship_type: PolicyCorrelationRelationshipType;
  source_ledger: PolicyCorrelationLedgerSource;
  source_record_refs: readonly string[];
  target_ledger: PolicyCorrelationLedgerSource;
  target_record_refs: readonly string[];
  influence_path: readonly string[];
  constraints_applied: readonly string[];
  exceptions_applied: readonly string[];
  authority_context: PolicyCorrelationContext;
  governance_context: PolicyCorrelationContext;
  runtime_context: PolicyCorrelationContext;
  mission_context: PolicyCorrelationContext;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: PolicyCorrelationReplayRefs;
  correlation_state: PolicyCorrelationState;
  correlation_hash: string;
  created_timestamp: string;
}>;

export type PolicyCorrelationDoctrine = Readonly<{
  principles: readonly ("no-assumption-influence" | "evidence-required" | "replay-required" | "tenant-isolated" | "advisory-only" | "fail-closed" | "cross-ledger-consistent")[];
  prohibited_behaviors: readonly string[];
  supported_correlation_types: readonly PolicyCorrelationType[];
  supported_relationship_types: readonly PolicyCorrelationRelationshipType[];
  allowed_state_transitions: Readonly<Record<PolicyCorrelationState, readonly PolicyCorrelationState[]>>;
}>;

export type PolicyCorrelationValidationFailure = Readonly<{
  failure_id: string;
  reason: PolicyCorrelationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type PolicyCorrelationValidationResult = Readonly<{
  validation_id: string;
  policy_correlation_id?: string;
  validation_state: PolicyCorrelationValidationState;
  failures: readonly PolicyCorrelationValidationFailure[];
  correlation_hash?: string;
  deterministic: true;
  replayable: boolean;
  tenant_scoped: boolean;
  advisory_only: true;
}>;

export type PolicyCorrelationEngineResult = Readonly<{
  engine_id: string;
  policy_analysis: PolicyAnalysisRecord;
  source_registry: readonly PolicyCorrelationSourceDefinition[];
  normalized_records: readonly PolicyCorrelationHistoricalRecord[];
  ordered_record_ids: readonly string[];
  correlations: readonly PolicyCorrelationRecord[];
  validation: PolicyCorrelationValidationResult;
}>;

export type PolicyCorrelationReplayResult = Readonly<{
  replay_id: string;
  policy_correlation_id: string;
  validation_state: PolicyCorrelationValidationState;
  failure_reason: PolicyCorrelationFailureReason | null;
  reconstructed_hash: string;
  expected_hash: string;
  final_state: PolicyCorrelationState;
}>;

export type PolicyCorrelationExplanation = Readonly<{
  policy_correlation_id: string;
  headline: string;
  steps: readonly string[];
  evidence_summary: readonly string[];
  replay_status: "REPLAYABLE" | "NOT_REPLAYABLE";
}>;

export type PolicyCorrelationObservabilitySurface = Readonly<{
  policy_analyzed: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  correlations: readonly PolicyCorrelationRecord[];
  explanations: readonly PolicyCorrelationExplanation[];
  validation_failures: readonly PolicyCorrelationValidationFailure[];
  consistency_status: "CONSISTENT" | "INCONSISTENT" | "INVALID";
  replay_ready: boolean;
  tenant_isolation_preserved: boolean;
}>;
