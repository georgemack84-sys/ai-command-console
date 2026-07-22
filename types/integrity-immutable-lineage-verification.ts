import type { CertificationReplayValidatorResult } from "@/types/certification-replay-requirement-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";

export type IntegrityVerificationScope =
  | "Decision Candidate"
  | "Governance Decision"
  | "Constitutional Evaluation"
  | "Authority Evaluation"
  | "Tenant Isolation"
  | "Certification Record"
  | "Replay Package"
  | "Evidence Collection"
  | "Mission Record"
  | "Lineage Chain"
  | "Ledger Entry"
  | "Audit Artifact";

export type IntegrityValidationOutcome = "VERIFIED" | "PARTIAL" | "CORRUPTED" | "UNKNOWN";
export type IntegrityHashAlgorithm = "SHA-256";

export type ProtectedIntegrityArtifact = Readonly<{
  artifact_ref: string;
  artifact_type: IntegrityVerificationScope;
  governance_decision_id: string;
  mission_id: string;
  tenant_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_ref: string;
  parent_refs: readonly string[];
  child_refs: readonly string[];
  hash_algorithm: IntegrityHashAlgorithm;
  artifact_hash: string;
  metadata_hash: string;
  append_only: boolean;
  deleted: boolean;
  modified: boolean;
  created_at: string;
  integrity_hash: string;
}>;

export type ImmutableLineageNode = Readonly<{
  lineage_id: string;
  artifact_ref: string;
  parent_lineage_ids: readonly string[];
  child_lineage_ids: readonly string[];
  sequence: number;
  transformation_ref: string;
  validation_ref: string;
  certification_ref: string;
  replay_ref: string;
  append_only: boolean;
  deleted: boolean;
  created_at: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationRecord = Readonly<{
  integrity_verification_id: string;
  governance_decision_id: string;
  mission_id: string;
  tenant_id: string;
  verification_scope: IntegrityVerificationScope;
  artifact_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hashes: readonly string[];
  hash_algorithm: IntegrityHashAlgorithm;
  verification_result: IntegrityValidationOutcome;
  corruption_findings: readonly IntegrityLineageFailureReason[];
  consistency_results: readonly string[];
  replay_ref: string;
  created_at: string;
  integrity_hash: string;
}>;

export type IntegrityEvidenceReport = Readonly<{
  report_id: string;
  governance_decision_id: string;
  verified_artifacts: readonly string[];
  verified_hashes: readonly string[];
  lineage_results: readonly string[];
  consistency_results: readonly string[];
  corruption_findings: readonly IntegrityLineageFailureReason[];
  validation_outcome: IntegrityValidationOutcome;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type IntegrityLineageLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  verification_scope: IntegrityVerificationScope;
  artifact_results: readonly string[];
  hash_results: readonly string[];
  lineage_results: readonly string[];
  consistency_results: readonly string[];
  corruption_results: readonly IntegrityLineageFailureReason[];
  validation_outcome: IntegrityValidationOutcome;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type IntegrityLineageFailureReason =
  | "GOVERNANCE_CONTRACT_INVALID"
  | "CERTIFICATION_REPLAY_INVALID"
  | "MISSING_ARTIFACT"
  | "MISSING_HASH"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "HASH_MISMATCH"
  | "CORRUPTED_METADATA"
  | "INCOMPLETE_LINEAGE"
  | "BROKEN_REFERENCE"
  | "CIRCULAR_LINEAGE"
  | "INCONSISTENT_EVIDENCE"
  | "DUPLICATE_LINEAGE_IDENTIFIER"
  | "TENANT_SCOPE_MISMATCH"
  | "REPLAY_MISMATCH"
  | "UNAUTHORIZED_INTEGRITY_LINEAGE_ACCESS";

export type IntegrityLineageValidation = Readonly<{
  validation_state: "VALID" | "FAILED_CLOSED";
  fail_closed: boolean;
  failures: readonly IntegrityLineageFailureReason[];
  checks: Readonly<{
    artifacts_present: boolean;
    hashes_present: boolean;
    hash_algorithm_supported: boolean;
    hashes_reproducible: boolean;
    metadata_consistent: boolean;
    evidence_consistent: boolean;
    references_valid: boolean;
    lineage_complete: boolean;
    lineage_immutable: boolean;
    lineage_acyclic: boolean;
    replay_verified: boolean;
  }>;
}>;

export type IntegrityLineageVerifierInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  certification_replay_result?: CertificationReplayValidatorResult;
  protected_artifacts?: readonly ProtectedIntegrityArtifact[];
  lineage_nodes?: readonly ImmutableLineageNode[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type IntegrityLineageVerifierResult = Readonly<{
  integrity_lineage_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  certification_replay_result: CertificationReplayValidatorResult;
  protected_artifacts: readonly ProtectedIntegrityArtifact[];
  lineage_nodes: readonly ImmutableLineageNode[];
  verification_record: IntegrityVerificationRecord;
  evidence_report: IntegrityEvidenceReport;
  ledger_records: readonly IntegrityLineageLedgerRecord[];
  validation: IntegrityLineageValidation;
  validation_outcome: IntegrityValidationOutcome;
  replay_hash: string;
  failures: readonly IntegrityLineageFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type IntegrityLineageReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  artifact_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_report_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly IntegrityLineageFailureReason[];
  integrity_hash: string;
}>;

export type IntegrityLineageObservability = Readonly<{
  integrity_verification_events: number;
  hash_verification_events: number;
  evidence_consistency_events: number;
  reference_validation_events: number;
  lineage_verification_events: number;
  corruption_detection_events: number;
  validation_completion_events: number;
  replay_verification_events: number;
  ledger_append_events: number;
}>;

export type IntegrityImmutableLineageFoundation = Readonly<{
  verifier_version: "integrity-immutable-lineage-verification/v1";
  verification_scopes: readonly IntegrityVerificationScope[];
  validation_outcomes: readonly IntegrityValidationOutcome[];
  result: IntegrityLineageVerifierResult;
  replay: IntegrityLineageReplay;
  observability: IntegrityLineageObservability;
}>;
