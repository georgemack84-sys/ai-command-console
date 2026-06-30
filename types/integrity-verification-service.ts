import type { AutonomousHashChainExecution } from "@/types/autonomous-hash-chain-engine";
import type { IntegrityRecord, IntegrityState } from "@/types/integrity-contract";
import type { TamperDetectionReport, TamperDetectionScenario } from "@/types/tamper-detection-engine";

export type IntegrityVerificationMode = "CONTINUOUS" | "SCHEDULED" | "ON_DEMAND";
export type IntegrityVerificationState = "VERIFIED" | "MONITORING" | "WARNING" | "DEGRADED" | "FAILED" | "CERTIFICATION_BLOCKED" | "INVALID";
export type IntegrityStatusLevel = "TRUSTED" | "WATCH" | "DEGRADED" | "COMPROMISED" | "UNTRUSTED";

export type IntegrityVerificationScenario =
  | "BASELINE"
  | "INTEGRITY_CONTRACT_INVALID"
  | "HASH_REPRODUCTION_FAILED"
  | "PARENT_HASH_INVALID"
  | "CHAIN_CONTINUITY_BROKEN"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "REPLAY_CHECKPOINT_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "ORPHANED_ARTIFACT"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_INVALID"
  | "AUTHORITY_REFERENCE_INVALID"
  | "TENANT_ISOLATION_VIOLATION"
  | "IMMUTABLE_IDENTIFIER_MODIFIED"
  | "OPTIONAL_METADATA_WARNING"
  | "UNSUPPORTED_VERIFICATION_VERSION"
  | "EXECUTION_DIVERGENCE_DETECTED";

export type IntegrityVerificationFailure =
  | "INTEGRITY_CONTRACT_INVALID"
  | "HASH_REPRODUCTION_FAILED"
  | "PARENT_HASH_INVALID"
  | "CHAIN_CONTINUITY_BROKEN"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "REPLAY_CHECKPOINT_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "ORPHANED_ARTIFACT"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_INVALID"
  | "AUTHORITY_REFERENCE_INVALID"
  | "TENANT_ISOLATION_VIOLATION"
  | "IMMUTABLE_IDENTIFIER_MODIFIED"
  | "OPTIONAL_METADATA_WARNING"
  | "UNSUPPORTED_VERIFICATION_VERSION"
  | "EXECUTION_DIVERGENCE_DETECTED";

export type IntegrityVerificationModule =
  | "SCHEMA_IDENTIFIER"
  | "HASH"
  | "CHAIN_CONTINUITY"
  | "REPLAY"
  | "LINEAGE"
  | "GOVERNANCE"
  | "TENANT_ISOLATION"
  | "CONFIDENCE"
  | "CERTIFICATION";

export type IntegrityVerificationResult = Readonly<{
  module: IntegrityVerificationModule;
  verification_state: IntegrityVerificationState;
  integrity_status: IntegrityStatusLevel;
  passed: boolean;
  failure: IntegrityVerificationFailure | null;
  confidence_score: number;
  message: string;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type HashVerificationSummary = Readonly<{
  replay_hash: boolean;
  execution_hash: boolean;
  planning_hash: boolean;
  decision_hash: boolean;
  orchestration_hash: boolean;
  supervision_hash: boolean;
  intervention_hash: boolean;
  parent_hash: boolean;
  lineage_hash: boolean;
  chain_hash: boolean;
  hash_verification_hash: string;
}>;

export type LineageVerificationSummary = Readonly<{
  lineage_reference: string;
  parent_reference: string | null;
  chain_reference: string;
  complete_lineage: boolean;
  orphaned_records_detected: boolean;
  lineage_verification_hash: string;
}>;

export type GovernanceVerificationSummary = Readonly<{
  governance_reference: string;
  constitutional_reference: string;
  policy_reference: string;
  authority_reference: string;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  governance_verification_hash: string;
}>;

export type ReplayVerificationSummary = Readonly<{
  replay_reference: string;
  replay_result: "REPRODUCIBLE" | "NOT_REPRODUCIBLE";
  replay_hash_result: "MATCH" | "MISMATCH";
  replay_checkpoint_valid: boolean;
  replay_verification_hash: string;
}>;

export type TenantIsolationSummary = Readonly<{
  tenant_id: string;
  tenant_scope_valid: boolean;
  cross_tenant_access_detected: boolean;
  tenant_isolation_hash: string;
}>;

export type IntegrityCertificationEvidence = Readonly<{
  evidence_id: string;
  verification_id: string;
  source_integrity_hash: string;
  chain_terminal_hash: string;
  tamper_forensic_hash: string;
  result_hashes: readonly string[];
  confidence_score: number;
  certification_evidence_hash: string;
}>;

export type IntegrityVerificationRecord = Readonly<{
  verification_id: string;
  tenant_id: string;
  artifact_id: string;
  artifact_type: string;
  verification_state: IntegrityVerificationState;
  integrity_status: IntegrityStatusLevel;
  confidence_score: number;
  hash_verification: HashVerificationSummary;
  lineage_verification: LineageVerificationSummary;
  governance_verification: GovernanceVerificationSummary;
  replay_verification: ReplayVerificationSummary;
  tenant_isolation: TenantIsolationSummary;
  recommended_action: string;
  repair_recommendations: readonly string[];
  certification_evidence: IntegrityCertificationEvidence;
  timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationReport = Readonly<{
  phase_version: "8H.4";
  schema_version: "integrity-verification-service/v8H.4";
  verification_id: string;
  verification_mode: IntegrityVerificationMode;
  verification_timestamp: string;
  source_integrity_contract: IntegrityRecord;
  source_chain: AutonomousHashChainExecution;
  tamper_report: TamperDetectionReport;
  verification_results: readonly IntegrityVerificationResult[];
  verification_record: IntegrityVerificationRecord;
  verification_state: IntegrityVerificationState;
  integrity_status: IntegrityStatusLevel;
  integrity_state: IntegrityState;
  confidence_score: number;
  certification_ready: boolean;
  certification_blocked: boolean;
  failed_checks: readonly IntegrityVerificationFailure[];
  supporting_evidence: readonly string[];
  report_hash: string;
  advisory_only_notice: string;
}>;

export type IntegrityVerificationInput = Readonly<{
  scenario?: IntegrityVerificationScenario;
  mode?: IntegrityVerificationMode;
  tamper_scenario?: TamperDetectionScenario;
  integrityRecord?: IntegrityRecord;
  chain?: AutonomousHashChainExecution;
  tamperReport?: TamperDetectionReport;
}>;

export type IntegrityVerificationObservabilitySurface = Readonly<{
  verification_id: string;
  verification_mode: IntegrityVerificationMode;
  tenant_id: string;
  artifact_id: string;
  verification_state: IntegrityVerificationState;
  integrity_status: IntegrityStatusLevel;
  confidence_score: number;
  certification_ready: boolean;
  certification_blocked: boolean;
  failed_modules: readonly IntegrityVerificationModule[];
  failed_checks: readonly IntegrityVerificationFailure[];
  evidence_hash: string;
  report_hash: string;
}>;
