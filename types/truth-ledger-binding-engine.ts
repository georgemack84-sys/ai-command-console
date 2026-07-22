import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeIdentityResolverResult } from "@/types/outcome-identity-resolver";

export type TruthBindingReferenceType =
  | "ORIGINAL_DECISION"
  | "DECISION_PACKAGE"
  | "OPERATOR_WORKFLOW"
  | "EVIDENCE_RECORD"
  | "REPLAY_RECORD"
  | "GOVERNANCE_RECORD"
  | "CERTIFICATION_RECORD"
  | "FINAL_OUTCOME"
  | "HISTORICAL_TRUTH_CHAIN";

export type TruthBindingRelationship =
  | "originates_from"
  | "produced_by"
  | "approved_by"
  | "governed_by"
  | "certified_by"
  | "references"
  | "supported_by"
  | "replayed_by"
  | "finalized_by"
  | "recorded_in";

export type TruthBindingCheck =
  | "IDENTITY_VALIDATION"
  | "BINDING_REQUEST_VALIDATION"
  | "TRUTH_REFERENCE_RESOLUTION"
  | "MANDATORY_REFERENCES"
  | "TENANT_ISOLATION"
  | "IMMUTABLE_TARGETS"
  | "BINDING_CREATION"
  | "REFERENCE_REGISTRY"
  | "REPLAY_METADATA"
  | "HISTORICAL_TRUTH_CHAIN"
  | "INTEGRITY_VALIDATION";

export type TruthBindingFailure =
  | "IDENTITY_NOT_VALIDATED"
  | "INCOMPLETE_OUTCOME_REJECTED"
  | "MISSING_IDENTIFIER_REJECTED"
  | "UNNORMALIZED_RECORD_REJECTED"
  | "INVALID_TENANT_REJECTED"
  | "INVALID_MISSION_REJECTED"
  | "MISSING_REQUIRED_REFERENCE_REJECTED"
  | "UNKNOWN_TRUTH_REFERENCE_REJECTED"
  | "CROSS_TENANT_REFERENCE_REJECTED"
  | "MUTABLE_LEDGER_REFERENCE_REJECTED"
  | "REPLAY_REFERENCE_MISMATCH_REJECTED"
  | "INTEGRITY_HASH_MISMATCH_REJECTED"
  | "REGISTRY_APPEND_ONLY_VIOLATED"
  | "HISTORICAL_RECORD_MUTATION_REJECTED"
  | "RELATIONSHIP_NONDETERMINISTIC"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_BINDING_BEHAVIOR";

export type OutcomeTruthBinding = Readonly<{
  binding_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  truth_record_refs: readonly string[];
  decision_package_ref: string;
  operator_workflow_ref: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  certification_refs: readonly string[];
  final_outcome_ref: string;
  historical_truth_chain_refs: readonly string[];
  binding_version: "10.2.3";
  binding_timestamp: string;
  integrity_hash: string;
}>;

export type TruthBindingReference = Readonly<{
  reference_id: string;
  truth_record_id: string;
  reference_type: TruthBindingReferenceType;
  source_component: string;
  relationship: TruthBindingRelationship;
  tenant_id: string;
  replay_ref: string;
  immutable_target: boolean;
  integrity_hash: string;
}>;

export type TruthBindingValidationResult = Readonly<{
  validation_id: string;
  normalized_outcome_id: string;
  validation_status: "VALID" | "BLOCKED";
  validated_reference_count: number;
  missing_reference_count: number;
  invalid_reference_count: number;
  tenant_validation_status: "VALID" | "INVALID";
  replay_validation_status: "VALID" | "INVALID";
  integrity_status: "VALID" | "INVALID";
  validation_timestamp: string;
  failures: readonly TruthBindingFailure[];
  integrity_hash: string;
}>;

export type TruthReferenceRegistryRecord = Readonly<{
  registry_id: string;
  binding_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  reference_ids: readonly string[];
  historical_truth_chain_refs: readonly string[];
  binding_version: "10.2.3";
  ledger_sequence: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type TruthBindingReplayMetadata = Readonly<{
  replay_metadata_id: string;
  binding_hash: string;
  reference_hashes: readonly string[];
  registry_hashes: readonly string[];
  historical_truth_chain_hash: string;
  replay_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  integrity_hash: string;
}>;

export type TruthBindingApiSurface = Readonly<{
  api_id: string;
  create_binding: "POST /truth-ledger/bind";
  validate_binding: "POST /truth-ledger/bind/validate";
  retrieve_binding: "GET /truth-ledger/bind/{binding_id}";
  retrieve_truth_references: "GET /truth-ledger/references/{normalized_outcome_id}";
  retrieve_historical_truth_chain: "GET /truth-ledger/history/{normalized_outcome_id}";
  update_supported: false;
  delete_supported: false;
  deterministic_access: true;
  integrity_hash: string;
}>;

export type TruthBindingMetrics = Readonly<{
  metrics_id: string;
  bindings_created: number;
  binding_failures: number;
  missing_reference_failures: number;
  unknown_reference_failures: number;
  tenant_violations: number;
  replay_validation_failures: number;
  registry_growth: number;
  validation_latency_ms: number;
  integrity_verification_failures: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type TruthBindingAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly TruthBindingCheck[];
  ledger_binding_engine_operational: boolean;
  binding_validator_operational: boolean;
  truth_reference_registry_operational: boolean;
  immutable_binding_pipeline_operational: boolean;
  mandatory_references_enforced: boolean;
  historical_truth_chain_complete: boolean;
  immutable_relationships_verified: boolean;
  truth_ledger_records_unmodified: boolean;
  failure_analysis: readonly TruthBindingFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type TruthLedgerBindingEngineInput = Readonly<{
  identity_resolver?: OutcomeIdentityResolverResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "INCOMPLETE_OUTCOME"
    | "MISSING_IDENTIFIER"
    | "UNNORMALIZED_RECORD"
    | "INVALID_TENANT"
    | "INVALID_MISSION"
    | "MISSING_DECISION"
    | "MISSING_DECISION_PACKAGE"
    | "MISSING_OPERATOR_WORKFLOW"
    | "MISSING_EVIDENCE"
    | "MISSING_REPLAY"
    | "MISSING_GOVERNANCE"
    | "MISSING_CERTIFICATION"
    | "MISSING_FINAL_OUTCOME"
    | "MISSING_HISTORY"
    | "UNKNOWN_REFERENCE"
    | "CROSS_TENANT_REFERENCE"
    | "MUTABLE_REFERENCE"
    | "REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "APPEND_ONLY_VIOLATION"
    | "HISTORICAL_MUTATION"
    | "NONDETERMINISTIC_RELATIONSHIP"
    | "INVALID_IDENTITY"
    | "FAIL_OPEN";
}>;

export type TruthLedgerBindingEngineResult = Readonly<{
  truth_ledger_binding_engine_version: "truth-ledger-binding-engine/v1";
  identity_resolver: OutcomeIdentityResolverResult;
  api_surface: TruthBindingApiSurface;
  binding: OutcomeTruthBinding;
  references: readonly TruthBindingReference[];
  validation: TruthBindingValidationResult;
  reference_registry: readonly TruthReferenceRegistryRecord[];
  replay_metadata: TruthBindingReplayMetadata;
  metrics: TruthBindingMetrics;
  audit_report: TruthBindingAuditReport;
  deterministic: true;
  replayable: true;
  immutable_references_only: true;
  modifies_truth_ledger_records: false;
  update_supported: false;
  delete_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TruthLedgerBindingEngineFoundation = Readonly<{
  truth_ledger_binding_engine_version: "truth-ledger-binding-engine/v1";
  checks: readonly TruthBindingCheck[];
  api_surface: TruthBindingApiSurface;
  result: TruthLedgerBindingEngineResult;
}>;
