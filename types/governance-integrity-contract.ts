export type GovernanceIntegrityObjectType =
  | "GOVERNANCE_RECORD"
  | "GOVERNANCE_DECISION"
  | "POLICY"
  | "COMPLIANCE_EVALUATION"
  | "RISK_ASSESSMENT"
  | "GOVERNANCE_RECOMMENDATION"
  | "ESCALATION"
  | "GOVERNANCE_LINEAGE_RECORD"
  | "REPLAY_RECORD"
  | "TRUTH_LEDGER_REFERENCE"
  | "GOVERNANCE_EVIDENCE"
  | "CONFIDENCE_ASSESSMENT"
  | "CERTIFICATION_RECORD";

export type GovernanceIntegrityState = "VALID" | "DEGRADED" | "CORRUPTED";

export type GovernanceIntegrityLifecycleState =
  | "REGISTERED"
  | "HASHED"
  | "VERIFIED"
  | "CERTIFIED"
  | "MONITORED"
  | "DEGRADED"
  | "CORRUPTED"
  | "RECOVERED";

export type GovernanceIntegrityVerificationStatus = "PENDING" | "VERIFIED" | "FAILED" | "REQUIRES_REVIEW";

export type GovernanceIntegrityCertificationState = "UNCERTIFIED" | "CERTIFIED" | "CERTIFICATION_BLOCKED" | "CERTIFICATION_REVIEW";

export type GovernanceIntegrityScenario =
  | "BASELINE"
  | "MISSING_IDENTITY"
  | "INVALID_TENANT_SCOPE"
  | "HASH_MISMATCH"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "BROKEN_LINEAGE"
  | "REPLAY_MISMATCH"
  | "MISSING_EVIDENCE_REFERENCE"
  | "VERIFICATION_METADATA_INCOMPLETE"
  | "INVALID_CERTIFICATION_METADATA"
  | "UNAUTHORIZED_FIELD_MODIFICATION"
  | "DUPLICATE_INTEGRITY_RECORD"
  | "ORPHAN_RECORD"
  | "LINEAGE_CYCLE"
  | "HIDDEN_VERIFICATION_STATE";

export type GovernanceIntegrityFailureReason =
  | "MISSING_IDENTITY"
  | "INVALID_TENANT_SCOPE"
  | "HASH_MISMATCH"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "BROKEN_LINEAGE"
  | "REPLAY_MISMATCH"
  | "MISSING_EVIDENCE_REFERENCE"
  | "VERIFICATION_METADATA_INCOMPLETE"
  | "INVALID_CERTIFICATION_METADATA"
  | "UNAUTHORIZED_FIELD_MODIFICATION"
  | "DUPLICATE_INTEGRITY_RECORD"
  | "ORPHAN_RECORD"
  | "LINEAGE_CYCLE"
  | "HIDDEN_VERIFICATION_STATE";

export type GovernanceIntegrityIdentity = Readonly<{
  integrity_record_id: string;
  governance_object_id: string;
  governance_object_type: GovernanceIntegrityObjectType;
  tenant_id: string;
  mission_id: string;
  version: string;
  created_timestamp: string;
  created_by: string;
}>;

export type GovernanceIntegrityHashInformation = Readonly<{
  content_hash: string;
  canonical_hash: string;
  previous_hash: string;
  hash_algorithm: "SHA-256";
  hash_version: "governance-integrity-hash/v7I.1";
  hash_timestamp: string;
}>;

export type GovernanceIntegrityLineage = Readonly<{
  parent_record_id: string | null;
  root_record_id: string;
  lineage_path: readonly string[];
  lineage_depth: number;
  superseded_by: string | null;
}>;

export type GovernanceIntegrityReplayReferences = Readonly<{
  replay_id: string;
  replay_hash: string;
  reconstruction_hash: string;
  truth_ledger_reference: string;
}>;

export type GovernanceIntegrityVerificationMetadata = Readonly<{
  verification_status: GovernanceIntegrityVerificationStatus;
  verification_timestamp: string;
  verification_method: "DETERMINISTIC_HASH_REPLAY" | "CERTIFICATION_GATE" | "MANUAL_AUDIT";
  verification_version: "governance-integrity-verification/v7I.1";
  verified_by: string;
}>;

export type GovernanceIntegrityEvidenceReferences = Readonly<{
  evidence_ids: readonly string[];
  policy_ids: readonly string[];
  compliance_ids: readonly string[];
  recommendation_ids: readonly string[];
  risk_ids: readonly string[];
}>;

export type GovernanceIntegrityCertificationMetadata = Readonly<{
  certification_state: GovernanceIntegrityCertificationState;
  certification_version: "governance-integrity-certification/v7I.1";
  certification_timestamp: string;
  certification_reference: string;
}>;

export type GovernanceIntegrityContract = Readonly<{
  phase_version: "7I.1";
  schema_version: "governance-integrity-contract/v7I.1";
  identity: GovernanceIntegrityIdentity;
  hash_information: GovernanceIntegrityHashInformation;
  lineage: GovernanceIntegrityLineage;
  replay_references: GovernanceIntegrityReplayReferences;
  verification_metadata: GovernanceIntegrityVerificationMetadata;
  integrity_state: GovernanceIntegrityState;
  lifecycle_state: GovernanceIntegrityLifecycleState;
  evidence_references: GovernanceIntegrityEvidenceReferences;
  certification_metadata: GovernanceIntegrityCertificationMetadata;
  immutable_fields: readonly string[];
  fail_closed: true;
  advisory_only_notice: string;
  record_hash: string;
}>;

export type GovernanceIntegrityValidationError = Readonly<{
  reason: GovernanceIntegrityFailureReason;
  state: GovernanceIntegrityState;
  path: string;
  message: string;
}>;

export type GovernanceIntegrityValidationResult = Readonly<{
  integrity_record_id: string | null;
  validation_state: GovernanceIntegrityState;
  valid: boolean;
  degraded: boolean;
  corrupted: boolean;
  failures: readonly GovernanceIntegrityValidationError[];
  record_hash_valid: boolean;
  canonical_hash_valid: boolean;
  replay_references_valid: boolean;
  lineage_valid: boolean;
  fail_closed: true;
  validation_hash: string;
}>;

export type GovernanceIntegrityRegistryRecord = Readonly<{
  integrity_record_id: string;
  governance_object_id: string;
  tenant_id: string;
  parent_record_id?: string | null;
}>;

export type GovernanceIntegrityEngineInput = Readonly<{
  scenario?: GovernanceIntegrityScenario;
  tenant_id?: string;
  mission_id?: string;
  created_by?: string;
  registry?: readonly GovernanceIntegrityRegistryRecord[];
  contract?: GovernanceIntegrityContract;
}>;

export type GovernanceIntegrityLifecycleTransition = Readonly<{
  from: GovernanceIntegrityLifecycleState;
  to: GovernanceIntegrityLifecycleState;
  allowed: boolean;
  resulting_integrity_state: GovernanceIntegrityState;
  transition_hash: string;
}>;

export type GovernanceIntegrityObservabilitySurface = Readonly<{
  integrity_record_id: string;
  governance_object_id: string;
  governance_object_type: GovernanceIntegrityObjectType;
  tenant_id: string;
  mission_id: string;
  integrity_state: GovernanceIntegrityState;
  lifecycle_state: GovernanceIntegrityLifecycleState;
  verification_status: GovernanceIntegrityVerificationStatus;
  certification_state: GovernanceIntegrityCertificationState;
  failure_count: number;
  failures: readonly GovernanceIntegrityFailureReason[];
  content_hash: string;
  canonical_hash: string;
  record_hash: string;
  replay_id: string;
  truth_ledger_reference: string;
  advisory_only_notice: string;
}>;
