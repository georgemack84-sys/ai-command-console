import type { ReplayCertificationReport } from "@/types/replay-certification-gate";

export type IntegrityArtifactType =
  | "PLANNING_RECORD"
  | "EXECUTION_RECORD"
  | "DELEGATION_RECORD"
  | "ORCHESTRATION_RECORD"
  | "SUPERVISION_RECORD"
  | "INTERVENTION_RECORD"
  | "REPLAY_RECORD"
  | "GOVERNANCE_DECISION";

export type IntegrityState = "VALID" | "DEGRADED" | "CORRUPTED";
export type IntegrityLifecycleState = "REGISTERED" | "HASHED" | "VERIFIED" | "CERTIFIED" | "MONITORED" | "DEGRADED" | "CORRUPTED" | "RECOVERED";
export type IntegrityVerificationState = "PENDING" | "VERIFIED" | "FAILED" | "REQUIRES_REVIEW";
export type IntegrityCertificationState = "UNCERTIFIED" | "CERTIFIED" | "CERTIFICATION_BLOCKED" | "CERTIFICATION_REVIEW";

export type IntegrityScenario =
  | "BASELINE"
  | "MISSING_IDENTIFIERS"
  | "MUTABLE_PROTECTED_FIELD"
  | "INVALID_HASHES"
  | "REPLAY_MISMATCH"
  | "LINEAGE_CORRUPTION"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "CONSTITUTIONAL_VIOLATION"
  | "DUPLICATE_IDENTIFIERS"
  | "ORPHANED_ARTIFACT"
  | "UNAUTHORIZED_MODIFICATION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "SCHEMA_INCOMPATIBILITY"
  | "HIDDEN_VERIFICATION_STATE";

export type IntegrityFailureReason =
  | "MISSING_IDENTIFIERS"
  | "MUTABLE_PROTECTED_FIELD"
  | "INVALID_HASHES"
  | "REPLAY_MISMATCH"
  | "LINEAGE_CORRUPTION"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "CONSTITUTIONAL_VIOLATION"
  | "DUPLICATE_IDENTIFIERS"
  | "ORPHANED_ARTIFACT"
  | "UNAUTHORIZED_MODIFICATION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "SCHEMA_INCOMPATIBILITY"
  | "HIDDEN_VERIFICATION_STATE";

export type IntegrityImmutableIdentifiers = Readonly<{
  autonomy_id: string;
  execution_id: string;
  replay_id: string;
  decision_id: string;
  planning_id: string;
  orchestration_id: string;
  delegation_id: string;
  supervision_id: string;
  intervention_id: string;
  governance_decision_id: string;
  tenant_id: string;
}>;

export type IntegrityHashPolicy = Readonly<{
  hash_algorithm: "SHA-256";
  hash_version: "autonomy-integrity-hash/v8H.1";
  artifact_hash: string;
  payload_hash: string;
  metadata_hash: string;
  replay_hash: string;
  lineage_hash: string;
  parent_hash: string;
  chain_hash: string;
  verification_hash: string;
}>;

export type IntegrityLineage = Readonly<{
  parent_artifact_id: string | null;
  child_artifact_ids: readonly string[];
  ancestor_artifact_ids: readonly string[];
  descendant_artifact_ids: readonly string[];
  replay_ancestor_id: string;
  execution_ancestor_id: string;
  planning_ancestor_id: string;
  decision_ancestor_id: string;
  governance_ancestor_id: string;
  lineage_path: readonly string[];
}>;

export type IntegrityRecord = Readonly<{
  integrity_id: string;
  artifact_type: IntegrityArtifactType;
  artifact_id: string;
  tenant_id: string;
  immutable_identifiers: IntegrityImmutableIdentifiers;
  protected_fields: readonly string[];
  hash_policy: IntegrityHashPolicy;
  replay_reference: string;
  lineage_reference: string;
  integrity_reference: string;
  constitutional_reference: string;
  governance_reference: string;
  policy_reference: string;
  authority_reference: string;
  creation_timestamp: string;
  certification_timestamp: string;
  verification_state: IntegrityVerificationState;
  integrity_status: IntegrityState;
  lifecycle_state: IntegrityLifecycleState;
  lineage: IntegrityLineage;
  schema_version: "integrity-contract/v8H.1";
  source_replay_certification: ReplayCertificationReport;
  fail_closed: true;
  record_hash: string;
}>;

export type IntegrityValidationError = Readonly<{
  reason: IntegrityFailureReason;
  state: IntegrityState;
  path: string;
  message: string;
}>;

export type IntegrityValidationResult = Readonly<{
  integrity_id: string | null;
  validation_state: IntegrityState;
  valid: boolean;
  degraded: boolean;
  corrupted: boolean;
  failures: readonly IntegrityValidationError[];
  schema_integrity_valid: boolean;
  required_fields_valid: boolean;
  immutable_identifiers_valid: boolean;
  protected_fields_valid: boolean;
  hash_reproducible: boolean;
  lineage_continuous: boolean;
  replay_reconstructable: boolean;
  governance_references_valid: boolean;
  constitutional_references_valid: boolean;
  tenant_ownership_valid: boolean;
  version_compatible: boolean;
  fail_closed: true;
  validation_hash: string;
}>;

export type IntegrityRegistryRecord = Readonly<{
  integrity_id: string;
  artifact_id: string;
  tenant_id: string;
  parent_artifact_id?: string | null;
}>;

export type IntegrityEngineInput = Readonly<{
  scenario?: IntegrityScenario;
  artifact_type?: IntegrityArtifactType;
  replayCertificationReport?: ReplayCertificationReport;
  registry?: readonly IntegrityRegistryRecord[];
  record?: IntegrityRecord;
}>;

export type IntegrityLifecycleTransition = Readonly<{
  from: IntegrityLifecycleState;
  to: IntegrityLifecycleState;
  allowed: boolean;
  resulting_integrity_state: IntegrityState;
  transition_hash: string;
}>;

export type IntegrityObservabilitySurface = Readonly<{
  integrity_id: string;
  artifact_type: IntegrityArtifactType;
  artifact_id: string;
  tenant_id: string;
  integrity_state: IntegrityState;
  lifecycle_state: IntegrityLifecycleState;
  verification_state: IntegrityVerificationState;
  certification_state: IntegrityCertificationState;
  failure_count: number;
  failures: readonly IntegrityFailureReason[];
  artifact_hash: string;
  chain_hash: string;
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
}>;

export type IntegrityContractFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    schema_version: "integrity-contract/v8H.1";
    hash_version: "autonomy-integrity-hash/v8H.1";
    protected_object_types: readonly IntegrityArtifactType[];
    immutable_fields: readonly string[];
    protected_fields: readonly string[];
    lifecycle_states: readonly IntegrityLifecycleState[];
    integrity_states: readonly IntegrityState[];
    failure_state_mapping: Readonly<Record<IntegrityFailureReason, IntegrityState>>;
  }>;
  contract: IntegrityRecord;
  validation: IntegrityValidationResult;
  observability: IntegrityObservabilitySurface;
}>;
